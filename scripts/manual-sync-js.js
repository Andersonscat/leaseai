require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Mock next/server and other things that sync-service might need 
// But sync-service.ts actually just needs Supabase and User

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log('🚀 Triggering Sync via JS Fallback...');
  
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (userError || !users.length) {
    console.error('❌ No users found');
    return;
  }
  
  const user = users[0];
  console.log('👤 Syncing for:', user.email);

  // We need to handle the alias resolution manually if we're using require on a TS file 
  // But wait, sync-service is TS. Node can't require it directly.
  
  // I'll create a script that just calls the API endpoint instead!
  const syncUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/gmail/sync`;
  console.log('🔗 Calling Sync API:', syncUrl);
  
  try {
     // We can't easily call authenticated Next.js routes from here without an auth token.
     // But we can just use the manual-parsing logic directly in a script if sync-service is too hard to run.
     
     // Let's use the debug-emails logic to get the message and then call the AI parser logic directly.
     console.log('🔄 Manually processing last 5 emails...');
     const { google } = require('googleapis');
     const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
     );
     oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
     const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
     
     const list = await gmail.users.messages.list({ userId: 'me', q: 'in:inbox newer_than:1h', maxResults: 5 });
     const messages = list.data.messages || [];
     
     for (const m of messages) {
        console.log(`\n--- Message ${m.id} ---`);
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
        // Using 2.5-flash as we proved it works
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const fullMsg = await gmail.users.messages.get({ userId: 'me', id: m.id });
        const headers = fullMsg.data.payload.headers;
        const from = headers.find(h => h.name === 'From').value;
        const subject = headers.find(h => h.name === 'Subject').value;
        
        console.log(`From: ${from} | Subject: ${subject}`);
        
        // Skip if not from a user (simple check)
        if (from.includes('ubereats') || from.includes('zillow') && !subject.includes('BD')) {
           console.log('⏭️ Skipping non-lead');
           continue;
        }

        console.log('🤖 Parsing with Gemini 2.5-Flash...');
        const prompt = `Classify this email as a lead and extract data. RETURN JSON. \nFrom: ${from}\nSubject: ${subject}\nBody: ${fullMsg.data.snippet}`;
        const result = await model.generateContent(prompt);
        console.log('✅ AI Result:', result.response.text().substring(0, 100));
        console.log('--- Done ---');
     }
  } catch (e) {
     console.error('❌ Sync failed:', e.message);
  }
}

run();
