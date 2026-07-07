"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./config";
export { isInvalidRefreshTokenError } from "./errors";

export function createSupabaseBrowserClient() {
  // Browser client is for Client Components only. Server route checks use server.ts.
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export async function clearSupabaseBrowserSession(
  supabase?: SupabaseClient | null,
) {
  // Handles invalid refresh-token cases by clearing every local Supabase auth artifact.
  try {
    await supabase?.auth.signOut({ scope: "local" });
  } catch {
    // The current refresh token may already be invalid. Local cleanup below is enough.
  }

  if (typeof window === "undefined") return;

  const projectRef = (() => {
    try {
      return new URL(supabaseUrl).hostname.split(".")[0];
    } catch {
      return "";
    }
  })();

  try {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (
        key &&
        (key.startsWith("sb-") ||
          key.toLowerCase().includes("supabase") ||
          (projectRef && key.includes(projectRef)))
      ) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage access failures.
  }

  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim();
    if (
      name &&
      (name.startsWith("sb-") ||
        name.toLowerCase().includes("supabase") ||
        (projectRef && name.includes(projectRef)))
    ) {
      document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
    }
  });
}
