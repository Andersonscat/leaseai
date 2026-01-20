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
    
    // Clean message body (remove signatures, footers, etc)
    let message = body
      .replace(/On .+ wrote:/g, '') // Remove email threads
      .replace(/_{3,}/g, '') // Remove separator lines
      .replace(/^>.*$/gm, '') // Remove quoted text
      .trim();
    
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
      };
    }
    
    // Fallback to old parsing method
    console.log('⚠️ AI parsing failed, using regex fallback');
    const lead = parseEmailBody(body, subject, from);
    
    if (lead) {
      console.log('Parsed lead (regex):', lead);
      return lead;
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
