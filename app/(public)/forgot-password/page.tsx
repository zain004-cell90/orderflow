import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ForgotPasswordPage } from "@/components/public/auth-pages";

export const metadata: Metadata = {
  title: "Forgot Password | OrderFlow",
  description: "Reset your OrderFlow account password.",
  alternates: { canonical: "/forgot-password" },
};

export default function Page() {
  return (
    <AuthProvider bootAuthState={false}>
      <ForgotPasswordPage />
    </AuthProvider>
  );
}
