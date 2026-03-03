import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { uploadPropertyImages, ensurePropertyImagesBucket } from '@/lib/property-images';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

// ─── Enum constants (must match form <select> values exactly) ─────────────────
const PETS_OPTIONS    = ["Allowed", "Not allowed", "Cats only", "Dogs only", "Small pets only"] as const;
const PARKING_OPTIONS = ["No parking", "Street parking", "1 space", "2 spaces", "Garage"] as const;
type PetsOption    = typeof PETS_OPTIONS[number];
type ParkingOption = typeof PARKING_OPTIONS[number];

// ─── Platform detection ───────────────────────────────────────────────────────

type Platform = 'zillow' | 'realtor' | 'redfin' | 'apartments' | 'generic';

function detectPlatform(url: string): Platform {
  if (/zillow\.com/i.test(url))       return 'zillow';
  if (/realtor\.com/i.test(url))      return 'realtor';
  if (/redfin\.com/i.test(url))       return 'redfin';
  if (/apartments\.com/i.test(url))   return 'apartments';
  return 'generic';
}

// ─── Image extraction per platform ───────────────────────────────────────────

/**
 * Zillow: photos.zillowstatic.com/fp/[hash][suffix]
 * Upgrades size/quality suffixes to -p_f.webp; flat URLs returned as-is.
 */
function normalizeZillowImageUrl(url: string): string {
  if (!url.includes('zillowstatic.com')) return url;
  const hasSizeSuffix    = /_\d+_\d+\.(?:webp|jpg|jpeg|png)$/i.test(url);
  const hasQualitySuffix = /-p_[a-z]\.(?:webp|jpg|jpeg|png)$/i.test(url);
  if (!hasSizeSuffix && !hasQualitySuffix) return url;
  const clean = url
    .replace(/-p_[a-z]\.(?:webp|jpg|jpeg|png)$/i, '')
    .replace(/_\d+_\d+\.(?:webp|jpg|jpeg|png)$/i, '')
    .replace(/\.(?:webp|jpg|jpeg|png)$/i, '');
  return `${clean}-p_f.webp`;
}

function getZillowBaseId(url: string): string {
  return url
    .replace(/-p_[a-z]\.(?:webp|jpg|jpeg|png)$/i, '')
    .replace(/_\d+_\d+\.(?:webp|jpg|jpeg|png)$/i, '')
    .replace(/\.(?:webp|jpg|jpeg|png)$/i, '');
}

function extractZillowImages(html: string): string[] {
  const matches = html.match(/https:\/\/photos\.zillowstatic\.com\/fp\/[^"'\\ \n]+/g) ?? [];
  const seen = new Map<string, string>();
  for (const u of matches) {
    const baseId = getZillowBaseId(u);
    const normalized = normalizeZillowImageUrl(u);
    if (!seen.has(baseId)) {
      seen.set(baseId, normalized);
    } else if (/-p_[a-z]\.(?:webp|jpg|jpeg|png)$/i.test(u)) {
      seen.set(baseId, normalized);
    }
  }
  return Array.from(seen.values()).slice(0, 30);
}

/**
 * Realtor.com URL anatomy:
 *   ap.rdcpix.com/{hash}l-m{photoId}{variant}.jpg
 *
 * Variant suffixes:
 *   s.jpg            → small thumbnail  (~45KB, 200px)  — SKIP
 *   od-w640_h480.jpg → outdoor 640x480               — upgrade
 *   od-w1280_h960    → outdoor 1280x960               — best "od"
 *   rd-w1280_h960    → retina display 1280x960         — BEST quality
 *
 * Strategy:
 *   1. Skip thumbnail URLs (ending in just "s.jpg" with no size suffix)
 *   2. Prefer "rd-w1280_h960.webp" variant — highest quality
 *   3. Deduplicate by photoId (the numeric part after "-m")
 */
/**
 * Realtor.com URL anatomy:
 *   ap.rdcpix.com/{hash}l-m{photoId}{variant}.{ext}
 *
 * Variants found in SSR HTML:
 *   s.jpg               → thumbnail ~200px  (most common in HTML)
 *   od-w640_h480.jpg    → outdoor 640x480
 *   rd-w1280_h960.webp  → retina 1280x960   (best quality)
 *
 * ALL variants can be upgraded to rd-w1280_h960.webp by replacing the suffix.
 * The SSR HTML mostly contains thumbnail (s.jpg) variants — we upgrade them all.
 */
function normalizeRealtorImageUrl(url: string): string {
  // Replace any known suffix with the high-res retina variant
  return url
    .replace(/(?:od|rd)-w\d+_h\d+\.(?:jpg|jpeg|webp|png)$/i, 'rd-w1280_h960.webp')
    .replace(/s\.(?:jpg|jpeg|webp|png)$/i, 'rd-w1280_h960.webp');
}

function getRealtorPhotoId(url: string): string | null {
  const m = url.match(/-m(\d+)/);
  return m ? m[1] : null;
}

function extractRealtorImages(html: string): string[] {
  const pattern = /https:\/\/ap\.rdcpix\.com\/[^"'\\ \n>]+\.(?:jpg|jpeg|webp|png)[^"'\\ \n>]*/gi;
  const matches = html.match(pattern) ?? [];

  // Deduplicate by photoId — all variants of the same photo share the same numeric ID
  const photoMap = new Map<string, string>(); // photoId → best URL

  for (const raw of matches) {
    const url = raw.split('"')[0].split("'")[0].split('\\')[0];
    if (url === 'https://ap.rdcpix.com/') continue;

    const photoId = getRealtorPhotoId(url);
    if (!photoId) continue;

    const normalized = normalizeRealtorImageUrl(url);

    if (!photoMap.has(photoId)) {
      photoMap.set(photoId, normalized);
    }
    // All variants normalize to the same URL anyway, no need to prefer one over another
  }

  return Array.from(photoMap.values()).slice(0, 30);
}

/**
 * Redfin: ssl.cdn-redfin.com
 * High-res: replace /[size]/ with /isfil/ in URL path
 */
function normalizeRedfinImageUrl(url: string): string {
  return url.replace(/\/\d+\//, '/isfil/');
}

function extractRedfinImages(html: string): string[] {
  const matches = html.match(/https:\/\/ssl\.cdn-redfin\.com\/[^"'\\ \n>]+\.(?:jpg|jpeg|webp|png)[^"'\\ \n>]*/gi) ?? [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const u of matches) {
    const clean = u.split('"')[0].split("'")[0].split('\\')[0];
    const normalized = normalizeRedfinImageUrl(clean);
    // Strip any /number/ segment for dedup key
    const key = normalized.replace(/\/\d+\/([\w.-]+\.(?:jpg|jpeg|webp|png))$/i, '/$1');
    if (!seen.has(key)) {
      seen.add(key);
      result.push(normalized);
      if (result.length >= 30) break;
    }
  }
  return result;
}

/**
 * Generic: find any real photo-looking URLs in the HTML
 */
function extractGenericImages(html: string): string[] {
  const matches = html.match(/https:\/\/[^"'\\ \n>]*\.(?:jpg|jpeg|webp|png)(?:\?[^"'\\ \n>]*)?/gi) ?? [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const u of matches) {
    const clean = u.split('"')[0].split("'")[0];
    // Skip tiny icons/logos/UI elements (usually short paths or under 20 chars after last /)
    const filename = clean.split('/').pop() ?? '';
    if (filename.length < 10) continue;
    if (!seen.has(clean)) {
      seen.add(clean);
      result.push(clean);
      if (result.length >= 30) break;
    }
  }
  return result;
}

function extractImages(html: string, platform: Platform): string[] {
  switch (platform) {
    case 'zillow':     return extractZillowImages(html);
    case 'realtor':    return extractRealtorImages(html);
    case 'redfin':     return extractRedfinImages(html);
    case 'apartments': return extractGenericImages(html);
    default:           return extractGenericImages(html);
  }
}

// ─── Structured data extraction per platform ─────────────────────────────────

/**
 * Zillow: uses __NEXT_DATA__ JSON embedded in a script tag
 */
function extractZillowStructuredData(html: string): string {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) return '';
  const rawData = match[1].replace(
    /https:\/\/photos\.zillowstatic\.com\/fp\/[^"'\\ \n]+/g,
    normalizeZillowImageUrl,
  );
  return '\n\n__NEXT_DATA__:\n' + rawData.substring(0, 30000);
}

/**
 * Realtor.com: uses window.__data or JSON-LD schema
 */
function extractRealtorStructuredData(html: string): string {
  const parts: string[] = [];

  // JSON-LD schema (often contains full property details)
  const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) ?? [];
  for (const block of jsonLdMatches.slice(0, 3)) {
    const content = block.replace(/<\/?script[^>]*>/gi, '');
    parts.push(content.substring(0, 8000));
  }

  // window.__data or similar
  const windowDataMatch = html.match(/window\.__data\s*=\s*({[\s\S]*?});/);
  if (windowDataMatch) parts.push('\nwindow.__data:\n' + windowDataMatch[1].substring(0, 15000));

  return parts.length > 0 ? '\n\nStructured Data:\n' + parts.join('\n') : '';
}

/**
 * Redfin: uses window.__reactServerState or JSON-LD
 */
function extractRedfinStructuredData(html: string): string {
  const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) ?? [];
  const parts = jsonLdMatches.slice(0, 2).map(b =>
    b.replace(/<\/?script[^>]*>/gi, '').substring(0, 8000)
  );
  return parts.length > 0 ? '\n\nJSON-LD:\n' + parts.join('\n') : '';
}

function extractStructuredData(html: string, platform: Platform): string {
  switch (platform) {
    case 'zillow':  return extractZillowStructuredData(html);
    case 'realtor': return extractRealtorStructuredData(html);
    case 'redfin':  return extractRedfinStructuredData(html);
    default: {
      const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) ?? [];
      const parts = jsonLdMatches.slice(0, 2).map(b =>
        b.replace(/<\/?script[^>]*>/gi, '').substring(0, 6000)
      );
      return parts.length > 0 ? '\n\nJSON-LD:\n' + parts.join('\n') : '';
    }
  }
}

// ─── Platform-specific fetch headers ─────────────────────────────────────────

function getFetchHeaders(platform: Platform): Record<string, string> {
  const base = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
  };

  switch (platform) {
    case 'zillow':
      return { ...base, 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' };
    case 'realtor':
      return { ...base, 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };
    case 'redfin':
      return { ...base, 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };
    default:
      return { ...base, 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };
  }
}

// ─── Sanitization helpers ─────────────────────────────────────────────────────

function normalizePets(raw: string): PetsOption {
  if (!raw) return "Not allowed";
  const r = raw.trim();
  if (PETS_OPTIONS.includes(r as PetsOption)) return r as PetsOption;
  const lower = r.toLowerCase();
  if (lower.includes('cats only') || lower === 'cats') return "Cats only";
  if (lower.includes('dogs only') || lower === 'dogs') return "Dogs only";
  if (lower.includes('small')) return "Small pets only";
  if (lower.includes('allow') || lower.includes('yes') || lower.includes('welcome') || lower.includes('ok') || lower.includes('permit') || lower.includes('friendly')) return "Allowed";
  return "Not allowed";
}

function normalizeParking(raw: string): ParkingOption {
  if (!raw) return "No parking";
  const r = raw.trim();
  if (PARKING_OPTIONS.includes(r as ParkingOption)) return r as ParkingOption;
  const lower = r.toLowerCase();
  if (lower.includes('garage') || lower.includes('covered') || lower.includes('carport') || lower.includes('attach')) return "Garage";
  if (/2\s*(car|space|spot|stall)/i.test(lower) || lower.includes('two')) return "2 spaces";
  if (/1\s*(car|space|spot|stall)/i.test(lower) || lower === 'one space') return "1 space";
  if (lower.includes('street') || lower.includes('on-street')) return "Street parking";
  if (lower === 'none' || lower === '' || lower.includes('no park')) return "No parking";
  if (lower.includes('park') || lower.includes('space') || lower.includes('spot') || lower.includes('lot')) return "1 space";
  return "No parking";
}

function parsePrice(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined || raw === '') return 0;
  if (typeof raw === 'number') return Math.round(raw);
  const cleaned = String(raw).replace(/[^0-9\-]/g, '');
  const match = cleaned.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

const ensureStringArray = (v: any): string[] => {
  if (Array.isArray(v)) return v.filter(i => typeof i === 'string');
  if (v && typeof v === 'string') return [v];
  return [];
};

/**
 * Returns a platform-agnostic photo identity key for deduplication.
 * Strips all size/quality/resolution suffixes so that the same photo
 * in different sizes maps to the same key.
 *
 * Examples:
 *   ap.rdcpix.com/hash/img-w480_h360.jpg   → ap.rdcpix.com/hash/img.jpg
 *   ap.rdcpix.com/hash/img-w1024_h768.jpg  → ap.rdcpix.com/hash/img.jpg  (same key)
 *   zillowstatic.com/fp/hash_640_480.webp  → zillowstatic.com/fp/hash.webp
 *   zillowstatic.com/fp/hash-p_f.webp      → zillowstatic.com/fp/hash.webp (same key)
 *   cdn-redfin.com/photo/480/img.jpg       → cdn-redfin.com/photo/img.jpg
 *
 * Strategy: extract the "photo identity" — the filename stem stripped of
 * all size/quality/variant suffixes and numeric path segments.
 */
function getPhotoKey(url: string): string {
  const withoutQuery = url.split('?')[0];

  // Get just the filename (last path segment)
  const filename = withoutQuery.split('/').pop() ?? withoutQuery;

  // Strip extension
  const stem = filename.replace(/\.(?:webp|jpg|jpeg|png)$/i, '');

  // Strip ALL known size/quality suffixes from the stem:
  //   Realtor:  photo-w480_h360  →  photo
  //   Realtor:  od-w480_h360     →  od  (od = outdoor, same photo different size)
  //   Zillow:   hash_640_480     →  hash
  //   Zillow:   hash-p_f         →  hash
  //   Generic:  name-800x600     →  name
  //   Generic:  name_large       →  name (won't strip words, only patterns)
  const cleanStem = stem
    .replace(/-w\d+_h\d+$/i, '')          // -w480_h360
    .replace(/_\d+_\d+$/i, '')            // _640_480
    .replace(/-p_[a-z]$/i, '')            // -p_f
    .replace(/-\d+x\d+$/i, '')            // -800x600
    .replace(/-(?:sm|md|lg|xl|full|thumb|large|small|medium|original|hires|preview)$/i, ''); // named variants

  return cleanStem.toLowerCase();
}

function deduplicateImages(urls: any[]): string[] {
  const seen = new Map<string, string>(); // key → first URL seen (for debug)
  const result: string[] = [];
  for (const u of urls) {
    if (typeof u !== 'string' || !u.startsWith('http')) continue;
    const key = getPhotoKey(u);
    if (!seen.has(key)) {
      seen.set(key, u);
      result.push(u);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`🔁 Dedup dropped: ${u}\n   (same key as: ${seen.get(key)})\n   key: "${key}"`);
    }
  }
  return result;
}

function sanitizeCommon(data: any): any {
  // Sanitize top-level price for single-unit listings
  if (data.price !== undefined) {
    data.price = parsePrice(data.price);
    if (data.type !== 'sale' && data.price > 100_000) data.price = 0;
  }
  data.address     = String(data.address     ?? '').trim();
  data.city        = String(data.city        ?? '').trim();
  data.state       = String(data.state       ?? '').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2);
  data.zip_code    = String(data.zip_code    ?? '').replace(/[^0-9]/g, '').slice(0, 10);
  data.description = String(data.description ?? '').trim();
  data.type        = data.type === 'sale' ? 'sale' : 'rent';
  data.pets        = normalizePets(String(data.pets    ?? ''));
  data.parking     = normalizeParking(String(data.parking ?? ''));
  data.amenities   = ensureStringArray(data.amenities);
  data.features    = ensureStringArray(data.features);
  data.rules       = ensureStringArray(data.rules);
  data.imagePreviews = deduplicateImages(Array.isArray(data.imagePreviews) ? data.imagePreviews : []);
  return data;
}

function sanitizeUnit(unit: any): any {
  unit.price = parsePrice(unit.price);
  // Sanity cap: rent can't be > $50k/mo, sale price > $50M is suspicious but allowed
  // If price looks absurd for rent (> 100k), it's likely a parsing error — reset to 0
  if (unit.price > 100_000 && !unit._is_sale) unit.price = 0;
  const bedsNum = parseInt(String(unit.beds ?? '1'), 10);
  unit.beds = isNaN(bedsNum) ? 1 : Math.min(5, Math.max(0, bedsNum));
  const bathsNum = parseFloat(String(unit.baths ?? '1'));
  unit.baths = isNaN(bathsNum) ? 1 : Math.min(4, Math.max(1, Math.round(bathsNum * 2) / 2));
  if (unit.sqft !== null && unit.sqft !== undefined) {
    const m = String(unit.sqft).match(/(\d+)/);
    unit.sqft = m ? parseInt(m[1], 10) : null;
  } else {
    unit.sqft = null;
  }
  return unit;
}

function sanitizeExtractedProperty(data: any): any {
  sanitizeCommon(data);
  if (data.listing_type === 'building') {
    data.units = Array.isArray(data.units) ? data.units.map(sanitizeUnit) : [];
  } else {
    data.listing_type = 'unit';
    sanitizeUnit(data);
  }
  return data;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    const platform = detectPlatform(url);
    console.log(`🚀 Magic Import — platform: ${platform}, url: ${url}`);

    const siteResponse = await fetch(url, { headers: getFetchHeaders(platform) });
    if (!siteResponse.ok) {
      throw new Error(`Failed to fetch listing page: ${siteResponse.status} ${siteResponse.statusText}`);
    }

    const html = await siteResponse.text();

    // Platform-specific pre-extraction
    const preExtractedImages = extractImages(html, platform);
    const structuredData     = extractStructuredData(html, platform);

    // Clean HTML: strip scripts/styles/svgs for the main body context
    const cleanedHtml = html
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '')
      .replace(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gim, '');

    const platformHints: Record<Platform, string> = {
      zillow:     'This is a Zillow listing. It may be a single unit OR an apartment building with multiple available units.',
      realtor:    'This is a Realtor.com listing. Typically a single property rental or sale.',
      redfin:     'This is a Redfin listing. Typically a single property for sale or rent.',
      apartments: 'This is an Apartments.com listing. It may be a single unit OR a building with multiple floor plans.',
      generic:    'This is a real estate listing from an unknown platform.',
    };

    const prompt = `You are extracting real estate listing data from a webpage.
Platform: ${platform} — ${platformHints[platform]}

First, determine listing type:
- "unit": a single specific apartment/house (one price, one bed/bath count)
- "building": an apartment complex with MULTIPLE available units in a table or floor plan list

Page HTML (cleaned):
${cleanedHtml.substring(0, 55000)}
${structuredData}

Return ONLY a JSON object. No markdown fences.

IF listing_type is "unit":
{
  "listing_type": "unit",
  "address": "street address only, no city/state",
  "city": "city name",
  "state": "2-letter state abbreviation",
  "zip_code": "5-digit ZIP code as string",
  "price": <plain integer, no $ or /mo, lower bound if range>,
  "type": <"rent" or "sale">,
  "beds": <integer 0–5, 0 = studio>,
  "baths": <number in 0.5 increments: 1, 1.5, 2, 2.5, 3, 3.5, 4>,
  "sqft": <integer, lower bound if range>,
  "description": "full marketing description from the listing",
  "amenities": ["shared or building amenities"],
  "features": ["unit features like flooring, appliances, cooling"],
  "rules": ["lease rules, restrictions"],
  "pets": <exactly one of: "Allowed", "Not allowed", "Cats only", "Dogs only", "Small pets only">,
  "parking": <exactly one of: "No parking", "Street parking", "1 space", "2 spaces", "Garage">
}

IF listing_type is "building":
{
  "listing_type": "building",
  "building_name": "name of complex",
  "address": "street address only",
  "city": "city name",
  "state": "2-letter state",
  "zip_code": "ZIP as string",
  "type": "rent",
  "description": "marketing description of the building/complex",
  "amenities": ["shared amenities"],
  "features": ["shared features"],
  "rules": ["building rules"],
  "pets": <one of the allowed enum values>,
  "parking": <one of the allowed enum values>,
  "units": [
    {
      "unit_number": "e.g. 414 or A1",
      "beds": <integer, 0 = studio>,
      "baths": <0.5 increments>,
      "sqft": <integer or null>,
      "price": <integer>,
      "available_from": "now" | "Apr 7" | "2026-04-07" | null
    }
  ]
}

Strict rules:
- price: plain integer. 2495 not "$2,495/mo". If range, use lower bound.
- beds: integer. Studio/bachelor = 0.
- baths: 0.5 increments only.
- sqft: integer only. Lower bound of range.
- pets: MUST match exactly one enum value. "Pet friendly", "Dogs OK", "Cats OK" → "Allowed".
- parking: MUST match exactly one enum value. "2-car garage" → "Garage".
- Do NOT include an "imagePreviews" field — images are handled separately.
- For buildings: list EVERY unit from the available units table.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' } as any,
    });

    let extractedData: any = null;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        try {
          extractedData = JSON.parse(text);
        } catch {
          const m = text.match(/\{[\s\S]*\}/);
          if (!m) throw new Error('AI response was not valid JSON');
          extractedData = JSON.parse(m[0]);
        }
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`⚠️ Import attempt ${attempt} failed:`, err.message);
        if (attempt < 2) await new Promise(r => setTimeout(r, 1500));
      }
    }

    if (!extractedData) throw lastError ?? new Error('Failed to extract property data');

    // Always use our pre-extracted, already-deduplicated images — never trust AI-generated URLs
    extractedData.imagePreviews = preExtractedImages;

    extractedData = sanitizeExtractedProperty(extractedData);

    // Upload images to Supabase Storage (server-side, avoids CORS + hotlink blocks)
    if (preExtractedImages.length > 0) {
      await ensurePropertyImagesBucket();
      const slug = slugify(extractedData.address || 'property');
      const storedUrls = await uploadPropertyImages(preExtractedImages, user.id, slug);
      extractedData.imagePreviews = storedUrls;
    }

    const label = extractedData.listing_type === 'building'
      ? `building "${extractedData.building_name}" (${extractedData.units?.length ?? 0} units)`
      : `${extractedData.address}, ${extractedData.city}`;
    console.log(`✅ Import success [${platform}] — ${label}`);

    return NextResponse.json({ data: extractedData });

  } catch (error: any) {
    console.error('❌ Magic Import Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
