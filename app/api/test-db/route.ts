import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Check if environment variables are set
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!hasUrl || !hasKey) {
      return NextResponse.json({
        status: 'error',
        message: 'Supabase environment variables not configured',
        details: {
          hasUrl,
          hasKey,
        }
      }, { status: 500 });
    }

    // Try to fetch from properties table
    const { data, error } = await supabase
      .from('properties')
      .select('id, address')
      .limit(1);

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Database connection failed',
        details: error.message,
        hint: 'Make sure you ran the schema.sql in Supabase SQL Editor'
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      message: '✅ Supabase is connected and working!',
      details: {
        connected: true,
        propertiesFound: data?.length || 0,
        sampleData: data || []
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Unexpected error',
      details: error.message
    }, { status: 500 });
  }
}
