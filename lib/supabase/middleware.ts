import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./config";
import { isInvalidRefreshTokenError } from "./errors";

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    if (isInvalidRefreshTokenError(error)) {
      clearSupabaseAuthCookies(request, response);
      return { response, supabase, user: null };
    }
    throw error;
  }

  return { response, supabase, user: data.user };
}

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith("sb-") || name.toLowerCase().includes("supabase")) {
      request.cookies.delete(name);
      response.cookies.set(name, "", { path: "/", maxAge: 0 });
    }
  });
}
