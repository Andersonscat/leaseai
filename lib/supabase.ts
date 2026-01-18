import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// For server-side and API routes
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For client-side components (with auth)
export const createSupabaseClient = () => {
  return createClientComponentClient();
};
