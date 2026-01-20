// Usage tracking and limits for different plans

export interface PlanLimits {
  name: string;
  price: number;
  emailParsing: number;        // emails per month
  aiAssistant: number;         // messages per month
  properties: number;          // max properties
  contracts: number;           // max contracts
}

export const PLANS: Record<string, PlanLimits> = {
  free: {
    name: 'Free',
    price: 0,
    emailParsing: 50,           // 50 emails/month
    aiAssistant: 10,            // 10 AI messages/month
    properties: 5,              // 5 properties
    contracts: 10,              // 10 contracts
  },
  starter: {
    name: 'Starter',
    price: 29,
    emailParsing: 500,          // 500 emails/month
    aiAssistant: 100,           // 100 AI messages/month
    properties: 25,             // 25 properties
    contracts: 50,              // 50 contracts
  },
  pro: {
    name: 'Pro',
    price: 99,
    emailParsing: 2000,         // 2000 emails/month
    aiAssistant: 500,           // 500 AI messages/month
    properties: 100,            // 100 properties
    contracts: 200,             // 200 contracts
  },
  enterprise: {
    name: 'Enterprise',
    price: 299,
    emailParsing: Infinity,     // Unlimited
    aiAssistant: Infinity,      // Unlimited
    properties: Infinity,       // Unlimited
    contracts: Infinity,        // Unlimited
  },
};

/**
 * Check if user has reached their limit for a specific feature
 */
export async function checkUsageLimit(
  userId: string,
  feature: 'emailParsing' | 'aiAssistant' | 'properties' | 'contracts'
): Promise<{ allowed: boolean; used: number; limit: number; plan: string }> {
  // Get user's current plan from database
  // For now, using 'free' as default
  const userPlan = 'free'; // TODO: Fetch from user profile
  
  const limits = PLANS[userPlan];
  
  // Get current usage for this month
  const used = await getCurrentUsage(userId, feature);
  const limit = limits[feature];
  
  return {
    allowed: used < limit,
    used,
    limit,
    plan: userPlan,
  };
}

/**
 * Increment usage counter for a feature
 */
export async function incrementUsage(
  userId: string,
  feature: 'emailParsing' | 'aiAssistant' | 'properties' | 'contracts',
  amount: number = 1
): Promise<void> {
  // TODO: Implement usage tracking in Supabase
  // Create a 'usage_stats' table to track monthly usage
  
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  // Pseudo code:
  // INSERT INTO usage_stats (user_id, feature, month, count)
  // VALUES (userId, feature, month, amount)
  // ON CONFLICT (user_id, feature, month)
  // DO UPDATE SET count = usage_stats.count + amount
  
  console.log(`Incremented ${feature} usage for user ${userId}: +${amount}`);
}

/**
 * Get current month's usage for a feature
 */
async function getCurrentUsage(
  userId: string,
  feature: string
): Promise<number> {
  // TODO: Fetch from usage_stats table
  const month = new Date().toISOString().slice(0, 7);
  
  // Pseudo code:
  // SELECT count FROM usage_stats
  // WHERE user_id = userId AND feature = feature AND month = month
  
  // For now, return 0
  return 0;
}

/**
 * Calculate cost for current usage
 */
export function calculateCost(used: {
  emailParsing: number;
  aiAssistant: number;
}): number {
  const emailCost = used.emailParsing * 0.0002;      // $0.0002 per email
  const aiCost = used.aiAssistant * 0.002;           // $0.002 per message
  
  return emailCost + aiCost;
}

/**
 * Get upgrade recommendation based on usage
 */
export function getUpgradeRecommendation(
  currentPlan: string,
  usage: { emailParsing: number; aiAssistant: number }
): string | null {
  const limits = PLANS[currentPlan];
  
  // If using > 80% of limit, recommend upgrade
  if (
    usage.emailParsing > limits.emailParsing * 0.8 ||
    usage.aiAssistant > limits.aiAssistant * 0.8
  ) {
    // Find next tier
    const planOrder = ['free', 'starter', 'pro', 'enterprise'];
    const currentIndex = planOrder.indexOf(currentPlan);
    if (currentIndex < planOrder.length - 1) {
      return planOrder[currentIndex + 1];
    }
  }
  
  return null;
}
