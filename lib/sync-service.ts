
import { SupabaseClient, User } from '@supabase/supabase-js';
import { getRecentMessages, sendAutoReply, sendHtmlEmail, buildPropertyListingHtml } from '@/lib/gmail';
import { getOAuthTokens } from '@/lib/oauth-tokens';

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
    // Load per-user OAuth token
    const oauthRow = await getOAuthTokens(user.id);
    if (!oauthRow) {
      console.log('⚠️ No Gmail token found for user', user.id);
      return { success: false, synced: 0, created: 0, autoRepliesSent: 0, message: 'Gmail not connected' };
    }
    const refreshToken = oauthRow.refresh_token;

    const leads = await getRecentMessages(refreshToken, 10); 

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
          // Save original email body (not AI summary) so inbox shows real message
          message_text: lead.original_message || lead.message,
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
        
        // 🚨 Check if AI assistant is enabled for this conversation
        const isAutoReplyEnabled = isNewTenant ? true : (existingTenant?.auto_reply_enabled ?? true);
        
        if (!isAutoReplyEnabled) {
          console.log(`🔇 Auto-reply disabled for ${lead.tenant_name}, skipping AI response (message preserved)`);
          continue;
        }

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
          
          const { analyzeConversation, generateFinalResponse, formatBookingDetails } = await import('@/lib/ai-qualification');
          
          const realtorName    = user.user_metadata?.ai_signature_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Agent';
          const realtorPhone   = user.user_metadata?.ai_phone || user.user_metadata?.phone || user.phone || undefined;
          const realtorCompany = user.user_metadata?.company || user.user_metadata?.brokerage_name || '';
          const timezone       = user.user_metadata?.timezone || 'America/Los_Angeles';
          const viewingHoursStart = user.user_metadata?.viewing_hours_start || '10:00';
          const viewingHoursEnd   = user.user_metadata?.viewing_hours_end   || '20:00';

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
            realtorName,
            realtorPhone,
            realtorCompany,
            timezone,
            viewingHoursStart,
            viewingHoursEnd,
          });

          // 2. HAND: Execute Actions
          let executionResult: { success: boolean; data?: any; error?: string } = { success: true }; // Default for 'reply' action
          
          if (analysis.action === 'book_calendar' && analysis.action_params) {
            console.log('📅 Action: Booking Calendar...');
            try {
              const { createCalendarEvent } = await import('@/lib/calendar-client');
              const args = analysis.action_params;
               
              // Use naive datetime strings to avoid server timezone interference
              const startTimeStr = args.start_time
                .replace(/Z$/i, '')
                .replace(/[+-]\d{2}:\d{2}$/, '')
                .replace(/\.\d{3}$/, '');
              
              const duration = args.duration_minutes || 30;
              const startAsUtc = new Date(startTimeStr + 'Z');
              const endAsUtc = new Date(startAsUtc.getTime() + duration * 60000);
              const endTimeStr = endAsUtc.toISOString().slice(0, 19);
              
              console.log('📅 Passing to Calendar (Pacific):', { start: startTimeStr, end: endTimeStr });
              
              const event = await createCalendarEvent(
                refreshToken,
                startTimeStr,
                endTimeStr,
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
                  start_time: startTimeStr,
                  end_time: endTimeStr,
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
          let finalResponseText = await generateFinalResponse(
            {
               tenant: { name: lead.tenant_name, email: lead.tenant_email },
               properties: properties || [], 
               conversationHistory,
               realtorName,
               realtorPhone,
               realtorCompany,
               timezone,
               viewingHoursStart,
               viewingHoursEnd,
            },
            analysis,
            executionResult
          );

          // 4. THE JUDGE: Anti-Hallucination Enforcement
          const { verifyResponseHallucinations } = await import('@/lib/ai-qualification');
          const verification = await verifyResponseHallucinations(finalResponseText, properties || []);
          
          if (verification.hasHallucinations) {
             console.error('🚨 HALLUCINATION BLOCKED 🚨', verification.reason);
             try {
                const fs = await import('fs');
                const path = await import('path');
                const logFile = path.resolve(process.cwd(), 'server.log');
                fs.appendFileSync(logFile, `🚨 [${new Date().toISOString()}] HALLUCINATION BLOCKED: ${verification.reason}\n`);
             } catch (e) {
                // Ignore file logging errors
             }
             
             // Fallback response instead of sending hallucinated text
             finalResponseText = `Hi ${lead.tenant_name}, I'm currently checking our inventory to confirm the exact details of matching properties. I will get back to you very shortly with accurate information!`;
             // Disable booking/listing inserts that rely on hallucinated data
             analysis.action = 'reply';
          }

          // 3b. ATTACH FORMATTED DETAILS (Code-generated, not AI-generated)
          let finalResponse = finalResponseText;
          if (analysis.action === 'book_calendar' && executionResult.success && analysis.action_params) {
            const bookingBlock = formatBookingDetails({
              address: analysis.action_params.property_address,
              calendarLink: executionResult.data.htmlLink,
              eventTime: analysis.action_params.start_time,
              realtorName,
              realtorPhone: user.user_metadata?.ai_phone || user.user_metadata?.phone || user.phone || 'Contact for details',
            });
            // Add three newlines for better spacing in HTML conversion
            finalResponse = `${finalResponseText}\n\n\n${bookingBlock}`;
          }

          console.log('✅ Final AI Response:', finalResponse.substring(0, 50));

          // Send email via Gmail
          const emailResult = await sendAutoReply(
            refreshToken,
            lead.tenant_email,
            lead.tenant_name,
            finalResponse,
            {
              threadId: lead.threadId,
              messageId: lead.rfcMessageId || lead.messageId,
              subject: lead.subject || lead.property_address || 'Your property inquiry',
            }
          );

          if (!emailResult.success) {
            throw new Error(emailResult.error || 'Failed to send email');
          }

          console.log('✅ Auto-reply email sent to:', lead.tenant_email);

          // Prepare property listings if AI recommended any
          const listingAddresses = analysis.listing_addresses || [];
          let matchedProperties: any[] = [];
          
          if ((analysis.action === 'send_listing' || listingAddresses.length > 0) && properties?.length) {
            matchedProperties = listingAddresses.length > 0
              ? properties.filter(p => listingAddresses.some(addr => p.address.toLowerCase().includes(addr.toLowerCase())))
              : (analysis.suggestedProperties?.length 
                  ? properties.filter(p => analysis.suggestedProperties!.some(sp => p.address.toLowerCase().includes(sp.toLowerCase())))
                  : properties.slice(0, 3));
          }

          // Generate db message text (includes invisible JSON for the frontend to render cards)
          let dbMessageText = finalResponse;
          if (matchedProperties.length > 0) {
             const cleanProps = matchedProperties.map(p => ({
               id: p.id,
               address: p.address,
               city: p.city,
               state: p.state,
               price: p.price_monthly || p.price,
               beds: p.bedrooms,
               baths: p.bathrooms,
               sqft: p.sqft,
               type: p.type,
               image: p.images?.[0] || p.image
             }));
             dbMessageText += `\n\n---PROPERTIES_JSON---\n${JSON.stringify(cleanProps)}\n---END_PROPERTIES_JSON---`;
          }

          // Save AI response as message in DB
          const { error: aiMessageError } = await supabase.from('messages').insert({
            user_id: user.id,
            tenant_id: tenantId,
            sender_type: 'landlord',
            sender_name: realtorName,
            message_text: dbMessageText,
            source: 'email',
            is_ai_response: true,
            is_read: true,
            gmail_message_id: emailResult.messageId,
          });

          if (aiMessageError) {
            console.error('Error saving AI message:', aiMessageError);
          }

          // 4. LISTING EMAIL: Send property photos if AI recommended listings
          if (matchedProperties.length > 0) {
            const { html, text } = buildPropertyListingHtml(matchedProperties, realtorName);
            const listingResult = await sendHtmlEmail(
              refreshToken,
              lead.tenant_email,
              `Property Listings — ${lead.subject || 'Your Inquiry'}`,
              html,
              text,
              {
                threadId: lead.threadId,
                inReplyTo: emailResult.messageId,
              }
            );
            if (listingResult.success) {
              console.log('📸 Property listing email sent with photos');
            } else {
              console.error('Failed to send listing email:', listingResult.error);
            }
          }

          // Update tenant with extracted data
          if (analysis.extractedData || analysis.summary) {
            const updateData: any = { 
              ...(analysis.extractedData || {}),
              ai_summary: analysis.summary,
              lead_priority: analysis.priority || 'warm',
              last_auto_reply_at: new Date().toISOString(),
            };
            
            // Calculate lead score if new data extracted
            const updatedTenant = { 
              ...(existingTenant || {}), 
              ...(analysis.extractedData || {}),
              lead_priority: analysis.priority || 'warm'
            };

            const { calculateLeadScore, getLeadQuality } = await import('@/lib/ai-qualification');
            const newScore = calculateLeadScore(updatedTenant);
            const newQuality = analysis.priority || getLeadQuality(newScore); // Prefer AI's priority assessment
            
            updateData.lead_score = newScore;
            updateData.lead_priority = newQuality;
            
            if (newScore >= 6) updateData.qualification_status = 'qualified';
            else if (newScore >= 3) updateData.qualification_status = 'qualifying';
            
            const { error: updateError } = await supabase
              .from('tenants')
              .update(updateData)
              .eq('id', tenantId);

            if (updateError) {
              console.error('Error updating tenant with AI data:', updateError);
            }
          }
 else {
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
