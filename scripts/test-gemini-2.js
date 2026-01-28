
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testConnection() {
  console.log('🧪 Testing Gemini 2.0 Flash Connection...');
  const apiKey = 'AIzaSyC0_ZFVSVnKE30UcM1rVjbYlw1a-FQtX_k'; 
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const result = await model.generateContent('Answer with "OK" if you are working.');
    const response = await result.response;
    console.log('✅ Success! Model Response:', response.text());
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

testConnection();
