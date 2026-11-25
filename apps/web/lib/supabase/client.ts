import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { BACKEND } from "./deployment";
let client: SupabaseClient | undefined;
export function backend() {
  if (!client)
    client = createClient(BACKEND.url, BACKEND.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  return client;
}
