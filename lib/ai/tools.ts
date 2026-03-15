import { SchemaType, FunctionCallingMode } from '@google/generative-ai';
import type { FunctionDeclaration, Tool } from '@google/generative-ai';
import { ALL_AMENITY_KEYS } from '@/lib/amenities-catalog';

// ─── Tool Declarations ──────────────────────────────────────────────────────
// Each tool represents an ACTION the AI can take. The LLM decides which tool
// to call based on the conversation context, eliminating manual intent parsing.

const sendProperties: FunctionDeclaration = {
  name: 'send_properties',
  description: `Send property listing cards to the client. Use this when:
- Client has completed qualification (all 7 Tier 1 fields known) and is ready for recommendations.
- Client asks "what do you have?", "show me options", "any apartments available?"
- Client asks to see MORE options after already seeing some.
NEVER use this if qualification fields are still missing — ask questions first via reply_to_client.`,
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      addresses: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
        description: 'Property addresses to send. Must be EXACT addresses from the AVAILABLE PROPERTIES list. 1-5 addresses.',
      },
      photo_mode: {
        type: SchemaType.BOOLEAN,
        description: 'Set true ONLY when client explicitly asks for photos/pictures/images of a property.',
      },
      reason: {
        type: SchemaType.STRING,
        description: 'Brief explanation of why these properties were chosen for this client.',
      },
    },
    required: ['addresses'],
  },
};

const bookViewing: FunctionDeclaration = {
  name: 'book_viewing',
  description: `Book a property viewing on the calendar. Use ONLY when:
- Client has CONFIRMED a SPECIFIC date AND time (e.g. "yes, 3pm works", "let's do Tuesday at 2pm").
- NEVER book if the client said vague things like "sometime next week" — ask for specifics via reply_to_client.
- NEVER book without an explicit property address.`,
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      start_time: {
        type: SchemaType.STRING,
        description: 'ISO 8601 datetime for the viewing start. Resolve relative dates ("tomorrow", "next Monday") using CURRENT DATE/TIME from context.',
      },
      property_address: {
        type: SchemaType.STRING,
        description: 'Full address of the property to view. Must match an address from AVAILABLE PROPERTIES.',
      },
      client_name: {
        type: SchemaType.STRING,
        description: 'Client name for the calendar event.',
      },
      duration_minutes: {
        type: SchemaType.INTEGER,
        description: 'Duration in minutes. Default 30.',
      },
    },
    required: ['start_time', 'property_address'],
  },
};

const getDistance: FunctionDeclaration = {
  name: 'get_distance',
  description: `Calculate the distance between a property and a target location. Use when the client asks:
- "how far is it from [place]?"
- "is it close to [place]?"
- "distance to downtown"
- Any question about commute, proximity, or distance.`,
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      property_address: {
        type: SchemaType.STRING,
        description: 'Full address of the property. Must match an address from AVAILABLE PROPERTIES or conversation context.',
      },
      target_place: {
        type: SchemaType.STRING,
        description: 'The place the client wants to know the distance to (e.g. "Seattle", "downtown", "University of Washington").',
      },
    },
    required: ['property_address', 'target_place'],
  },
};

const escalateToHuman: FunctionDeclaration = {
  name: 'escalate_to_human',
  description: `Escalate the conversation to a human agent. Use when:
- Client mentions legal action, lawsuits, attorney involvement.
- Client files a discrimination or Fair Housing complaint.
- Client requests ADA/accessibility accommodations.
- Client reports maintenance emergency (gas leak, flooding, fire).
- Client uses threatening or abusive language.
- Client requests opt-out/unsubscribe (STOP, UNSUBSCRIBE, REMOVE ME).
- Client asks the same question 2+ times and you cannot answer from the database.
- Client is frustrated or confused after 2+ exchanges.
- Client's budget is below ALL available properties AND they declined alternatives.
- 4+ consecutive unintelligible messages.`,
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      reason: {
        type: SchemaType.STRING,
        description: 'Specific reason for escalation (e.g. "Client requested opt-out", "Legal threat mentioned").',
      },
    },
    required: ['reason'],
  },
};

const updateClientProfile: FunctionDeclaration = {
  name: 'update_client_profile',
  description: `Extract and save structured data from the client's message. Call this EVERY time the client provides new information about themselves, their preferences, or their requirements. This runs IN ADDITION to any other tool — always extract data when available.`,
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      personal: {
        type: SchemaType.OBJECT,
        description: 'Personal information.',
        properties: {
          firstName: { type: SchemaType.STRING },
          lastName: { type: SchemaType.STRING },
          email: { type: SchemaType.STRING },
          phone: { type: SchemaType.STRING },
        },
      },
      timeline: {
        type: SchemaType.OBJECT,
        description: 'Move-in timeline and lease preferences.',
        properties: {
          move_in_date: { type: SchemaType.STRING, description: 'YYYY-MM-DD format.' },
          lease_term_ideal_months: { type: SchemaType.INTEGER },
        },
      },
      budget: {
        type: SchemaType.OBJECT,
        description: 'Budget information.',
        properties: {
          max_monthly_rent: { type: SchemaType.INTEGER },
          budget_stated: { type: SchemaType.STRING, description: 'Original statement (e.g. "2500 CAD").' },
          budget_currency: { type: SchemaType.STRING },
          budget_usd: { type: SchemaType.INTEGER, description: 'Converted to USD.' },
        },
      },
      housing: {
        type: SchemaType.OBJECT,
        description: 'Housing requirements.',
        properties: {
          property_types: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: '["rent"] or ["buy"].',
          },
          bedrooms_min: { type: SchemaType.INTEGER },
          bathrooms_min: { type: SchemaType.INTEGER },
          furnished: { type: SchemaType.STRING },
        },
      },
      occupants: {
        type: SchemaType.OBJECT,
        properties: {
          total_count: { type: SchemaType.INTEGER },
        },
      },
      pets: {
        type: SchemaType.OBJECT,
        properties: {
          has_pets: { type: SchemaType.BOOLEAN },
          pet_type: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          pet_weight_lbs: { type: SchemaType.INTEGER },
        },
      },
      location: {
        type: SchemaType.OBJECT,
        properties: {
          city: { type: SchemaType.STRING },
          state: { type: SchemaType.STRING },
          neighborhoods_must: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
      },
      amenities: {
        type: SchemaType.OBJECT,
        properties: {
          desired_features: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: `Canonical keys from: ${ALL_AMENITY_KEYS.slice(0, 30).join(', ')}... ACCUMULATE across messages.`,
          },
          deal_breakers: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
      },
    },
  },
};

const requestHumanAction: FunctionDeclaration = {
  name: 'request_human_action',
  description: `Create a request for a human team member to perform an action you cannot do yourself. Use when:
- Client asks to reschedule or cancel a viewing.
- Client asks about lease terms, deposits, or legal questions you cannot answer.
- Client requests something not covered by your other tools (e.g. maintenance, custom requests).
- You promised to "check with the landlord" — log it here so the team follows up.
This is DIFFERENT from escalate_to_human: escalation transfers the conversation; this just creates a task while YOU continue chatting.`,
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      action_description: {
        type: SchemaType.STRING,
        description: 'Clear description of what needs to be done (e.g. "Reschedule viewing at 123 Main St from Thursday to Friday 3pm").',
      },
      urgency: {
        type: SchemaType.STRING,
        description: '"low" for general questions, "medium" for time-sensitive requests, "high" for same-day or blocking issues.',
      },
      related_property_address: {
        type: SchemaType.STRING,
        description: 'Property address if the request is about a specific property.',
      },
    },
    required: ['action_description', 'urgency'],
  },
};

const checkAvailability: FunctionDeclaration = {
  name: 'check_availability',
  description: `Check the realtor's calendar for available viewing slots. Use when:
- Client asks "when can I see it?", "what times are available?", "are you free Thursday?"
- BEFORE booking a viewing — to offer real available slots instead of guessing.
- Client wants to know the schedule for this week or next week.
Returns a list of free 30-minute slots within the next 7 days.`,
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      preferred_date: {
        type: SchemaType.STRING,
        description: 'ISO 8601 date the client prefers (e.g. "2026-03-15"). If not specified, defaults to tomorrow.',
      },
      days_to_scan: {
        type: SchemaType.INTEGER,
        description: 'Number of days to scan for availability. Default 7, max 14.',
      },
    },
    required: [],
  },
};

const getPropertyDetails: FunctionDeclaration = {
  name: 'get_property_details',
  description: `Get full details about a specific property WITHOUT sending a property card to the client. Use when:
- Client asks a specific question about a property ("does it have a dishwasher?", "what's the pet policy?", "is parking included?").
- You need to check property details to answer a question accurately.
- You want to look up information without triggering a card/listing display.
This is READ-ONLY — it does not show anything to the client, it just gives you the data to answer their question.`,
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      property_address: {
        type: SchemaType.STRING,
        description: 'Full or partial address of the property to look up. Must match an address from AVAILABLE PROPERTIES.',
      },
    },
    required: ['property_address'],
  },
};

const replyToClient: FunctionDeclaration = {
  name: 'reply_to_client',
  description: `Send a conversational reply to the client. You MUST call this tool to deliver your message. Use when:
- Asking qualification questions (budget, bedrooms, move-in date, pets, occupants, lease duration, rent/buy).
- Responding to greetings or small talk.
- Acknowledging information the client provided.
- Any situation where you are NOT using another action tool (send_properties, book_viewing, etc.).
IMPORTANT: You must ALWAYS call at least one tool per turn. If you are not calling another tool, call this one.`,
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      message: {
        type: SchemaType.STRING,
        description: 'The message text to send to the client. Must be professional, warm, and concise (2-5 sentences). Match the client\'s language.',
      },
    },
    required: ['message'],
  },
};

// ─── Tool Configuration ─────────────────────────────────────────────────────

export const AGENT_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      replyToClient,
      sendProperties,
      bookViewing,
      getDistance,
      escalateToHuman,
      updateClientProfile,
      requestHumanAction,
      checkAvailability,
      getPropertyDetails,
    ],
  },
];

export const TOOL_CONFIG = {
  functionCallingConfig: {
    mode: FunctionCallingMode.ANY,
  },
};

export type ToolCallName =
  | 'reply_to_client'
  | 'send_properties'
  | 'book_viewing'
  | 'get_distance'
  | 'escalate_to_human'
  | 'update_client_profile'
  | 'request_human_action'
  | 'check_availability'
  | 'get_property_details';

export interface ToolCallResult {
  name: ToolCallName;
  args: Record<string, any>;
}

/**
 * Extract function calls from Gemini response.
 * Returns both text content and function calls.
 */
export function parseToolResponse(response: any): {
  text: string | null;
  toolCalls: ToolCallResult[];
} {
  const candidate = response.response?.candidates?.[0];
  if (!candidate?.content?.parts) {
    return { text: response.response?.text() || null, toolCalls: [] };
  }

  let text: string | null = null;
  const toolCalls: ToolCallResult[] = [];

  for (const part of candidate.content.parts) {
    if (part.text) {
      text = (text || '') + part.text;
    }
    if (part.functionCall) {
      toolCalls.push({
        name: part.functionCall.name as ToolCallName,
        args: part.functionCall.args || {},
      });
    }
  }

  return { text, toolCalls };
}
