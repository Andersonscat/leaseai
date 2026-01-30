
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    if (data.models) {
      console.log('Available Model Names:');
      data.models.forEach(m => console.log(` - ${m.name}`));
    } else {
      console.log('No models found:', data);
    }
  } catch (error) {
    console.error('Failed to list models:', error.message);
  }
}

listModels();
