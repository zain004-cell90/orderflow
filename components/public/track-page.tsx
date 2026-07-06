/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  Package,
  Search,
  Truck,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/marketing-chrome";
import { formatCurrency } from "@/lib/formatters";
import { defaultCheckoutConfig } from "@/lib/mock-data";
import { routes } from "@/lib/routes";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { statusToUi } from "@/lib/supabase/mappers";
import { readCheckoutConfig, readOrders, readSettings } from "@/lib/storage";
import type { CheckoutConfig, Order, StoreSettings } from "@/lib/types";

const initialSettings: StoreSettings = {
  storeName: "The Modern Entrepreneur",
  businessPhone: "",
  businessEmail: "",
  country: "PK",
  currency: "PKR",
  timezone: "Asia/Karachi",
  phoneFormat: "",
  dateFormat: "DD/MM/YYYY",
  logo: "",
};
const statusSteps = [
  "Order Received",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
];

export function TrackPage() {
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [results, setResults] = useState<Order[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [settings, setSettings] = useState(initialSettings);
  const [config, setConfig] = useState<CheckoutConfig>(defaultCheckoutConfig);
  const [trackingDisabled, setTrackingDisabled] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readOrders([]);
      const phone = params.get("phone") || "";
      const loadedConfig = readCheckoutConfig(defaultCheckoutConfig);
      setOrders(stored);
      setSettings(readSettings(initialSettings));
      setConfig(loadedConfig);
      setQuery(phone);
      if (phone && loadedConfig.trackingEnabled) {
        setResults(matchOrders(stored, phone));
      }
      if (phone && !loadedConfig.trackingEnabled) {
        setTrackingDisabled(true);
        setResults([]);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [params]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTrackingDisabled(false);
    if (!config.trackingEnabled) {
      setTrackingDisabled(true);
      setResults([]);
      return;
    }
    if (isSupabaseConfigured()) {
      const storeSlug = params.get("store") || config.storeId;
      try {
        const supabase = createSupabaseBrowserClient();
        const storeQuery = supabase
          .from("stores")
          .select("store_settings(order_tracking_enabled)");
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            storeSlug,
          );
        const { data: storeData } = await (isUuid
          ? storeQuery.eq("id", storeSlug).maybeSingle()
          : storeQuery.eq("slug", storeSlug).maybeSingle());
        const settingsRow = Array.isArray(storeData?.store_settings)
          ? storeData?.store_settings[0]
          : storeData?.store_settings;
        if (settingsRow?.order_tracking_enabled === false) {
          setTrackingDisabled(true);
          setResults([]);
          return;
        }
        const { data, error } = await supabase.rpc("track_orders_by_phone", {
          store_slug: storeSlug,
          phone: query,
        });
        if (error) throw error;
        const found = ((data || []) as any[]).map(mapTrackedOrder(query));
        setResults(found);
        setExpanded(found[0]?.id || null);
        return;
      } catch {
        setResults([]);
      }
    }
    const found = matchOrders(orders, query);
    setResults(found);
    setExpanded(found[0]?.id || null);
  };

  return (
    <div className="marketing flex min-h-screen flex-col bg-[#f9f9ff] text-[#141b2b]">
      <MarketingHeader />
      <main className="track-orders-page">
        <div className="track-shell">
          <header className="track-heading">
            <span>
              <Package size={24} />
            </span>
            <h1>Track your order</h1>
            <p>Enter your phone number to see all your orders.</p>
          </header>
          <form onSubmit={submit} className="track-search-card">
            <label>
              <Search size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Phone Number"
                inputMode="tel"
              />
            </label>
            <button>Track Orders</button>
          </form>
          {trackingDisabled ? (
            <section className="track-empty">
              <Package size={30} />
              <h2>Order tracking is turned off by this seller.</h2>
              <p>Please contact the seller directly for order updates.</p>
              <Link href={routes.contact}>Contact Seller</Link>
            </section>
          ) : results === null ? (
            <section className="track-empty">
              <Truck size={30} />
              <h2>Your order updates will appear here</h2>
              <p>Use the same phone number you entered when placing your order.</p>
            </section>
          ) : results.length === 0 ? (
            <section className="track-empty">
              <Package size={30} />
              <h2>No orders found for this phone number.</h2>
              <p>Check your number or contact the seller.</p>
              <Link href={routes.contact}>Contact Seller</Link>
            </section>
          ) : (
            <section className="tracking-results">
              <div className="tracking-results-head">
                <div>
                  <h2>
                    {results.length} {results.length === 1 ? "order" : "orders"} found
                  </h2>
                  <p>Orders linked to {query}</p>
                </div>
                <span>{config.storeName}</span>
              </div>
              {results.map((order) => (
                <TrackOrderCard
                  key={order.id}
                  order={order}
                  expanded={expanded === order.id}
                  onToggle={() =>
                    setExpanded(expanded === order.id ? null : order.id)
                  }
                  currency={settings.currency}
                  storeName={config.storeName}
                />
              ))}
            </section>
          )}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

function TrackOrderCard({
  order,
  expanded,
  onToggle,
  currency,
  storeName,
}: {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  currency: StoreSettings["currency"];
  storeName: string;
}) {
  const current = normalizeStatus(order.status);
  const currentIndex = Math.max(0, statusSteps.indexOf(current));
  return (
    <article className={`tracking-order-card ${expanded ? "expanded" : ""}`}>
      <button className="tracking-order-summary" onClick={onToggle}>
        <span
          className="tracking-product-thumb"
          style={{ backgroundImage: `url(${order.productImage || ""})` }}
        >
          {!order.productImage && <Package size={19} />}
        </span>
        <span>
          <small>{order.orderNumber || order.id}</small>
          <b>{order.productName || order.product}</b>
          <em>
            {order.quantity || 1} item{(order.quantity || 1) > 1 ? "s" : ""} ·{" "}
            {order.date}
          </em>
        </span>
        <span className="tracking-order-meta">
          <i>{current}</i>
          <strong>{formatCurrency(order.totalAmount || order.amount, currency)}</strong>
          <small>{storeName}</small>
        </span>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {expanded && (
        <div className="tracking-order-details">
          <div className="tracking-detail-grid">
            <Detail label="Quantity" value={String(order.quantity || 1)} />
            <Detail label="Size" value={order.size || "—"} />
            <Detail label="Color" value={order.color || "—"} />
            <Detail label="Payment" value="Cash on Delivery" />
            <Detail
              label="Delivery Address"
              value={`${order.address || "—"}, ${order.city || ""}`}
              full
            />
            {Object.entries(order.productCustomFields || {}).map(([key, value]) => (
              <Detail key={key} label={pretty(key)} value={String(value) || "—"} />
            ))}
            {Object.entries(order.checkoutCustomFields || {}).map(([key, value]) => (
              <Detail key={key} label={pretty(key)} value={String(value) || "—"} />
            ))}
          </div>
          <div className="tracking-timeline">
            <h3>Order timeline</h3>
            {statusSteps.map((step, index) => (
              <div
                className={`${index <= currentIndex ? "done" : ""} ${
                  index === currentIndex ? "current" : ""
                }`}
                key={step}
              >
                <i>{index <= currentIndex ? <Check size={13} /> : index + 1}</i>
                <span>
                  <b>{step}</b>
                  <small>
                    {timelineTime(order, step) ||
                      (index === currentIndex ? "Current status" : "Pending")}
                  </small>
                </span>
              </div>
            ))}
          </div>
          <div className="tracking-contact">
            <MapPin size={15} />
            <span>
              <b>Need help with this delivery?</b>
              <small>Contact the seller for address or delivery questions.</small>
            </span>
            <Link href={routes.contact}>Contact Seller</Link>
          </div>
        </div>
      )}
    </article>
  );
}

function Detail({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "full" : ""}>
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}
function matchOrders(orders: Order[], query: string) {
  const phone = normalizePhone(query);
  return phone.length < 6
    ? []
    : orders.filter((order) => normalizePhone(order.phone) === phone);
}
function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}
function normalizeStatus(status: Order["status"]) {
  return status === "Pending" ? "Order Received" : status;
}
function timelineTime(order: Order, step: string) {
  return order.timeline?.find((item) => item.label === step)?.timestamp;
}
function pretty(value: string) {
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (x) => x.toUpperCase());
}
function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return String(value);
  if (Array.isArray(value)) return value.map(displayValue).filter(Boolean).join(", ");
  if (typeof value === "object")
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${pretty(key)}: ${displayValue(item)}`)
      .filter((item) => !item.endsWith(": "))
      .join(", ");
  return String(value);
}
function mapTrackedOrder(phone: string) {
  return (row: any): Order => {
    const selected = row.selected_options || {};
    const productFields =
      selected &&
      typeof selected.custom_fields === "object" &&
      !Array.isArray(selected.custom_fields)
        ? selected.custom_fields
        : {};
    return {
      id: row.order_number,
      orderNumber: row.order_number,
      customer: row.customer_name || "Customer",
      customerName: row.customer_name || "Customer",
      initials: "CU",
      phone: row.phone || phone,
      email: row.email || "",
      product: row.product_name,
      productId: row.product_id,
      productName: row.product_name,
      productImage: row.product_image || "",
      date: new Date(row.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      createdAt: row.created_at,
      amount: Number(row.total_amount || 0),
      totalAmount: Number(row.total_amount || 0),
      status: statusToUi[row.status] || "Order Received",
      quantity: row.quantity || 1,
      size: selected.Size || selected.size || "",
      color: selected.Color || selected.color || "",
      variant: [selected.Size || selected.size, selected.Color || selected.color]
        .filter(Boolean)
        .join(" · "),
      city: row.city || "",
      address: row.address || "",
      paymentMethod: "Cash on Delivery",
      productCustomFields: Object.fromEntries(
        Object.entries(productFields).map(([key, value]) => [
          key,
          displayValue(value),
        ]),
      ),
      checkoutCustomFields: Object.fromEntries(
        Object.entries(row.custom_fields || {}).map(([key, value]) => [
          key,
          displayValue(value),
        ]),
      ),
      timeline: (row.timeline || []).map((item: any) => ({
        status: statusToUi[item.status] || "Order Received",
        label: statusToUi[item.status] || "Order Received",
        timestamp: new Date(item.created_at).toLocaleString(),
      })),
    };
  };
}
