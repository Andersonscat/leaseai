import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const idx = parseInt(req.nextUrl.searchParams.get('idx') ?? '0', 10);

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('properties')
    .select('images')
    .eq('id', id)
    .single();

  if (error || !data?.images?.length) {
    return new NextResponse('Not found', { status: 404 });
  }

  const imageEntry: string = data.images[idx] ?? data.images[0];
  if (!imageEntry) return new NextResponse('Not found', { status: 404 });

  // Already an external URL — redirect
  if (imageEntry.startsWith('http')) {
    return NextResponse.redirect(imageEntry);
  }

  // Base64 data URI — parse and stream as binary
  const match = imageEntry.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) {
    return new NextResponse('Invalid image', { status: 400 });
  }

  const mimeType = match[1];
  const buffer = Buffer.from(match[2], 'base64');

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}
