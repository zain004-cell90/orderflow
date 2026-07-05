import { notFound } from "next/navigation";
import { AdminPage } from "@/components/admin/admin-page";
import { ADMIN_EMAIL } from "@/lib/mock-auth";
import { getServerMockSession } from "@/lib/server-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isInvalidRefreshTokenError } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Page() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (isInvalidRefreshTokenError(error)) notFound();
      throw error;
    }
    const user = data.user;
    if (!user) notFound();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "admin") notFound();
    return <AdminPage />;
  }
  const session = await getServerMockSession();
  if (session?.email.toLowerCase() !== ADMIN_EMAIL) notFound();
  return <AdminPage />;
}
