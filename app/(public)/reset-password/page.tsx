import type { Metadata } from "next";
import { ResetPasswordPage } from "@/components/public/auth-pages";

export const metadata: Metadata = {
  title: "Reset Password | OrderFlow",
  description: "Set a new password for your OrderFlow account.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ResetPasswordPage />;
}
