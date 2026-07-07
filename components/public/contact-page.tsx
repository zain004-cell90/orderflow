"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  ExternalLink,
  Mail,
  MapPin,
  Send,
  Users,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/marketing-chrome";
import { routes } from "@/lib/routes";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  readContactSubmissions,
  storageKeys,
  writeStorage,
} from "@/lib/storage";
import type { ContactSubmission } from "@/lib/types";
import {
  isValidEmail,
  sanitizeEmail,
  sanitizeMultiline,
  sanitizeText,
} from "@/lib/validation";

const field =
  "h-12 w-full rounded-lg border border-[#c7c4d8] bg-[#f9f9ff] px-4 text-[14px] outline-none transition-all placeholder:text-[#777587] focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20";
const subjects = [
  "Technical Support",
  "Billing & Subscription",
  "Strategic Partnership",
  "Feature Request",
  "Other",
];

export function ContactPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSending(true);
    const data = new FormData(e.currentTarget);
    const submission: ContactSubmission = {
      id: `msg-${Date.now()}`,
      fullName: sanitizeText(data.get("fullName"), 100),
      email: sanitizeEmail(data.get("email")),
      subject: sanitizeText(data.get("subject"), 120),
      message: sanitizeMultiline(data.get("message"), 1500),
      status: "New",
      source: "contact_page",
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!submission.fullName || !isValidEmail(submission.email) || !submission.message) {
      setError("Please enter your name, a valid email, and your message.");
      setSending(false);
      return;
    }
    try {
      if (isSupabaseConfigured()) {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.from("contact_submissions").insert({
          full_name: submission.fullName,
          email: submission.email,
          subject: submission.subject,
          message: submission.message,
          status: "new",
          source: submission.source,
          user_agent: submission.userAgent,
        });
        if (error) throw error;
      } else {
        writeStorage(storageKeys.contactSubmissions, [
          submission,
          ...readContactSubmissions([]),
        ]);
      }
      setSent(true);
      e.currentTarget.reset();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not send your message. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="marketing min-h-screen bg-[#f9f9ff] text-[#141b2b]">
      <MarketingHeader />
      <main className="relative mx-auto max-w-[1280px] px-6 pb-20 pt-32">
        <header className="mx-auto mb-20 max-w-2xl text-center">
          <h1 className="mb-4 text-[32px] font-bold leading-[1.2] tracking-[-0.01em] md:text-[48px] md:leading-[1.1] md:tracking-[-0.02em]">
            Need help? We&apos;re here.
          </h1>
          <p className="text-[18px] leading-[1.6] text-[#464555]">
            Our world-class support team is dedicated to helping social media
            entrepreneurs scale their operations with OrderFlow. Reach out and
            we&apos;ll get back to you within 2 business hours.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <section className="lg:col-span-7">
            <div className="rounded-xl border border-[#c7c4d8]/30 bg-white p-8 shadow-sm md:p-12">
              <form onSubmit={submit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Full Name">
                    <input
                      className={field}
                      name="fullName"
                      placeholder="Jane Doe"
                      required
                    />
                  </Field>
                  <Field label="Email Address">
                    <input
                      className={field}
                      name="email"
                      type="email"
                      placeholder="jane@company.com"
                      required
                    />
                  </Field>
                </div>
                <Field label="Subject">
                  <select className={field} name="subject">
                    {subjects.map((subject) => (
                      <option key={subject}>{subject}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Message">
                  <textarea
                    className={`${field} h-auto min-h-[150px] resize-none py-4`}
                    name="message"
                    placeholder="How can we help you today?"
                    required
                  />
                </Field>
                {error && (
                  <p className="rounded-lg bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700">
                    {error}
                  </p>
                )}
                {sent && (
                  <p className="rounded-lg bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">
                    Message sent. Admin can now review it in the Admin Panel.
                  </p>
                )}
                <button
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-[#4f46e5] to-[#3525cd] text-[14px] font-semibold text-white shadow-lg disabled:cursor-wait disabled:opacity-70"
                  disabled={sending}
                >
                  {sending ? "Sending..." : sent ? "Send Another Message" : "Send Message"}
                  {sent ? <Mail size={17} /> : <Send size={17} />}
                </button>
              </form>
            </div>
          </section>
          <aside className="space-y-8 lg:col-span-5">
            <div className="space-y-6">
              <ContactCard
                icon={Users}
                title="Support Email"
                text="Get help with your active orders and technical workflows."
                email="support@orderflow.io"
              />
              <ContactCard
                icon={BriefcaseBusiness}
                title="Business Email"
                text="For enterprise licensing, partnerships, and press inquiries."
                email="partners@orderflow.io"
                secondary
              />
              <div className="relative overflow-hidden rounded-xl bg-[#3525cd] p-8 text-white">
                <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                <div className="relative">
                  <h2 className="mb-4 text-[24px] font-semibold leading-[1.3] tracking-[-0.01em]">
                    Common Questions
                  </h2>
                  <p className="mb-6 text-[14px] leading-[1.5] text-[#dad7ff]">
                    Before reaching out, check our documentation. We might have
                    already answered your question.
                  </p>
                  <Link
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-[14px] font-bold text-[#3525cd]"
                    href={routes.faq}
                  >
                    View Help Center <ExternalLink size={17} />
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-8 pt-4 opacity-50 grayscale">
              {[4, 5, 6].map((n) => (
                <Image
                  key={n}
                  className="h-6 w-14 object-cover"
                  src={`/images/orderflow/stitch-0${n}.png`}
                  alt="Partner logo"
                  width={56}
                  height={24}
                />
              ))}
            </div>
          </aside>
        </div>
      </main>
      <section className="mx-auto mb-20 max-w-[1280px] px-6">
        <div className="relative h-96 overflow-hidden rounded-2xl border border-[#c7c4d8]/30 shadow-sm">
          <Image
            className="h-full w-full object-cover"
            src="/images/orderflow/stitch-07.png"
            alt="OrderFlow headquarters"
            width={512}
            height={512}
          />
          <div className="absolute bottom-8 left-8 rounded-xl border border-white/40 bg-white/90 p-6 shadow-lg backdrop-blur">
            <p className="mb-2 text-[12px] font-semibold text-[#3525cd]">
              Our Headquarters
            </p>
            <p className="text-[12px] leading-5 text-[#464555]">
              101 High-Performance Way,
              <br />
              Suite 400, San Francisco, CA 94105
            </p>
            <a
              href="#"
              className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-[#3525cd]"
            >
              <MapPin size={14} />
              Get Directions
            </a>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="block text-[12px] font-medium text-[#464555]">
        {label}
      </span>
      {children}
    </label>
  );
}
function ContactCard({
  icon: Icon,
  title,
  text,
  email,
  secondary = false,
}: {
  icon: typeof Users;
  title: string;
  text: string;
  email: string;
  secondary?: boolean;
}) {
  return (
    <article className="rounded-xl border border-[#c7c4d8]/10 bg-[#f1f3ff] p-6 transition-colors hover:border-[#3525cd]/30">
      <div className="flex items-start gap-4">
        <span
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${
            secondary
              ? "bg-[#64a8fe]/10 text-[#0060ac]"
              : "bg-[#4f46e5]/10 text-[#3525cd]"
          }`}
        >
          <Icon size={20} />
        </span>
        <div>
          <h2 className="mb-1 text-[18px] font-semibold">{title}</h2>
          <p className="mb-3 text-[14px] leading-[1.5] text-[#464555]">
            {text}
          </p>
          <a
            className={`flex items-center gap-1 text-[14px] font-semibold ${
              secondary ? "text-[#0060ac]" : "text-[#3525cd]"
            }`}
            href={`mailto:${email}`}
          >
            {email}
            <ArrowRight size={15} />
          </a>
        </div>
      </div>
    </article>
  );
}
