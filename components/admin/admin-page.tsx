"use client";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  Download,
  Mail,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useDashboard } from "@/components/dashboard/dashboard-store";
import { downloadCsv } from "@/lib/csv";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  readContactSubmissions,
  storageKeys,
  writeStorage,
} from "@/lib/storage";
import type {
  AccountStatus,
  ContactSubmission,
  ContactSubmissionStatus,
  MockUser,
  UserPlan,
} from "@/lib/types";

type AdminTab = "overview" | "users" | "stores" | "messages" | "analytics";
const plans: UserPlan[] = ["Free", "Starter", "Growth"];
const statuses: AccountStatus[] = ["Active", "Suspended", "Blocked", "Deleted"];
const messageStatuses: ContactSubmissionStatus[] = [
  "New",
  "Read",
  "Replied",
  "Archived",
];
export function AdminPage() {
  // Protected by the server route; this client UI manages admin-only data/actions.
  const { user, users, stores, updateUser, deleteUser } = useAuth();
  const { toast, askConfirm, addNotification } = useDashboard();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState("All");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState<MockUser | null>(null);
  const [messages, setMessages] = useState<ContactSubmission[]>([]);
  const [messageStatus, setMessageStatus] = useState("All");
  const [selectedMessage, setSelectedMessage] =
    useState<ContactSubmission | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const filtered = useMemo(
    () =>
      users.filter(
        (item) =>
          `${item.name} ${item.email} ${item.country}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (plan === "All" || item.plan === plan) &&
          (status === "All" || item.status === status),
      ),
    [users, query, plan, status],
  );
  const totals = useMemo(
    () => ({
      users: users.filter((x) => x.status !== "Deleted").length,
      orders: stores.reduce((sum, x) => sum + x.orders, 0),
      products: stores.reduce((sum, x) => sum + x.products, 0),
      customers: stores.reduce((sum, x) => sum + x.customers, 0),
      activeStores: stores.filter((x) => x.status === "Active").length,
      messages: messages.filter((x) => x.status !== "Archived").length,
      newMessages: messages.filter((x) => x.status === "New").length,
    }),
    [users, stores, messages],
  );
  const filteredMessages = useMemo(
    () =>
      messages.filter(
        (item) =>
          `${item.fullName} ${item.email} ${item.subject} ${item.message}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (messageStatus === "All" || item.status === messageStatus),
      ),
    [messages, messageStatus, query],
  );
  const loadMessages = async () => {
    setLoadingMessages(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("contact_submissions")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setMessages((data || []).map(mapContactSubmission));
      } else {
        setMessages(readContactSubmissions([]));
      }
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Could not load messages.",
        "error",
      );
      setMessages(readContactSubmissions([]));
    } finally {
      setLoadingMessages(false);
    }
  };
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMessages();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const save = (
    target: MockUser,
    patch: Partial<Pick<MockUser, "plan" | "status" | "role">>,
  ) => {
    if (target.id === user?.id && patch.status && patch.status !== "Active") {
      toast("You cannot restrict your own administrator account.", "error");
      return;
    }
    if (target.id === user?.id && patch.role && patch.role !== "admin") {
      toast("You cannot remove your own admin access.", "error");
      return;
    }
    updateUser(target.id, patch);
    setSelected((value) =>
      value?.id === target.id ? { ...value, ...patch } : value,
    );
    toast("User account updated");
    addNotification({
      title: "Admin account updated",
      message: `${target.email} was updated.`,
      type: "Settings Updated",
      actionUrl: "/admin",
    });
  };
  const remove = (target: MockUser) => {
    if (target.id === user?.id) {
      toast("You cannot delete your own administrator account.", "error");
      return;
    }
    askConfirm({
      title: "Delete user?",
      message: `${target.email} will lose access. This is a mock soft delete.`,
      confirmLabel: "Delete User",
      destructive: true,
      action: () => {
        deleteUser(target.id);
        setSelected(null);
        toast("User deleted");
      },
    });
  };
  const exportUsers = () => {
    if (!filtered.length) {
      toast("No data available to export.", "error");
      return;
    }
    downloadCsv(
      "orderflow-admin-users.csv",
      [
        "Name",
        "Email",
        "Role",
        "Plan",
        "Status",
        "Country",
        "Orders",
        "Products",
        "Customers",
      ],
      filtered.map((item) => [
        item.name,
        item.email,
        item.role,
        item.plan,
        item.status,
        item.country,
        item.ordersUsed,
        item.productsUsed,
        item.customersUsed,
      ]),
    );
    toast("CSV exported successfully.");
    addNotification({
      title: "CSV export completed",
      message: `${filtered.length} admin users were exported.`,
      type: "Export Completed",
      actionUrl: "/admin",
    });
  };
  const updateMessageStatus = async (
    target: ContactSubmission,
    nextStatus: ContactSubmissionStatus,
  ) => {
    const nextMessages = messages.map((item) =>
      item.id === target.id
        ? { ...item, status: nextStatus, updatedAt: new Date().toISOString() }
        : item,
    );
    setMessages(nextMessages);
    setSelectedMessage((value) =>
      value?.id === target.id
        ? { ...value, status: nextStatus, updatedAt: new Date().toISOString() }
        : value,
    );
    writeStorage(storageKeys.contactSubmissions, nextMessages);
    try {
      if (isSupabaseConfigured()) {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase
          .from("contact_submissions")
          .update({ status: statusToDb(nextStatus) })
          .eq("id", target.id);
        if (error) throw error;
      }
      toast("Message status updated");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Could not update message.",
        "error",
      );
      void loadMessages();
    }
  };
  const exportMessages = () => {
    if (!filteredMessages.length) {
      toast("No data available to export.", "error");
      return;
    }
    downloadCsv(
      "orderflow-contact-messages.csv",
      ["Name", "Email", "Subject", "Message", "Status", "Date"],
      filteredMessages.map((item) => [
        item.fullName,
        item.email,
        item.subject,
        item.message,
        item.status,
        item.createdAt,
      ]),
    );
    toast("CSV exported successfully.");
  };
  return (
    <DashboardShell
      title="Admin Panel"
      actionLabel="Export Users"
      action={exportUsers}
      searchPlaceholder="Search admin data..."
      searchValue={query}
      onSearchChange={setQuery}
      searchResultsEnabled={false}
    >
      <div className="admin-page">
        <div className="tabs admin-tabs">
          {(
            [
              ["overview", "Overview"],
              ["users", "Users"],
              ["stores", "Stores"],
              ["messages", `Messages${totals.newMessages ? ` (${totals.newMessages})` : ""}`],
              ["analytics", "Analytics"],
            ] as [AdminTab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              className={`tab ${tab === id ? "active" : ""}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "overview" && (
          <>
            <div className="stat-grid admin-stat-grid">
              <AdminMetric
                icon={<Users size={17} />}
                label="Total Users"
                value={totals.users}
              />
              <AdminMetric
                icon={<Building2 size={17} />}
                label="Total Orders"
                value={totals.orders}
              />
              <AdminMetric
                icon={<Store size={17} />}
                label="Total Products"
                value={totals.products}
              />
              <AdminMetric
                icon={<UserRound size={17} />}
                label="Total Customers"
                value={totals.customers}
              />
              <AdminMetric
                icon={<ShieldCheck size={17} />}
                label="Active Stores"
                value={totals.activeStores}
              />
              <AdminMetric
                icon={<MessageSquareText size={17} />}
                label="Messages"
                value={totals.messages}
              />
            </div>
            <section className="panel card">
              <div className="panel-head">
                <h3>Recent Users</h3>
                <button className="text-action" onClick={() => setTab("users")}>
                  View all
                </button>
              </div>
              <UserTable users={users.slice(0, 6)} onOpen={setSelected} />
            </section>
          </>
        )}
        {tab === "users" && (
          <>
            <div className="admin-filters">
              <label className="searchbar">
                <Search size={14} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search users..."
                />
              </label>
              <select
                className="field"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                aria-label="Filter by plan"
              >
                <option>All</option>
                {plans.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <select
                className="field"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                aria-label="Filter by status"
              >
                <option>All</option>
                {statuses.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <button className="btn-secondary" onClick={exportUsers}>
                <Download size={14} />
                Export
              </button>
            </div>
            <section className="panel card">
              <UserTable users={filtered} onOpen={setSelected} />
            </section>
          </>
        )}
        {tab === "stores" && (
          <section className="panel card">
            <div className="panel-head">
              <h3>Store Management</h3>
              <span>{stores.length} stores</span>
            </div>
            <div className="admin-store-grid">
              {stores.map((store) => (
                <article className="card" key={store.id}>
                  <span className="stat-icon">
                    <Store size={16} />
                  </span>
                  <h3>{store.name}</h3>
                  <p>{store.ownerEmail}</p>
                  <div>
                    <b>{store.plan}</b>
                    <span
                      className={`status status-${store.status.toLowerCase()}`}
                    >
                      {store.status}
                    </span>
                  </div>
                  <dl>
                    <div>
                      <dt>Orders</dt>
                      <dd>{store.orders}</dd>
                    </div>
                    <div>
                      <dt>Products</dt>
                      <dd>{store.products}</dd>
                    </div>
                    <div>
                      <dt>Customers</dt>
                      <dd>{store.customers}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </section>
        )}
        {tab === "messages" && (
          <>
            <div className="admin-filters">
              <label className="searchbar">
                <Search size={14} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search messages..."
                />
              </label>
              <select
                className="field"
                value={messageStatus}
                onChange={(e) => setMessageStatus(e.target.value)}
                aria-label="Filter by message status"
              >
                <option>All</option>
                {messageStatuses.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <button className="btn-secondary" onClick={loadMessages}>
                <RefreshCw size={14} />
                Refresh
              </button>
              <button className="btn-secondary" onClick={exportMessages}>
                <Download size={14} />
                Export
              </button>
            </div>
            <section className="panel card">
              <div className="panel-head">
                <h3>Contact Messages</h3>
                <span>
                  {loadingMessages
                    ? "Loading..."
                    : `${filteredMessages.length} messages`}
                </span>
              </div>
              <MessageTable
                messages={filteredMessages}
                onOpen={(message) => {
                  setSelectedMessage(message);
                  if (message.status === "New")
                    void updateMessageStatus(message, "Read");
                }}
              />
            </section>
          </>
        )}
        {tab === "analytics" && (
          <AdminAnalytics users={users} totals={totals} />
        )}
      </div>
      {selected && (
        <UserDrawer
          target={selected}
          currentId={user?.id || ""}
          onClose={() => setSelected(null)}
          onSave={(patch) => save(selected, patch)}
          onDelete={() => remove(selected)}
        />
      )}
      {selectedMessage && (
        <MessageDrawer
          target={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onSave={(status) => updateMessageStatus(selectedMessage, status)}
        />
      )}
    </DashboardShell>
  );
}
function AdminMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <article className="stat-card card">
      <span className="stat-icon">{icon}</span>
      <strong>{value.toLocaleString()}</strong>
      <p>{label}</p>
    </article>
  );
}
function UserTable({
  users,
  onOpen,
}: {
  users: MockUser[];
  onOpen: (user: MockUser) => void;
}) {
  return users.length ? (
    <>
      <table className="data-table desktop">
        <thead>
          <tr>
            <th>User</th>
            <th>Plan</th>
            <th>Status</th>
            <th>Country</th>
            <th>Usage</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <b>{user.name}</b>
                <br />
                <small>{user.email}</small>
              </td>
              <td>{user.plan}</td>
              <td>
                <span className={`status status-${user.status.toLowerCase()}`}>
                  {user.status}
                </span>
              </td>
              <td>{user.country}</td>
              <td>{user.ordersUsed} orders</td>
              <td>
                <button className="text-action" onClick={() => onOpen(user)}>
                  View profile
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mobile-cards">
        {users.map((user) => (
          <button
            className="mobile-order text-left"
            key={user.id}
            onClick={() => onOpen(user)}
          >
            <div className="mobile-order-top">
              <b>{user.name}</b>
              <span className={`status status-${user.status.toLowerCase()}`}>
                {user.status}
              </span>
            </div>
            <p>{user.email}</p>
            <p>
              {user.plan} · {user.ordersUsed} orders
            </p>
          </button>
        ))}
      </div>
    </>
  ) : (
    <div className="empty-state">
      <h3>No users found</h3>
      <p>Try changing the search or filters.</p>
    </div>
  );
}
function MessageTable({
  messages,
  onOpen,
}: {
  messages: ContactSubmission[];
  onOpen: (message: ContactSubmission) => void;
}) {
  return messages.length ? (
    <>
      <table className="data-table desktop">
        <thead>
          <tr>
            <th>Sender</th>
            <th>Subject</th>
            <th>Status</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((message) => (
            <tr key={message.id}>
              <td>
                <b>{message.fullName}</b>
                <br />
                <small>{message.email}</small>
              </td>
              <td>
                <b>{message.subject}</b>
                <br />
                <small>{message.message.slice(0, 80)}</small>
              </td>
              <td>
                <span className={`status status-${message.status.toLowerCase()}`}>
                  {message.status}
                </span>
              </td>
              <td>{formatDate(message.createdAt)}</td>
              <td>
                <button className="text-action" onClick={() => onOpen(message)}>
                  View message
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mobile-cards">
        {messages.map((message) => (
          <button
            className="mobile-order text-left"
            key={message.id}
            onClick={() => onOpen(message)}
          >
            <div className="mobile-order-top">
              <b>{message.fullName}</b>
              <span className={`status status-${message.status.toLowerCase()}`}>
                {message.status}
              </span>
            </div>
            <p>{message.email}</p>
            <p>{message.subject}</p>
          </button>
        ))}
      </div>
    </>
  ) : (
    <div className="empty-state">
      <Mail size={28} />
      <h3>No contact messages found</h3>
      <p>New contact form submissions will appear here.</p>
    </div>
  );
}
function UserDrawer({
  target,
  currentId,
  onClose,
  onSave,
  onDelete,
}: {
  target: MockUser;
  currentId: string;
  onClose: () => void;
  onSave: (patch: Partial<Pick<MockUser, "plan" | "status" | "role">>) => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(event) => event.currentTarget === event.target && onClose()}
    >
      <aside
        className="detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-title"
      >
        <div className="drawer-head">
          <div>
            <span className="eyebrow">User management</span>
            <h2 id="admin-user-title">{target.name}</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close user profile"
          >
            <X size={18} />
          </button>
        </div>
        <div className="drawer-body">
          <div className="profile-hero">
            <span className="avatar-large">
              {target.name
                .split(/\s+/)
                .map((x) => x[0])
                .join("")
                .slice(0, 2)}
            </span>
            <h3>{target.email}</h3>
            <p>Joined {target.createdAt}</p>
          </div>
          <div className="drawer-info-grid">
            <span>
              <small>Orders</small>
              <b>{target.ordersUsed}</b>
            </span>
            <span>
              <small>Products</small>
              <b>{target.productsUsed}</b>
            </span>
            <span>
              <small>Customers</small>
              <b>{target.customersUsed}</b>
            </span>
            <span>
              <small>Last active</small>
              <b>{target.lastActiveAt}</b>
            </span>
          </div>
          <label className="form-group">
            <span>Admin Panel Access</span>
            <select
              className="field"
              value={target.role}
              disabled={target.id === currentId}
              onChange={(e) =>
                onSave({ role: e.target.value as MockUser["role"] })
              }
            >
              <option value="user">User only</option>
              <option value="admin">Admin access</option>
            </select>
          </label>
          <label className="form-group mt-4">
            <span>Plan</span>
            <select
              className="field"
              value={target.plan}
              onChange={(e) => onSave({ plan: e.target.value as UserPlan })}
            >
              {plans.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="form-group mt-4">
            <span>Account Status</span>
            <select
              className="field"
              value={target.status}
              disabled={target.id === currentId}
              onChange={(e) =>
                onSave({ status: e.target.value as AccountStatus })
              }
            >
              {statuses
                .filter((x) => x !== "Deleted")
                .map((x) => (
                  <option key={x}>{x}</option>
                ))}
            </select>
          </label>
          <div className="drawer-actions">
            <button
              className="btn-danger"
              disabled={target.id === currentId}
              onClick={onDelete}
            >
              <Trash2 size={14} />
              Delete User
            </button>
            <button className="btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
function MessageDrawer({
  target,
  onClose,
  onSave,
}: {
  target: ContactSubmission;
  onClose: () => void;
  onSave: (status: ContactSubmissionStatus) => void;
}) {
  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(event) => event.currentTarget === event.target && onClose()}
    >
      <aside
        className="detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-message-title"
      >
        <div className="drawer-head">
          <div>
            <span className="eyebrow">Contact message</span>
            <h2 id="admin-message-title">{target.subject}</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close message"
          >
            <X size={18} />
          </button>
        </div>
        <div className="drawer-body">
          <div className="profile-hero">
            <span className="avatar-large">
              {target.fullName
                .split(/\s+/)
                .map((x) => x[0])
                .join("")
                .slice(0, 2)}
            </span>
            <h3>{target.fullName}</h3>
            <p>{target.email}</p>
          </div>
          <div className="drawer-info-grid">
            <span>
              <small>Status</small>
              <b>{target.status}</b>
            </span>
            <span>
              <small>Received</small>
              <b>{formatDate(target.createdAt)}</b>
            </span>
            <span>
              <small>Source</small>
              <b>{target.source}</b>
            </span>
            <span>
              <small>Email</small>
              <b>{target.email}</b>
            </span>
          </div>
          <section className="card mt-4">
            <h3>Message</h3>
            <p className="whitespace-pre-wrap text-[13px] leading-6 text-[#464555]">
              {target.message}
            </p>
          </section>
          <label className="form-group mt-4">
            <span>Message Status</span>
            <select
              className="field"
              value={target.status}
              onChange={(e) => onSave(e.target.value as ContactSubmissionStatus)}
            >
              {messageStatuses.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <div className="drawer-actions">
            <a className="btn-secondary" href={`mailto:${target.email}`}>
              <Mail size={14} />
              Reply by Email
            </a>
            <button className="btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
function AdminAnalytics({
  users,
  totals,
}: {
  users: MockUser[];
  totals: {
    users: number;
    orders: number;
    products: number;
    customers: number;
    activeStores: number;
  };
}) {
  const plansData = plans.map((plan) => ({
    label: plan,
    value: users.filter(
      (user) => user.plan === plan && user.status !== "Deleted",
    ).length,
  }));
  const countries = Object.entries(
    users
      .filter((x) => x.status !== "Deleted")
      .reduce<
        Record<string, number>
      >((map, user) => ({ ...map, [user.country]: (map[user.country] || 0) + 1 }), {}),
  );
  return (
    <div className="admin-analytics-grid">
      <section className="card">
        <h3>Plan Distribution</h3>
        {plansData.map((item) => (
          <AdminBar
            key={item.label}
            label={item.label}
            value={item.value}
            max={Math.max(1, totals.users)}
          />
        ))}
      </section>
      <section className="card">
        <h3>Country Distribution</h3>
        {countries.map(([label, value]) => (
          <AdminBar
            key={label}
            label={label}
            value={value}
            max={Math.max(1, totals.users)}
          />
        ))}
      </section>
      <section className="card admin-revenue">
        <BarChart3 size={22} />
        <span>Revenue estimate</span>
        <strong>
          Rs{" "}
          {users
            .reduce(
              (sum, user) =>
                sum +
                (user.plan === "Starter"
                  ? 799
                  : user.plan === "Growth"
                    ? 1999
                    : 0),
              0,
            )
            .toLocaleString()}
        </strong>
        <small>Monthly estimate from active mock plans</small>
      </section>
    </div>
  );
}
function AdminBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  return (
    <div className="admin-bar">
      <span>
        <b>{label}</b>
        <small>{value}</small>
      </span>
      <i>
        <em style={{ width: `${(value / max) * 100}%` }} />
      </i>
    </div>
  );
}
function mapContactSubmission(row: Record<string, unknown>): ContactSubmission {
  return {
    id: String(row.id || ""),
    fullName: String(row.full_name || ""),
    email: String(row.email || ""),
    subject: String(row.subject || ""),
    message: String(row.message || ""),
    status: statusToUi(String(row.status || "new")),
    source: String(row.source || "contact_page"),
    userAgent: row.user_agent ? String(row.user_agent) : undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || row.created_at || new Date().toISOString()),
  };
}
function statusToUi(value: string): ContactSubmissionStatus {
  if (value === "read") return "Read";
  if (value === "replied") return "Replied";
  if (value === "archived") return "Archived";
  return "New";
}
function statusToDb(value: ContactSubmissionStatus) {
  return value.toLowerCase();
}
function formatDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : value;
}
