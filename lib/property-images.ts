import { createClient } from '@supabase/supabase-js';

const BUCKET = 'property-images';
const MAX_IMAGES = 25;
const FETCH_TIMEOUT_MS = 12_000;
// Skip tiny thumbnails/icons — 20KB is enough to exclude ~200px thumbnails
// Realtor.com rd-w1280 images are 55–200KB, so 20KB is a safe floor
const MIN_BYTES = 20_000;

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Fetches an external image URL and uploads it to Supabase Storage.
 * Returns the public URL of the stored image, or null on failure.
 */
async function downloadAndStore(
  externalUrl: string,
  storagePath: string,
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    // Build platform-appropriate Referer header to avoid hotlink blocks
    let referer = new URL(externalUrl).origin + '/';
    if (externalUrl.includes('rdcpix.com'))     referer = 'https://www.realtor.com/';
    if (externalUrl.includes('zillowstatic'))   referer = 'https://www.zillow.com/';
    if (externalUrl.includes('cdn-redfin.com')) referer = 'https://www.redfin.com/';

    const res = await fetch(externalUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/jpeg,image/*,*/*;q=0.8',
        'Referer': referer,
      },
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`⚠️ Image HTTP ${res.status}: ${externalUrl}`);
      return null;
    }

    const buffer = await res.arrayBuffer();

    // Skip tiny files (icons/thumbnails)
    if (buffer.byteLength < MIN_BYTES) {
      console.warn(`⚠️ Image too small (${buffer.byteLength}B < ${MIN_BYTES}B), skipping: ${externalUrl}`);
      return null;
    }

    const contentType = res.headers.get('content-type') ?? 'image/jpeg';

    const { error } = await serviceSupabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
        cacheControl: '31536000', // 1 year
      });

    if (error) {
      console.warn(`⚠️ Storage upload failed for ${storagePath}: ${error.message}`);
      return null;
    }

    const { data: { publicUrl } } = serviceSupabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    return publicUrl;
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn(`⚠️ Image fetch failed: ${externalUrl}`, err.message);
    }
    return null;
  }
}

/**
 * Uploads a batch of external image URLs to Supabase Storage.
 *
 * - Downloads each image server-side (avoids CORS and hotlink blocks)
 * - Skips images smaller than MIN_BYTES (thumbnails/icons)
 * - Stores under: property-images/{userId}/{propertySlug}/{index}.{ext}
 * - Returns an array of public Supabase Storage URLs
 * - Falls back to the original URL if upload fails (better than losing the image)
 */
export async function uploadPropertyImages(
  externalUrls: string[],
  userId: string,
  propertySlug: string,
): Promise<string[]> {
  const urls = externalUrls.slice(0, MAX_IMAGES);

  // Upload in parallel batches of 10
  const BATCH = 10;
  const results: string[] = [];

  for (let i = 0; i < urls.length; i += BATCH) {
    const batch = urls.slice(i, i + BATCH);
    const batchResults = await Promise.all(
      batch.map(async (url, batchIdx) => {
        const idx = i + batchIdx;
        const ext = guessExtension(url);
        const path = `${userId}/${propertySlug}/${idx}.${ext}`;
        const stored = await downloadAndStore(url, path);
        // Fall back to original URL if upload fails
        return stored ?? url;
      }),
    );
    results.push(...batchResults);
  }

  console.log(`📸 Uploaded ${results.filter(u => u.includes('supabase')).length}/${urls.length} images to Storage`);
  return results;
}

function guessExtension(url: string): string {
  const path = url.split('?')[0].toLowerCase();
  if (path.endsWith('.webp')) return 'webp';
  if (path.endsWith('.png'))  return 'png';
  if (path.endsWith('.jpeg')) return 'jpeg';
  return 'jpg';
}

/**
 * Ensures the property-images bucket exists and is public.
 * Call once during app initialization or from a setup script.
 */
export async function ensurePropertyImagesBucket(): Promise<void> {
  const { data: buckets } = await serviceSupabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);
  if (!exists) {
    const { error } = await serviceSupabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB per file
    });
    if (error) console.error('Failed to create bucket:', error);
    else console.log(`✅ Created bucket: ${BUCKET}`);
  }
}
