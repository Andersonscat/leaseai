import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getRecentUnreadMessages, sendAutoReply } from '@/lib/gmail';
import { generateQualificationResponse } from '@/lib/ai-qualification';

// Global sync lock to prevent concurrent syncs
const syncLocks = new Map<string, boolean>();

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Проверяем авторизацию
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🚨 CRITICAL: Prevent concurrent syncs for same user
    if (syncLocks.get(user.id)) {
      console.log('⏸️  Sync already in progress for this user, skipping...');
      return NextResponse.json({
        success: true,
        synced: 0,
        created: 0,
        message: 'Sync already in progress',
      });
    }

    // Set lock
    syncLocks.set(user.id, true);
    console.log('📧 Starting Gmail sync...');

    // Получаем отфильтрованные и обработанные лиды (AI уже отфильтровал спам!)
    // Уменьшаем с 20 до 5 для быстрой синхронизации
    const leads = await getRecentUnreadMessages(5); // Последние 5 писем (быстрее!)

    if (!leads || leads.length === 0) {
      console.log('✅ No new leads found');
      return NextResponse.json({
        success: true,
        synced: 0,
        created: 0,
        message: 'No new leads',
      });
    }

    console.log(`📨 Found ${leads.length} new leads after AI filtering`);

    let created = 0;
    let autoRepliesSent = 0;

    // Get realtor's properties for AI context
    console.log('🔍 Fetching properties for user:', user.id);
    
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['Active', 'Available']); // ← Support both "Active" and "Available"
    
    // 🚨 DEBUG: Log properties to see what AI receives
    console.log('🏠 Properties loaded for AI:', {
      user_id: user.id,
      count: properties?.length || 0,
      properties: properties?.map(p => ({
        id: p.id,
        address: p.address,
        price: p.price,
        bedrooms: p.beds,
        status: p.status,
        user_id: p.user_id,
      })),
      error: propertiesError,
    });

    // Сохраняем лиды в БД (они уже обработаны AI!)
    for (const lead of leads) {
      try {
        console.log(`\n🔍 Processing lead from: ${lead.tenant_email}`);
        
        // Проверяем существует ли уже tenant с таким email (case-insensitive)
        const { data: existingTenants, error: searchError } = await supabase
          .from('tenants')
          .select('id, auto_reply_enabled, gmail_thread_id, email')
          .eq('user_id', user.id)
          .ilike('email', lead.tenant_email); // Case-insensitive search
        
        if (searchError) {
          console.error('❌ Error searching for tenant:', searchError);
        }
        
        const existingTenant = existingTenants?.[0]; // Take first match
        
        if (existingTenant) {
          console.log(`✅ Found existing tenant: ${existingTenant.email} (ID: ${existingTenant.id})`);
        } else {
          console.log(`🆕 No existing tenant found for: ${lead.tenant_email}`);
        }

        let tenantId = existingTenant?.id;
        let isNewTenant = false;
        let isReplyInSameThread = false;

        // Check if this is a reply in existing thread
        if (existingTenant && lead.threadId) {
          if (existingTenant.gmail_thread_id === lead.threadId) {
            console.log('✅ Reply in existing thread detected');
            isReplyInSameThread = true;
          } else {
            console.log('📧 New thread from existing tenant');
          }
        }

        // Если tenant не существует - создаем
        if (!tenantId) {
          const { data: newTenant, error: tenantError } = await supabase
            .from('tenants')
            .insert({
              user_id: user.id,
              name: lead.tenant_name,
              email: lead.tenant_email,
              phone: lead.tenant_phone,
              status: 'Pending',
              gmail_thread_id: lead.threadId, // Save for threading
              gmail_message_id: lead.messageId, // Save original message ID
              auto_reply_enabled: true, // Enable auto-reply by default
              qualification_status: 'new',
            })
            .select()
            .single();

          if (tenantError) {
            console.error('Error creating tenant:', tenantError);
            continue;
          }

          tenantId = newTenant.id;
          isNewTenant = true;
          console.log('✅ Created new tenant:', lead.tenant_name);
        } else if (lead.threadId && !isReplyInSameThread) {
          // Update thread ID if this is a new thread from existing tenant
          await supabase
            .from('tenants')
            .update({ gmail_thread_id: lead.threadId })
            .eq('id', tenantId);
        }

        // 🚨 CRITICAL: Check if Gmail message already processed (prevent duplicates!)
        if (lead.messageId) {
          const { data: existingMessages } = await supabase
            .from('messages')
            .select('id')
            .eq('gmail_message_id', lead.messageId) // ← Check by Gmail message ID
            .limit(1);
            
          if (existingMessages && existingMessages.length > 0) {
            console.log('⏭️  Gmail message already processed (ID: ' + lead.messageId + '), skipping');
            continue;
          }
        }

        // Check if this is an active conversation (has AI replies)
        // If AI already replied in this thread - it's an active conversation, always respond
        const { data: aiMessages } = await supabase
          .from('messages')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('sender_type', 'agent')
          .limit(1);
        
        const isActiveConversation = !!(aiMessages && aiMessages.length > 0);
        
        // Check if this is an old FIRST message (more than 24 hours old)
        // We don't want to auto-reply to very old emails UNLESS it's a reply in active thread
        const { data: lastTenantMessages } = await supabase
          .from('messages')
          .select('created_at')
          .eq('tenant_id', tenantId)
          .eq('sender_type', 'tenant')
          .order('created_at', { ascending: false })
          .limit(1);
        
        const lastTenantMessage = lastTenantMessages?.[0];
        const isOldMessage = !isActiveConversation && lastTenantMessage && 
          (Date.now() - new Date(lastTenantMessage.created_at).getTime()) > 24 * 60 * 60 * 1000;

        // Создаем сообщение от клиента
        const { error: messageError } = await supabase.from('messages').insert({
          user_id: user.id,
          tenant_id: tenantId,
          sender_type: 'tenant',
          sender_name: lead.tenant_name,
          message_text: lead.message,
          source: lead.source,
          is_read: false,
          gmail_message_id: lead.messageId, // ← Save Gmail message ID
        });

        if (messageError) {
          console.error('Error creating message:', messageError);
          continue;
        }

        created++;
        console.log(`✅ Saved lead from ${lead.tenant_name}`);

        // 🤖 AUTO-REPLY: Send immediate AI response for ALL incoming messages
        // LOGIC:
        // ✅ Active conversation (has AI replies) → ALWAYS respond to client replies
        // ⏸️ First message + old (>24h) → Skip (don't respond to ancient emails)
        
        // 🚨 CRITICAL: Check if AI already responded recently (prevent duplicates!)
        const { data: recentAiReplies, error: recentCheckError } = await supabase
          .from('messages')
          .select('id, created_at')
          .eq('tenant_id', tenantId)
          .eq('sender_type', 'landlord')
          .eq('is_ai_response', true)
          .gte('created_at', new Date(Date.now() - 180000).toISOString()) // Last 3 minutes (increased safety margin)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (recentCheckError) {
          console.error('⚠️  Error checking recent replies:', recentCheckError);
        }
        
        if (recentAiReplies && recentAiReplies.length > 0) {
          const lastReplyTime = new Date(recentAiReplies[0].created_at);
          const timeSince = Math.floor((Date.now() - lastReplyTime.getTime()) / 1000);
          console.log(`⏭️  AI already replied ${timeSince}s ago, skipping duplicate`);
          continue;
        }
        
        if (isOldMessage) {
          console.log('⏸️  Old first message (>24h), skipping auto-reply');
          continue;
        }
        
        if (isActiveConversation) {
          console.log('💬 Active conversation - client replied, sending AI response');
        }

        try {
          if (isReplyInSameThread) {
            console.log('📧 Reply in existing thread - generating contextual response');
          } else if (isNewTenant) {
            console.log('🎉 New tenant - sending welcome auto-reply');
          } else {
            console.log('📨 New message from existing tenant - sending auto-reply');
          }
          
          console.log('🤖 Generating instant auto-reply for:', lead.tenant_name);

          // Get conversation history for context
          const { data: previousMessages } = await supabase
            .from('messages')
            .select('message_text, sender_type')
            .eq('tenant_id', tenantId)
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })
            .limit(10);

          const conversationHistory = [
            ...(previousMessages?.map(msg => ({
              role: msg.sender_type === 'tenant' ? ('user' as const) : ('assistant' as const),
              content: msg.message_text,
            })) || []),
            {
              role: 'user' as const,
              content: lead.message,
            },
          ];

          // Get current tenant data for better context
          const { data: currentTenant } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', tenantId)
            .single();

          // Generate smart AI response
          const aiResult = await generateQualificationResponse({
            tenant: currentTenant || {
              id: tenantId,
              name: lead.tenant_name,
              email: lead.tenant_email,
              phone: lead.tenant_phone,
              qualification_status: isNewTenant ? 'new' : 'qualifying',
            },
            properties: properties || [],
            conversationHistory,
            realtorName: user.email?.split('@')[0] || 'Realtor',
          });

            if (!aiResult.response) {
              throw new Error('AI returned empty response');
            }

            console.log('✅ AI response generated:', aiResult.response.substring(0, 100) + '...');

            // Send email via Gmail
            const emailResult = await sendAutoReply(
              lead.tenant_email,
              lead.tenant_name,
              aiResult.response,
              {
                threadId: lead.threadId,
                messageId: lead.messageId,
                subject: lead.property_address || 'Your property inquiry',
              }
            );

            if (!emailResult.success) {
              throw new Error(emailResult.error || 'Failed to send email');
            }

            console.log('✅ Auto-reply email sent to:', lead.tenant_email);

            // Save AI response as message in DB
            const { error: aiMessageError } = await supabase.from('messages').insert({
              user_id: user.id,
              tenant_id: tenantId,
              sender_type: 'landlord',
              sender_name: user.email?.split('@')[0] || 'Realtor',
              message_text: aiResult.response,
              source: 'email',
              is_ai_response: true,
              is_read: true, // Marked as read since it's sent
            });

            if (aiMessageError) {
              console.error('Error saving AI message:', aiMessageError);
            }

            // Update tenant with extracted data and lead score
            if (aiResult.extractedData && Object.keys(aiResult.extractedData).length > 0) {
              const updateData: any = { 
                ...aiResult.extractedData,
                last_auto_reply_at: new Date().toISOString(),
              };
              
              // Calculate lead score if new data extracted
              const updatedTenant = { ...(currentTenant || {}), ...aiResult.extractedData };
              if (updatedTenant.budget_min || updatedTenant.move_in_date || updatedTenant.bedrooms) {
                const { calculateLeadScore, getLeadQuality } = await import('@/lib/ai-qualification');
                const newScore = calculateLeadScore(updatedTenant);
                const newQuality = getLeadQuality(newScore);
                updateData.lead_score = newScore;
                updateData.lead_quality = newQuality;
                
                // Update qualification status
                if (newScore >= 6) {
                  updateData.qualification_status = 'qualified';
                } else if (newScore >= 3) {
                  updateData.qualification_status = 'qualifying';
                }
              }
              
              const { error: updateError } = await supabase
                .from('tenants')
                .update(updateData)
                .eq('id', tenantId);

              if (updateError) {
                console.error('Error updating tenant with AI data:', updateError);
              }
            } else {
              // Just update last_auto_reply_at
              await supabase
                .from('tenants')
                .update({ last_auto_reply_at: new Date().toISOString() })
                .eq('id', tenantId);
            }

            autoRepliesSent++;
            console.log(`✅ Auto-reply complete for ${lead.tenant_name}`);

        } catch (autoReplyError) {
          console.error('❌ Auto-reply failed for', lead.tenant_name, ':', autoReplyError);
          // Continue with other leads even if auto-reply fails
        }

      } catch (error) {
        console.error('Error saving lead:', error);
      }
    }

    console.log(`✅ Gmail sync complete: ${created} new leads saved, ${autoRepliesSent} auto-replies sent`);

    return NextResponse.json({
      success: true,
      synced: leads.length, // Количество найденных лидов после AI фильтрации
      created, // Количество сохраненных в БД
      autoRepliesSent, // Количество отправленных автоответов
      message: `Found ${leads.length} leads, saved ${created} to database, sent ${autoRepliesSent} auto-replies`,
    });
  } catch (error) {
    console.error('❌ Gmail sync error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to sync Gmail',
      },
      { status: 500 }
    );
  } finally {
    // 🚨 CRITICAL: Always release lock
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      syncLocks.delete(user.id);
      console.log('🔓 Sync lock released');
    }
  }
}
