
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { extractLeadData, maskPII, TenantData } from '../lib/ai-qualification';

async function testExtraction() {
  console.log('\n\n🔹 TEST CASE: Extraction 2.0 - Conflicts & Confidence');
  console.log('--------------------------------------------------');

  const currentData: Partial<TenantData> = {
    name: "Alex",
    budget: "$2,000",
    move_in_date: "2026-03-01"
  };

  const history = [
    { role: 'user' as const, content: "Hi, I'm Alex. My email is alex.test@example.com and phone is +1234567890." },
    { role: 'assistant' as const, content: "Nice to meet you Alex! What is your budget and move-in date?" },
    { role: 'user' as const, content: "Actually, my plans changed. I need to move in April now, and my budget can go up to $2,500. I also have a small cat." }
  ];

  console.log('👤 Current Budget:', currentData.budget);
  console.log('👤 Current Move-in:', currentData.move_in_date);
  console.log('💬 Latest Message:', history[history.length - 1].content);

  const result = await extractLeadData(history, currentData);

  console.log('\n📊 Extraction Result:');
  console.log(JSON.stringify(result, null, 2));

  if (result.conflicts && result.conflicts.length > 0) {
    console.log('\n✅ CONFLICT DETECTED:', result.conflicts);
  } else {
    console.log('\n❌ NO CONFLICT DETECTED (Expected one for budget/date)');
  }

  if (result.budgetMax?.value === 2500) {
    console.log('✅ Correct new budget extracted: 2500');
  }

  console.log('\n\n🔹 TEST CASE: PII Masking');
  console.log('--------------------------------------------------');
  const rawText = "Contact me at alex.test@example.com or call +1234567890 for more info.";
  const masked = maskPII(rawText);
  console.log('Raw:', rawText);
  console.log('Masked:', masked);

  if (masked.includes('[EMAIL-REDACTED]') && masked.includes('[PHONE-REDACTED]')) {
    console.log('✅ PII Masking works!');
  } else {
    console.log('❌ PII Masking failed.');
  }
}

testExtraction();
