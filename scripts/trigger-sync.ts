
import { createClient } from '@supabase/supabase-js';
import { syncGmailMessages } from '../lib/sync-service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSync() {
  console.log('🚀 Triggering manual Gmail sync test...');
  
  // Get the first user to simulate sync for
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  
  if (userError || !users || users.length === 0) {
    console.error('❌ Could not find users:', userError);
    return;
  }
  
  const targetUser = users[0];
  console.log(`👤 Syncing for user: ${targetUser.email} (${targetUser.id})`);
  
  try {
    const result = await syncGmailMessages(supabase, targetUser as any);
    console.log('\n--- SYNC RESULT ---');
    console.log(JSON.stringify(result, null, 2));
    console.log('-------------------\n');
    
    if (result.success) {
      console.log('✅ Sync executed successfully!');
    } else {
      console.log('❌ Sync reported failure.');
    }
  } catch (error) {
    console.error('❌ Sync crashed:', error);
  }
}

runSync();
