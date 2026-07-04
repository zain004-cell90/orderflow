import type { MockAuthSession, MockStore, MockUser, UserPlan } from "./types";
import { readStorage, storageKeys, writeStorage } from "./storage";

export const ADMIN_EMAIL = "zainali00490@gmail.com";
export const AUTH_COOKIE = "orderflow_mock_session";
export const planLimits: Record<UserPlan, number> = {
  Free: 25,
  Starter: 150,
  Growth: 500,
};

export const seedUsers: MockUser[] = [
  {
    id: "usr-admin",
    name: "Zain Ali",
    email: ADMIN_EMAIL,
    role: "admin",
    plan: "Growth",
    status: "Active",
    country: "Pakistan",
    storeId: "store-admin",
    createdAt: "2025-01-04",
    lastActiveAt: "2026-06-24",
    ordersUsed: 386,
    productsUsed: 64,
    customersUsed: 271,
  },
  {
    id: "usr-alex",
    name: "Alex Rivera",
    email: "alex@orderflow.pk",
    role: "user",
    plan: "Free",
    status: "Active",
    country: "Pakistan",
    storeId: "store-id",
    createdAt: "2026-01-12",
    lastActiveAt: "2026-06-24",
    ordersUsed: 16,
    productsUsed: 12,
    customersUsed: 15,
  },
  {
    id: "usr-sara",
    name: "Sara Khan",
    email: "sara@luminastudio.pk",
    role: "user",
    plan: "Starter",
    status: "Active",
    country: "Pakistan",
    storeId: "store-lumina",
    createdAt: "2025-11-20",
    lastActiveAt: "2026-06-23",
    ordersUsed: 118,
    productsUsed: 29,
    customersUsed: 94,
  },
  {
    id: "usr-emily",
    name: "Emily Carter",
    email: "emily@socialnorth.co",
    role: "user",
    plan: "Growth",
    status: "Active",
    country: "United States",
    storeId: "store-socialnorth",
    createdAt: "2025-09-08",
    lastActiveAt: "2026-06-22",
    ordersUsed: 342,
    productsUsed: 51,
    customersUsed: 228,
  },
  {
    id: "usr-hamza",
    name: "Hamza Malik",
    email: "hamza@urbanthread.pk",
    role: "user",
    plan: "Free",
    status: "Suspended",
    country: "Pakistan",
    storeId: "store-urbanthread",
    createdAt: "2026-03-02",
    lastActiveAt: "2026-06-18",
    ordersUsed: 25,
    productsUsed: 8,
    customersUsed: 21,
  },
  {
    id: "usr-priya",
    name: "Priya Sharma",
    email: "priya@theedit.in",
    role: "user",
    plan: "Starter",
    status: "Blocked",
    country: "India",
    storeId: "store-theedit",
    createdAt: "2025-12-15",
    lastActiveAt: "2026-06-10",
    ordersUsed: 74,
    productsUsed: 20,
    customersUsed: 61,
  },
];
export const seedStores: MockStore[] = seedUsers.map((user, index) => ({
  id: user.storeId,
  name: [
    "OrderFlow Admin Store",
    "The Modern Entrepreneur",
    "Lumina Studio",
    "Social North",
    "Urban Thread",
    "The Edit",
  ][index],
  ownerId: user.id,
  ownerEmail: user.email,
  plan: user.plan,
  status: user.status,
  country: user.country,
  orders: user.ordersUsed,
  products: user.productsUsed,
  customers: user.customersUsed,
  createdAt: user.createdAt,
}));

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
export function isAdminEmail(value: string) {
  return normalizeEmail(value) === ADMIN_EMAIL;
}
export function readMockUsers() {
  return readStorage(storageKeys.users, seedUsers);
}
export function readMockStores() {
  return readStorage(storageKeys.stores, seedStores);
}
export function readMockSession() {
  return readStorage<MockAuthSession | null>(storageKeys.authSession, null);
}
export function persistMockSession(session: MockAuthSession | null) {
  if (session) {
    writeStorage(storageKeys.authSession, session);
    const age = session.remember ? 60 * 60 * 24 * 30 : 60 * 60 * 12;
    document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=${age}; samesite=lax`;
  } else {
    window.localStorage.removeItem(storageKeys.authSession);
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; samesite=lax`;
  }
}
export function monthlyOrderCount<
  T extends { createdAt?: string; date: string },
>(orders: T[], now = new Date()) {
  return orders.filter((order) => {
    const date = new Date(order.createdAt || order.date);
    return (
      Number.isFinite(date.getTime()) &&
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }).length;
}
export function orderLimitFor(plan: UserPlan) {
  return planLimits[plan];
}
