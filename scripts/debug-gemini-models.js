
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

async function testModels() {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const modelsToTest = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro'
  ];

  for (const modelName of modelsToTest) {
    console.log(`\n--- Testing model: ${modelName} ---`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hi');
      console.log(`✅ ${modelName} works! Response:`, result.response.text());
    } catch (error) {
      console.error(`❌ ${modelName} failed:`, error.message);
    }
  }
}

testModels();
