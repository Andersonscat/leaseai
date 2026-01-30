
import { SupabaseClient, User } from '@supabase/supabase-js';
import { getRecentUnreadMessages, sendAutoReply } from '@/lib/gmail';
// import { generateQualificationResponse } from '@/lib/ai-qualification';

// Global sync lock to prevent concurrent syncs
const syncLocks = new Map<string, boolean>();

export interface SyncResult {
  success: boolean;
  synced: number;
  created: number;
  autoRepliesSent: number;
  message: string;
}

export async function syncGmailMessages(
  supabase: SupabaseClient,
  user: User
): Promise<SyncResult> {
  // 🚨 CRITICAL: Prevent concurrent syncs for same user
  if (syncLocks.get(user.id)) {
    console.log('⏸️  Sync already in progress for this user, skipping...');
    return {
      success: true,
      synced: 0,
      created: 0,
      autoRepliesSent: 0,
      message: 'Sync already in progress',
    };
  }

  // Set lock
  syncLocks.set(user.id, true);
  console.log('📧 Starting Gmail sync service...');

  try {
    // Получаем отфильтрованные и обработанные лиды
    // Уменьшаем с 20 до 5 для быстрой синхронизации
    const leads = await getRecentUnreadMessages(5); 

    if (!leads || leads.length === 0) {
      console.log('✅ No new leads found');
      return {
        success: true,
        synced: 0,
        created: 0,
        autoRepliesSent: 0,
        message: 'No new leads',
      };
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
      .in('status', ['Active', 'Available', 'active', 'available']);
    
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
      })),
      error: propertiesError,
    });

    // Сохраняем лиды в БД (они уже обработаны AI!)
    for (const lead of leads) {
      try {
        console.log(`\n🔍 Processing lead from: ${lead.tenant_email}`);
        
        // Проверяем существует ли уже tenant с таким email
        const { data: existingTenants, error: searchError } = await supabase
          .from('tenants')
          .select('id, auto_reply_enabled, gmail_thread_id, email')
          .eq('user_id', user.id)
          .ilike('email', lead.tenant_email);
        
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
              gmail_thread_id: lead.threadId,
              gmail_message_id: lead.messageId,
              auto_reply_enabled: true,
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
          // Update thread ID if new thread
          await supabase
            .from('tenants')
            .update({ gmail_thread_id: lead.threadId })
            .eq('id', tenantId);
        }

        // 🚨 CRITICAL: Check if Gmail message already processed
        if (lead.messageId) {
          const { data: existingMessages } = await supabase
            .from('messages')
            .select('id')
            .eq('gmail_message_id', lead.messageId)
            .limit(1);
            
          if (existingMessages && existingMessages.length > 0) {
            console.log('⏭️  Gmail message already processed (ID: ' + lead.messageId + '), skipping');
            continue;
          }
        }

        // Check active conversation
        const { data: aiMessages } = await supabase
          .from('messages')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('sender_type', 'landlord') // Check for landlord messages (AI/User)
          .limit(1);
        
        const isActiveConversation = !!(aiMessages && aiMessages.length > 0);
        
        // Check if old first message
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
          gmail_message_id: lead.messageId,
        });

        if (messageError) {
          console.error('Error creating message:', messageError);
          continue;
        }

        created++;
        console.log(`✅ Saved lead from ${lead.tenant_name}`);

        // 🤖 AUTO-REPLY LOGIC
        
        // Check recent AI replies
        const { data: recentAiReplies, error: recentCheckError } = await supabase
          .from('messages')
          .select('id, created_at')
          .eq('tenant_id', tenantId)
          .eq('sender_type', 'landlord')
          .eq('is_ai_response', true)
          .eq('is_ai_response', true)
          .gte('created_at', new Date(Date.now() - 10000).toISOString()) // Only block if replied in last 10s (race condition)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (recentCheckError) {
          console.error('⚠️  Error checking recent replies:', recentCheckError);
        }
        
        // Only skip if AI replied VERY recently (prevent infinite loops)
        if (recentAiReplies && recentAiReplies.length > 0) {
           console.log(`⏳ AI replied just now (<10s), skipping to prevent loop`);
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

          // Get conversation history
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

          // =================================================================================
          // 🆕 AGENTIC PIPELINE: Brain -> Hand -> Voice
          // =================================================================================
          
          const { analyzeConversation, generateFinalResponse } = await import('@/lib/ai-qualification');
          
          // 1. BRAIN: Analyze and Plan
          const analysis = await analyzeConversation({
            tenant: {
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

          // 2. HAND: Execute Actions
          let executionResult: { success: boolean; data?: any; error?: string } = { success: true }; // Default for 'reply' action
          
          if (analysis.action === 'book_calendar' && analysis.action_params) {
            console.log('📅 Action: Booking Calendar...');
            try {
              const { createCalendarEvent } = await import('@/lib/calendar-client');
              const args = analysis.action_params;
              
              const startTime = new Date(args.start_time);
              const duration = args.duration_minutes || 30;
              const endTime = new Date(startTime.getTime() + duration * 60000);
              
              const event = await createCalendarEvent(
                startTime.toISOString(),
                endTime.toISOString(),
                `Viewing: ${args.property_address}`,
                `Client: ${args.client_name || lead.tenant_name}\nPhone: ${lead.tenant_phone}\nEmail: ${lead.tenant_email}`,
                lead.tenant_email
              );
              
              executionResult = { success: true, data: event };
              console.log('✅ Booking Execution Success:', event.htmlLink);

              // Save appointment to Supabase
              try {
                const fs = await import('fs');
                const path = await import('path');
                const logFile = path.resolve(process.cwd(), 'server.log');

                const { error: appointmentError } = await supabase.from('appointments').insert({
                  user_id: user.id,
                  tenant_id: tenantId,
                  property_id: properties?.find(p => p.address === args.property_address)?.id || null, 
                  title: `Viewing: ${args.property_address}`,
                  start_time: startTime.toISOString(),
                  end_time: endTime.toISOString(),
                  description: `Client: ${args.client_name || lead.tenant_name}\nPhone: ${lead.tenant_phone}\nEmail: ${lead.tenant_email}`,
                  google_event_id: event.id,
                  google_event_link: event.htmlLink,
                  status: 'confirmed'
                });

                if (appointmentError) {
                  const logMsg = `❌ [${new Date().toISOString()}] DB Save Error: ${JSON.stringify(appointmentError)}\n`;
                  fs.appendFileSync(logFile, logMsg);
                  console.error('❌ Failed to save appointment to DB:', appointmentError);
                } else {
                  const logMsg = `✅ [${new Date().toISOString()}] DB Save Success: ${event.id}\n`;
                  fs.appendFileSync(logFile, logMsg);
                  console.log('✅ Appointment saved to DB');
                }
              } catch (dbError: any) {
                const fs = await import('fs');
                const path = await import('path');
                const logFile = path.resolve(process.cwd(), 'server.log');
                const logMsg = `❌ [${new Date().toISOString()}] DB Exception: ${dbError?.message || JSON.stringify(dbError)}\n`;
                fs.appendFileSync(logFile, logMsg);
                console.error('❌ Error saving appointment to DB:', dbError);
              }
              
            } catch (err: any) {
              console.error('❌ Booking Execution Failed:', err);
              const fs = await import('fs');
              const path = await import('path');
              const logFile = path.resolve(process.cwd(), 'server.log');
              fs.appendFileSync(logFile, `❌ [${new Date().toISOString()}] Execution Error: ${err.message}\n`);
              
              executionResult = { success: false, error: err.message || 'Unknown calendar error' };
            }
          }

          // 3. VOICE: Generate Response
          const finalResponse = await generateFinalResponse(
            {
               tenant: { name: lead.tenant_name, email: lead.tenant_email },
               properties: properties || [], 
               conversationHistory,
               realtorName: 'Agent'
            },
            analysis,
            executionResult
          );

          console.log('✅ Final AI Response:', finalResponse.substring(0, 50));

          // Send email via Gmail
          const emailResult = await sendAutoReply(
            lead.tenant_email,
            lead.tenant_name,
            finalResponse,
            {
              threadId: lead.threadId,
              messageId: lead.rfcMessageId || lead.messageId, // Use RFC ID if available, else fallback
              subject: lead.subject || lead.property_address || 'Your property inquiry',
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
            message_text: finalResponse,
            source: 'email',
            is_ai_response: true,
            is_read: true,
          });

          if (aiMessageError) {
            console.error('Error saving AI message:', aiMessageError);
          }

          // Update tenant with extracted data
          if (analysis.extractedData && Object.keys(analysis.extractedData).length > 0) {
            const updateData: any = { 
              ...analysis.extractedData,
              last_auto_reply_at: new Date().toISOString(),
            };
            
            // Calculate lead score if new data extracted
            const updatedTenant = { ...(existingTenant || {}), ...analysis.extractedData };
            if (updatedTenant.budget_min || updatedTenant.move_in_date || updatedTenant.bedrooms) {
              const { calculateLeadScore, getLeadQuality } = await import('@/lib/ai-qualification');
              const newScore = calculateLeadScore(updatedTenant);
              const newQuality = getLeadQuality(newScore);
              updateData.lead_score = newScore;
              updateData.lead_quality = newQuality;
              
              if (newScore >= 6) updateData.qualification_status = 'qualified';
              else if (newScore >= 3) updateData.qualification_status = 'qualifying';
            }
            
            const { error: updateError } = await supabase
              .from('tenants')
              .update(updateData)
              .eq('id', tenantId);

            if (updateError) {
              console.error('Error updating tenant with AI data:', updateError);
            }
          } else {
            await supabase
              .from('tenants')
              .update({ last_auto_reply_at: new Date().toISOString() })
              .eq('id', tenantId);
          }

          autoRepliesSent++;
          console.log(`✅ Auto-reply complete for ${lead.tenant_name}`);

        } catch (autoReplyError) {
          console.error('❌ Auto-reply failed for', lead.tenant_name, ':', autoReplyError);
        }

      } catch (error) {
        console.error('Error saving lead:', error);
      }
    }

    console.log(`✅ Gmail sync complete: ${created} new leads saved, ${autoRepliesSent} auto-replies sent`);

    return {
      success: true,
      synced: leads.length,
      created,
      autoRepliesSent,
      message: `Found ${leads.length} leads, saved ${created} to database, sent ${autoRepliesSent} auto-replies`,
    };

  } catch (error) {
    console.error('❌ Gmail sync error:', error);
    throw error;
  } finally {
    // 🚨 CRITICAL: Always release lock
    syncLocks.delete(user.id);
    console.log('🔓 Sync lock released');
  }
}
