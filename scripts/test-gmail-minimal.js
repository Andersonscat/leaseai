
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

async function testGmail() {
  console.log('🧪 Testing Gmail connection with new refresh token...');
  console.log('Client ID:', process.env.GOOGLE_CLIENT_ID ? '✅ SET' : '❌ MISSING');
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    console.log('🔍 Fetching messages from last 1 hour...');
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'newer_than:1h',
      maxResults: 5
    });

    const messages = response.data.messages || [];
    console.log(`✅ Success! Found ${messages.length} recent messages.`);
    
    if (messages.length > 0) {
      console.log('Sample message ID:', messages[0].id);
    } else {
      console.log('ℹ️ No new messages in the last hour, but the connection works.');
    }
  } catch (error) {
    console.error('❌ Gmail API Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testGmail();
