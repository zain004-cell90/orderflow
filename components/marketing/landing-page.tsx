"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  ClipboardList,
  MessageCircle,
  Package,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";
import {
  MessyToOrganizedSection,
  OrderDashboardAndTrackingSection,
} from "./stitch-sections";

const features = [
  {
    icon: ClipboardList,
    title: "Lost Orders",
    text: "DMs get buried and forgotten. Customers get frustrated because you missed their message.",
  },
  {
    icon: BarChart3,
    title: "Scattered Details",
    text: "Address in one text, phone number in another, screenshot in another. It is a logistical nightmare.",
  },
  {
    icon: Package,
    title: "Manual Work",
    text: "Spending hours every day copying addresses into spreadsheets instead of growing your brand.",
  },
  {
    icon: Users,
    title: "No Customer Database",
    text: "You do not know who your best customers are or how to reach them for new launches.",
  },
  {
    icon: ShoppingBag,
    title: "No Order History",
    text: "Past purchases disappear inside chats, leaving no reliable record for you or your customer.",
  },
  {
    icon: MessageCircle,
    title: "Constant Questions",
    text: "Customers keep asking for prices, options and order updates that should already be available.",
  },
];

const faqs = [
  [
    "Do I need a website to use OrderFlow?",
    "No. OrderFlow gives you one standalone checkout link that works with every social channel you already sell on.",
  ],
  [
    "Can customers pay through OrderFlow?",
    "The first version focuses on collecting complete orders for cash-on-delivery and manual payment workflows.",
  ],
  [
    "Can I add sizes and colors?",
    "Yes. Every product can have its own size, color and variant options, plus custom checkout questions.",
  ],
  [
    "Will it work on mobile phones?",
    "Yes. The seller dashboard and customer checkout are designed mobile-first for fast everyday use.",
  ],
];

export function LandingPage() {
  const [faqOpen, setFaqOpen] = useState(0);
  return (
    <div className="marketing">
      <MarketingHeader />

      <main>
        <section className="marketing-hero">
          <div className="container-shell hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">
                <span className="w-2 h-2 bg-indigo-700 rounded-full animate-pulse" />
                Built for Instagram &amp; WhatsApp Sellers
              </span>
              <h1>
                Stop asking customers for their details <span>in DMs.</span>
              </h1>
              <p>
                Send one checkout link. Customers enter their own name, phone
                number, address, size and color. Every order appears
                automatically in your dashboard.
              </p>
              <div className="hero-actions">
                <Link className="btn-primary" href={routes.signup}>
                  Create Your Checkout Link
                </Link>
                <Link
                  className="btn-secondary !rounded-full !px-6 !py-3.5"
                  href={routes.demo}
                >
                  Watch Demo
                </Link>
              </div>
              <div className="hero-proof flex-wrap">
                <span className="flex items-center gap-1">
                  <CircleCheck size={14} />
                  No website required
                </span>
                <span className="flex items-center gap-1">
                  <CircleCheck size={14} />
                  Setup in 5 minutes
                </span>
                <span className="flex items-center gap-1">
                  <CircleCheck size={14} />
                  Works with Instagram, WhatsApp &amp; TikTok
                </span>
              </div>
            </div>
            <div
              id="demo"
              className="hero-visual scroll-mt-24"
              aria-label="OrderFlow checkout preview"
            >
              <div className="glow" />
              <div className="order-pop card">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <span className="w-8 h-8 grid place-items-center rounded-full bg-pink-100 text-pink-600 text-xs">
                    A
                  </span>
                  <b className="text-sm">Customer DM</b>
                </div>
                <div className="grid gap-3 mt-4">
                  <p className="!m-0 p-3 bg-white rounded-2xl text-xs shadow-sm">
                    I want to order the blue suit.
                  </p>
                  <p className="!m-0 p-3 bg-indigo-50 rounded-2xl text-xs">
                    Great! What&apos;s your name, phone, address, size and
                    color?
                  </p>
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl text-[10px] font-bold">
                    Order gets buried in 100+ unread DMs
                  </div>
                </div>
              </div>
              <div className="phone">
                <div className="phone-screen">
                  <div className="flex justify-between items-center mb-5">
                    <b className="text-sm text-indigo-700">
                      Your Shop Checkout
                    </b>
                    <ShoppingBag size={18} />
                  </div>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="product-mini !w-16 !h-16 !shrink-0">
                      <Package size={24} />
                    </div>
                    <div>
                      <b className="text-sm">Premium Lawn Suit</b>
                      <strong className="block text-indigo-700">
                        PKR 3,500
                      </strong>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <small>Name</small>
                      <div className="mini-field !h-10" />
                    </div>
                    <div>
                      <small>Phone</small>
                      <div className="mini-field !h-10" />
                    </div>
                    <div>
                      <small>Size</small>
                      <div className="mini-field !h-10" />
                    </div>
                    <div>
                      <small>Color</small>
                      <div className="mini-field !h-10" />
                    </div>
                  </div>
                  <small>Full Address</small>
                  <div className="mini-field !h-10" />
                  <button className="btn-primary w-full mt-3">
                    Confirm Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="problems" className="section bg-white">
          <div className="container-shell">
            <div className="section-heading">
              <h2>Still collecting orders like this?</h2>
              <p>
                The more orders you get, the harder it becomes to manage them
                inside chats.
              </p>
            </div>
            <div className="feature-grid">
              {features.map(({ icon: Icon, title, text }) => (
                <article className="feature-card" key={title}>
                  <span className="feature-icon">
                    <Icon size={21} />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <MessyToOrganizedSection />

        <section className="section bg-white">
          <div className="container-shell spotlight">
            <div className="checkout-demo">
              <div className="checkout-panel">
                <div className="flex justify-between items-center mb-6">
                  <div className="brand">
                    <span className="brand-mark">
                      <Store size={15} />
                    </span>
                    <span>Lumière</span>
                  </div>
                  <span className="text-xs text-gray-400">Secure checkout</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="product-mini">
                    <Package size={44} />
                  </div>
                  <div>
                    <span className="eyebrow">Order summary</span>
                    <h3 className="mt-3 mb-2">Linen Co-ord Set</h3>
                    <b>PKR 12,999</b>
                    <div className="mini-field" />
                    <div className="mini-field" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="mini-field !h-11" />
                  <div className="mini-field !h-11" />
                </div>
                <button className="btn-primary w-full mt-3">
                  Complete order
                </button>
              </div>
            </div>
            <div className="spotlight-copy">
              <span className="eyebrow">Branded checkout</span>
              <h2>A checkout that feels like your store.</h2>
              <p className="text-gray-500 leading-7">
                Give buyers a professional, trustworthy ordering experience
                without building a website or learning complicated tools.
              </p>
              <div className="check-list">
                {[
                  "Your logo, name and colors",
                  "Product variants and quantities",
                  "Custom fields for every business",
                  "Perfect on every phone",
                ].map((x) => (
                  <div className="check-item" key={x}>
                    <Check size={17} color="#22c55e" strokeWidth={3} />
                    {x}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <OrderDashboardAndTrackingSection />

        <section id="pricing" className="section bg-white scroll-mt-20">
          <div className="container-shell">
            <div className="section-heading">
              <h2>
                Simple plans that grow with your order volume.
              </h2>
            </div>
            <div className="price-grid">
              <Price
                name="Free"
                price="Rs 0/month"
                badge="Start free"
                items={[
                  "25 orders per month",
                  "Unlimited products",
                  "Branded checkout",
                ]}
              />
              <Price
                featured
                name="Starter"
                price="Rs 799/month"
                badge="Best for new sellers"
                items={[
                  "150 orders per month",
                  "Tracking tools",
                  "Customer database",
                ]}
              />
              <Price name="Growth" price="Rs 1,999/month" badge="For growing stores" items={["500 orders per month","Growth analytics","Priority support"]}/>
            </div>
          </div>
        </section>

        <section id="faq" className="section scroll-mt-20">
          <div className="container-shell">
            <div className="section-heading">
              <h2>Frequently Asked</h2>
            </div>
            <div className="faq-list">
              {faqs.map(([q, a], i) => (
                <div className="faq card" key={q}>
                  <button onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}>
                    {q}
                    {faqOpen === i ? (
                      <ChevronUp size={17} />
                    ) : (
                      <ChevronDown size={17} />
                    )}
                  </button>
                  {faqOpen === i && <p>{a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-20">
          <div className="container-shell">
            <div className="cta">
              <h2>Still asking customers for their details manually?</h2>
              <p>
                Send one link. Get every order automatically. Join hundreds of
                local brands scaling today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <Link href={routes.signup} className="btn-primary">
                  Create Your Checkout Link
                </Link>
                <Link href={routes.contact} className="btn-secondary">
                  Book a Demo
                </Link>
              </div>
              <small>No credit card required · Setup in 5 minutes</small>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

function Price({
  name,
  price,
  items,
  featured = false,
  badge,
}: {
  name: string;
  price: string;
  items: string[];
  featured?: boolean;
  badge: string;
}) {
  return (
    <article className={`price-card card ${featured ? "featured" : ""}`}>
      <span className="text-[10px] font-bold uppercase tracking-widest">{badge}</span>
      <h3>{name}</h3>
      <div className="price">
        {price}
      </div>
      <div className="price-list">
        {items.map((x) => (
          <span className="flex items-center gap-2" key={x}>
            <Check size={14} />
            {x}
          </span>
        ))}
      </div>
      <Link
        href={routes.signup}
        className={featured ? "btn-primary w-full" : "btn-secondary w-full"}
      >
        {name === "Free" ? "Start free" : `Choose ${name}`}
      </Link>
    </article>
  );
}
