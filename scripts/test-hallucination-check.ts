import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { verifyResponseHallucinations, Property } from '../lib/ai-qualification';

const MOCK_PROPERTIES: Property[] = [
  {
    id: 'p1',
    address: '123 Main St, Seattle, WA',
    price: '$2,500',
    bedrooms: 2,
    status: 'Available',
    description: 'Beautiful 2-bed condo.',
  },
  {
    id: 'p2',
    address: '456 Oak Ave, Seattle, WA',
    price: '$1,800',
    bedrooms: 1,
    status: 'Available',
    description: 'Cozy 1-bed condo.',
  }
];

async function testHallucination(name: string, response: string) {
  console.log(`\n\n🔹 TEST CASE: ${name}`);
  console.log('--------------------------------------------------');
  console.log('Response:', response);
  
  const result = await verifyResponseHallucinations(response, MOCK_PROPERTIES);
  
  console.log('\n⚖️ Verification Result:');
  console.log(`   Has Hallucinations: ${result.hasHallucinations}`);
  console.log(`   Hallucinated Addresses: ${result.hallucinatedAddresses}`);
  console.log(`   Reason: ${result.reason}`);
  
  if (result.hasHallucinations && name === "Should detect fake address") {
    console.log('✅ TEST PASSED: Successfully detected fake address.');
  } else if (!result.hasHallucinations && name === "Should pass valid address") {
    console.log('✅ TEST PASSED: Successfully ignored valid address.');
  } else {
    console.log('❌ TEST FAILED: Unexpected result.');
  }
}

async function main() {
  // Test case 1: Real address
  await testHallucination(
    "Should pass valid address", 
    "I recommend checking out 123 Main St, Seattle, WA. It's a great 2-bedroom condo."
  );

  // Test case 2: Hallucinated address
  await testHallucination(
    "Should detect fake address", 
    "How about 999 Fake Street? It just came on the market for $2000."
  );
}

main();
