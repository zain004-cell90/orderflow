import type { Metadata } from "next";
import { LegalPage } from "@/components/public/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service | OrderFlow",
  description:
    "OrderFlow terms of service for sellers using the SaaS checkout and order management MVP.",
};

export default function TermsPage() {
  return <LegalPage type="terms" />;
}
