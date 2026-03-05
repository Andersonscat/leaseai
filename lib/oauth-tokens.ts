/**
 * Per-user OAuth token storage.
 * Reads tokens from the `oauth_tokens` DB table, with env-var fallback
 * so existing setups keep working during migration.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export interface OAuthTokenRow {
  refresh_token: string;
  access_token: string | null;
  gmail_email: string | null;
  expires_at: string | null;
  scope: string | null;
}

/**
 * Load a user's Google OAuth tokens from the DB.
 * Falls back to the legacy GMAIL_REFRESH_TOKEN env var when no DB row exists.
 */
export async function getOAuthTokens(
  userId: string
): Promise<OAuthTokenRow | null> {
  const { data, error } = await supabaseAdmin
    .from("oauth_tokens")
    .select("refresh_token, access_token, gmail_email, expires_at, scope")
    .eq("user_id", userId)
    .eq("provider", "google")
    .single();

  if (data) return data as OAuthTokenRow;

  return null;
}

/**
 * Look up the user_id that owns a given Gmail address.
 * Used by the webhook handler to map incoming Pub/Sub notifications
 * to the correct user.
 */
export async function getUserIdByGmailEmail(
  email: string
): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("oauth_tokens")
    .select("user_id")
    .eq("gmail_email", email.toLowerCase())
    .eq("provider", "google")
    .single();

  return data?.user_id ?? null;
}

/**
 * Upsert tokens for a user (used by the OAuth callback).
 */
export async function upsertOAuthTokens(
  userId: string,
  tokens: {
    refresh_token: string;
    access_token?: string | null;
    expires_at?: string | null;
    scope?: string | null;
    gmail_email?: string | null;
  }
): Promise<void> {
  const { error } = await supabaseAdmin.from("oauth_tokens").upsert(
    {
      user_id: userId,
      provider: "google",
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token ?? null,
      expires_at: tokens.expires_at ?? null,
      scope: tokens.scope ?? null,
      gmail_email: tokens.gmail_email?.toLowerCase() ?? null,
    },
    { onConflict: "user_id,provider" }
  );

  if (error) {
    console.error("Failed to upsert OAuth tokens:", error.message);
    throw new Error("Failed to store OAuth tokens");
  }
}

/**
 * Delete a user's OAuth tokens (disconnect).
 */
export async function deleteOAuthTokens(userId: string): Promise<void> {
  await supabaseAdmin
    .from("oauth_tokens")
    .delete()
    .eq("user_id", userId)
    .eq("provider", "google");
}
