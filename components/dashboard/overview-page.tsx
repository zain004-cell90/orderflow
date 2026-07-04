"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Clock3,
  Repeat2,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { routes } from "@/lib/routes";
import { useDashboard } from "./dashboard-store";
import { DashboardShell } from "./dashboard-shell";
import { OrdersTable, StatCard } from "./shared";

export function OverviewPage() {
  const router = useRouter();
  const { orders, customers, addOrder, toast, storeSettings, notifications } = useDashboard();
  const [range, setRange] = useState("today");
  const [custom, setCustom] = useState(false);
  const [testModal, setTestModal] = useState(false);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const pending = orders.filter((x) => x.status === "Pending").length;
  const delivered = orders.filter((x) => x.status === "Delivered").length;
  const repeats = customers.filter((x) => x.isRepeatCustomer).length;
  const createTest = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("customer") || "Test Customer");
    const number =
      Math.max(1041, ...orders.map((o) => Number(o.id.replace(/\D/g, "")))) + 1;
    const id = `ORD-${number}`;
    const now = new Date();
    addOrder({
      id,
      customer: name,
      initials: name
        .split(" ")
        .map((x) => x[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      phone: String(data.get("phone") || "+92 300 0000000"),
      product: String(data.get("product") || "Premium Hoodie"),
      variant: "Black · Medium",
      date: now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      amount: Number(data.get("amount")) || 4500,
      status: "Pending",
      address: "Gulberg III",
      city: "Lahore",
      paymentMethod: "COD",
      quantity: 1,
      notes: "Test order",
      timeline: [
        {
          status: "Received",
          label: "Order Received",
          timestamp: now.toLocaleString("en-PK", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        },
      ],
    });
    setTestModal(false);
    toast(`Test order ${id} created`);
  };
  return (
    <DashboardShell
      title="Dashboard"
      actionLabel="Create Test Order"
      action={() => setTestModal(true)}
    >
      <div className="subhead">
        <div>
          <h2>Overview</h2>
          <p>
            Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>
        <div className="filter-actions">
          <label className="date-filter">
            <CalendarDays size={13} />
            <select
              aria-label="Dashboard date range"
              value={range}
              onChange={(e) => {
                setRange(e.target.value);
                if (e.target.value === "custom") setCustom(true);
              }}
            >
              <option value="today">Today</option>
              <option value="7">7 Days</option>
              <option value="30">30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </label>
          {custom && (
            <div className="date-popover card">
              <b>Custom range</b>
              <label>
                From
                <input type="date" />
              </label>
              <label>
                To
                <input type="date" />
              </label>
              <button
                className="btn-primary"
                onClick={() => {
                  setCustom(false);
                  toast("Custom date range applied");
                }}
              >
                Apply Range
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="stat-grid">
        <StatCard
          onClick={() => router.push(routes.orders)}
          icon={<ShoppingBag size={16} />}
          value={String(orders.length)}
          label="Orders Today"
        />
        <StatCard
          onClick={() => router.push(`${routes.orders}?status=Pending`)}
          icon={<Clock3 size={16} />}
          value={String(pending)}
          label="Pending Orders"
          change="24h"
        />
        <StatCard
          onClick={() => router.push(`${routes.orders}?status=Delivered`)}
          icon={<Truck size={16} />}
          value={String(delivered)}
          label="Delivered Orders"
          change="98%"
        />
        <StatCard
          onClick={() => router.push(`${routes.customers}?repeat=true`)}
          icon={<Repeat2 size={16} />}
          value={`${repeats}/${customers.length}`}
          label="Repeat Customers"
          change="+4.2%"
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel card">
          <div className="panel-head">
            <h3>Recent Orders</h3>
            <Link href={routes.orders}>View All</Link>
          </div>
          <OrdersTable
            orders={orders.slice(0, 4)}
            onView={(o) =>
              router.push(`${routes.orders}?order=${encodeURIComponent(o.id)}`)
            }
          />
        </section>
        <div className="grid gap-4 content-start">
          <section className="panel card">
            <div className="panel-head">
              <h3>Activity</h3>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            </div>
            <div className="activity-list">
              {notifications.length === 0 && (
                <div className="empty-mini">No activity yet.</div>
              )}
              {(activityExpanded ? notifications : notifications.slice(0, 4)).map((item) => (
                <div className="activity" key={item.id}>
                  <span className="activity-dot muted" />
                  <div><strong>{item.title}</strong><p>{item.message}</p><time>{item.createdAt}</time></div>
                </div>
              ))}
              {notifications.length > 4 && (
                <button
                  onClick={() => setActivityExpanded((value) => !value)}
                  className="btn-secondary"
                >
                  {activityExpanded ? "Show recent activity" : "See earlier activity"}
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
      {testModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="test-order-title"
        >
          <form className="modal" onSubmit={createTest}>
            <div className="modal-head">
              <div>
                <h2 id="test-order-title">Create Test Order</h2>
                <p>Create a sample order in your current store.</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setTestModal(false)}
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>
            <div className="modal-body form-grid">
              <label className="form-group">
                <span>Customer</span>
                <input
                  required
                  name="customer"
                  className="field"
                  defaultValue="Test Customer"
                />
              </label>
              <label className="form-group">
                <span>Phone</span>
                <input
                  name="phone"
                  className="field"
                  defaultValue="+92 300 0000000"
                />
              </label>
              <label className="form-group">
                <span>Product</span>
                <input
                  name="product"
                  className="field"
                  defaultValue="Premium Hoodie"
                />
              </label>
              <label className="form-group">
                <span>Amount ({storeSettings.currency})</span>
                <input
                  name="amount"
                  inputMode="numeric"
                  className="field"
                  defaultValue="4500"
                />
              </label>
            </div>
            <div className="modal-foot">
              <button
                type="button"
                className="btn-secondary ml-auto"
                onClick={() => setTestModal(false)}
              >
                Cancel
              </button>
              <button className="btn-primary ml-2">Create Test Order</button>
            </div>
          </form>
        </div>
      )}
    </DashboardShell>
  );
}
