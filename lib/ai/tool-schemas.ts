import { z } from 'zod';

export const replyToClientSchema = z.object({
  message: z.string().min(1),
});

export const sendPropertiesSchema = z.object({
  addresses: z.array(z.string().min(3)).min(1).max(10),
  photo_mode: z.boolean().optional().default(false),
  reason: z.string().optional(),
});

export const bookViewingSchema = z.object({
  start_time: z.string().min(10).refine(
    (s) => !isNaN(Date.parse(s)),
    { message: 'start_time must be a valid date string (ISO 8601). Example: "2026-03-15T15:00:00"' }
  ),
  property_address: z.string().min(5),
  client_name: z.string().optional(),
  duration_minutes: z.number().int().min(15).max(120).optional().default(30),
});

export const getDistanceSchema = z.object({
  property_address: z.string().min(5),
  target_place: z.string().min(2),
});

export const escalateToHumanSchema = z.object({
  reason: z.string().min(3),
});

export const updateClientProfileSchema = z.object({
  personal: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  timeline: z.object({
    move_in_date: z.string().optional(),
    lease_term_ideal_months: z.number().int().optional(),
  }).optional(),
  budget: z.object({
    max_monthly_rent: z.number().optional(),
    budget_stated: z.string().optional(),
    budget_currency: z.string().optional(),
    budget_usd: z.number().optional(),
  }).optional(),
  housing: z.object({
    property_types: z.array(z.string()).optional(),
    bedrooms_min: z.number().int().optional(),
    bathrooms_min: z.number().int().optional(),
    furnished: z.string().optional(),
  }).optional(),
  occupants: z.object({
    total_count: z.number().int().optional(),
  }).optional(),
  pets: z.object({
    has_pets: z.boolean().optional(),
    pet_type: z.array(z.string()).optional(),
    pet_weight_lbs: z.number().optional(),
  }).optional(),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    neighborhoods_must: z.array(z.string()).optional(),
  }).optional(),
  amenities: z.object({
    desired_features: z.array(z.string()).optional(),
    deal_breakers: z.array(z.string()).optional(),
  }).optional(),
}).passthrough();

export const requestHumanActionSchema = z.object({
  action_description: z.string().min(5),
  urgency: z.enum(['low', 'medium', 'high']).default('medium'),
  related_property_address: z.string().optional(),
});

export const checkAvailabilitySchema = z.object({
  preferred_date: z.string().optional(),
  days_to_scan: z.number().int().min(1).max(14).optional().default(7),
});

export const getPropertyDetailsSchema = z.object({
  property_address: z.string().min(3),
});

export const TOOL_SCHEMAS: Record<string, z.ZodType<any>> = {
  reply_to_client: replyToClientSchema,
  send_properties: sendPropertiesSchema,
  book_viewing: bookViewingSchema,
  get_distance: getDistanceSchema,
  escalate_to_human: escalateToHumanSchema,
  update_client_profile: updateClientProfileSchema,
  request_human_action: requestHumanActionSchema,
  check_availability: checkAvailabilitySchema,
  get_property_details: getPropertyDetailsSchema,
};

/**
 * Validate tool call args against the schema for that tool.
 * Returns { success: true, data } or { success: false, error }.
 */
export function validateToolArgs(
  toolName: string,
  args: Record<string, any>
): { success: true; data: any } | { success: false; error: string } {
  const schema = TOOL_SCHEMAS[toolName];
  if (!schema) {
    return { success: true, data: args };
  }

  const result = schema.safeParse(args);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const issues = result.error.issues
    .map(i => `${i.path.join('.')}: ${i.message}`)
    .join('; ');
  return { success: false, error: `Invalid arguments for ${toolName}: ${issues}` };
}
