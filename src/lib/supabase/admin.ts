import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig, getSupabaseSecretKey } from "@/lib/env";

export function createAdminClient() {
  const config = getSupabasePublicConfig();
  if (!config) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }
  const { url } = config;
  const secret = getSupabaseSecretKey();
  if (!secret) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) for admin operations."
    );
  }

  return createSupabaseJsClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
