import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ensureAvatarsBucket } from '@/lib/avatars';

const BUCKET = 'avatars';
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

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

export async function POST(request: NextRequest) {
  try {
    const supabase = createAuthenticatedClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 400 });
    }

    const type = file.type?.toLowerCase();
    if (!ALLOWED.includes(type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG or WebP' }, { status: 400 });
    }

    await ensureAvatarsBucket();

    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
    const storagePath = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    // Update user metadata
    await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });

    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error('Avatar upload:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
