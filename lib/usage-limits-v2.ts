// Updated usage limits based on practical SaaS model
// Limit: contacts, AI assistant, auto-responses
// Unlimited: email parsing (included in all plans)

export interface PlanLimits {
  name: string;
  price: number;
  activeContacts: number;          // Max active leads/contacts
  aiAssistantDaily: number;        // AI chat messages per day
  autoResponsesDaily: number;      // AI auto-replies per day
  teamMembers: number;             // Number of users/seats
  features: string[];              // Feature flags
}

export const PLANS: Record<string, PlanLimits> = {
  free: {
    name: 'Free',
    price: 0,
    activeContacts: 50,
    aiAssistantDaily: 20,
    autoResponsesDaily: 10,
    teamMembers: 1,
    features: ['basic_inbox', 'manual_add'],
  },
  solo: {
    name: 'Solo',
    price: 39,
    activeContacts: 200,
    aiAssistantDaily: 100,
    autoResponsesDaily: 50,
    teamMembers: 1,
    features: ['basic_inbox', 'manual_add', 'gmail_sync', 'ai_assistant', 'auto_responses', 'priority_support'],
  },
  team: {
    name: 'Team',
    price: 129,
    activeContacts: 1000,
    aiAssistantDaily: 500,
    autoResponsesDaily: 200,
    teamMembers: 3,
    features: ['basic_inbox', 'manual_add', 'gmail_sync', 'ai_assistant', 'auto_responses', 'analytics', 'team_collaboration', 'priority_support'],
  },
  business: {
    name: 'Business',
    price: 399,
    activeContacts: Infinity,
    aiAssistantDaily: Infinity,
    autoResponsesDaily: Infinity,
    teamMembers: 10,
    features: ['all_features', 'white_label', 'custom_integrations', 'dedicated_support'],
  },
};

/**
 * Check if user can add a new contact
 */
export async function canAddContact(userId: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  plan: string;
}> {
  const userPlan = await getUserPlan(userId);
  const limits = PLANS[userPlan];
  
  // Count active contacts (tenants with status != 'Archived')
  const currentContacts = await getActiveContactsCount(userId);
  
  return {
    allowed: currentContacts < limits.activeContacts,
    current: currentContacts,
    limit: limits.activeContacts,
    plan: userPlan,
  };
}

/**
 * Check daily AI assistant usage
 */
export async function canUseAIAssistant(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  resetsAt: Date;
}> {
  const userPlan = await getUserPlan(userId);
  const limits = PLANS[userPlan];
  
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const usedToday = await getDailyUsage(userId, 'aiAssistant', today);
  
  // Calculate when daily limit resets (midnight)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  return {
    allowed: usedToday < limits.aiAssistantDaily,
    used: usedToday,
    limit: limits.aiAssistantDaily,
    resetsAt: tomorrow,
  };
}

/**
 * Check daily auto-response usage
 */
export async function canUseAutoResponse(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  resetsAt: Date;
}> {
  const userPlan = await getUserPlan(userId);
  const limits = PLANS[userPlan];
  
  const today = new Date().toISOString().slice(0, 10);
  const usedToday = await getDailyUsage(userId, 'autoResponse', today);
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  return {
    allowed: usedToday < limits.autoResponsesDaily,
    used: usedToday,
    limit: limits.autoResponsesDaily,
    resetsAt: tomorrow,
  };
}

/**
 * Increment daily usage counter
 */
export async function incrementDailyUsage(
  userId: string,
  feature: 'aiAssistant' | 'autoResponse',
  amount: number = 1
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  
  // TODO: Implement in Supabase
  // INSERT INTO daily_usage (user_id, feature, date, count)
  // VALUES (userId, feature, today, amount)
  // ON CONFLICT (user_id, feature, date)
  // DO UPDATE SET count = daily_usage.count + amount
  
  console.log(`✅ Incremented ${feature} for ${userId}: +${amount} (${today})`);
}

/**
 * Get current daily usage
 */
async function getDailyUsage(
  userId: string,
  feature: string,
  date: string
): Promise<number> {
  // TODO: Fetch from daily_usage table
  // SELECT count FROM daily_usage
  // WHERE user_id = userId AND feature = feature AND date = date
  
  return 0; // Placeholder
}

/**
 * Get user's plan
 */
async function getUserPlan(userId: string): Promise<string> {
  // TODO: Fetch from user_plans table
  // For now, return 'free'
  return 'free';
}

/**
 * Get active contacts count
 */
async function getActiveContactsCount(userId: string): Promise<number> {
  // TODO: Count tenants where status != 'Archived'
  // SELECT COUNT(*) FROM tenants
  // WHERE user_id = userId AND status != 'Archived'
  
  return 0; // Placeholder
}

/**
 * Format time until reset
 */
export function getTimeUntilReset(resetsAt: Date): string {
  const now = new Date();
  const diff = resetsAt.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Get usage stats for display
 */
export async function getUsageStats(userId: string): Promise<{
  contacts: { current: number; limit: number; percentage: number };
  aiAssistant: { used: number; limit: number; percentage: number; resetsAt: Date };
  autoResponses: { used: number; limit: number; percentage: number; resetsAt: Date };
  plan: string;
}> {
  const userPlan = await getUserPlan(userId);
  const limits = PLANS[userPlan];
  
  const contactsCount = await getActiveContactsCount(userId);
  const today = new Date().toISOString().slice(0, 10);
  const aiUsed = await getDailyUsage(userId, 'aiAssistant', today);
  const autoUsed = await getDailyUsage(userId, 'autoResponse', today);
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  return {
    contacts: {
      current: contactsCount,
      limit: limits.activeContacts,
      percentage: limits.activeContacts === Infinity ? 0 : (contactsCount / limits.activeContacts) * 100,
    },
    aiAssistant: {
      used: aiUsed,
      limit: limits.aiAssistantDaily,
      percentage: limits.aiAssistantDaily === Infinity ? 0 : (aiUsed / limits.aiAssistantDaily) * 100,
      resetsAt: tomorrow,
    },
    autoResponses: {
      used: autoUsed,
      limit: limits.autoResponsesDaily,
      percentage: limits.autoResponsesDaily === Infinity ? 0 : (autoUsed / limits.autoResponsesDaily) * 100,
      resetsAt: tomorrow,
    },
    plan: userPlan,
  };
}
