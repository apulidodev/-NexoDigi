import { createClient } from "@supabase/supabase-js";
import { getServerSupabaseEnv } from "@/lib/supabase/env";

/** Server-only elevated client. Every caller must enforce authorization first. */
export function createSupabaseAdminClient() {
  const env = getServerSupabaseEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}