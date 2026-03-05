// Gmail API Integration for automatic lead parsing
// This will watch your Gmail inbox and automatically create leads

import { google } from 'googleapis';
import { unifiedEmailProcessor, AIParserResult } from './ai-email-parser';

// Email patterns for different platforms
const EMAIL_PATTERNS = {
  zillow: {
    from: ['noreply@zillow.com', 'leads@zillow.com'],
    source: 'zillow',
  },
  airbnb: {
    from: ['automated@airbnb.com', 'inquiries@airbnb.com'],
    source: 'airbnb',
  },
  facebook: {
    from: ['notification@facebookmail.com', 'marketplace@facebookmail.com'],
    source: 'facebook',
  },
  craigslist: {
    from: ['craigslist.org'],
    source: 'craigslist',
  },
};

interface ParsedLead {
  tenant_name: string;
  tenant_email: string;
  tenant_phone?: string;
  message: string;
  original_message?: string; // Original verbatim email body
  source: string;
  property_address?: string;
  subject?: string; // Original email subject
  messageId?: string; // Gmail message ID for threading
  rfcMessageId?: string; // RFC 2822 Message-ID header for threading
  threadId?: string; // Gmail thread ID for threading
}

/**
 * Initialize Gmail API client.
 * Requires an explicit refresh token (loaded from oauth_tokens table by the caller).
 */
export function getGmailClient(refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * CLEAN email body - AGGRESSIVELY remove quoted text, old threads, and signatures
 */
export function cleanEmailBody(body: string, subject: string): string {
  try {
    let message = body;
    
    // Method 1: Remove lines starting with > (quoted text and security warnings)
    const lines = message.split('\n');
    const cleanLines = [];
    let foundQuotedSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Skip quoted lines (start with >)
      if (trimmed.startsWith('>')) {
        foundQuotedSection = true;
        continue;
      }
      
      // Skip separator lines
      if (trimmed.match(/^[-_|=]{3,}$/)) {
        foundQuotedSection = true;
        continue;
      }
      
      // Skip university/corporate security warnings
      if (trimmed.includes('Untrusted Sender') || 
          trimmed.includes('This Message Is From') ||
          trimmed.includes('Please contact the') ||
          trimmed.includes('for additional information') ||
          trimmed.includes('Caution: External Email')) {
        foundQuotedSection = true;
        continue;
      }
      
      // If we found quoted section and this is empty line, skip
      if (foundQuotedSection && trimmed === '') {
        continue;
      }
      
      // Stop if we hit "wrote:" pattern (quoted email)
      const quoteMatch = trimmed.match(/(On\s+[\s\S]+wrote:|From:\s+[\s\S]+)/i) || 
                         trimmed.match(/<.+@.+>\s+wrote:/i) ||
                         trimmed.match(/^On\s+.*,\s+.*at\s+.*wrote:/i) ||
                         trimmed.match(/^On\s+(Mon|Tue|Wed|Thu|Fri|Sat|Sun),.*wrote:?$/i);
      
      if (quoteMatch) {
         const index = quoteMatch.index || 0;
         if (index > 0) {
           cleanLines.push(line.substring(0, index).trim());
         }
         break; 
      }
      
      if (trimmed.startsWith('On ') && (trimmed.includes('wrote:') || trimmed.endsWith('wrote'))) {
         break;
      }
      
      cleanLines.push(line);
    }
    
    message = cleanLines.join('\n').trim();
    
    // Method 2: Cut at common quote markers if still present
    const quoteMarkers = [
      'wrote:',
      'Original Message',
      'Forwarded message',
      'From:',
      'Sent:',
    ];
    
    for (const marker of quoteMarkers) {
      const markerIndex = message.toLowerCase().indexOf(marker.toLowerCase());
      if (markerIndex > 30) { 
        let cutIndex = markerIndex;
        for (let i = markerIndex - 1; i >= Math.max(0, markerIndex - 100); i--) {
          if (message[i] === '\n' && message.substring(i + 1, i + 4) === 'On ') {
            cutIndex = i;
            break;
          }
        }
        message = message.substring(0, cutIndex).trim();
        break;
      }
    }
    
    // Method 3: Remove email signatures
    message = message.replace(/\n--\s*\n[\s\S]*$/m, '');
    
    // Method 4: Take only meaningful paragraphs
    const paragraphs = message.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length > 0) {
      let result = '';
      for (let i = 0; i < Math.min(paragraphs.length, 3); i++) {
        const para = paragraphs[i].trim();
        if (para.match(/^(From|To|Subject|Date|Sent):/i)) continue;
        
        if (result.length + para.length > 1000) break;
        result += (result ? '\n\n' : '') + para;
      }
      message = result || paragraphs[0];
    }
    
    return message.trim();
  } catch (error) {
    console.error('Error cleaning email:', error);
    return body; // Fallback to raw if logic fails
  }
}

/**
 * Detect source from email address
 */
function detectSource(from: string): string {
  const fromLower = from.toLowerCase();
  
  for (const [platform, config] of Object.entries(EMAIL_PATTERNS)) {
    if (config.from.some(pattern => fromLower.includes(pattern))) {
      return config.source;
    }
  }
  
  return 'email'; // default source
}

/**
 * Parse email body to extract lead information
 */
function parseEmailBody(body: string, subject: string, from: string): ParsedLead | null {
  try {
    // Extract email from "From" header
    const emailMatch = from.match(/[\w.-]+@[\w.-]+\.\w+/);
    const senderEmail = emailMatch ? emailMatch[0] : '';
    
    // Extract name from "From" header (before email)
    const nameMatch = from.match(/^([^<]+)</);
    let senderName = nameMatch ? nameMatch[1].trim() : senderEmail.split('@')[0];
    
    // Remove quotes if present
    senderName = senderName.replace(/["']/g, '');
    
    // Extract phone number from body
    const phoneMatch = body.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[0] : undefined;
    
    // Extract property address from subject or body
    const addressMatch = subject.match(/(?:Re:|Inquiry about|Question about)\s*(.+?)(?:\s*-|\s*$)/i);
    const propertyAddress = addressMatch ? addressMatch[1].trim() : undefined;
    
    // Clean message body
    const message = cleanEmailBody(body, subject);
    
    const source = detectSource(from);
    
    return {
      tenant_name: senderName || 'Unknown',
      tenant_email: senderEmail,
      tenant_phone: phone,
      message: message || subject,
      source,
      property_address: propertyAddress,
    };
  } catch (error) {
    console.error('Error parsing email:', error);
    return null;
  }
}

/**
 * Get email body from message parts
 */
function getEmailBody(message: any): string {
  let body = '';
  
  if (message.payload.parts) {
    // Multipart message
    for (const part of message.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body.data) {
        body += Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
    }
  } else if (message.payload.body.data) {
    // Simple message
    body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
  }
  
  return body;
}

/**
 * Watch Gmail inbox for new messages
 */
export async function watchInbox(refreshToken: string, userId: string = 'me') {
  const gmail = getGmailClient(refreshToken);
  
  try {
    const response = await gmail.users.watch({
      userId,
      requestBody: {
        topicName: process.env.GMAIL_PUBSUB_TOPIC,
        labelIds: ['INBOX'],
      },
    });
    
    console.log('Gmail watch started:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error setting up Gmail watch:', error);
    throw error;
  }
}

/**
 * Process new email and create lead (using Unified AI)
 */
export async function processNewEmail(refreshToken: string, messageId: string, userId: string = 'me'): Promise<AIParserResult | null> {
  const gmail = getGmailClient(refreshToken);
  
  try {
    const response = await gmail.users.messages.get({
      userId,
      id: messageId,
      format: 'full',
    });
    
    const message = response.data;
    const headers = message.payload?.headers || [];
    const from = headers.find(h => h.name === 'From')?.value || '';
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const rfcMessageId = headers.find(h => h.name === 'Message-ID')?.value;
    const body = getEmailBody(message);
    
    const lead = await unifiedEmailProcessor(from, subject, body);
    if (lead) {
      lead.messageId = message.id || undefined;
      lead.rfcMessageId = rfcMessageId || undefined;
      lead.threadId = message.threadId || undefined;
      lead.subject = subject;
    }
    return lead;
  } catch (error) {
    console.error('Error processing email:', error);
    return null;
  }
}

/**
 * Get recent unread messages (for initial sync)
 * Filters out newsletters, receipts, and non-lead emails
 */
export async function getRecentMessages(refreshToken: string, maxResults: number = 10, userId: string = 'me') {
  const gmail = getGmailClient(refreshToken);
  
  try {
    // Sync all messages from inbox in the last 2 hours (read or unread)
    const response = await gmail.users.messages.list({
      userId,
      q: 'in:inbox newer_than:2h',
      maxResults,
    });
    
    const messages = response.data.messages || [];
    const leads: ParsedLead[] = [];
    
    for (const message of messages) {
      if (message.id) {
        // Get full message to check subject/body
        const fullMessage = await gmail.users.messages.get({
          userId,
          id: message.id,
          format: 'full',
        });
        
        const headers = fullMessage.data.payload?.headers || [];
        const from = headers.find(h => h.name === 'From')?.value || '';
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const rfcMessageId = headers.find(h => h.name === 'Message-ID')?.value;
        const body = getEmailBody(fullMessage.data);
        
        // 🤖 UNIFIED AI: One call to filter AND parse
        const lead = await unifiedEmailProcessor(from, subject, body);
        
        if (!lead || !lead.isLead) {
          console.log(`⏭️  AI Skipped: "${subject}" - ${lead?.reason || 'Not a lead'}`);
          continue;
        }

        console.log(`✅ AI Approved Lead: "${subject}"`);
        
        // Add metadata to lead result
        lead.messageId = fullMessage.data.id || undefined;
        lead.rfcMessageId = rfcMessageId || undefined;
        lead.threadId = fullMessage.data.threadId || undefined;
        lead.subject = subject;
        
        // Always use cleaned body (strips quoted replies, signatures, etc.)
        // so inbox shows only the client's new message, not the trailing thread
        lead.original_message = cleanEmailBody(body, subject) || body;
        
        leads.push(lead);

        // ⏱️ Delay between messages to avoid burst rate limits 
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return leads;
  } catch (error) {
    console.error('Error getting recent messages:', error);
    return [];
  }
}

/**
 * Send email via Gmail API
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param body - Email body (plain text)
 * @param threadId - Optional: Gmail thread ID to reply to (keeps conversation together)
 * @param inReplyTo - Optional: Message-ID header for proper threading
 */
export async function sendEmail(
  refreshToken: string,
  to: string,
  subject: string,
  body: string,
  options?: {
    threadId?: string;
    inReplyTo?: string;
    userId?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const gmail = getGmailClient(refreshToken);
  const userId = options?.userId || 'me';
  
  try {
    console.log('📧 Sending email to:', to);
    
    // Get user's email address for "From" header
    const profile = await gmail.users.getProfile({ userId });
    const fromEmail = profile.data.emailAddress || '';
    
    // Build email message in RFC 2822 format
    const messageParts = [
      `From: ${fromEmail}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
    ];
    
    // Add threading headers if replying
    if (options?.inReplyTo) {
      messageParts.push(`In-Reply-To: ${options.inReplyTo}`);
      messageParts.push(`References: ${options.inReplyTo}`);
    }
    
    // Empty line separates headers from body
    messageParts.push('');
    messageParts.push(body);
    
    const message = messageParts.join('\r\n');
    
    // Encode message in base64url format (required by Gmail API)
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // Send the email
    const requestBody: any = {
      raw: encodedMessage,
    };
    
    // If threadId provided, add it to keep conversation together
    if (options?.threadId) {
      requestBody.threadId = options.threadId;
    }
    
    const response = await gmail.users.messages.send({
      userId,
      requestBody,
    });
    
    console.log('✅ Email sent successfully:', response.data.id);
    
    return {
      success: true,
      messageId: response.data.id || undefined,
    };
    
  } catch (error: any) {
    console.error('❌ Error sending email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send HTML email via Gmail API (for property listing emails with photos)
 */
export async function sendHtmlEmail(
  refreshToken: string,
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string,
  options?: {
    threadId?: string;
    inReplyTo?: string;
    userId?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const gmail = getGmailClient(refreshToken);
  const userId = options?.userId || 'me';
  
  try {
    console.log('📧 Sending HTML email to:', to);
    
    const profile = await gmail.users.getProfile({ userId });
    const fromEmail = profile.data.emailAddress || '';
    
    // MIME boundary for multipart
    const boundary = `boundary_${Date.now()}`;
    
    const headers = [
      `From: ${fromEmail}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ];
    
    if (options?.inReplyTo) {
      headers.push(`In-Reply-To: ${options.inReplyTo}`);
      headers.push(`References: ${options.inReplyTo}`);
    }
    
    const messageParts = [
      headers.join('\r\n'),
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      textBody,
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlBody,
      `--${boundary}--`,
    ];
    
    const message = messageParts.join('\r\n');
    
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const requestBody: any = { raw: encodedMessage };
    if (options?.threadId) {
      requestBody.threadId = options.threadId;
    }
    
    const response = await gmail.users.messages.send({
      userId,
      requestBody,
    });
    
    console.log('✅ HTML email sent successfully:', response.data.id);
    return { success: true, messageId: response.data.id || undefined };
    
  } catch (error: any) {
    console.error('❌ Error sending HTML email:', error);
    return { success: false, error: error.message || 'Failed to send HTML email' };
  }
}

/**
 * Build HTML email body for property listing
 */
export function buildPropertyListingHtml(
  properties: Array<{
    address: string;
    price: string;
    bedrooms: number;
    description?: string;
    images?: string[];
    pet_policy?: string;
    parking_type?: string;
    available_from?: string;
  }>,
  realtorName: string
): { html: string; text: string } {
  const cards = properties.map(p => {
    const imageUrl = p.images?.[0] || `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop`;
    return `
    <div style="border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;margin-bottom:20px;max-width:560px;font-family:Arial,sans-serif;">
      <img src="${imageUrl}" alt="${p.address}" style="width:100%;height:220px;object-fit:cover;" />
      <div style="padding:16px 20px;">
        <h3 style="margin:0 0 8px;color:#1a1a1a;font-size:18px;">${p.address}</h3>
        <p style="margin:0 0 8px;color:#2563eb;font-size:22px;font-weight:700;">${p.price}/mo</p>
        <p style="margin:0 0 8px;color:#555;font-size:14px;">
          🛏 ${p.bedrooms} ${p.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
          ${p.pet_policy && p.pet_policy !== 'no_pets' ? ' • 🐾 Pets OK' : ''}
          ${p.parking_type ? ` • 🅿️ ${p.parking_type}` : ''}
        </p>
        ${p.available_from ? `<p style="margin:0 0 8px;color:#555;font-size:13px;">Available: ${p.available_from}</p>` : ''}
        ${p.description ? `<p style="margin:0;color:#666;font-size:13px;line-height:1.4;">${p.description.substring(0, 200)}${p.description.length > 200 ? '...' : ''}</p>` : ''}
      </div>
    </div>`;
  }).join('\n');

  const html = `
  <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333;">
    <h2 style="color:#1a1a1a;margin-bottom:4px;">Property Listings For You</h2>
    <p style="color:#888;margin-top:0;margin-bottom:24px;font-size:14px;">Here are some options I think would be a great fit:</p>
    ${cards}
    <p style="color:#666;font-size:14px;margin-top:24px;">
      Interested in any of these? Reply to this email and I'll set up a viewing for you.
    </p>
    <p style="color:#333;font-size:14px;">Best regards,<br/><strong>${realtorName}</strong></p>
  </div>`;

  const text = properties.map(p => 
    `${p.address} — ${p.price}/mo, ${p.bedrooms} bed(s). ${p.description?.substring(0, 100) || ''}`
  ).join('\n\n') + `\n\nBest regards,\n${realtorName}`;

  return { html, text };
}


/**
 * Send auto-reply to a lead
 * Uses proper email threading to keep conversation organized.
 * Converts basic Markdown to HTML for hyperlink support.
 */
export async function sendAutoReply(
  refreshToken: string,
  leadEmail: string,
  leadName: string,
  replyMessage: string,
  options?: {
    threadId?: string;
    messageId?: string;
    subject?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const subject = options?.subject 
      ? `Re: ${options.subject.replace(/^Re:\s*/i, '')}` 
      : 'Re: Your property inquiry';
    
    // Simple Markdown to HTML conversion for links and formatting
    const htmlBody = replyMessage
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #2563eb; text-decoration: underline;">$1</a>') // Links
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*([^*]+)\*/g, '<em>$1</em>') // Italic
      .replace(/^\*(.+)$/gm, '<li>$1</li>') // Bullted list items
      .replace(/(<li>.+<\/li>(\n<li>.+<\/li>)*)/g, '<ul style="padding-left: 20px;">$1</ul>') // Wrap lists
      .replace(/\n/g, '<br/>'); // Line breaks

    const formattedHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.8; color: #2d3748; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="margin-bottom: 24px;">
          ${htmlBody.split('<br/><br/>').map(p => `<p style="margin: 0 0 16px 0;">${p}</p>`).join('')}
        </div>
      </div>
    `;
    
    const result = await sendHtmlEmail(
      refreshToken,
      leadEmail,
      subject,
      formattedHtml,
      replyMessage,
      {
        threadId: options?.threadId,
        inReplyTo: options?.messageId,
      }
    );
    
    return result;
    
  } catch (error: any) {
    console.error('❌ Error in auto-reply:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
