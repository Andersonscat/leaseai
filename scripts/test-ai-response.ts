import { generateFinalResponse, AiAnalysis, Property } from '../lib/ai-qualification';

async function testBookingResponse() {
  const mockContext = {
    tenant: { name: 'John Doe', email: 'john@example.com' },
    properties: [
      {
        id: '1',
        address: '123 Main St, Seattle, WA',
        price: '$2500',
        bedrooms: 2,
        status: 'Available',
      }
    ] as Property[],
    conversationHistory: [
      { role: 'user' as const, content: 'I like 123 Main St.' },
      { role: 'assistant' as const, content: 'Great! When would you like to see it?' },
      { role: 'user' as const, content: 'Tomorrow at 3pm works.' }
    ],
    realtorName: 'Jane Smith',
    realtorPhone: '+1 (555) 012-3456',
  };

  const mockAnalysis: AiAnalysis = {
    thought_process: 'Client confirmed 3pm tomorrow.',
    intent: 'booking_confirmed',
    action: 'book_calendar',
    action_params: {
      start_time: '2026-02-22T15:00:00',
      property_address: '123 Main St, Seattle, WA',
      client_name: 'John Doe',
      duration_minutes: 30,
    },
    priority: 'hot',
  };

  const mockExecutionResult = {
    success: true,
    data: {
      htmlLink: 'https://calendar.google.com/event?id=123',
      start: { dateTime: '2026-02-22T15:00:00' }
    }
  };

  console.log('🧪 Testing AI Response Generation...');
  try {
    const response = await generateFinalResponse(mockContext, mockAnalysis, mockExecutionResult);
    console.log('\n--- GENERATED RESPONSE ---\n');
    console.log(response);
    console.log('\n---------------------------\n');

    const hasTime = response.includes('3:00 PM') || response.includes('15:00');
    const hasAddress = response.includes('123 Main St');
    const hasGoogleMaps = response.includes('google.com/maps');
    const hasPhone = response.includes('(555) 012-3456');

    console.log('✅ Has Time:', hasTime);
    console.log('✅ Has Address:', hasAddress);
    console.log('✅ Has Google Maps Link:', hasGoogleMaps);
    console.log('✅ Has Realtor Phone:', hasPhone);

    if (hasTime && hasAddress && hasGoogleMaps && hasPhone) {
      console.log('\n🎉 ALL VERIFICATION CHECKS PASSED!');
    } else {
      console.log('\n❌ SOME VERIFICATION CHECKS FAILED!');
    }
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

testBookingResponse();
