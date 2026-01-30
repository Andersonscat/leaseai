
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

async function testSingleModel() {
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = 'gemini-2.0-flash';
  
  console.log(`\n--- Testing model: ${modelName} ---`);
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Hi');
    console.log(`✅ ${modelName} works! Response:`, result.response.text());
  } catch (error) {
    console.error(`❌ ${modelName} failed:`, error.message);
  }
}

testSingleModel();
