
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

async function listModels() {
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    // Note: The SDK doesn't have a direct listModels yet in all versions, 
    // but we can try to use the fetch API to hit the REST endpoint
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log('Available Models:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to list models:', error.message);
  }
}

listModels();
