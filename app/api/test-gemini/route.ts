import { NextResponse } from 'next/server';
import { classifyEmail, generateEmailResponse } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { action, data } = await request.json();

    if (action === 'classify') {
      // Test email classification
      const result = await classifyEmail(data.emailContent);
      return NextResponse.json({ success: true, result });
    }

    if (action === 'generate') {
      // Test response generation
      const response = await generateEmailResponse(
        data.clientRequest,
        data.properties || []
      );
      return NextResponse.json({ success: true, response });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Gemini test error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
