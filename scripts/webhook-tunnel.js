#!/usr/bin/env node
/**
 * Gmail Webhook Tunnel Setup
 * 
 * Starts an ngrok tunnel so Google Pub/Sub can reach localhost,
 * then updates the Pub/Sub push subscription to use the tunnel URL.
 * 
 * Usage:
 *   node scripts/webhook-tunnel.js
 *   npm run webhook
 * 
 * First-time setup:
 *   1. Sign up free at https://ngrok.com
 *   2. Copy your auth token from dashboard
 *   3. Add NGROK_AUTHTOKEN=your_token to .env.local
 */

const ngrok = require('@ngrok/ngrok');
const { execSync } = require('child_process');
const path = require('path');

// Load .env.local
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const PORT = process.env.PORT || 3000;
const PUBSUB_TOPIC = process.env.GMAIL_PUBSUB_TOPIC;

async function main() {
  console.log('🚀 Starting ngrok tunnel for Gmail webhook...\n');

  if (!process.env.NGROK_AUTHTOKEN) {
    console.error('❌ NGROK_AUTHTOKEN not set in .env.local');
    console.log('');
    console.log('Quick setup:');
    console.log('  1. Sign up free → https://ngrok.com');
    console.log('  2. Copy auth token from https://dashboard.ngrok.com/get-started/your-authtoken');
    console.log('  3. Add to .env.local: NGROK_AUTHTOKEN=your_token_here');
    process.exit(1);
  }

  try {
    // 1. Start ngrok tunnel
    const listener = await ngrok.forward({
      addr: PORT,
      authtoken: process.env.NGROK_AUTHTOKEN,
    });

    const url = listener.url();
    const webhookUrl = `${url}/api/gmail/webhook`;

    console.log('✅ Tunnel established!');
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Public:  ${url}`);
    console.log(`   Webhook: ${webhookUrl}`);
    console.log('');

    // 2. Try to update Pub/Sub subscription via gcloud CLI
    if (PUBSUB_TOPIC) {
      const subscriptionName = PUBSUB_TOPIC.replace('/topics/', '/subscriptions/') + '-push';
      
      console.log('📡 Configuring Pub/Sub push subscription...');

      try {
        // Check if gcloud is available
        execSync('which gcloud', { stdio: 'pipe' });
        
        try {
          // Try to describe existing subscription
          execSync(`gcloud pubsub subscriptions describe ${subscriptionName} --format="value(name)"`, { stdio: 'pipe' });
          // Exists → update
          execSync(`gcloud pubsub subscriptions update ${subscriptionName} --push-endpoint="${webhookUrl}"`, { stdio: 'inherit' });
          console.log('✅ Pub/Sub subscription updated!\n');
        } catch {
          // Doesn't exist → create
          execSync(`gcloud pubsub subscriptions create ${subscriptionName} --topic=${PUBSUB_TOPIC} --push-endpoint="${webhookUrl}" --ack-deadline=30`, { stdio: 'inherit' });
          console.log('✅ Pub/Sub subscription created!\n');
        }
      } catch {
        console.log('⚠️  gcloud CLI not found. Please set push endpoint manually:');
        console.log(`   → Google Cloud Console → Pub/Sub → Subscriptions`);
        console.log(`   → Create/Edit subscription for topic: ${PUBSUB_TOPIC}`);
        console.log(`   → Set push endpoint to: ${webhookUrl}`);
        console.log('');
      }
    }

    // 3. Renew Gmail Watch
    console.log('🔔 Renewing Gmail Watch...');
    try {
      const response = await fetch(`http://localhost:${PORT}/api/gmail/watch`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        const expDate = new Date(Number(data.expiration));
        console.log(`✅ Gmail Watch active until: ${expDate.toLocaleString()}`);
      } else {
        console.log('⚠️  Watch renewal failed:', data.error || 'unknown');
      }
    } catch {
      console.log('⚠️  Could not reach dev server. Is `npm run dev` running?');
    }

    console.log('\n═════════════════════════════════════════');
    console.log('  🟢 WEBHOOK LIVE — Emails processed in real-time');
    console.log('  Press Ctrl+C to stop');
    console.log('═════════════════════════════════════════\n');

    // Keep alive
    await new Promise(() => {}); // Block forever

  } catch (err) {
    console.error('❌ Failed:', err.message || err);
    process.exit(1);
  }
}

main();
