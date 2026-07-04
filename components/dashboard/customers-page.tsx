"use client";

import {
  Download,
  Filter,
  Search,
  ShoppingBag,
  StickyNote,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { downloadCsv } from "@/lib/csv";
import { sanitizeMultiline, sanitizeText } from "@/lib/validation";
import type { Customer } from "@/lib/types";
import { DashboardShell } from "./dashboard-shell";
import { useDashboard } from "./dashboard-store";
import { EmptyState, StatusBadge } from "./shared";

const blankFilters = {
  country: "All",
  city: "",
  repeat: "All",
  minSpent: "",
  maxSpent: "",
  minOrders: "",
  maxOrders: "",
};
type CustomerFilters = typeof blankFilters;
export function CustomersPage() {
  const { customers, updateCustomer, toast, formatMoney, addNotification } =
    useDashboard();
  const params = useSearchParams();
  const mobile = useCustomersMobile();
  const perPage = mobile ? 4 : 6;
  const [query, setQuery] = useState(params.get("q") || "");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<CustomerFilters>({
    ...blankFilters,
    repeat: params.get("repeat") === "true" ? "Repeat" : "All",
  });
  const [filters, setFilters] = useState<CustomerFilters>({
    ...blankFilters,
    repeat: params.get("repeat") === "true" ? "Repeat" : "All",
  });
  const [selected, setSelected] = useState<Customer | null>(null);
  const [notes, setNotes] = useState("");
  const [customFields, setCustomFields] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const countries = useMemo(
    () => ["All", ...Array.from(new Set(customers.map((c) => c.country)))],
    [customers],
  );
  const filtered = useMemo(
    () =>
      customers.filter((c) => {
        const search =
          `${c.name} ${c.email} ${c.phone} ${c.city} ${c.country}`.toLowerCase();
        const repeat =
          filters.repeat === "All" ||
          (filters.repeat === "Repeat"
            ? c.isRepeatCustomer
            : !c.isRepeatCustomer);
        return (
          search.includes(query.toLowerCase()) &&
          (filters.country === "All" || c.country === filters.country) &&
          (!filters.city ||
            c.city.toLowerCase().includes(filters.city.toLowerCase())) &&
          repeat &&
          c.totalSpent >= (Number(filters.minSpent) || 0) &&
          (!filters.maxSpent || c.totalSpent <= Number(filters.maxSpent)) &&
          c.ordersCount >= (Number(filters.minOrders) || 0) &&
          (!filters.maxOrders || c.ordersCount <= Number(filters.maxOrders))
        );
      }),
    [customers, query, filters],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );
  const openProfile = (customer: Customer) => {
    setSelected(customer);
    setNotes(customer.notes);
    setCustomFields(
      Object.entries(customer.customFields || {}).map(([label, value]) => ({
        label,
        value: String(value),
      })),
    );
  };
  const clear = () => {
    setQuery("");
    setDraftFilters(blankFilters);
    setFilters(blankFilters);
    setPage(1);
    toast("Customer filters cleared", "info");
  };
  const exportCustomers = (scope: "view" | "all") => {
    const data = scope === "view" ? visible : customers;
    if (!data.length) {
      setExportOpen(false);
      toast("No data available to export.", "error");
      return;
    }
    downloadCsv(
      "orderflow-customers.csv",
      [
        "Customer Name",
        "Email",
        "Phone",
        "Country",
        "City",
        "Address",
        "Orders Count",
        "Total Spent",
        "Average Ticket",
        "Repeat Customer",
        "Notes",
      ],
      data.map((c) => [
        c.name,
        c.email,
        c.phone,
        c.country,
        c.city,
        c.address,
        c.ordersCount,
        c.totalSpent,
        c.avgTicket,
        c.isRepeatCustomer ? "Yes" : "No",
        c.notes,
      ]),
    );
    setExportOpen(false);
    toast("CSV exported successfully.");
    addNotification({
      title: "CSV export completed",
      message: `${data.length} customers were exported.`,
      type: "Export Completed",
      actionUrl: "/dashboard/customers",
    });
  };
  return (
    <DashboardShell
      title="Customers"
      searchPlaceholder="Search customers..."
      searchValue={query}
      onSearchChange={(value) => {
        setQuery(value);
        setPage(1);
      }}
    >
      <div className="subhead">
        <div>
          <h2>Customers</h2>
          <p>Manage {customers.length} active customer records.</p>
        </div>
        <div className="filter-actions">
          <button
            className={`btn-secondary ${filtersOpen ? "active-filter" : ""}`}
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <Filter size={13} />
            Filters
          </button>
          <div className="export-anchor">
            <button
              className="btn-secondary"
              onClick={() => setExportOpen(!exportOpen)}
            >
              <Download size={13} />
              Export
            </button>
            {exportOpen && (
              <div className="export-menu card">
                <button onClick={() => exportCustomers("view")}>
                  Export current view
                </button>
                <button onClick={() => exportCustomers("all")}>
                  Export all customers
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="customer-search-row">
        <label className="searchbar !flex !w-full !max-w-none">
          <Search size={14} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, phone, city, or country..."
          />
        </label>
        {filtersOpen && (
          <CustomersFilters
            value={draftFilters}
            countries={countries}
            onChange={setDraftFilters}
            onApply={() => {
              setFilters(draftFilters);
              setFiltersOpen(false);
              setPage(1);
              toast("Customer filters applied", "info");
            }}
            onReset={() => {
              setDraftFilters(blankFilters);
              setFilters(blankFilters);
              setPage(1);
              toast("Customer filters reset", "info");
            }}
          />
        )}
      </div>
      <section className="panel card">
        {visible.length ? (
          <>
            <table className="data-table desktop">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Location</th>
                  <th>Phone</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => openProfile(c)}
                  >
                    <td>
                      <div className="customer-cell">
                        <span className="customer-avatar">{c.initials}</span>
                        <span>
                          <b>{c.name}</b>
                          <small>{c.email}</small>
                        </span>
                        {c.isRepeatCustomer && (
                          <span className="status status-shipped">Repeat</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {c.city}
                      <br />
                      <small>{c.country}</small>
                    </td>
                    <td>{c.phone}</td>
                    <td>{c.ordersCount}</td>
                    <td>
                      <b>{formatMoney(c.totalSpent)}</b>
                    </td>
                    <td>
                      <button
                        className="text-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          openProfile(c);
                        }}
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mobile-cards">
              {visible.map((c) => (
                <button
                  onClick={() => openProfile(c)}
                  className="mobile-order customer-mobile-card text-left"
                  key={c.id}
                >
                  <div className="mobile-order-top">
                    <b>{c.name}</b>
                    {c.isRepeatCustomer && (
                      <span className="status status-shipped">Repeat</span>
                    )}
                  </div>
                  <p>{c.email}</p>
                  <p>{c.phone}</p>
                  <p>
                    {c.city}, {c.country}
                  </p>
                  <div className="customer-card-metrics">
                    <span>{c.ordersCount} orders</span>
                    <b>{formatMoney(c.totalSpent)}</b>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title="No customers found."
            text="Try changing your search or filters."
            action={
              <button className="btn-primary" onClick={clear}>
                Clear filters
              </button>
            }
          />
        )}
        <CustomerPagination
          page={currentPage}
          pages={pages}
          count={filtered.length}
          perPage={perPage}
          onPage={setPage}
        />
      </section>
      {selected && (
        <CustomerProfile
          customer={selected}
          notes={notes}
          formatMoney={formatMoney}
          onNotes={setNotes}
          customFields={customFields}
          onCustomFields={setCustomFields}
          onClose={() => setSelected(null)}
          onHistory={() => setHistoryCustomer(selected)}
          onSave={() => {
            const safeNotes = sanitizeMultiline(notes, 1000);
            const savedFields = Object.fromEntries(
              customFields
                .filter((field) => field.label.trim())
                .map((field) => [
                  sanitizeText(field.label, 80),
                  sanitizeText(field.value, 300),
                ]),
            );
            updateCustomer(selected.id, {
              notes: safeNotes,
              customFields: savedFields,
            });
            setSelected({
              ...selected,
              notes: safeNotes,
              customFields: savedFields,
            });
            toast("Customer profile saved");
          }}
        />
      )}{" "}
      {historyCustomer && (
        <OrderHistoryModal
          customer={historyCustomer}
          formatMoney={formatMoney}
          onClose={() => setHistoryCustomer(null)}
        />
      )}
    </DashboardShell>
  );
}

function CustomersFilters({
  value,
  countries,
  onChange,
  onApply,
  onReset,
}: {
  value: CustomerFilters;
  countries: string[];
  onChange: (value: CustomerFilters) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const field = (key: keyof CustomerFilters, next: string) =>
    onChange({ ...value, [key]: next });
  return (
    <div className="customer-filters card">
      <div className="filter-sheet-head">
        <b>Customer Filters</b>
        <button onClick={onReset}>Reset</button>
      </div>
      <label>
        Country
        <select
          className="field"
          value={value.country}
          onChange={(e) => field("country", e.target.value)}
        >
          {countries.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      <label>
        City
        <input
          className="field"
          value={value.city}
          onChange={(e) => field("city", e.target.value)}
          placeholder="Any city"
        />
      </label>
      <label>
        Customer Type
        <select
          className="field"
          value={value.repeat}
          onChange={(e) => field("repeat", e.target.value)}
        >
          <option>All</option>
          <option>Repeat</option>
          <option>First-time</option>
        </select>
      </label>
      <div className="filter-pair">
        <label>
          Min Spent
          <input
            className="field"
            inputMode="numeric"
            value={value.minSpent}
            onChange={(e) => field("minSpent", e.target.value)}
          />
        </label>
        <label>
          Max Spent
          <input
            className="field"
            inputMode="numeric"
            value={value.maxSpent}
            onChange={(e) => field("maxSpent", e.target.value)}
          />
        </label>
      </div>
      <div className="filter-pair">
        <label>
          Min Orders
          <input
            className="field"
            inputMode="numeric"
            value={value.minOrders}
            onChange={(e) => field("minOrders", e.target.value)}
          />
        </label>
        <label>
          Max Orders
          <input
            className="field"
            inputMode="numeric"
            value={value.maxOrders}
            onChange={(e) => field("maxOrders", e.target.value)}
          />
        </label>
      </div>
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
function CustomerProfile({
  customer,
  notes,
  formatMoney,
  onNotes,
  customFields,
  onCustomFields,
  onClose,
  onHistory,
  onSave,
}: {
  customer: Customer;
  notes: string;
  formatMoney: (amount: number) => string;
  onNotes: (value: string) => void;
  customFields: Array<{ label: string; value: string }>;
  onCustomFields: (value: Array<{ label: string; value: string }>) => void;
  onClose: () => void;
  onHistory: () => void;
  onSave: () => void;
}) {
  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <aside
        className="detail-drawer customer-detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`${customer.name} profile`}
      >
        <div className="drawer-head">
          <div>
            <span className="eyebrow">Customer profile</span>
            <h2>{customer.name}</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close customer profile"
          >
            <X size={18} />
          </button>
        </div>
        <div className="drawer-body">
          <div className="profile-hero customer-drawer-hero">
            <div className="avatar-large">
              <span>{customer.initials}</span>
            </div>
            <h3>{customer.name}</h3>
            <p>Customer since {customer.createdAt}</p>
            {customer.isRepeatCustomer && (
              <span className="status status-shipped mt-2">
                Repeat Customer
              </span>
            )}
          </div>
          <div className="detail-list">
            <div>
              <span className="customer-detail-icon">@</span>
              <span>
                <small>Email</small>
                <b>{customer.email}</b>
              </span>
            </div>
            <div>
              <span className="customer-detail-icon">#</span>
              <span>
                <small>Phone</small>
                <b>{customer.phone}</b>
              </span>
            </div>
            <div>
              <span className="customer-detail-icon">⌖</span>
              <span>
                <small>Shipping Address</small>
                <b>
                  {customer.address}, {customer.city}, {customer.country}
                </b>
              </span>
            </div>
          </div>
          <div className="customer-metric-grid">
            <div>
              <small>Lifetime Value</small>
              <strong>{formatMoney(customer.totalSpent)}</strong>
            </div>
            <div>
              <small>Order Count</small>
              <strong>{customer.ordersCount}</strong>
            </div>
            <div>
              <small>Average Ticket</small>
              <strong>{formatMoney(customer.avgTicket)}</strong>
            </div>
          </div>
          <div className="profile-section customer-history-preview">
            <div className="profile-section-head">
              <h4>Order History</h4>
              <button className="text-action" onClick={onHistory}>
                View All
              </button>
            </div>
            {customer.orderHistory.slice(0, 3).map((order) => (
              <div className="customer-history-row" key={order.id}>
                <span className="stat-icon">
                  <ShoppingBag size={12} />
                </span>
                <span>
                  <b>{order.id}</b>
                  <small>
                    {order.date} · {order.products}
                  </small>
                </span>
                <span>
                  <b>{formatMoney(order.amount)}</b>
                  <StatusBadge status={order.status} />
                </span>
              </div>
            ))}
          </div>
          <div className="profile-section">
            <h4 className="flex items-center gap-2">
              <StickyNote size={13} />
              Customer Notes
            </h4>
            <textarea
              className="field !pt-3 min-h-28 mt-3"
              value={notes}
              onChange={(e) => onNotes(e.target.value)}
              placeholder="Add private customer notes..."
            />
            <div className="custom-fields-head mt-5">
              <div>
                <h4>Custom Customer Fields</h4>
                <p>Customer type, birthday, Instagram handle, or VIP notes.</p>
              </div>
              <button
                className="btn-secondary"
                onClick={() =>
                  onCustomFields([...customFields, { label: "", value: "" }])
                }
              >
                <Plus size={13} />
                Add Field
              </button>
            </div>
            <div className="grid gap-2 mt-3">
              {customFields.map((field, index) => (
                <div className="customer-custom-row" key={index}>
                  <input
                    className="field"
                    value={field.label}
                    placeholder="Field label"
                    onChange={(e) =>
                      onCustomFields(
                        customFields.map((item, i) =>
                          i === index
                            ? { ...item, label: e.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                  <input
                    className="field"
                    value={field.value}
                    placeholder="Value"
                    onChange={(e) =>
                      onCustomFields(
                        customFields.map((item, i) =>
                          i === index
                            ? { ...item, value: e.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                  <button
                    className="icon-button danger-action"
                    onClick={() =>
                      onCustomFields(customFields.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <button className="btn-primary w-full mt-3" onClick={onSave}>
              Save Customer Profile
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
function OrderHistoryModal({
  customer,
  formatMoney,
  onClose,
}: {
  customer: Customer;
  formatMoney: (amount: number) => string;
  onClose: () => void;
}) {
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-title"
    >
      <div className="modal customer-history-modal">
        <div className="modal-head">
          <div>
            <h2 id="history-title">{customer.name}&apos;s Order History</h2>
            <p>{customer.ordersCount} lifetime orders</p>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close order history"
          >
            <X size={17} />
          </button>
        </div>
        <div className="modal-body customer-history-list">
          {customer.orderHistory.map((order) => (
            <div key={order.id}>
              <span>
                <b>{order.id}</b>
                <small>
                  {order.date} · {order.products}
                </small>
              </span>
              <span>
                <b>{formatMoney(order.amount)}</b>
                <StatusBadge status={order.status} />
              </span>
            </div>
          ))}
        </div>
        <div className="modal-foot">
          <button className="btn-primary ml-auto" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
function CustomerPagination({
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
  const start = count ? (page - 1) * perPage + 1 : 0,
    end = Math.min(page * perPage, count);
  return (
    <div className="table-footer">
      <span>
        Showing {start} to {end} of {count} customers
      </span>
      <div className="pagination">
        <button
          className="page-btn page-word"
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className={`page-btn ${page === n ? "active" : ""}`}
            onClick={() => onPage(n)}
          >
            {n}
          </button>
        ))}
        <button
          className="page-btn page-word"
          disabled={page === pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
function subscribeCustomersMobile(callback: () => void) {
  const media = window.matchMedia("(max-width: 767px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function customersMobileSnapshot() {
  return window.matchMedia("(max-width: 767px)").matches;
}
function useCustomersMobile() {
  return useSyncExternalStore(
    subscribeCustomersMobile,
    customersMobileSnapshot,
    () => false,
  );
}
