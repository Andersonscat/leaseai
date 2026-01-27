import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Initialize OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_SITE_URL}/api/gmail/callback`
);

// Generate Auth URL for user to authorize Gmail access
export function getGmailAuthUrl(): string {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force to get refresh token
  });
}

// Exchange authorization code for tokens
export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Create Gmail client with refresh token
export function getGmailClient(refreshToken: string) {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// Get user's email address
export async function getUserEmail(refreshToken: string) {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  return data.email;
}

// Fetch unread messages
export async function fetchUnreadMessages(refreshToken: string, maxResults: number = 10) {
  const gmail = getGmailClient(refreshToken);
  
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread -from:me', // Unread messages not from user
    maxResults,
  });

  return response.data.messages || [];
}

// Get message details
export async function getMessageDetails(refreshToken: string, messageId: string) {
  const gmail = getGmailClient(refreshToken);
  
  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  return response.data;
}

// Parse email content from message
export function parseEmailContent(message: any): {
  from: string;
  subject: string;
  body: string;
  threadId: string;
} {
  const headers = message.payload?.headers || [];
  const from = headers.find((h: any) => h.name === 'From')?.value || '';
  const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
  
  let body = '';
  
  // Extract body from parts
  if (message.payload?.parts) {
    const textPart = message.payload.parts.find((part: any) => 
      part.mimeType === 'text/plain'
    );
    if (textPart?.body?.data) {
      body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
    }
  } else if (message.payload?.body?.data) {
    body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
  }

  // Clean up body (remove quoted replies)
  const cleanBody = (text: string) => {
    // Strategy 1: "On ... at ... wrote:" header (Gmail standard)
    // Relaxed regex to match "On [anything] at [anything] wrote:"
    const gmailHeader = /On\s+[\s\S]+?at\s+[\s\S]+?wrote:/i;
    const splitByGmail = text.split(gmailHeader);
    if (splitByGmail.length > 1) {
      return splitByGmail[0].trim();
    }
    
    // Strategy 2: "On ... wrote:" header (Generic)
    const genericHeader = /On\s+[\s\S]+?wrote:/i;
    const splitByGeneric = text.split(genericHeader);
    if (splitByGeneric.length > 1) {
       return splitByGeneric[0].trim();
    }

    // Strategy 3: Standard separators
    const separatorRegex = /_{3,}|-{3,}/;
    const splitBySeparator = text.split(separatorRegex);
    if (splitBySeparator.length > 1) {
       return splitBySeparator[0].trim();
    }
    
    // Strategy 4: Strip lines starting with ">" (Fallback)
    // If we find a block of > lines, we cut from the first one
    const lines = text.split('\n');
    const firstQuoteIndex = lines.findIndex(line => line.trim().startsWith('>'));
    if (firstQuoteIndex !== -1) {
        return lines.slice(0, firstQuoteIndex).join('\n').trim();
    }

    return text.trim();
  };

  return {
    from,
    subject,
    body: cleanBody(body),
    threadId: message.threadId || '',
  };
}

// Send email reply
export async function sendEmailReply(
  refreshToken: string,
  to: string,
  subject: string,
  body: string,
  threadId?: string
) {
  const gmail = getGmailClient(refreshToken);
  
  const email = [
    `To: ${to}`,
    `Subject: Re: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\n');

  const encodedEmail = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail,
      threadId,
    },
  });

  return response.data;
}

// Mark message as read
export async function markAsRead(refreshToken: string, messageId: string) {
  const gmail = getGmailClient(refreshToken);
  
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: {
      removeLabelIds: ['UNREAD'],
    },
  });
}
