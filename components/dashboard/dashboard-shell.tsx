"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  CircleHelp,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Settings,
  ShoppingBag,
  ShoppingCart,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { useDashboard } from "./dashboard-store";
import { useAuth } from "@/components/auth/auth-provider";

const nav = [
  { href: routes.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { href: routes.orders, label: "Orders", icon: ShoppingCart },
  { href: routes.products, label: "Products", icon: Package },
  { href: routes.customers, label: "Customers", icon: Users },
  { href: routes.checkout, label: "Checkout Page", icon: CreditCard },
  { href: routes.analytics, label: "Analytics", icon: BarChart3 },
  { href: routes.settings, label: "Settings", icon: Settings },
];

export function DashboardShell({
  children,
  title,
  searchPlaceholder = "Search orders, customers, or products...",
  searchValue,
  onSearchChange,
  actionLabel = "Create Order",
  action,
  flush = false,
  searchResultsEnabled = true,
}: {
  children: ReactNode;
  title: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  actionLabel?: string;
  action?: () => void;
  flush?: boolean;
  searchResultsEnabled?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const {
    orders,
    products,
    customers,
    loading,
    toast,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useDashboard();
  const [more, setMore] = useState(false);
  const [query, setQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==="Escape"){setMore(false);setNotificationsOpen(false);setUserMenu(false)}};document.addEventListener("keydown",close);return()=>document.removeEventListener("keydown",close)},[]);
  const effectiveQuery = searchValue ?? query;
  const changeSearch = onSearchChange ?? setQuery;
  const currentNav = isAdmin
    ? [...nav, { href: routes.admin, label: "Admin Panel", icon: ShieldCheck }]
    : nav;
  const active = (href: string) =>
    href === routes.dashboard ? pathname === href : pathname.startsWith(href);
  const results = useMemo(() => {
    const q = effectiveQuery.trim().toLowerCase();
    if (!q) return [];
    return [
      ...orders
        .filter((x) =>
          `${x.id} ${x.customer} ${x.product}`.toLowerCase().includes(q),
        )
        .slice(0, 3)
        .map((x) => ({
          label: `${x.id} · ${x.customer}`,
          detail: x.product,
          href: `${routes.orders}?q=${encodeURIComponent(effectiveQuery)}`,
        })),
      ...customers
        .filter((x) =>
          `${x.name} ${x.phone} ${x.email}`.toLowerCase().includes(q),
        )
        .slice(0, 3)
        .map((x) => ({
          label: x.name,
          detail: x.phone,
          href: `${routes.customers}?q=${encodeURIComponent(effectiveQuery)}`,
        })),
      ...products
        .filter((x) => `${x.name} ${x.category}`.toLowerCase().includes(q))
        .slice(0, 3)
        .map((x) => ({
          label: x.name,
          detail: x.category,
          href: `${routes.products}?q=${encodeURIComponent(effectiveQuery)}`,
        })),
    ].slice(0, 6);
  }, [effectiveQuery, orders, customers, products]);
  const go = (href: string) => {
    changeSearch("");
    router.push(href);
  };
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Link href={routes.dashboard} className="brand">
            <span className="brand-mark">
              <ShoppingBag size={15} />
            </span>
            <span>OrderFlow</span>
          </Link>
          <small>ENTERPRISE</small>
        </div>
        <nav className="side-nav" aria-label="Dashboard navigation">
          {currentNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`side-link ${active(href) ? "active" : ""}`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="upgrade">
          <strong>Upgrade to Starter</strong>
          <p>Unlock 150 orders/month and tracking tools.</p>
          <button
            onClick={() => {
              toast("Upgrade options opened", "info");
              router.push(`${routes.settings}?tab=billing`);
            }}
            className="btn-primary !w-full !py-2 !text-[10px]"
          >
            Upgrade to Starter
          </button>
        </div>
        <div className="sidebar-foot">
          <Link className="side-link" href={routes.contact}>
            <CircleHelp size={15} />
            Support
          </Link>
          <button
            className="side-link"
            onClick={() => {
              logout();
              router.push(routes.home);
              router.refresh();
            }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">{title}</h1>
            <div className="global-search-wrap">
              <label className="searchbar">
                <Search size={14} />
                <input
                  value={effectiveQuery}
                  onChange={(e) => changeSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                />
              </label>
              {searchResultsEnabled && effectiveQuery && (
                <div className="global-search-results card">
                  {results.length ? (
                    results.map((x, i) => (
                      <button key={`${x.href}-${i}`} onClick={() => go(x.href)}>
                        <span>
                          <b>{x.label}</b>
                          <small>{x.detail}</small>
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="empty-mini">
                      No matching orders, customers, or products.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="topbar-actions">
            <div className="menu-anchor">
              <button
                className="icon-button"
                aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
                aria-expanded={notificationsOpen}
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setUserMenu(false);
                }}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="notification-count">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div className="topbar-menu notifications-menu card">
                  <div className="menu-title">
                    Notifications{" "}
                    <button
                      onClick={() => {
                        markAllNotificationsRead();
                        toast("Notifications marked as read");
                      }}
                    >
                      Mark all read
                    </button>
                  </div>
                  {notifications.length ? (
                    notifications.slice(0, 8).map((notification) => (
                      <button
                        className={notification.isRead ? "read" : "unread"}
                        key={notification.id}
                        onClick={() => {
                          markNotificationRead(notification.id);
                          setNotificationsOpen(false);
                          if (notification.actionUrl)
                            router.push(notification.actionUrl);
                        }}
                      >
                        <span>
                          <b>{notification.title}</b>
                          <small>{notification.message}</small>
                          <time>{notification.createdAt}</time>
                        </span>
                        {!notification.isRead && <i />}
                      </button>
                    ))
                  ) : (
                    <div className="empty-mini">No notifications yet.</div>
                  )}
                </div>
              )}
            </div>
            <Link
              className="icon-button"
              href={routes.contact}
              aria-label="Help"
            >
              <CircleHelp size={16} />
            </Link>
            {action ? (
              <button
                className="btn-primary !py-2 !px-4"
                onClick={action}
                aria-label={actionLabel}
              >
                <Plus size={14} />
                <span>{actionLabel}</span>
              </button>
            ) : (
              <Link
                className="btn-primary !py-2 !px-4"
                href={`${routes.orders}?create=true`}
                aria-label={actionLabel}
              >
                <Plus size={14} />
                <span>{actionLabel}</span>
              </Link>
            )}
            <div className="menu-anchor">
              <button
                onClick={() => {
                  setUserMenu(!userMenu);
                  setNotificationsOpen(false);
                }}
                className="profile-dot"
                aria-label="User menu"
                aria-expanded={userMenu}
              >
                {initials(user?.name || "OrderFlow User")}
              </button>
              {userMenu && (
                <div className="topbar-menu user-menu card">
                  <div className="user-summary">
                    <span className="profile-dot">
                      {initials(user?.name || "OrderFlow User")}
                    </span>
                    <span>
                      <b>{user?.name || "OrderFlow User"}</b>
                      <small>{user?.email || ""}</small>
                    </span>
                  </div>
                  <Link
                    href={`${routes.settings}?tab=account`}
                    onClick={() => setUserMenu(false)}
                  >
                    <UserRound size={14} />
                    Profile
                  </Link>
                  <Link
                    href={routes.settings}
                    onClick={() => setUserMenu(false)}
                  >
                    <Settings size={14} />
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      router.push(routes.home);
                      router.refresh();
                    }}
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className={flush ? "" : "dashboard-content"}>
          {loading ? <DashboardSkeleton /> : children}
        </div>
      </main>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {currentNav.slice(0, 4).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`bottom-link ${active(href) ? "active" : ""}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        ))}
        <button
          className={`bottom-link ${more ? "active" : ""}`}
          onClick={() => setMore(!more)}
        >
          {more ? <X size={18} /> : <MoreHorizontal size={18} />}
          <span>More</span>
        </button>
      </nav>
      {more && (
        <div className="more-menu">
          {currentNav.slice(4).map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMore(false)}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function DashboardSkeleton() {
  return (
    <div className="skeleton-page" aria-label="Loading dashboard">
      <div className="skeleton-line w-52" />
      <div className="stat-grid">
        {[1, 2, 3, 4].map((x) => (
          <div key={x} className="stat-card card skeleton-block" />
        ))}
      </div>
      <div className="panel card skeleton-panel" />
    </div>
  );
}
