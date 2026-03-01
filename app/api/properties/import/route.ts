import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

/**
 * Normalizes Zillow image URLs to their highest possible resolution.
 * Zillow uses various suffixes for different sizes:
 * - _384_256.webp (low res)
 * - _640_480.webp (medium res)
 * - -p_f.webp (high res, the "full" or "photo" version)
 * - -uncropped_scaled_within_1536_1152.webp (very high res)
 */
function normalizeZillowImageUrl(url: string): string {
  if (!url.includes('zillowstatic.com')) return url;
  
  // Zillow image quality hierarchy (best to worst):
  // 1. -uncropped_scaled_within_1536_1152.webp (Ultra High)
  // 2. -p_f.webp / -p_h.webp (High/Full)
  // 3. _1536_1152.webp (High)
  // 4. _640_480.webp (Medium)
  // 5. _384_256.webp (Low)

  // We aim for the high-res '-p_f' or '1536_1152' version
  // Replace sizing/quality suffixes
  
  // Clean up existing suffixes first
  let cleanUrl = url.split('-p_')[0].split('_')[0].split('.webp')[0].split('.jpg')[0].split('.jpeg')[0].split('.png')[0];
  
  // Re-append the high-res suffix
  // Note: -p_f is the most reliable high-res suffix for Zillow
  return `${cleanUrl}-p_f.webp`;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log(`🚀 Starting Magic Import for URL: ${url}`);

    // Fetch the content
    // Note: In production, Zillow might block simple fetch. Consider ScraperAPI if needed.
    const siteResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
      }
    });

    if (!siteResponse.ok) {
      throw new Error(`Failed to fetch site: ${siteResponse.statusText}`);
    }

    const html = await siteResponse.text();

    // 1. Try to extract structured images to help the AI
    const imageMatches = html.match(/https:\/\/photos\.zillowstatic\.com\/fp\/[^"\\ ]+/g) || [];
    
    // Deduplicate by normalizing the URL path (removing the sizing suffix like _[WIDTH]_[HEIGHT].webp)
    const photoMap = new Map();
    imageMatches.forEach(url => {
      // Zillow photos often have suffixes like -p_f.jpg or _1536_1152.webp
      // We want to group by the core ID of the photo and ALWAYS use the high-res version
      const photoIdPrefix = url.split('-')[0] || url.split('_')[0];
      const highRes = normalizeZillowImageUrl(url);
      
      if (!photoMap.has(photoIdPrefix)) {
        photoMap.set(photoIdPrefix, highRes);
      }
    });
    
    const uniqueImages = Array.from(photoMap.values()).slice(0, 30);

    // 2. Clean up HTML and AGGRESSIVELY normalize all Zillow URLs in the text
    // This ensures the AI ONLY sees high-res URLs in the content
    let cleanedHtml = html
      .replace(/https:\/\/photos\.zillowstatic\.com\/fp\/[^"\\ ]+/g, (match) => normalizeZillowImageUrl(match))
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
      .replace(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gim, "");

    // 3. Try to find __NEXT_DATA__ for rich details
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    let extraContext = "";
    if (nextDataMatch) {
      let rawData = nextDataMatch[1];
      // Normalize URLs in raw data too
      rawData = rawData.replace(/https:\/\/photos\.zillowstatic\.com\/fp\/[^"\\ ]+/g, (match) => normalizeZillowImageUrl(match));
      extraContext = "\nRaw Data Snippet:\n" + rawData.substring(0, 30000); 
    }

    const prompt = `
      Extract property information from the following content. 
      I have also pre-extracted some potential image URLs for you.
      
      Pre-extracted Images:
      ${uniqueImages.join('\n')}

      HTML Content:
      ${cleanedHtml.substring(0, 60000)}
      ${extraContext}

      Return the data in a strict JSON format matching this structure:
      {
        "address": "street address only (e.g. 123 Main St)",
        "city": "city name",
        "state": "state abbreviation",
        "zip_code": "ZIP code",
        "price": "number or range",
        "type": "rent" or "sale",
        "beds": number,
        "baths": number,
        "sqft": "number",
        "description": "Full, comprehensive, professional and compelling marketing description of the property. Capture ALL the details from the source text.",
        "amenities": ["list", "of", "amenities"],
        "features": ["list", "of", "features"],
        "rules": ["list", "of", "property", "rules"],
        "pets": "pet policy description",
        "parking": "parking details",
        "imagePreviews": ["list of at least 15-25 high quality UNIQUE image urls found in the page"]
      }

      Important:
      - For imagePreviews, look for high-resolution photo URLs. DO NOT return duplicates or similar looking URLs. Return as many unique photos as you can find (up to 25).
      - For 'description', do not summarize. Provide the full marketing text found in the source.
      - Be thorough with amenities and features. Look for appliances, flooring, cooling, heating, etc.
      - If you find any rules (no smoking, quiet hours, etc.), put them in the 'rules' array.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract JSON from markdown code block if present
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response as JSON");
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    // 4. POST-PROCESS: Double check all images in extractedData are normalized
    if (extractedData.imagePreviews && Array.isArray(extractedData.imagePreviews)) {
      extractedData.imagePreviews = extractedData.imagePreviews.map((url: string) => normalizeZillowImageUrl(url));
    }

    return NextResponse.json({ data: extractedData });
  } catch (error: any) {
    console.error('❌ Magic Import Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
