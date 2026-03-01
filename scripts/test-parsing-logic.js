require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Mock content from the email we found
const emailFrom = 'Asylzhan Tatibayev <assylzhanscat@gmail.com>';
const emailSubject = '2 BD';
const emailBody = `Hi My name is Aaron Smith. Saw your listing on Zillow. I was planning to move to Seattle on March 1, and need a place to stay. My budget is around 2500 dollars per month. Need a rent. I have no animals`;

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function testParsing() {
  console.log('🧪 Testing AI Parsing for email:', emailSubject);
  
  const prompt = `Analyze this real estate email and both CLASSIFY (is it a lead?) and EXTRACT data.

FROM: ${emailFrom}
SUBJECT: ${emailSubject}
BODY: ${emailBody}

STEP 1: Classify
- isLead: true if this is a genuine inquiry about property.
- category: inquiry, spam, newsletter, thanks, notification.
- reason: brief explanation.

STEP 2: Extract (only if isLead is true)
- tenant_name, tenant_email, tenant_phone, property_address, intent (viewing/inquiry/booking/question), urgency (high/medium/low), budget, move_in_date.
- original_message: The client's NEW message only. Strip any quoted reply text.
- message: Short internal CRM summary.

Return ONLY valid JSON:
{
  "isLead": boolean,
  "confidence": 0-100,
  "category": "string",
  "reason": "string",
  "tenant_name": "string",
  "tenant_email": "string",
  "source": "string"
}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log('\n--- AI Response ---');
    console.log(responseText);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testParsing();
