import { createClient } from '@supabase/supabase-js';

const BUCKET = 'avatars';

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Ensures the avatars bucket exists. Creates it if missing.
 * Call before first avatar upload.
 */
export async function ensureAvatarsBucket(): Promise<void> {
  const { data: buckets } = await serviceSupabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await serviceSupabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 2 * 1024 * 1024, // 2MB
    });
    if (error) {
      console.error('Failed to create avatars bucket:', error);
      throw error;
    }
  }
}
