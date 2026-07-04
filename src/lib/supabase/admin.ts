import { createClient } from '@supabase/supabase-js';
import { requireEnv } from '@/lib/env';

const supabaseUrl = requireEnv(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_URL',
);
const serviceRoleKey = requireEnv(
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  'SUPABASE_SERVICE_ROLE_KEY',
);

/**
 * Creates a Supabase client authenticated with the service-role key. This
 * client BYPASSES Row Level Security, so it must only be used in trusted
 * server code — e.g. writing to the shared cache tables, which are read-only
 * for authenticated users. NEVER import this into client code.
 */
export function createAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
