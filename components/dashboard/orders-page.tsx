"use client";

import {
  Download,
  Eye,
  MapPin,
  Package,
  Pencil,
  Phone,
  Printer,
  Search,
  SlidersHorizontal,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  FormEvent,
  MouseEvent,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { Order, OrderStatus, PaymentMethod } from "@/lib/mock-data";
import { downloadCsv } from "@/lib/csv";
import {
  sanitizeMultiline,
  sanitizePhone,
  sanitizeText,
} from "@/lib/validation";
import { DashboardShell } from "./dashboard-shell";
import { orderStatuses, useDashboard } from "./dashboard-store";
import { EmptyState, StatusBadge } from "./shared";
import { ProfileCompletionModal } from "./profile-gate";
import { PlanLimitModal, useOrderLimit } from "./plan-limit";

const statusFilters = ["All", ...orderStatuses] as const;
const paymentMethods: PaymentMethod[] = [
  "COD",
  "Bank Transfer",
  "JazzCash",
  "Easypaisa",
];
const blankFilters = {
  dateRange: "All Time",
  min: "",
  max: "",
  city: "",
  payment: "All",
};
type FilterState = typeof blankFilters;

export function OrdersPage() {
  const {
    orders,
    addOrder,
    updateOrder,
    deleteOrder,
    askConfirm,
    toast,
    addNotification,
    storeSettings,
  } = useDashboard();
  const params = useSearchParams();
  const mobile = useMobile();
  const perPage = mobile ? 3 : 5;
  const initialStatus = params.get("status");
  const [statusFilter, setStatusFilter] = useState(
    initialStatus &&
      statusFilters.includes(initialStatus as (typeof statusFilters)[number])
      ? initialStatus
      : "All",
  );
  const [query, setQuery] = useState(params.get("q") || "");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<FilterState>(blankFilters);
  const [filters, setFilters] = useState<FilterState>(blankFilters);
  const initialOrder = params.get("order");
  const [selected, setSelected] = useState<Order | null>(
    () => orders.find((o) => o.id === initialOrder) || null,
  );
  const [editing, setEditing] = useState<Order | null>(null);
  const [creating, setCreating] = useState(
    params.get("create") === "true" && Boolean(storeSettings.storeName.trim()),
  );
  const [profileGate, setProfileGate] = useState(
    params.get("create") === "true" && !storeSettings.storeName.trim(),
  );
  const [limitOpen, setLimitOpen] = useState(false);
  const orderLimit = useOrderLimit(orders);
  const startCreate = () => {
    if (!storeSettings.storeName.trim()) {
      setProfileGate(true);
      return;
    }
    if (orderLimit.reached) {
      setLimitOpen(true);
      return;
    }
    setCreating(true);
  };
  useEffect(() => {
    if (params.get("create") !== "true" || !orderLimit.reached) return;
    const timer = window.setTimeout(() => {
      setCreating(false);
      setLimitOpen(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [params, orderLimit.reached]);
  useEffect(() => {
    if (!initialOrder) return;
    const timer = window.setTimeout(() => {
      const match = orders.find((order) => order.id === initialOrder);
      if (match) setSelected(match);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialOrder, orders]);

  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        const search =
          `${order.id} ${order.customer} ${order.phone} ${order.product} ${order.city || ""} ${order.status}`.toLowerCase();
        const amount =
          order.amount >= (Number(filters.min) || 0) &&
          (!filters.max || order.amount <= Number(filters.max));
        const city =
          !filters.city ||
          order.city?.toLowerCase().includes(filters.city.toLowerCase());
        const payment =
          filters.payment === "All" || order.paymentMethod === filters.payment;
        return (
          (statusFilter === "All" || order.status === statusFilter) &&
          search.includes(query.toLowerCase()) &&
          amount &&
          city &&
          payment &&
          matchesDate(order.date, filters.dateRange)
        );
      }),
    [orders, statusFilter, query, filters],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );
  const clearFilters = () => {
    setQuery("");
    setStatusFilter("All");
    setDraftFilters(blankFilters);
    setFilters(blankFilters);
    setPage(1);
  };
  const changeStatus = (order: Order, status: OrderStatus) => {
    const timeline = [
      ...(order.timeline || []),
      {
        status,
        label: status,
        timestamp: new Date().toLocaleString("en-PK", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      },
    ];
    updateOrder(order.id, { status, timeline });
    setSelected((v) => (v?.id === order.id ? { ...v, status, timeline } : v));
    toast("Order status updated");
  };
  const saveOrder = (values: OrderFormValues, existing?: Order) => {
    if (existing) {
      const changed = existing.status !== values.status;
      const timeline = changed
        ? [
            ...(existing.timeline || []),
            {
              status: values.status,
              label: values.status,
              timestamp: new Date().toLocaleString("en-PK", {
                dateStyle: "medium",
                timeStyle: "short",
              }),
            },
          ]
        : existing.timeline;
      updateOrder(existing.id, { ...values, timeline });
      setSelected((v) =>
        v?.id === existing.id ? { ...v, ...values, timeline } : v,
      );
      setEditing(null);
      toast("Order updated successfully");
      return;
    }
    const number =
      Math.max(1041, ...orders.map((o) => Number(o.id.replace(/\D/g, "")))) + 1;
    const id = `ORD-${number}`;
    const initials = values.customer
      .split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const now = new Date();
    const timeline = [
      {
        status: "Received" as const,
        label: "Order Received",
        timestamp: now.toLocaleString("en-PK", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      },
      ...(values.status !== "Pending"
        ? [
            {
              status: values.status,
              label: values.status,
              timestamp: now.toLocaleString("en-PK", {
                dateStyle: "medium",
                timeStyle: "short",
              }),
            },
          ]
        : []),
    ];
    addOrder({
      id,
      initials,
      date: now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      ...values,
      timeline,
    });
    setCreating(false);
    setStatusFilter("All");
    setPage(1);
    toast("Order created successfully");
  };
  const remove = (order: Order) =>
    askConfirm({
      title: "Delete order?",
      message: "This action cannot be undone.",
      confirmLabel: "Delete Order",
      destructive: true,
      action: () => {
        deleteOrder(order.id);
        setSelected(null);
        setEditing(null);
        toast("Order deleted");
      },
    });
  const exportCsv = (scope: "current" | "all") => {
    const source = scope === "current" ? visible : orders;
    if (!source.length) {
      toast("No data available to export.", "error");
      return;
    }
    downloadCsv(
      "orderflow-orders.csv",
      [
        "Order ID",
        "Customer",
        "Phone",
        "Product",
        "Variant",
        "Quantity",
        "Amount",
        "Status",
        "Date",
        "Address",
        "City",
        "Payment Method",
        "Notes",
      ],
      source.map((o) => [
        o.id,
        o.customer,
        o.phone,
        o.product,
        o.variant || "",
        o.quantity || 1,
        o.amount,
        o.status,
        o.date,
        o.address || "",
        o.city || "",
        o.paymentMethod || "",
        o.notes || "",
      ]),
    );
    toast("CSV exported successfully.");
    addNotification({
      title: "CSV export completed",
      message: `${source.length} orders were exported.`,
      type: "Export Completed",
      actionUrl: "/dashboard/orders",
    });
  };

  return (
    <DashboardShell
      title="Orders"
      searchPlaceholder="Search orders..."
      searchValue={query}
      onSearchChange={(value) => {
        setQuery(value);
        setPage(1);
      }}
      actionLabel="Create Order"
      action={startCreate}
    >
      <div className="filter-row">
        <div className="tabs">
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`tab ${statusFilter === status ? "active" : ""}`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="filter-actions">
          <button
            className={`btn-secondary ${filtersOpen ? "active-filter" : ""}`}
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal size={13} />
            More Filters
          </button>
          <div className="export-anchor">
            <button className="btn-secondary">
              <Download size={13} />
              Export CSV
            </button>
            <div className="export-menu card">
              <button onClick={() => exportCsv("current")}>
                Export current view
              </button>
              <button onClick={() => exportCsv("all")}>Export all data</button>
            </div>
          </div>
        </div>
      </div>
      <div className="orders-search-row">
        <label className="searchbar !flex">
          <Search size={14} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by order, customer, phone, product, city, or status..."
          />
        </label>
        {filtersOpen && (
          <OrdersFilters
            value={draftFilters}
            onChange={setDraftFilters}
            onApply={() => {
              setFilters(draftFilters);
              setFiltersOpen(false);
              setPage(1);
              toast("Order filters applied", "info");
            }}
            onReset={() => {
              setDraftFilters(blankFilters);
              setFilters(blankFilters);
              setPage(1);
              toast("Order filters reset", "info");
            }}
          />
        )}
      </div>
      <section className="panel card">
        {visible.length ? (
          <OrdersList
            orders={visible}
            onView={setSelected}
            onEdit={setEditing}
            onDelete={remove}
            onStatus={changeStatus}
          />
        ) : (
          <EmptyState
            title="No orders found."
            text="Try changing your search or filters."
            action={
              <button className="btn-primary" onClick={clearFilters}>
                Clear filters
              </button>
            }
          />
        )}
        <Pagination
          page={currentPage}
          pages={pageCount}
          count={filtered.length}
          perPage={perPage}
          onPage={setPage}
        />
      </section>
      <ProfileCompletionModal
        open={profileGate}
        onClose={() => setProfileGate(false)}
      />
      <PlanLimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        used={orderLimit.used}
        limit={orderLimit.limit}
        plan={orderLimit.plan}
      />
      {creating && (
        <OrderFormModal
          title="Create Order"
          onClose={() => setCreating(false)}
          onSave={(values) => saveOrder(values)}
        />
      )}{" "}
      {editing && (
        <OrderFormModal
          title="Edit Order"
          order={editing}
          onClose={() => setEditing(null)}
          onSave={(values) => saveOrder(values, editing)}
        />
      )}{" "}
      {selected && (
        <OrderDetailsDrawer
          order={selected}
          onClose={() => setSelected(null)}
          onEdit={() => {
            setEditing(selected);
            setSelected(null);
          }}
          onStatus={(status) => changeStatus(selected, status)}
        />
      )}
    </DashboardShell>
  );
}

function OrdersFilters({
  value,
  onChange,
  onApply,
  onReset,
}: {
  value: FilterState;
  onChange: (value: FilterState) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const field = (key: keyof FilterState, next: string) =>
    onChange({ ...value, [key]: next });
  return (
    <div className="advanced-filters orders-filters card">
      <label>
        Date Range
        <select
          className="field"
          value={value.dateRange}
          onChange={(e) => field("dateRange", e.target.value)}
        >
          <option>Today</option>
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>All Time</option>
        </select>
      </label>
      <div className="filter-pair">
        <label>
          Min Amount
          <input
            className="field"
            inputMode="numeric"
            value={value.min}
            onChange={(e) => field("min", e.target.value)}
            placeholder="0"
          />
        </label>
        <label>
          Max Amount
          <input
            className="field"
            inputMode="numeric"
            value={value.max}
            onChange={(e) => field("max", e.target.value)}
            placeholder="No maximum"
          />
        </label>
      </div>
      <label>
        City
        <input
          className="field"
          value={value.city}
          onChange={(e) => field("city", e.target.value)}
          placeholder="Lahore, Karachi..."
        />
      </label>
      <label>
        Payment Method
        <select
          className="field"
          value={value.payment}
          onChange={(e) => field("payment", e.target.value)}
        >
          <option>All</option>
          {paymentMethods.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      <div className="filter-buttons">
        <button className="btn-secondary" onClick={onReset}>
          Reset Filters
        </button>
        <button className="btn-primary" onClick={onApply}>
          Apply Filters
        </button>
      </div>
    </div>
  );
}

function OrdersList({
  orders,
  onView,
  onEdit,
  onDelete,
  onStatus,
}: {
  orders: Order[];
  onView: (o: Order) => void;
  onEdit: (o: Order) => void;
  onDelete: (o: Order) => void;
  onStatus: (o: Order, s: OrderStatus) => void;
}) {
  const { formatMoney } = useDashboard();
  return (
    <>
      <table className="data-table desktop">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Product</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="cursor-pointer" onClick={() => onView(o)}>
              <td className="order-id">{o.id}</td>
              <td>
                <b>{o.customer}</b>
                <br />
                <span className="text-[8px] text-gray-400">{o.phone}</span>
              </td>
              <td>
                {o.product}
                <br />
                <span className="text-[8px] text-gray-400">
                  {o.variant} · Qty {o.quantity || 1}
                </span>
              </td>
              <td>{o.date}</td>
              <td>
                <b>{formatMoney(o.amount)}</b>
              </td>
              <td>
                <select
                  onClick={stop}
                  aria-label={`Status for ${o.id}`}
                  value={o.status}
                  onChange={(e) => onStatus(o, e.target.value as OrderStatus)}
                  className={`status status-${o.status.toLowerCase().replaceAll(" ", "-")} border-0 outline-0`}
                >
                  {orderStatuses.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </td>
              <td>
                <OrderActions
                  order={o}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mobile-cards">
        {orders.map((o) => (
          <article
            className="mobile-order"
            key={o.id}
            onClick={() => onView(o)}
          >
            <div className="mobile-order-top">
              <span className="order-id">{o.id}</span>
              <OrderStatusBadge status={o.status} />
            </div>
            <b className="text-xs block mt-3">{o.customer}</b>
            <p>{o.phone}</p>
            <p>
              {o.product} · {o.variant}
            </p>
            <p>
              <b>{formatMoney(o.amount)}</b> · Qty {o.quantity || 1}
            </p>
            <p>{o.date}</p>
            <div className="mobile-card-actions" onClick={stop}>
              <button
                type="button"
                className="btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(o);
                }}
              >
                View
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(o);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(o);
                }}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
function OrderActions({
  order,
  onView,
  onEdit,
  onDelete,
}: {
  order: Order;
  onView: (o: Order) => void;
  onEdit: (o: Order) => void;
  onDelete: (o: Order) => void;
}) {
  return (
    <div className="row-actions">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onView(order);
        }}
        aria-label={`View ${order.id}`}
      >
        <Eye size={13} />
        <span>View</span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(order);
        }}
        aria-label={`Edit ${order.id}`}
      >
        <Pencil size={13} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(order);
        }}
        aria-label={`Delete ${order.id}`}
        className="danger-action"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <StatusBadge status={status} />;
}

type OrderFormValues = {
  customer: string;
  phone: string;
  product: string;
  variant: string;
  quantity: number;
  amount: number;
  address: string;
  city: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  notes: string;
  checkoutCustomFields: Record<string, string>;
};
function OrderFormModal({
  title,
  order,
  onClose,
  onSave,
}: {
  title: string;
  order?: Order;
  onClose: () => void;
  onSave: (values: OrderFormValues) => void;
}) {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    onSave({
      customer: sanitizeText(d.get("customer"), 80),
      phone: sanitizePhone(d.get("phone")),
      product: sanitizeText(d.get("product"), 100),
      variant: sanitizeText(d.get("variant"), 100),
      quantity: Number(d.get("quantity")) || 1,
      amount: Number(d.get("amount")) || 0,
      address: sanitizeMultiline(d.get("address"), 300),
      city: sanitizeText(d.get("city"), 80),
      paymentMethod: String(d.get("paymentMethod")) as PaymentMethod,
      status: String(d.get("status")) as OrderStatus,
      notes: sanitizeMultiline(d.get("notes"), 1000),
      checkoutCustomFields: Object.fromEntries(
        [
          "Delivery Instructions",
          "Alternate Phone",
          "Landmark",
          "Instagram Username",
          "Preferred Delivery Date",
        ]
          .map((label) => [label, sanitizeText(d.get(`custom-${label}`), 300)])
          .filter(([, value]) => value),
      ),
    });
  };
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-form-title"
    >
      <form className="modal order-form-modal" onSubmit={submit}>
        <div className="modal-head">
          <div>
            <h2 id="order-form-title">{title}</h2>
            <p>{order ? `Update ${order.id}.` : "Add a new customer order."}</p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>
        <div className="modal-body form-grid">
          <FormField label="Customer Name">
            <input
              required
              name="customer"
              className="field"
              defaultValue={order?.customer}
            />
          </FormField>
          <FormField label="Phone Number">
            <input
              required
              name="phone"
              className="field"
              defaultValue={order?.phone}
            />
          </FormField>
          <FormField label="Product">
            <input
              required
              name="product"
              className="field"
              defaultValue={order?.product}
            />
          </FormField>
          <FormField label="Variant">
            <input
              name="variant"
              className="field"
              defaultValue={order?.variant}
            />
          </FormField>
          <FormField label="Quantity">
            <input
              required
              name="quantity"
              className="field"
              inputMode="numeric"
              min="1"
              defaultValue={order?.quantity || 1}
            />
          </FormField>
          <FormField label="Amount">
            <input
              required
              name="amount"
              className="field"
              inputMode="numeric"
              min="0"
              defaultValue={order?.amount}
            />
          </FormField>
          <FormField label="Address" full>
            <input
              name="address"
              className="field"
              defaultValue={order?.address}
            />
          </FormField>
          <FormField label="City">
            <input name="city" className="field" defaultValue={order?.city} />
          </FormField>
          <FormField label="Payment Method">
            <select
              name="paymentMethod"
              className="field"
              defaultValue={order?.paymentMethod || "COD"}
            >
              {paymentMethods.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Status">
            <select
              name="status"
              className="field"
              defaultValue={order?.status || "Pending"}
            >
              {orderStatuses.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Notes" full>
            <textarea
              name="notes"
              className="field !pt-3 min-h-24"
              defaultValue={order?.notes}
            />
          </FormField>
          <div className="custom-fields-section full">
            <div className="custom-fields-head">
              <div>
                <h3>Custom Order Fields</h3>
                <p>Optional fulfillment and customer details.</p>
              </div>
            </div>
            <div className="form-grid">
              {[
                "Delivery Instructions",
                "Alternate Phone",
                "Landmark",
                "Instagram Username",
                "Preferred Delivery Date",
              ].map((label) => (
                <FormField key={label} label={label}>
                  <input
                    name={`custom-${label}`}
                    type={label === "Preferred Delivery Date" ? "date" : "text"}
                    className="field"
                    defaultValue={String(
                      order?.checkoutCustomFields?.[label] || "",
                    )}
                  />
                </FormField>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button
            type="button"
            className="btn-secondary ml-auto"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="btn-primary ml-2">
            {order ? "Save Changes" : "Create Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
function FormField({
  label,
  full = false,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`form-group ${full ? "full" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function OrderDetailsDrawer({
  order,
  onClose,
  onEdit,
  onStatus,
}: {
  order: Order;
  onClose: () => void;
  onEdit: () => void;
  onStatus: (status: OrderStatus) => void;
}) {
  const { formatMoney } = useDashboard();
  const next = nextStatus(order.status);
  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <aside
        className="detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-drawer-title"
      >
        <div className="drawer-head">
          <div>
            <span className="eyebrow">Order details</span>
            <h2 id="order-drawer-title">{order.id}</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close order details"
          >
            <X size={18} />
          </button>
        </div>
        <div className="drawer-body">
          <div className="order-summary-card">
            <OrderStatusBadge status={order.status} />
            <strong>{formatMoney(order.amount)}</strong>
            <small>{order.date}</small>
          </div>
          <div className="detail-list">
            <Detail
              icon={<UserRound size={16} />}
              label="Customer"
              value={order.customer}
            />
            <Detail
              icon={<Phone size={16} />}
              label="Phone"
              value={order.phone}
            />
            <Detail
              icon={<Package size={16} />}
              label="Product"
              value={`${order.quantity || 1} × ${order.product} · ${order.variant || "Standard"}`}
            />
            <Detail
              icon={<MapPin size={16} />}
              label="Address"
              value={`${order.address || "—"}, ${order.city || "—"}`}
            />
          </div>
          <div className="drawer-info-grid">
            <span>
              <small>Payment Method</small>
              <b>{order.paymentMethod || "COD"}</b>
            </span>
            <span>
              <small>Order Date</small>
              <b>{order.date}</b>
            </span>
            <span className="full">
              <small>Notes</small>
              <b>{order.notes || "No notes added."}</b>
            </span>
          </div>
          {order.checkoutCustomFields &&
            Object.keys(order.checkoutCustomFields).length > 0 && (
              <div className="product-custom-summary">
                <h3>Custom Order Fields</h3>
                {Object.entries(order.checkoutCustomFields).map(
                  ([label, value]) => (
                    <div key={label}>
                      <span>
                        <b>{label}</b>
                        <small>{String(value)}</small>
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}
          <div className="timeline">
            <h3>Status Timeline</h3>
            {timelineSteps(order).map((item, i) => (
              <div
                className={`timeline-record ${item.done ? "done" : ""}`}
                key={item.label}
              >
                <i>{item.done ? "✓" : i + 1}</i>
                <span>
                  <b>{item.label}</b>
                  <small>{item.timestamp || "Pending"}</small>
                </span>
              </div>
            ))}
          </div>
          <div className="drawer-actions drawer-actions-wrap">
            <button className="btn-secondary" onClick={onEdit}>
              Edit Order
            </button>
            <button
              className="btn-secondary"
              disabled={!next}
              onClick={() => next && onStatus(next)}
            >
              Update Status
            </button>
            <button className="btn-secondary" onClick={() => window.print()}>
              <Printer size={14} />
              Print
            </button>
            <button className="btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      {icon}
      <span>
        <small>{label}</small>
        <b>{value}</b>
      </span>
    </div>
  );
}
function Pagination({
  page,
  pages,
  count,
  perPage,
  onPage,
}: {
  page: number;
  pages: number;
  count: number;
  perPage: number;
  onPage: (page: number) => void;
}) {
  const start = count ? (page - 1) * perPage + 1 : 0;
  const end = Math.min(page * perPage, count);
  return (
    <div className="table-footer">
      <span>
        Showing {start} to {end} of {count} orders
      </span>
      <div className="pagination">
        <button
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          className="page-btn page-word"
        >
          Previous
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onPage(n)}
            className={`page-btn ${page === n ? "active" : ""}`}
          >
            {n}
          </button>
        ))}
        <button
          disabled={page === pages}
          onClick={() => onPage(page + 1)}
          className="page-btn page-word"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function matchesDate(date: string, range: string) {
  if (range === "All Time") return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  const days = Math.floor((today.getTime() - value.getTime()) / 86400000);
  return range === "Today"
    ? days === 0
    : range === "Last 7 Days"
      ? days >= 0 && days < 7
      : days >= 0 && days < 30;
}
function timelineSteps(order: Order) {
  const steps = [
    "Order Received",
    "Confirmed",
    "Packed",
    "Shipped",
    "Delivered",
  ];
  return steps.map((label) => {
    const item = (order.timeline || []).find((x) => x.label === label);
    return { label, timestamp: item?.timestamp, done: Boolean(item) };
  });
}
function nextStatus(status: OrderStatus): OrderStatus | null {
  if (status === "Pending") return "Confirmed";
  const flow: OrderStatus[] = [
    "Order Received",
    "Confirmed",
    "Packed",
    "Shipped",
    "Delivered",
  ];
  const index = flow.indexOf(status);
  return index >= 0 && index < flow.length - 1 ? flow[index + 1] : null;
}
function stop(e: MouseEvent) {
  e.stopPropagation();
}
function subscribeMobile(callback: () => void) {
  const media = window.matchMedia("(max-width: 767px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function getMobile() {
  return window.matchMedia("(max-width: 767px)").matches;
}
function useMobile() {
  return useSyncExternalStore(subscribeMobile, getMobile, () => false);
}
