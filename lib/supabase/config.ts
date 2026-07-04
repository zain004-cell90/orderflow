const fallbackSupabaseUrl = "https://rucsowndqbckpepwinnp.supabase.co";
const fallbackSupabaseAnonKey =
  "sb_publishable_xVjjdsqT6D8BqKJVeAN7nw_NXdjuQY-";

export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackSupabaseUrl;
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey;

export function isSupabaseConfigured() {
  return (
    supabaseUrl.startsWith("https://") &&
    Boolean(supabaseAnonKey) &&
    !supabaseAnonKey.includes("replace_with")
  );
}

export function requireSupabaseConfig() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
}
