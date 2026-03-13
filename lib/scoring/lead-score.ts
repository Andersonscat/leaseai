import type { TenantData } from '@/lib/ai/types';

/**
 * Calculate lead score based on tenant data completeness (0-100).
 */
export function calculateLeadScore(tenant: Partial<TenantData> & Record<string, any>): number {
  let points = 0;
  const max = 100;

  // Contact info (max 15)
  if (tenant.name) points += 5;
  if (tenant.email) points += 5;
  if (tenant.phone) points += 5;

  // Budget (max 20) — check both old and new fields
  if (tenant.budget_max || tenant.budget_min || tenant.budget) points += 20;

  // Timeline (max 15)
  if (tenant.move_in_date) points += 15;

  // Housing preferences (max 20)
  if (tenant.bedrooms != null) points += 7;
  if (tenant.bathrooms != null) points += 3;
  if (tenant.property_type) points += 5;
  if (tenant.lease_duration || tenant.lease_term_months) points += 5;

  // Lifestyle (max 10)
  if (tenant.has_pets !== undefined) points += 3;
  if (tenant.num_occupants != null || tenant.occupants != null) points += 3;
  if (tenant.needs_parking !== undefined || tenant.parking_needed !== undefined) points += 2;
  if (tenant.furnishing) points += 2;

  // Location (max 10)
  if (tenant.preferred_neighborhoods && (
    Array.isArray(tenant.preferred_neighborhoods) ? tenant.preferred_neighborhoods.length > 0 : true
  )) points += 10;

  // Amenities & specifics (max 10)
  if (tenant.must_haves && (Array.isArray(tenant.must_haves) ? tenant.must_haves.length > 0 : true)) points += 5;
  if (tenant.deal_breakers && (Array.isArray(tenant.deal_breakers) ? tenant.deal_breakers.length > 0 : true)) points += 5;

  return Math.min(points, max);
}

/**
 * Get lead quality label from score
 */
export function getLeadQuality(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 80) return 'hot';
  if (score >= 50) return 'warm';
  return 'cold';
}
