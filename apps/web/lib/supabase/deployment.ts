// Intentionally PUBLIC browser configuration. A publishable key grants no privileged access.
// All data access is enforced by Supabase Auth, RLS, column grants and restricted RPCs.
export const BACKEND = {
  url:
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://azyycklgfzmyxpztqugw.supabase.co",
  publishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_GnqX75t5QERfAiyPn8F-eQ_gby0WgKm",
  siteUrl:
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://web-xi-nine-d4ej5g61wk.vercel.app",
} as const;
