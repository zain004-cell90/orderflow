"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { routes } from "@/lib/routes";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/marketing-chrome";

type LegalPageProps = {
  type: "privacy" | "terms";
};

const legalCopy = {
  privacy: {
    eyebrow: "Privacy Policy",
    title: "How OrderFlow handles your data",
    description:
      "This MVP privacy page explains the basic data OrderFlow may collect when sellers and customers use the product.",
    sections: [
      {
        title: "Information we collect",
        text: "OrderFlow may collect account details, store details, product information, customer order details, checkout settings, and support messages entered into the app.",
      },
      {
        title: "How we use information",
        text: "We use this information to operate seller dashboards, collect customer orders, show tracking updates, improve reliability, and provide support.",
      },
      {
        title: "Customer order data",
        text: "Customer names, phone numbers, addresses, product selections, and order status are used only for order management and tracking inside the seller's store.",
      },
      {
        title: "Data security",
        text: "OrderFlow is being prepared for production with Supabase authentication, database rules, storage controls, and protected dashboard routes.",
      },
    ],
  },
  terms: {
    eyebrow: "Terms of Service",
    title: "Terms for using OrderFlow",
    description:
      "These MVP terms describe the basic rules for using OrderFlow while the product is being prepared for real sellers.",
    sections: [
      {
        title: "Use of the service",
        text: "OrderFlow is provided to help social sellers collect order details, manage customers, and organize order tracking from one branded checkout link.",
      },
      {
        title: "Seller responsibility",
        text: "Sellers are responsible for product accuracy, pricing, delivery, customer communication, refunds, and compliance with local business rules.",
      },
      {
        title: "MVP limitations",
        text: "Payment gateways, delivery integrations, WhatsApp API automation, and advanced staff permissions are not part of the MVP unless added later.",
      },
      {
        title: "Acceptable use",
        text: "Users must not misuse the platform, upload harmful content, violate customer privacy, or use OrderFlow for illegal products or misleading sales.",
      },
    ],
  },
} as const;

export function LegalPage({ type }: LegalPageProps) {
  const copy = legalCopy[type];

  return (
    <div className="marketing min-h-screen bg-[#f9f9ff] text-[#141b2b]">
      <MarketingHeader />
      <main className="mx-auto max-w-[1000px] px-6 pb-24 pt-32">
        <section className="rounded-[32px] border border-[#c7c4d8]/30 bg-white p-8 shadow-sm md:p-14">
          <span className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#eeedff] text-[#3525cd]">
            <ShieldCheck size={26} />
          </span>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-[36px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[56px]">
            {copy.title}
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-[1.7] text-[#464555]">
            {copy.description}
          </p>
          <div className="mt-10 grid gap-5">
            {copy.sections.map((section) => (
              <article
                key={section.title}
                className="rounded-2xl border border-[#e5e7eb] bg-[#fafaff] p-6"
              >
                <h2 className="text-[18px] font-bold tracking-[-0.01em]">
                  {section.title}
                </h2>
                <p className="mt-3 text-[14px] leading-7 text-[#464555]">
                  {section.text}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href={routes.home} className="btn-primary">
              Back to Home
            </Link>
            <Link href={routes.contact} className="btn-secondary">
              Contact Support
            </Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
