#!/usr/bin/env node

/**
 * OAuth2 Authorization Script for Gmail + Calendar
 * This script helps you get a refresh token with both Gmail and Calendar scopes
 */

const { google } = require('googleapis');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

// OAuth2 credentials from .env.local
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback'
);

// Required scopes for Gmail + Calendar
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar.events',  // NEW: Calendar events
];

console.log('🔐 Google OAuth2 Authorization for Gmail + Calendar\n');
console.log('📋 Requested Scopes:');
SCOPES.forEach(scope => console.log(`   - ${scope}`));
console.log('');

// Generate the authorization URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent', // Force consent screen to get refresh token
});

console.log('📖 Instructions:');
console.log('1. Open this URL in your browser:');
console.log('');
console.log(`   ${authUrl}`);
console.log('');
console.log('2. Authorize the app');
console.log('3. Copy the authorization code from the URL');
console.log('4. Paste it below');
console.log('');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the authorization code: ', async (code) => {
  try {
    console.log('\n🔄 Exchanging code for tokens...');
    
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    console.log('\n✅ Success! Your tokens:');
    console.log('');
    console.log('📝 Add this to your .env.local file:');
    console.log('');
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('');
    
    if (tokens.access_token) {
      console.log('🔑 Access Token (temporary, not needed):');
      console.log(`   ${tokens.access_token.substring(0, 50)}...`);
    }
    
    console.log('');
    console.log('✨ You can now use both Gmail and Calendar APIs!');
    
  } catch (error) {
    console.error('\n❌ Error getting tokens:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  } finally {
    rl.close();
  }
});
