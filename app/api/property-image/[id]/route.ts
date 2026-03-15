import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function createAuthenticatedClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const idx = parseInt(req.nextUrl.searchParams.get('idx') ?? '0', 10);

  const supabase = createAuthenticatedClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { data, error } = await supabase
    .from('properties')
    .select('images')
    .eq('id', id)
    .eq('user_id', user.id)
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
