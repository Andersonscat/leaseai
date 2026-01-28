
const { geminiModel } = require('./lib/gemini-client');

async function testConnection() {
  console.log('🧪 Testing Gemini Connection...');
  try {
    const result = await geminiModel.generateContent('Say "Hello World" if you work');
    const response = await result.response;
    console.log('✅ Success! Model Response:', response.text());
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

// Mock environment for the test (since we run with node)
process.env.GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || 'AIzaSyC0_ZFVSVnKE30UcM1rVjbYlw1a-FQtX_k'; // From env.local

testConnection();
