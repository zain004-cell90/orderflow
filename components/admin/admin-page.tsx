"use client";
import { useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  Download,
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
import type { AccountStatus, MockUser, UserPlan } from "@/lib/types";

type AdminTab = "overview" | "users" | "stores" | "analytics";
const plans: UserPlan[] = ["Free", "Starter", "Growth"];
const statuses: AccountStatus[] = ["Active", "Suspended", "Blocked", "Deleted"];
export function AdminPage() {
  const { user, users, stores, updateUser, deleteUser } = useAuth();
  const { toast, askConfirm, addNotification } = useDashboard();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState("All");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState<MockUser | null>(null);
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
    }),
    [users, stores],
  );
  const save = (
    target: MockUser,
    patch: Partial<Pick<MockUser, "plan" | "status">>,
  ) => {
    if (target.id === user?.id && patch.status && patch.status !== "Active") {
      toast("You cannot restrict your own administrator account.", "error");
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
  onSave: (patch: Partial<Pick<MockUser, "plan" | "status">>) => void;
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
