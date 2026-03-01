
import { analyzeConversation, generateFinalResponse, TenantData, Property, ConversationContext } from '../lib/ai-qualification';
import { SchemaType } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Mock Realtor Name
const REALTOR_NAME = "Sarah Connors";

// Mock Properties
const MOCK_PROPERTIES: Property[] = [
  {
    id: 'p1',
    address: '123 Main St, Seattle, WA',
    price: '$2,500',
    bedrooms: 2,
    status: 'Available',
    description: 'Beautiful 2-bed condo with city views and gym.',
    available_from: '2026-03-01',
    pet_policy: 'allowed',
    images: ['img1.jpg']
  },
  {
    id: 'p2',
    address: '456 Oak Ave, Seattle, WA',
    price: '$1,800',
    bedrooms: 1,
    status: 'Available',
    description: 'Cozy 1-bed near the park. Quiet neighborhood.',
    available_from: '2026-02-15',
    pet_policy: 'cats_only',
    images: ['img2.jpg']
  }
];

// Helper to run a test case
async function runTest(name: string, history: { role: 'user' | 'assistant', content: string }[], tenantOverride: Partial<TenantData> = {}) {
  console.log(`\n\n🔹 TEST CASE: ${name}`);
  console.log('--------------------------------------------------');
  
  const tenant: TenantData = {
    id: 't1',
    name: 'John Doe',
    email: 'john@example.com',
    qualification_status: 'new',
    ...tenantOverride
  };

  const context: ConversationContext = {
    tenant,
    properties: MOCK_PROPERTIES,
    conversationHistory: history,
    realtorName: REALTOR_NAME
  };

  console.log('👤 User Last Message:', history[history.length - 1].content);

  try {
    // 1. Analyze
    console.log('Thinking...');
    const analysis = await analyzeConversation(context);
    
    console.log('🧠 AI Analysis:');
    console.log(`   Intent: ${analysis.intent}`);
    console.log(`   Action: ${analysis.action}`);
    console.log(`   Thought: ${analysis.thought_process}`);
    if (analysis.extractedData) {
        console.log('   Extracted Data:', JSON.stringify(analysis.extractedData, null, 2));
    }
    if (analysis.listing_addresses) {
        console.log('   Listings to Send:', analysis.listing_addresses);
    }

    // 2. Generate Response
    const response = await generateFinalResponse(context, analysis);
    console.log('\n🗣️ AI Response:\n');
    console.log(response);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function main() {
  // Scenario 1: New Lead - specific inquiry
  await runTest("Passive Data Collection", [
    { role: 'user', content: "Hi, I'm interested in the 2 bedroom apartment. I have a golden retriever and my budget is around $2600. When can I move in?" }
  ]);

  // Scenario 2: Scheduling - Late night request (should fail business hours)
  await runTest("Scheduling - After Hours", [
    { role: 'user', content: "Can I come see the place tonight at 9 PM?" }
  ]);
  
  // Scenario 3: Scheduling - Valid request
  await runTest("Scheduling - Valid Time", [
    { role: 'user', content: "Is tomorrow at 5 PM okay for a viewing?" }
  ]);

  // Scenario 4: Escalation
  await runTest("Escalation - Legal Threat", [
    { role: 'assistant', content: "I'm sorry, I cannot approve your application without a credit check." },
    { role: 'user', content: "This is discrimination! I'm going to sue you and your agency!" }
  ]);

  // Scenario 5: Property Recommendation
  await runTest("Property Recommendation", [
    { role: 'user', content: "Do you have any 1 bedroom apartments available?" }
  ]);
}

main();
