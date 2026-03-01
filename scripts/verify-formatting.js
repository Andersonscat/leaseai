require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Mock data
const context = {
  tenant: { name: 'Asylzhan', email: 'user@example.com' },
  realtorName: 'Agent Alice',
  realtorPhone: '+1 555-123-4567',
  properties: [
    { address: '123 Main St, Seattle, WA', price: '$2500', bedrooms: 2 }
  ],
  conversationHistory: [
    { role: 'user', content: 'I want to see 123 Main St tomorrow at 3pm' }
  ]
};

const analysis = {
  action: 'book_calendar',
  action_params: {
    property_address: '123 Main St, Seattle, WA',
    start_time: '2026-02-22T15:00:00Z'
  }
};

const executionResult = {
  success: true,
  data: { htmlLink: 'https://www.google.com/calendar/event?eid=TEST_EVENT_ID' }
};

async function verify() {
  console.log('🧪 Verifying AI Formatting with New Key...');
  
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // 1. Test AI Response Generation (Conversation part)
  const prompt = `
    You are a professional real estate agent. 
    Client: ${context.tenant.name}
    Message: "${context.conversationHistory[0].content}"
    Task: Confirm that the booking is successful. 
    (CRITICAL: Just write the conversational message body. Do NOT try to format links or contact info yourself — another system will append the details automatically).
    Generate ONLY the message body text.
  `;

  try {
    const result = await model.generateContent(prompt);
    const aiText = result.response.text();
    console.log('\n--- AI Conversational Response ---');
    console.log(aiText);

    // 2. Test Programmatic Formatting (Matching the new lib/ai-qualification.ts logic)
    console.log('\n--- Programmatic Link Formatting ---');
    const encodedAddress = encodeURIComponent(analysis.action_params.property_address);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    const displayTime = 'Sun, Feb 22 at 3:00 PM';
    
    const bookingBlock = `
---
**Booking Details:**

*   **Property:** [${analysis.action_params.property_address}](${mapsUrl})
*   **Time:** [${displayTime}](${executionResult.data.htmlLink})
*   **Agent:** ${context.realtorName} (${context.realtorPhone})
`.trim();

    console.log(bookingBlock);

    // 3. Test HTML Conversion (Matching the new lib/gmail.ts template)
    console.log('\n--- HTML Conversion (Final Email View) ---');
    const fullMessage = `${aiText}\n\n\n${bookingBlock}`;
    
    // Simplified Markdown to HTML for simulation
    const htmlBody = fullMessage
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #2563eb; text-decoration: underline;">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/^\*(.+)$/gm, '<li>$1</li>')
      .replace(/\n/g, '<br/>');

    const formattedHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.8; color: #2d3748; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="margin-bottom: 24px;">
          ${htmlBody.split('<br/><br/>').map(p => `<p style="margin: 0 0 16px 0;">${p}</p>`).join('')}
        </div>
      </div>
    `;

    console.log(formattedHtml);
    console.log('\n✅ Formatting Verification Complete!');

  } catch (error) {
    if (error.message.includes('429')) {
      console.log('⏳ Rate limited (Expected for Free Tier). But key is VALID!');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

verify();
