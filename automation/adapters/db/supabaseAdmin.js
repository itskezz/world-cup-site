// automation/adapters/db/supabaseAdmin.js
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "../../lib/env.js";

export function createSupabaseAdminClient() {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}