// Test Gemini API
// Run with: node --loader ts-node/esm test-gemini-simple.ts

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

async function testGemini() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: 'Classify this email as lead or spam: "Hi, I am interested in renting a 2-bedroom apartment in downtown. My budget is $2000/month. Can we schedule a viewing?"'
        }]
      }]
    })
  });

  const data = await response.json();
  console.log('Gemini Response:', JSON.stringify(data, null, 2));
}

testGemini().catch(console.error);
