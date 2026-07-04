import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/mock-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

export function proxy(request: NextRequest) {
  if (isSupabaseConfigured()) return proxyWithSupabase(request);
  if (request.cookies.has(AUTH_COOKIE)) return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set(
    "next",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return NextResponse.redirect(login);
}
export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };

async function proxyWithSupabase(request: NextRequest) {
  const { response, supabase, user } = await updateSupabaseSession(request);
  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    return NextResponse.redirect(login);
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, account_status")
    .eq("id", user.id)
    .maybeSingle();
  if (request.nextUrl.pathname.startsWith("/admin") && profile?.role !== "admin") {
    return NextResponse.rewrite(new URL("/not-found", request.url), {
      status: 404,
      headers: response.headers,
    });
  }
  if (profile?.account_status === "deleted") {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return response;
}
