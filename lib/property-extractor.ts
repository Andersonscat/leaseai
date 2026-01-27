
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PropertyParameters, PROPERTY_PARAMS_DEFAULT } from '@/types/property-parameters';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

// Using flash model for speed and reliability
const extractionModel = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: "application/json" }
});

const EXTRACTION_SYSTEM_PROMPT = `
You are a precision Real Estate Data Extractor.
Target: Extract structured data from raw listing text into a strict JSON format.

RULES:
1.  **Extract only explicitly stated facts.** Do not guess. If a field is missing, omit it or set to null/unknown.
2.  **Evidence is Mandatory:** For every key fact you extract (like price, pets, parking), you MUST provide a "quote" from the text in the 'audit.evidence' map. Keys should be dot-notation (e.g. "pricing.rent_monthly").
3.  **Find Conflicts:** If the text contradicts itself (e.g. header says "No Pets" but text says "Dogs OK"), log it in 'audit.conflicts'.
4.  **Infer wisely but safely:** 
    - "W/D in unit" -> laundry_type: "in-unit"
    - "Street parking" -> parking_type: "street"
    - "$2500" -> rent_monthly: 2500

OUTPUT JSON STRUCTURE (PropertyParameters):
{
  "identity": { "address", "type", ... },
  "pricing": { "rent_monthly", "security_deposit", ... },
  "availability": { ... },
  "layout": { "beds", "baths", "sqft", ... },
  "condition": { "furnished", "appliances": [], ... },
  "utilities": { "included_in_rent": [], "tenant_pays": [], ... },
  "amenities_access": { "laundry_type", "parking_type", ... },
  "pets": { "allowed", "pet_fee_one_time", ... },
  "community": { "gated", ... },
  "screening": { "income_multiple", ... },
  "audit": {
     "evidence": { "pricing.rent_monthly": "$2500 per month (Description)" },
     "conflicts": [],
     "unknowns": ["pet_fee", "lease_term"],
     "questions_to_ask_agent": [ { "question": "Is parking included?", "reason": "missing_data" } ]
  }
}
`;

export async function extractPropertyParameters(
  rawText: string, 
  sourceType: 'text' | 'url' | 'chat' = 'text'
): Promise<PropertyParameters> {
  try {
    const prompt = `
${EXTRACTION_SYSTEM_PROMPT}

SOURCE TYPE: ${sourceType}
INPUT TEXT:
"""
${rawText.substring(0, 15000)} 
"""

Extract the data now. Return valid JSON only.
`;
    
    const result = await extractionModel.generateContent(prompt);
    const response = result.response;
    const jsonText = response.text();
    
    // Clean up markdown code blocks if present
    const cleanJson = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const data = JSON.parse(cleanJson);
    
    // Merge with defaults to ensure type safety
    return { ...PROPERTY_PARAMS_DEFAULT, ...data };

  } catch (error) {
    console.error("Extraction Failed:", error);
    // Return empty/default structure on failure so UI doesn't crash
    return { 
        ...PROPERTY_PARAMS_DEFAULT, 
        audit: { 
            ...PROPERTY_PARAMS_DEFAULT.audit, 
            evidence: { "error": "Extraction failed: " + (error as any).message } 
        } 
    };
  }
}
