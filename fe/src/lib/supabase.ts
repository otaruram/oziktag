import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function createFallbackClient(): SupabaseClient {
  const noopChannel: any = {
    on: () => noopChannel,
    subscribe: () => noopChannel,
  };
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithOAuth: async () => ({
        data: { provider: "google" as const, url: "" },
        error: new Error("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diatur di fe/.env"),
      }),
      signOut: async () => ({ error: null }),
    },
    channel: () => noopChannel,
    removeChannel: async () => "ok",
  } as unknown as SupabaseClient;
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("[Oziktag] VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum diatur. Menjalankan mode fallback.");
}

export const supabase: SupabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createFallbackClient();
