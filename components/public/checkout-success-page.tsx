/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Check,
  CheckCircle2,
  PackageCheck,
  Printer,
  Store,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/formatters";
import { defaultCheckoutConfig } from "@/lib/mock-data";
import { readCheckoutConfig, readOrders, readSettings } from "@/lib/storage";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { statusToUi } from "@/lib/supabase/mappers";
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
const nextSteps = [
  { label: "Order Received", icon: CheckCircle2 },
  { label: "Seller Confirms", icon: Check },
  { label: "Packed", icon: PackageCheck },
  { label: "Shipped", icon: Truck },
  { label: "Delivered", icon: CheckCircle2 },
];

export function CheckoutSuccessPage() {
  const params = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [config, setConfig] = useState<CheckoutConfig>(defaultCheckoutConfig);
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const id =
        params.get("orderId") ||
        window.sessionStorage.getItem("orderflow.last-order");
      const store = params.get("store");
      const phone = params.get("phone");
      setConfig(readCheckoutConfig(defaultCheckoutConfig));
      setSettings(readSettings(initialSettings));
      if (isSupabaseConfigured() && store && phone) {
        const supabase = createSupabaseBrowserClient();
        supabase
          .rpc("track_orders_by_phone", { store_slug: store, phone })
          .then(({ data }) => {
            const row = ((data || []) as any[]).find(
              (item) => item.order_number === id,
            );
            setOrder(row ? mapTrackedOrder(row, store, phone) : null);
          });
        return;
      }
      const orders = readOrders([]);
      setOrder(orders.find((item) => (item.orderNumber || item.id) === id) || null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [params]);

  const receipt = () => {
    setMessage("Receipt ready to print.");
    window.setTimeout(() => window.print(), 120);
  };

  if (!order)
    return (
      <main className="checkout-success-page">
        <section className="success-card">
          <Store size={30} />
          <h1>Order not found</h1>
          <p>We could not load this receipt. Track your order using your phone number.</p>
          <Link className="public-confirm-button" href="/track">
            Track My Order
          </Link>
        </section>
      </main>
    );

  const productFields = Object.entries(order.productCustomFields || {});
  const checkoutFields = Object.entries(order.checkoutCustomFields || {});
  const storeLink = order.storeId || config.storeId;

  return (
    <main className="checkout-success-page">
      <div className="success-shell">
        <header className="success-hero">
          <span>
            <Check size={38} />
          </span>
          <h1>Order received successfully.</h1>
          <p>{config.thankYouMessage}</p>
        </header>
        <div className="success-grid">
          <section className="success-card order-receipt">
            <div className="receipt-head">
              <div>
                <small>Order ID</small>
                <h2>{order.orderNumber || order.id}</h2>
              </div>
              <span>{order.status}</span>
            </div>
            <div className="receipt-store">
              {config.logo ? (
                <i style={{ backgroundImage: `url(${config.logo})` }} />
              ) : (
                <i>
                  <Store size={16} />
                </i>
              )}
              <b>{config.storeName}</b>
            </div>
            <div className="receipt-product">
              {order.productImage ? (
                <span style={{ backgroundImage: `url(${order.productImage})` }} />
              ) : (
                <span>
                  <PackageCheck size={24} />
                </span>
              )}
              <div>
                <b>{order.productName || order.product}</b>
                <small>Quantity: {order.quantity || 1}</small>
              </div>
              <strong>
                {formatCurrency(order.totalAmount || order.amount, settings.currency)}
              </strong>
            </div>
            <dl className="receipt-details">
              <Receipt label="Customer" value={order.customerName || order.customer} />
              <Receipt label="Phone" value={order.phone} />
              {order.email && <Receipt label="Email" value={order.email} />}
              <Receipt label="Size" value={order.size || "—"} />
              <Receipt label="Color" value={order.color || "—"} />
              {productFields.map(([key, value]) => (
                <Receipt
                  key={key}
                  label={fieldLabel(key, config, order)}
                  value={String(value) || "—"}
                />
              ))}
              {checkoutFields.map(([key, value]) => (
                <Receipt
                  key={key}
                  label={config.customFields.find((item) => item.id === key)?.label || key}
                  value={String(value) || "—"}
                />
              ))}
              <Receipt label="City" value={order.city || "—"} />
              <Receipt label="Address" value={order.address || "—"} />
              <Receipt label="Payment Method" value="Cash on Delivery" />
              <Receipt label="Status" value={order.status} />
            </dl>
            <div className="receipt-total">
              <span>Total Amount</span>
              <strong>
                {formatCurrency(order.totalAmount || order.amount, settings.currency)}
              </strong>
            </div>
          </section>
          <aside className="success-side">
            <section className="success-card">
              <h3>What happens next?</h3>
              <div className="next-steps">
                {nextSteps.map((step, index) => (
                  <div className={index === 0 ? "active" : ""} key={step.label}>
                    <i>
                      <step.icon size={15} />
                    </i>
                    <span>
                      <b>{step.label}</b>
                      <small>
                        {index === 0
                          ? "Your order is now with the seller."
                          : "You will see this update when completed."}
                      </small>
                    </span>
                  </div>
                ))}
              </div>
            </section>
            <div className="success-actions">
              {config.trackingEnabled && (
                <Link
                  className="public-confirm-button"
                  href={`/track?phone=${encodeURIComponent(order.phone)}&store=${encodeURIComponent(storeLink)}`}
                >
                  Track My Order
                </Link>
              )}
              <Link className="success-secondary" href={`/checkout/${storeLink}`}>
                Back to Store
              </Link>
              <button className="success-secondary" onClick={receipt}>
                <Printer size={15} />
                Download / Print Receipt
              </button>
              {message && <small className="success-message">{message}</small>}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function mapTrackedOrder(row: any, store: string, phone: string): Order {
  const status = statusToUi[row.status] || "Order Received";
  const selected = row.selected_options || {};
  const productCustomFields =
    selected && typeof selected.custom_fields === "object" && !Array.isArray(selected.custom_fields)
      ? selected.custom_fields
      : {};
  return {
    id: row.order_number,
    orderNumber: row.order_number,
    storeId: store,
    customer: row.customer_name || "Customer",
    customerName: row.customer_name || "Customer",
    initials: initials(row.customer_name || "Customer"),
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
    status,
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
      Object.entries(productCustomFields).map(([key, value]) => [
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
}
function Receipt({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
function fieldLabel(id: string, config: CheckoutConfig, order: Order) {
  const checkoutLabel = config.customFields.find((item) => item.id === id)?.label;
  if (checkoutLabel) return checkoutLabel;
  return Object.keys(order.productCustomFields || {}).includes(id) ? pretty(id) : id;
}
function pretty(value: string) {
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) return value.map(displayValue).filter(Boolean).join(", ");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${pretty(key)}: ${displayValue(item)}`)
      .filter((item) => !item.endsWith(": "))
      .join(", ");
  }
  return String(value);
}
