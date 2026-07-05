import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SignupPage } from "@/components/public/auth-pages";

export const metadata: Metadata = {
  title: "Sign Up | OrderFlow",
  description: "Create your free OrderFlow seller account.",
  alternates: { canonical: "/signup" },
};

export default function Page() {
  return (
    <AuthProvider bootAuthState={false}>
      <SignupPage />
    </AuthProvider>
  );
}
