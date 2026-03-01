#!/usr/bin/env node

/**
 * Gmail OAuth2 Token Refresh Script
 * Run this to get a new refresh token when the old one expires
 */

const { google } = require('googleapis');
const readline = require('readline');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google'
);

// Scopes required for Gmail API
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
];

async function getNewToken() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent screen to get refresh token
  });

  console.log('\n📧 Gmail OAuth2 Token Refresh\n');
  console.log('1. Open this URL in your browser:');
  console.log('\n' + authUrl + '\n');
  console.log('2. Authorize the application');
  console.log('3. Copy the authorization code from the redirect URL\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter the authorization code: ', async (code) => {
    rl.close();
    
    try {
      const { tokens } = await oauth2Client.getToken(code);
      
      console.log('\n✅ Success! Add these to your .env file:\n');
      console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log(`GMAIL_ACCESS_TOKEN=${tokens.access_token}\n`);
      
      if (!tokens.refresh_token) {
        console.log('⚠️  Warning: No refresh token received.');
        console.log('Make sure you used prompt=consent in the auth URL.\n');
      }
      
    } catch (error) {
      console.error('❌ Error getting tokens:', error.message);
    }
  });
}

getNewToken();
