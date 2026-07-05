import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LoginPage } from "@/components/public/auth-pages";

export const metadata: Metadata = {
  title: "Log In | OrderFlow",
  description: "Log in to manage your OrderFlow store.",
  alternates: { canonical: "/login" },
};

export default function Page() {
  return (
    <AuthProvider bootAuthState={false}>
      <Suspense fallback={null}>
        <LoginPage />
      </Suspense>
    </AuthProvider>
  );
}
