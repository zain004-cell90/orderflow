import type { Metadata } from "next";
import { CheckEmailPage } from "@/components/public/auth-pages";

export const metadata: Metadata = {
  title: "Check Your Email | OrderFlow",
  description: "Confirm your email address to continue setting up OrderFlow.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CheckEmailPage />;
}
