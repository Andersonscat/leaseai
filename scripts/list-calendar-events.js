
require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

// Mock getCalendarClient since we can't easily import TS in JS script without build
function getCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  if (process.env.GMAIL_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });
  }

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

async function listEvents() {
  console.log('📅 Fetching events from Google Calendar...');
  const calendar = getCalendarClient();
  
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);
  
  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: nextWeek.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    const events = response.data.items || [];
    console.log(`✅ Found ${events.length} upcoming events:`);
    
    events.forEach(event => {
      const start = event.start.dateTime || event.start.date;
      console.log(`- [${start}] ${event.summary} (Attendees: ${event.attendees ? event.attendees.length : 0})`);
    });
    
  } catch (error) {
    // If error is 403/401, it means we lack permissions
    console.error('❌ Error listing events:', error.message);
    if (error.code === 403 || error.code === 401) {
       console.log('\n⚠️  PERMISSION ISSUE: The current Refresh Token does not allow access to Calendar.');
       console.log('👉 You need to get a new token with "https://www.googleapis.com/auth/calendar" scope.');
    }
  }
  process.exit(0);
}

listEvents();
