import type { Metadata } from "next";
import { LegalPage } from "@/components/public/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | OrderFlow",
  description:
    "OrderFlow privacy policy for sellers and customers using checkout, order tracking, and dashboard tools.",
};

export default function PrivacyPage() {
  return <LegalPage type="privacy" />;
}
