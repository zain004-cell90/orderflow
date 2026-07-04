"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { routes } from "@/lib/routes";
import { useAuth } from "./auth-provider";

export function ProtectedAccountGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, user, logout } = useAuth();
  const router = useRouter();
  if (!ready)
    return (
      <main className="auth-gate-loading" aria-label="Loading account">
        <span className="skeleton-line w-52" />
      </main>
    );
  if (!user) return null;
  if (user.status !== "Active")
    return (
      <main className="account-status-page">
        <div className="account-status-card card">
          <span>
            <ShieldAlert size={28} />
          </span>
          <h1>Account suspended.</h1>
          <p>
            Your account is currently {user.status.toLowerCase()}. Dashboard
            access is unavailable. Contact support if you believe this is a
            mistake.
          </p>
          <div>
            <Link className="btn-primary" href={routes.contact}>
              Contact support
            </Link>
            <button
              className="btn-secondary"
              onClick={() => {
                logout();
                router.push(routes.home);
                router.refresh();
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
    );
  return <>{children}</>;
}
