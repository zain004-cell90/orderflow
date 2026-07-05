/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ADMIN_EMAIL,
  isAdminEmail,
  normalizeEmail,
  persistMockSession,
  readMockSession,
  readMockStores,
  readMockUsers,
} from "@/lib/mock-auth";
import { storageKeys, writeStorage } from "@/lib/storage";
import {
  clearSupabaseBrowserSession,
  createSupabaseBrowserClient,
  isInvalidRefreshTokenError,
} from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { toPlanDb, toPlanUi } from "@/lib/supabase/mappers";
import { routes } from "@/lib/routes";
import type {
  MockAuthSession,
  MockStore,
  MockUser,
  UserPlan,
} from "@/lib/types";

type AuthResult =
  | { ok: true; message?: string; nextPath?: string; needsEmailConfirmation?: boolean }
  | { ok: false; message: string };
type AuthContextValue = {
  session: MockAuthSession | null;
  user: MockUser | null;
  users: MockUser[];
  stores: MockStore[];
  ready: boolean;
  isAdmin: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<AuthResult>;
  signup: (name: string, email: string, password: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateUser: (
    id: string,
    patch: Partial<Pick<MockUser, "plan" | "status" | "name">>,
  ) => void;
  deleteUser: (id: string) => void;
  updateCurrentPlan: (plan: UserPlan) => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);
const supabaseEnabled = isSupabaseConfigured();

function toAccountStatus(value?: string): MockUser["status"] {
  if (value === "suspended") return "Suspended";
  if (value === "blocked") return "Blocked";
  if (value === "deleted") return "Deleted";
  return "Active";
}
function toDbAccountStatus(value?: MockUser["status"]) {
  if (value === "Suspended") return "suspended";
  if (value === "Blocked") return "blocked";
  if (value === "Deleted") return "deleted";
  return "active";
}
function createUser(name: string, email: string): MockUser {
  const normalized = normalizeEmail(email);
  return {
    id: `usr-${Date.now()}`,
    name: name.trim() || normalized.split("@")[0],
    email: normalized,
    role: isAdminEmail(normalized) ? "admin" : "user",
    plan: isAdminEmail(normalized) ? "Growth" : "Free",
    status: "Active",
    country: "Pakistan",
    storeId: `store-${Date.now()}`,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    ordersUsed: 0,
    productsUsed: 0,
    customersUsed: 0,
  };
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<MockAuthSession | null>(null);
  const [users, setUsers] = useState<MockUser[]>([]);
  const [stores, setStores] = useState<MockStore[]>([]);
  const [ready, setReady] = useState(false);
  const supabase = useMemo(
    () => (supabaseEnabled ? createSupabaseBrowserClient() : null),
    [],
  );
  const loadSupabaseAuthState = useCallback(
    async (emailHint?: string) => {
      if (!supabase) return;
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        if (isInvalidRefreshTokenError(error)) {
          await clearSupabaseBrowserSession(supabase);
          setSession(null);
          setUsers([]);
          setStores([]);
          return;
        }
        throw error;
      }
      const authUser = data.user;
      if (!authUser) {
        setSession(null);
        setUsers([]);
        setStores([]);
        return;
      }
      const email = normalizeEmail(authUser.email || emailHint || "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();
      const profilePayload = {
        id: authUser.id,
        email,
        full_name:
          profile?.full_name ||
          (authUser.user_metadata?.full_name as string | undefined) ||
          email.split("@")[0],
        role: isAdminEmail(email) ? "admin" : profile?.role || "user",
        account_status: profile?.account_status || "active",
      };
      if (!profile) {
        await supabase.from("profiles").upsert(profilePayload, {
          onConflict: "id",
        });
      }
      const [{ data: allProfiles }, { data: allStores }] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("stores")
          .select("*, subscriptions(*)")
          .order("created_at", { ascending: false }),
      ]);
      const profiles = allProfiles?.length ? allProfiles : [profilePayload];
      const storesRows = allStores || [];
      const mappedUsers: MockUser[] = profiles.map((item: any) => {
        const store = storesRows.find((row: any) => row.owner_id === item.id);
        const subscription = Array.isArray(store?.subscriptions)
          ? store.subscriptions[0]
          : store?.subscriptions;
        return {
          id: item.id,
          name: item.full_name || item.email?.split("@")[0] || "Seller",
          email: normalizeEmail(item.email || ""),
          role: item.role === "admin" ? "admin" : "user",
          plan: toPlanUi(subscription?.plan),
          status: toAccountStatus(item.account_status),
          country: item.country || store?.country || "Pakistan",
          storeId: store?.id || "",
          createdAt: item.created_at || new Date().toISOString(),
          lastActiveAt: item.updated_at || item.created_at || new Date().toISOString(),
          ordersUsed: subscription?.monthly_orders_used || 0,
          productsUsed: 0,
          customersUsed: 0,
        };
      });
      const mappedStores: MockStore[] = storesRows.map((store: any) => {
        const owner = profiles.find((item: any) => item.id === store.owner_id);
        const subscription = Array.isArray(store.subscriptions)
          ? store.subscriptions[0]
          : store.subscriptions;
        return {
          id: store.id,
          name: store.name,
          ownerId: store.owner_id,
          ownerEmail: normalizeEmail(owner?.email || ""),
          plan: toPlanUi(subscription?.plan),
          status: toAccountStatus(owner?.account_status),
          country: store.country || owner?.country || "Pakistan",
          orders: subscription?.monthly_orders_used || 0,
          products: 0,
          customers: 0,
          createdAt: store.created_at,
        };
      });
      setSession({
        email,
        createdAt: new Date().toISOString(),
        remember: true,
      });
      setUsers(mappedUsers);
      setStores(mappedStores);
    },
    [supabase],
  );
  useEffect(() => {
    if (supabase) {
      let active = true;
      const boot = window.setTimeout(() => {
        loadSupabaseAuthState()
        .catch(() => {
          if (active) {
            setSession(null);
            setUsers([]);
            setStores([]);
          }
        })
        .finally(() => active && setReady(true));
      }, 0);
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (!nextSession) {
          setSession(null);
          return;
        }
        loadSupabaseAuthState().catch((error) => {
          if (isInvalidRefreshTokenError(error)) {
            void clearSupabaseBrowserSession(supabase);
            setSession(null);
            setUsers([]);
            setStores([]);
          }
        });
      });
      return () => {
        active = false;
        window.clearTimeout(boot);
        subscription.unsubscribe();
      };
    }
    const timer = window.setTimeout(() => {
      setSession(readMockSession());
      setUsers(readMockUsers());
      setStores(readMockStores());
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSupabaseAuthState, supabase]);
  useEffect(() => {
    if (ready) writeStorage(storageKeys.users, users);
  }, [users, ready]);
  useEffect(() => {
    if (ready) writeStorage(storageKeys.stores, stores);
  }, [stores, ready]);
  const user = useMemo(
    () =>
      session
        ? users.find(
            (item) =>
              normalizeEmail(item.email) === normalizeEmail(session.email),
          ) || null
        : null,
    [session, users],
  );
  const begin = useCallback((email: string, remember: boolean) => {
    const next = {
      email: normalizeEmail(email),
      createdAt: new Date().toISOString(),
      remember,
    };
    setSession(next);
    persistMockSession(next);
  }, []);
  const login = async (
    email: string,
    password: string,
    remember: boolean,
  ): Promise<AuthResult> => {
    const normalized = normalizeEmail(email);
    if (!/^\S+@\S+\.\S+$/.test(normalized))
      return { ok: false, message: "Enter a valid email address." };
    if (password.length < 8)
      return { ok: false, message: "Password must be at least 8 characters." };
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalized,
        password,
      });
      if (error) return { ok: false, message: error.message };
      await loadSupabaseAuthState(normalized);
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_status")
        .eq("email", normalized)
        .maybeSingle();
      if (profile?.account_status === "deleted") {
        await supabase.auth.signOut();
        setSession(null);
        return {
          ok: false,
          message: "This account has been deleted. Contact support.",
        };
      }
      const {
        data: { user: signedInUser },
        error: currentUserError,
      } = await supabase.auth.getUser();
      if (currentUserError && isInvalidRefreshTokenError(currentUserError)) {
        await clearSupabaseBrowserSession(supabase);
        setSession(null);
        return {
          ok: false,
          message: "Your session expired. Please log in again.",
        };
      }
      const { data: store } = await supabase
        .from("stores")
        .select("id, is_setup_complete")
        .eq("owner_id", signedInUser?.id || "")
        .maybeSingle();
      return {
        ok: true,
        nextPath: store?.is_setup_complete ? undefined : routes.onboarding,
      };
    }
    let account = users.find((item) => item.email === normalized);
    if (account?.status === "Deleted")
      return {
        ok: false,
        message: "This account has been deleted. Contact support.",
      };
    if (!account) {
      account = createUser(normalized.split("@")[0], normalized);
      const nextUsers = [...users, account];
      const nextStores = [
        ...stores,
        {
          id: account!.storeId,
          name: "New Store",
          ownerId: account!.id,
          ownerEmail: account!.email,
          plan: account!.plan,
          status: account!.status,
          country: account!.country,
          orders: 0,
          products: 0,
          customers: 0,
          createdAt: account!.createdAt,
        },
      ];
      setUsers(nextUsers);
      setStores(nextStores);
      writeStorage(storageKeys.users, nextUsers);
      writeStorage(storageKeys.stores, nextStores);
    }
    begin(normalized, remember);
    return { ok: true };
  };
  const signup = async (
    name: string,
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    const normalized = normalizeEmail(email);
    if (name.trim().length < 2)
      return { ok: false, message: "Enter your full name." };
    if (!/^\S+@\S+\.\S+$/.test(normalized))
      return { ok: false, message: "Enter a valid email address." };
    if (password.length < 8)
      return { ok: false, message: "Password must be at least 8 characters." };
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: normalized,
        password,
        options: { data: { full_name: name.trim() } },
      });
      if (error) return { ok: false, message: error.message };
      if (data.user) {
        await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            email: normalized,
            full_name: name.trim(),
            role: isAdminEmail(normalized) ? "admin" : "user",
            account_status: "active",
          },
          { onConflict: "id" },
        );
      }
      await loadSupabaseAuthState(normalized);
      return {
        ok: true,
        nextPath: data.session ? routes.onboarding : routes.checkEmail,
        needsEmailConfirmation: !data.session,
        message: data.session
          ? undefined
          : "Account created. Please check your email to confirm your account.",
      };
    }
    if (
      users.some(
        (item) => item.email === normalized && item.status !== "Deleted",
      )
    )
      return {
        ok: false,
        message: "An account with this email already exists.",
      };
    const account = createUser(name, normalized);
    const nextUsers = [...users, account];
    const nextStores = [
      ...stores,
      {
        id: account.storeId,
        name: "New Store",
        ownerId: account.id,
        ownerEmail: account.email,
        plan: account.plan,
        status: account.status,
        country: account.country,
        orders: 0,
        products: 0,
        customers: 0,
        createdAt: account.createdAt,
      },
    ];
    setUsers(nextUsers);
    setStores(nextStores);
    writeStorage(storageKeys.users, nextUsers);
    writeStorage(storageKeys.stores, nextStores);
    begin(normalized, true);
    return { ok: true };
  };
  const resetPassword = async (email: string): Promise<AuthResult> => {
    const normalized = normalizeEmail(email);
    if (!/^\S+@\S+\.\S+$/.test(normalized))
      return { ok: false, message: "Enter a valid email address." };
    if (supabase) {
      const redirectTo =
        typeof window === "undefined"
          ? undefined
          : `${window.location.origin}${routes.login}`;
      const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
        redirectTo,
      });
      if (error) return { ok: false, message: error.message };
    }
    return {
      ok: true,
      message: "If an account exists, password reset instructions have been sent.",
    };
  };
  const updateUser = (
    id: string,
    patch: Partial<Pick<MockUser, "plan" | "status" | "name">>,
  ) => {
    setUsers((value) =>
      value.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
    setStores((value) =>
      value.map((store) =>
        store.ownerId === id
          ? {
              ...store,
              plan: patch.plan || store.plan,
              status: patch.status || store.status,
            }
          : store,
      ),
    );
    if (supabase) {
      if (patch.name || patch.status) {
        void Promise.resolve(supabase
          .from("profiles")
          .update({
            ...(patch.name ? { full_name: patch.name } : {}),
            ...(patch.status
              ? { account_status: toDbAccountStatus(patch.status) }
              : {}),
          })
          .eq("id", id)
          .then(() => loadSupabaseAuthState()))
          .catch(() => undefined);
      }
      if (patch.plan) {
        const storeId = stores.find((store) => store.ownerId === id)?.id;
        if (storeId) {
          void Promise.resolve(supabase
            .from("subscriptions")
            .upsert(
              {
                store_id: storeId,
                plan: toPlanDb(patch.plan),
                orders_limit:
                  patch.plan === "Free" ? 25 : patch.plan === "Starter" ? 150 : 500,
                status: "active",
              },
              { onConflict: "store_id" },
            )
            .then(() => loadSupabaseAuthState()))
            .catch(() => undefined);
        }
      }
    }
  };
  const deleteUser = (id: string) => updateUser(id, { status: "Deleted" });
  const logout = async () => {
    if (supabase) await clearSupabaseBrowserSession(supabase);
    setSession(null);
    if (!supabase) persistMockSession(null);
  };
  const updateCurrentPlan = (plan: UserPlan) => {
    if (user) updateUser(user.id, { plan });
  };
  const value: AuthContextValue = {
    session,
    user,
    users,
    stores,
    ready,
    isAdmin: Boolean(
      user && user.email === ADMIN_EMAIL && user.role === "admin",
    ),
    login,
    signup,
    resetPassword,
    logout,
    updateUser,
    deleteUser,
    updateCurrentPlan,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
