require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

async function listRecentEmails() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    console.log('📬 Fetching last 10 messages from inbox...');
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'in:inbox',
      maxResults: 10
    });

    const messages = response.data.messages || [];
    if (messages.length === 0) {
      console.log('📭 Inbox is empty');
      return;
    }

    for (const msg of messages) {
      const fullMsg = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date']
      });

      const headers = fullMsg.data.payload.headers;
      const from = headers.find(h => h.name === 'From').value;
      const subject = headers.find(h => h.name === 'Subject').value;
      const date = headers.find(h => h.name === 'Date').value;
      
      console.log(`\nID: ${msg.id}`);
      console.log(`From: ${from}`);
      console.log(`Subject: ${subject}`);
      console.log(`Date: ${date}`);
      console.log(`Snippet: ${fullMsg.data.snippet}`);
      console.log('---');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listRecentEmails();
