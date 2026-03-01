require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testConnection() {
  console.log('🧪 Testing Gemini Connection (gemini-2.0-flash)...');
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const result = await model.generateContent('Say "Ready"');
    const response = await result.response;
    console.log('✅ Success! Model Response:', response.text());
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

testConnection();
