
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Function to fetch available models directly via REST because SDK listModels might need specific setup
async function listModels() {
    console.log('🔍 Listing available models...');
    const apiKey = 'AIzaSyC0_ZFVSVnKE30UcM1rVjbYlw1a-FQtX_k';
    
    // Using fetch directly to list models
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        
        if (data.models) {
            console.log('✅ Available Models:');
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(` - ${m.name.replace('models/', '')}`);
                }
            });
        } else {
            console.log('❌ No models found or error:', data);
        }
    } catch (e) {
        console.error('❌ Error listing models:', e);
    }
}

listModels();
