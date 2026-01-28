
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testConnection() {
  console.log('🧪 Testing Gemini Connection (gemini-pro)...');
  const apiKey = 'AIzaSyC0_ZFVSVnKE30UcM1rVjbYlw1a-FQtX_k'; // Hardcoded for test
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  try {
    const result = await model.generateContent('Say "Ready"');
    const response = await result.response;
    console.log('✅ Success! Model Response:', response.text());
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

testConnection();
