const { geminiModel, generateContentWithRetry, genAI } = require('./lib/gemini-client');
const { analyzeConversation, QUALIFICATION_SYSTEM_PROMPT } = require('./lib/ai-qualification');

async function test() {
  const context = {
    tenant: {
      name: 'Aaron Smith',
      email: 'aaron@example.com'
    },
    properties: [
      {
        id: 'prop-1',
        address: '112 Broadway Ave, Seattle, WA',
        price: '$2,300',
        bedrooms: 2,
        status: 'Available',
        description: 'Great 2 bed apartment, pets allowed.',
        available_from: '2026-02-01',
        pet_policy: 'allowed'
      }
    ],
    conversationHistory: [
      { role: 'user', content: 'dollars per month. Need a rent. I have no animals with me, except my girlfriend huh. Do you have any options?' },
      { role: 'assistant', content: 'Hi Aaron, thank you for reaching out and providing those details. It\'s helpful to know your move-in date and budget. To help me find the best options for you, could you please let me know the minimum number of bedrooms you require?' },
      { role: 'user', content: '2 bedrooms' },
      { role: 'assistant', content: 'Thank you for confirming. To ensure I find the best options that align with your plans, could you let me know what lease duration you are looking for? For instance, a standard 12-month term or something shorter.' },
      { role: 'user', content: '12 months are ok' }
    ],
    realtorName: 'Alex'
  };

  try {
    const analysis = await analyzeConversation(context);
    console.log(JSON.stringify(analysis, null, 2));
  } catch (e) {
    console.error(e);
  }
}

test();
