// Gmail API Integration for automatic lead parsing
// This will watch your Gmail inbox and automatically create leads

import { google } from 'googleapis';
import { hybridEmailParser } from './ai-email-parser';
import { isRealLeadAI } from './ai-email-filter';

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
  source: string;
  property_address?: string;
  subject?: string; // Original email subject
  messageId?: string; // Gmail message ID for threading
  rfcMessageId?: string; // RFC 2822 Message-ID header for threading
  threadId?: string; // Gmail thread ID for threading
}

/**
 * Initialize Gmail API client
 */
export function getGmailClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Set credentials from stored tokens
  if (process.env.GMAIL_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });
  }

  return google.gmail({ version: 'v1', auth: oauth2Client });
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
    
    // Clean message body - AGGRESSIVELY remove quoted text and old threads
    let message = body;
    
    // Method 1: Remove lines starting with > (quoted text and security warnings)
    // CRITICAL: Do this FIRST before other processing
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
      
      // Skip university security warnings
      if (trimmed.includes('Untrusted Sender') || 
          trimmed.includes('This Message Is From') ||
          trimmed.includes('Please contact the UW-IT') ||
          trimmed.includes('for additional information')) {
        foundQuotedSection = true;
        continue;
      }
      
      // If we found quoted section and this is empty line, skip
      if (foundQuotedSection && trimmed === '') {
        continue;
      }
      
      // Stop if we hit "wrote:" pattern (quoted email)
      // Check for quote marker on the line (handling non-breaking spaces and variations)
      const quoteMatch = trimmed.match(/(On\s+[\s\S]+wrote:|From:\s+[\s\S]+)/i) || 
                         trimmed.match(/<.+@.+>\s+wrote:/i) ||
                         trimmed.match(/^On\s+.*,\s+.*at\s+.*wrote:/i); // Specific common pattern
      
      if (quoteMatch) {
         // If marker found, take only text BEFORE it
         const index = quoteMatch.index || 0;
         if (index > 0) {
           cleanLines.push(line.substring(0, index).trim());
         }
         break; // Stop processing remaining lines
      }
      
      // Also check for "On [Date], [Time], [Name] wrote:" specifically which might have special spaces
      if (trimmed.startsWith('On ') && trimmed.includes('wrote:')) {
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
      if (markerIndex > 50) { // Only cut if marker is not at the very beginning
        // Look backwards for "On" or "<email>" before "wrote:"
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
    
    // Method 4: Take only first meaningful content (first few paragraphs)
    const paragraphs = message.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length > 0) {
      // Take first 2 paragraphs or until we hit 500 chars
      let result = '';
      for (let i = 0; i < Math.min(paragraphs.length, 3); i++) {
        const para = paragraphs[i].trim();
        // Skip if paragraph looks like a header or metadata
        if (para.match(/^(From|To|Subject|Date|Sent):/i)) continue;
        
        if (result.length + para.length > 500) {
          if (result.length === 0 && para.length > 50) {
            result = para; // Take first paragraph even if long
          }
          break;
        }
        result += (result ? '\n\n' : '') + para;
      }
      message = result || paragraphs[0];
    }
    
    message = message.trim();
    
    // Limit message length
    if (message.length > 1000) {
      message = message.substring(0, 1000) + '...';
    }
    
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
export async function watchInbox(userId: string = 'me') {
  const gmail = getGmailClient();
  
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
 * Process new email and create lead (with AI parsing)
 */
export async function processNewEmail(messageId: string, userId: string = 'me'): Promise<ParsedLead | null> {
  const gmail = getGmailClient();
  
  try {
    // Get full message
    const response = await gmail.users.messages.get({
      userId,
      id: messageId,
      format: 'full',
    });
    
    const message = response.data;
    
    // Extract headers
    const headers = message.payload?.headers || [];
    const from = headers.find(h => h.name === 'From')?.value || '';
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const rfcMessageId = headers.find(h => h.name === 'Message-ID')?.value;
    
    // Get body
    const body = getEmailBody(message);
    
    // Try AI-powered hybrid parsing first
    console.log('🤖 Parsing email with AI...');
    const aiParsed = await hybridEmailParser(from, subject, body);
    
    if (aiParsed) {
      console.log('✅ AI parsed successfully:', {
        name: aiParsed.tenant_name,
        source: aiParsed.source,
        intent: aiParsed.intent,
        urgency: aiParsed.urgency,
      });
      
      // Use original email body instead of AI summary
      const originalMessage = body.trim() || subject;
      
      return {
        tenant_name: aiParsed.tenant_name,
        tenant_email: aiParsed.tenant_email,
        tenant_phone: aiParsed.tenant_phone,
        message: originalMessage,  // ← ОРИГИНАЛЬНЫЙ ТЕКСТ!
        source: aiParsed.source,
        property_address: aiParsed.property_address,
        subject: subject, // Pass original subject
        messageId: message.id || undefined,
        rfcMessageId: rfcMessageId || undefined, // Pass proper Message-ID
        threadId: message.threadId || undefined,
      };
    }
    
    // Fallback to old parsing method
    console.log('⚠️ AI parsing failed, using regex fallback');
    const lead = parseEmailBody(body, subject, from);
    
    if (lead) {
      console.log('Parsed lead (regex):', lead);
      return {
        ...lead,
        subject: subject,
        messageId: message.id || undefined,
        rfcMessageId: rfcMessageId || undefined,
        threadId: message.threadId || undefined,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error processing email:', error);
    return null;
  }
}

/**
 * Check if email is a real lead using AI
 * Falls back to regex if AI unavailable
 */
async function isRealLead(subject: string, body: string, from: string): Promise<boolean> {
  const result = await isRealLeadAI(from, subject, body);
  return result.isLead;
}

/**
 * Get recent unread messages (for initial sync)
 * Filters out newsletters, receipts, and non-lead emails
 */
export async function getRecentUnreadMessages(maxResults: number = 10, userId: string = 'me') {
  const gmail = getGmailClient();
  
  try {
    // Option 1: Sync only from specific label (if user has set up Gmail filters)
    // Uncomment this if you want to use Gmail labels:
    // const response = await gmail.users.messages.list({
    //   userId,
    //   q: 'is:unread label:leads',  // Only emails with "Leads" label
    //   maxResults,
    // });
    
    // Option 2: Sync all unread from inbox (default)
    const response = await gmail.users.messages.list({
      userId,
      q: 'is:unread in:inbox',
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
        const body = getEmailBody(fullMessage.data);
        
        // 🤖 AI-powered filtering
        const isLead = await isRealLead(subject, body, from);
        
        if (!isLead) {
          console.log(`⏭️  AI Skipped: "${subject}"`);
          continue;
        }
        
        console.log(`✅ AI Approved: "${subject}"`);
        const lead = await processNewEmail(message.id, userId);
        if (lead) {
          leads.push(lead);
        }
      }
    }
    
    return leads;
  } catch (error) {
    console.error('Error getting unread messages:', error);
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
  to: string,
  subject: string,
  body: string,
  options?: {
    threadId?: string;
    inReplyTo?: string;
    userId?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const gmail = getGmailClient();
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
 * Send auto-reply to a lead
 * Uses proper email threading to keep conversation organized
 */
export async function sendAutoReply(
  leadEmail: string,
  leadName: string,
  replyMessage: string,
  options?: {
    threadId?: string;
    messageId?: string;
    subject?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const subject = options?.subject 
      ? `Re: ${options.subject.replace(/^Re:\s*/i, '')}` 
      : 'Re: Your property inquiry';
    
    const result = await sendEmail(
      leadEmail,
      subject,
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
