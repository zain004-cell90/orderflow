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
import { defaultCheckoutConfig } from "@/lib/mock-data";
import { defaultAutomationSettings } from "@/lib/settings";
import {
  readCustomers,
  readNotifications,
  readOrders,
  readProducts,
  readSettings,
  readStorage,
  storageKeys,
  writeStorage,
} from "@/lib/storage";
import {
  clearSupabaseBrowserSession,
  createSupabaseBrowserClient,
  isInvalidRefreshTokenError,
} from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  loadDashboardData,
  saveProduct as saveSupabaseProduct,
  toNotificationDbType,
  updateOrderStatus as updateSupabaseOrderStatus,
} from "@/lib/supabase/data";
import { statusToDb } from "@/lib/supabase/mappers";
import { formatCurrency } from "@/lib/formatters";
import type {
  Customer,
  EntityId,
  Notification,
  NotificationType,
  Order,
  OrderStatus,
  Product,
  StoreSettings,
  CheckoutConfig,
} from "@/lib/types";

type ToastTone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: ToastTone };
type ConfirmState =
  | {
      title: string;
      message: string;
      confirmLabel?: string;
      destructive?: boolean;
      action: () => void;
    }
  | null;
type NewNotification = {
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string;
};
type DashboardContextValue = {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  loading: boolean;
  storeSettings: StoreSettings;
  checkoutConfig: CheckoutConfig;
  notifications: Notification[];
  unreadCount: number;
  formatMoney: (amount: number) => string;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: EntityId, patch: Partial<Product>) => void;
  deleteProduct: (id: EntityId) => void;
  updateCustomer: (id: EntityId, patch: Partial<Customer>) => void;
  updateStoreSettings: (patch: Partial<StoreSettings>) => void;
  updateCheckoutConfig: (config: CheckoutConfig) => void;
  addNotification: (notification: NewNotification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  toasts: Toast[];
  toast: (message: string, tone?: ToastTone) => void;
  confirm: ConfirmState;
  askConfirm: (state: NonNullable<ConfirmState>) => void;
  closeConfirm: () => void;
  runConfirm: () => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);
const supabaseEnabled = isSupabaseConfigured();
const emptyOrders: Order[] = [];
const emptyProducts: Product[] = [];
const emptyCustomers: Customer[] = [];

const initialSettings: StoreSettings = {
  storeName: "New Store",
  businessPhone: "",
  businessEmail: "",
  country: "US",
  currency: "USD",
  timezone: "America/New_York",
  phoneFormat: "+1 (555) 123-4567",
  dateFormat: "MM/DD/YYYY",
  logo: "",
};
const initialNotifications: Notification[] = [];

function isCurrentMonth(value?: string) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return (
    Number.isFinite(date.getTime()) &&
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function isAllowedNotification(type: NotificationType) {
  return type === "New Order" || type === "Customer Added";
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  // Central dashboard data layer: pages call this provider instead of querying Supabase directly.
  const [orders, setOrders] = useState<Order[]>(emptyOrders);
  const [products, setProducts] = useState<Product[]>(emptyProducts);
  const [customers, setCustomers] = useState<Customer[]>(emptyCustomers);
  const [storeSettings, setStoreSettings] =
    useState<StoreSettings>(initialSettings);
  const [checkoutConfig, setCheckoutConfig] =
    useState<CheckoutConfig>(defaultCheckoutConfig);
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [subscriptionLimit, setSubscriptionLimit] = useState<number | null>(null);
  const supabase = useMemo(
    () => (supabaseEnabled ? createSupabaseBrowserClient() : null),
    [],
  );

  const toast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((value) => [...value, { id, message, tone }]);
    setTimeout(
      () => setToasts((value) => value.filter((item) => item.id !== id)),
      2600,
    );
  }, []);

  const refreshSupabaseData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const data = await loadDashboardData(supabase);
      setStoreId(data.store?.id || null);
      setSubscriptionLimit(data.subscription?.orders_limit || null);
      setOrders(data.orders);
      setProducts(data.products);
      setCustomers(data.customers);
      setNotifications(
        data.notifications.filter((notification) =>
          isAllowedNotification(notification.type),
        ),
      );
      setStoreSettings(data.storeSettings || initialSettings);
      if (data.checkoutConfig) {
        setCheckoutConfig(data.checkoutConfig);
        writeStorage(storageKeys.checkout, data.checkoutConfig);
      } else if (data.store) {
        const fallbackCheckout = {
          ...defaultCheckoutConfig,
          storeId: data.store.slug || data.store.id,
          storeName: data.store.name,
        };
        setCheckoutConfig(fallbackCheckout);
        writeStorage(storageKeys.checkout, fallbackCheckout);
      }
    } catch (error) {
      if (
        isInvalidRefreshTokenError(error) ||
        (error instanceof Error && /session expired/i.test(error.message))
      ) {
        await clearSupabaseBrowserSession(supabase);
        window.location.href = `/login?next=${encodeURIComponent(
          window.location.pathname + window.location.search,
        )}`;
        return;
      }
      toast(
        error instanceof Error ? error.message : "Could not load dashboard data.",
        "error",
      );
    } finally {
      setHydrated(true);
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    if (supabase) {
      const id = window.setTimeout(() => {
        refreshSupabaseData();
      }, 0);
      return () => window.clearTimeout(id);
    }
    const id = setTimeout(() => {
      setOrders(readOrders(emptyOrders));
      setProducts(readProducts(emptyProducts));
      setCustomers(readCustomers(emptyCustomers));
      setStoreSettings(readSettings(initialSettings));
      setCheckoutConfig(readStorage(storageKeys.checkout, defaultCheckoutConfig));
      setNotifications(
        readNotifications(initialNotifications).filter((notification) =>
          isAllowedNotification(notification.type),
        ),
      );
      setHydrated(true);
      setLoading(false);
    }, 180);
    return () => clearTimeout(id);
  }, [refreshSupabaseData, supabase]);

  useEffect(() => {
    if (!hydrated || supabase) return;
    writeStorage(storageKeys.orders, orders);
  }, [orders, hydrated, supabase]);
  useEffect(() => {
    if (!hydrated || supabase) return;
    writeStorage(storageKeys.products, products);
  }, [products, hydrated, supabase]);
  useEffect(() => {
    if (!hydrated || supabase) return;
    writeStorage(storageKeys.customers, customers);
  }, [customers, hydrated, supabase]);
  useEffect(() => {
    if (!hydrated || supabase) return;
    writeStorage(storageKeys.settings, storeSettings);
  }, [storeSettings, hydrated, supabase]);
  useEffect(() => {
    if (!hydrated || supabase) return;
    writeStorage(storageKeys.checkout, checkoutConfig);
  }, [checkoutConfig, hydrated, supabase]);
  useEffect(() => {
    if (!hydrated || supabase) return;
    writeStorage(storageKeys.notifications, notifications);
  }, [notifications, hydrated, supabase]);

  useEffect(() => {
    if (supabase) return;
    const sync = (event: StorageEvent | Event) => {
      const key =
        event instanceof StorageEvent
          ? event.key
          : (event as CustomEvent<{ key: string }>).detail?.key;
      if (!key || key === storageKeys.orders) setOrders(readOrders(emptyOrders));
      if (!key || key === storageKeys.products)
        setProducts(readProducts(emptyProducts));
      if (!key || key === storageKeys.customers)
        setCustomers(readCustomers(emptyCustomers));
      if (!key || key === storageKeys.settings)
        setStoreSettings(readSettings(initialSettings));
      if (!key || key === storageKeys.checkout)
        setCheckoutConfig(readStorage(storageKeys.checkout, defaultCheckoutConfig));
      if (!key || key === storageKeys.notifications)
        setNotifications(
          readNotifications(initialNotifications).filter((notification) =>
            isAllowedNotification(notification.type),
          ),
        );
    };
    window.addEventListener("storage", sync);
    window.addEventListener("orderflow-storage", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("orderflow-storage", sync);
    };
  }, [supabase]);

  const addNotification = useCallback(
    (notification: NewNotification) => {
      if (!isAllowedNotification(notification.type)) return;
      const nextNotification = {
        id: `notification-${Date.now()}-${Math.random()}`,
        ...notification,
        createdAt: "Just now",
        isRead: false,
      };
      setNotifications((value) => [nextNotification, ...value]);
      if (supabase && storeId) {
        supabase
          .from("notifications")
          .insert({
            store_id: storeId,
            title: notification.title,
            message: notification.message,
            type: toNotificationDbType(notification.type),
            action_url: notification.actionUrl || null,
          })
          .then(() => undefined);
      }
    },
    [storeId, supabase],
  );

  const addOrder = useCallback(
    (order: Order) => {
      if (supabase && storeId) {
        const used = orders.filter((item) =>
          isCurrentMonth(item.createdAt || item.date),
        ).length;
        if (subscriptionLimit !== null && used >= subscriptionLimit) {
          toast("Upgrade plan to accept more orders.", "error");
          return;
        }
        void Promise.resolve(supabase
          .from("customers")
          .upsert(
            {
              store_id: storeId,
              name: order.customerName || order.customer,
              email: order.email || null,
              phone: order.phone,
              city: order.city || null,
              address: order.address || null,
            },
            { onConflict: "store_id,phone_normalized" },
          )
          .select("id")
          .single()
          .then(async ({ data: customer, error }) => {
            if (error) throw error;
            const { data: created, error: orderError } = await supabase
              .from("orders")
              .insert({
                store_id: storeId,
                customer_id: customer.id,
                order_number: order.orderNumber || order.id,
                customer_name: order.customerName || order.customer,
                phone: order.phone,
                email: order.email || null,
                city: order.city || null,
                address: order.address || null,
                notes: order.notes || null,
                subtotal: order.totalAmount || order.amount,
                total_amount: order.totalAmount || order.amount,
                currency: "PKR",
                payment_method: order.paymentMethod || "Cash on Delivery",
                status: statusToDb[order.status],
                source: "dashboard",
              })
              .select("id, order_number")
              .single();
            if (orderError) throw orderError;
            if (order.productId) {
              const { error: itemError } = await supabase.from("order_items").insert({
                order_id: created.id,
                product_id: String(order.productId),
                product_name: order.productName || order.product,
                product_image_url: order.productImage || null,
                quantity: order.quantity || 1,
                unit_price:
                  (order.totalAmount || order.amount) / Math.max(order.quantity || 1, 1),
                total_price: order.totalAmount || order.amount,
                selected_options: {
                  ...(order.size ? { Size: order.size } : {}),
                  ...(order.color ? { Color: order.color } : {}),
                  ...(order.variant ? { Variant: order.variant } : {}),
                },
              });
              if (itemError) throw itemError;
            }
            const { error: timelineError } = await supabase.from("order_timeline").insert({
              order_id: created.id,
              status: statusToDb[order.status],
              note: "Order created from dashboard.",
            });
            if (timelineError) throw timelineError;
            await refreshSupabaseData();
            toast("Order created successfully.");
          }))
          .catch((error: unknown) =>
            toast(
              error instanceof Error ? error.message : "Could not create order.",
              "error",
            ),
          );
        return;
      }
      setOrders((value) => [order, ...value]);
      const automation = readStorage(storageKeys.automation, defaultAutomationSettings);
      if (automation.autoCreateCustomer) {
        setCustomers((value) => {
          const existing = value.find(
            (customer) =>
              customer.phone.replace(/\D/g, "") === order.phone.replace(/\D/g, ""),
          );
          if (existing) {
            const ordersCount = existing.ordersCount + 1;
            const totalSpent = existing.totalSpent + order.amount;
            return value.map((customer) =>
              customer.id === existing.id
                ? {
                    ...customer,
                    ordersCount,
                    totalSpent,
                    avgTicket: Math.round(totalSpent / ordersCount),
                    isRepeatCustomer: automation.autoMarkRepeat
                      ? true
                      : customer.isRepeatCustomer,
                    orderHistory: [
                      {
                        id: order.id,
                        date: order.date,
                        products: order.product,
                        amount: order.amount,
                        status: order.status,
                      },
                      ...customer.orderHistory,
                    ],
                  }
                : customer,
            );
          }
          addNotification({
            title: "Customer added",
            message: `${order.customer} was added from ${order.id}.`,
            type: "Customer Added",
            actionUrl: "/dashboard/customers",
          });
          return [
            {
              id: Date.now(),
              name: order.customer,
              initials: order.initials,
              email: order.email || "",
              phone: order.phone,
              country: "",
              city: order.city || "",
              address: order.address || "",
              ordersCount: 1,
              totalSpent: order.amount,
              avgTicket: order.amount,
              isRepeatCustomer: false,
              createdAt: order.date,
              notes: "",
              orderHistory: [
                {
                  id: order.id,
                  date: order.date,
                  products: order.product,
                  amount: order.amount,
                  status: order.status,
                },
              ],
            },
            ...value,
          ];
        });
      }
      addNotification({
        title: "New order",
        message: `${order.id} was created for ${order.customer}.`,
        type: "New Order",
        actionUrl: `/dashboard/orders?order=${encodeURIComponent(order.id)}`,
      });
    },
    [
      addNotification,
      orders,
      refreshSupabaseData,
      storeId,
      subscriptionLimit,
      supabase,
      toast,
    ],
  );

  const updateOrder = useCallback(
    (id: string, patch: Partial<Order>) => {
      setOrders((value) =>
        value.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
      if (supabase && patch.status) {
        updateSupabaseOrderStatus(supabase, id, patch.status)
          .then(refreshSupabaseData)
          .catch((error) =>
            toast(
              error instanceof Error
                ? error.message
                : "Could not update order status.",
              "error",
            ),
          );
      }
      if (patch.status) {
        addNotification({
          title: "Order status updated",
          message: `${id} is now ${patch.status}.`,
          type: "Order Status Updated",
          actionUrl: `/dashboard/orders?order=${encodeURIComponent(id)}`,
        });
      }
    },
    [addNotification, refreshSupabaseData, supabase, toast],
  );

  const deleteOrder = useCallback(
    (id: string) => {
      setOrders((value) => value.filter((item) => item.id !== id));
      if (supabase) {
        void Promise.resolve(supabase
          .from("orders")
          .delete()
          .or(`id.eq.${id},order_number.eq.${id}`)
          .then(({ error }) => {
            if (error) throw error;
            return refreshSupabaseData();
          }))
          .catch((error: unknown) =>
            toast(
              error instanceof Error ? error.message : "Could not delete order.",
              "error",
            ),
          );
      }
    },
    [refreshSupabaseData, supabase, toast],
  );

  const addProduct = useCallback(
    (product: Product) => {
      if (supabase && storeId) {
        saveSupabaseProduct(supabase, storeId, product)
          .then(refreshSupabaseData)
          .then(() => toast("Product saved successfully."))
          .catch((error) =>
            toast(
              error instanceof Error ? error.message : "Could not save product.",
              "error",
            ),
          );
      } else {
        setProducts((value) => [product, ...value]);
      }
      addNotification({
        title: "Product added",
        message: `${product.name} was added to your inventory.`,
        type: "Product Added",
        actionUrl: `/dashboard/products?q=${encodeURIComponent(product.name)}`,
      });
    },
    [addNotification, refreshSupabaseData, storeId, supabase, toast],
  );

  const updateProduct = useCallback(
    (id: EntityId, patch: Partial<Product>) => {
      const product = products.find((item) => item.id === id);
      setProducts((value) =>
        value.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
      if (supabase && storeId && product) {
        saveSupabaseProduct(supabase, storeId, { ...product, ...patch }, id)
          .then(refreshSupabaseData)
          .catch((error) =>
            toast(
              error instanceof Error ? error.message : "Could not update product.",
              "error",
            ),
          );
      }
      const automation = readStorage(storageKeys.automation, defaultAutomationSettings);
      if (
        automation.lowStockAlert &&
        product &&
        typeof patch.stock === "number" &&
        patch.stock <= 10
      ) {
        addNotification({
          title: "Low stock",
          message: `${product.name} has ${patch.stock} units remaining.`,
          type: "Product Low Stock",
          actionUrl: `/dashboard/products?q=${encodeURIComponent(product.name)}`,
        });
      }
    },
    [addNotification, products, refreshSupabaseData, storeId, supabase, toast],
  );

  const deleteProduct = useCallback(
    (id: EntityId) => {
      const product = products.find((item) => item.id === id);
      setProducts((value) => value.filter((item) => item.id !== id));
      if (supabase) {
        void Promise.resolve(supabase
          .from("products")
          .update({ status: "archived" })
          .eq("id", id)
          .then(({ error }) => {
            if (error) throw error;
            return refreshSupabaseData();
          }))
          .catch((error: unknown) =>
            toast(
              error instanceof Error ? error.message : "Could not delete product.",
              "error",
            ),
          );
      }
      if (product) {
        addNotification({
          title: "Product deleted",
          message: `${product.name} was removed from inventory.`,
          type: "Product Deleted",
          actionUrl: "/dashboard/products",
        });
      }
    },
    [addNotification, products, refreshSupabaseData, supabase, toast],
  );

  const updateCustomer = useCallback(
    (id: EntityId, patch: Partial<Customer>) => {
      const customer = customers.find((item) => item.id === id);
      setCustomers((value) =>
        value.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
      if (supabase) {
        void Promise.resolve(supabase
          .from("customers")
          .update({
            name: patch.name,
            email: patch.email,
            phone: patch.phone,
            city: patch.city,
            address: patch.address,
            notes: patch.notes,
          })
          .eq("id", id)
          .then(({ error }) => {
            if (error) throw error;
            return refreshSupabaseData();
          }))
          .catch((error: unknown) =>
            toast(
              error instanceof Error ? error.message : "Could not update customer.",
              "error",
            ),
          );
      }
      if (customer) {
        addNotification({
          title: "Customer updated",
          message: `${customer.name}'s profile was updated.`,
          type: "Customer Updated",
          actionUrl: "/dashboard/customers",
        });
      }
    },
    [addNotification, customers, refreshSupabaseData, supabase, toast],
  );

  const updateStoreSettings = useCallback(
    (patch: Partial<StoreSettings>) => {
      setStoreSettings((value) => ({ ...value, ...patch }));
      if (supabase && storeId) {
        void Promise.resolve(supabase
          .from("stores")
          .update({
            name: patch.storeName,
            logo_url: patch.logo,
            business_phone: patch.businessPhone,
            business_email: patch.businessEmail,
            country: patch.country,
            currency: patch.currency,
            timezone: patch.timezone,
          })
          .eq("id", storeId)
          .then(({ error }) => {
            if (error) throw error;
            return refreshSupabaseData();
          }))
          .catch((error: unknown) =>
            toast(
              error instanceof Error
                ? error.message
                : "Could not update store settings.",
              "error",
            ),
          );
      }
      addNotification({
        title: "Store settings updated",
        message: "International store settings were saved.",
        type: "Settings Updated",
        actionUrl: "/dashboard/settings",
      });
    },
    [addNotification, refreshSupabaseData, storeId, supabase, toast],
  );

  const value = useMemo<DashboardContextValue>(
    () => ({
      orders,
      products,
      customers,
      loading,
      storeSettings,
      checkoutConfig,
      notifications,
      unreadCount: notifications.filter((item) => !item.isRead).length,
      toasts,
      toast,
      confirm,
      formatMoney: (amount) => formatCurrency(amount, storeSettings.currency),
      addOrder,
      updateOrder,
      deleteOrder,
      addProduct,
      updateProduct,
      deleteProduct,
      updateCustomer,
      updateStoreSettings,
      updateCheckoutConfig: (config) => {
        setCheckoutConfig(config);
        writeStorage(storageKeys.checkout, config);
      },
      addNotification,
      markNotificationRead: (id) => {
        setNotifications((items) =>
          items.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
        );
        if (supabase) {
          supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", id)
            .then(() => undefined);
        }
      },
      markAllNotificationsRead: () => {
        setNotifications((items) =>
          items.map((item) => ({ ...item, isRead: true })),
        );
        if (supabase && storeId) {
          supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("store_id", storeId)
            .then(() => undefined);
        }
      },
      askConfirm: setConfirm,
      closeConfirm: () => setConfirm(null),
      runConfirm: () => {
        confirm?.action();
        setConfirm(null);
      },
    }),
    [
      addNotification,
      addOrder,
      addProduct,
      confirm,
      customers,
      checkoutConfig,
      deleteOrder,
      deleteProduct,
      loading,
      notifications,
      orders,
      products,
      storeId,
      storeSettings,
      supabase,
      toast,
      toasts,
      updateCustomer,
      updateOrder,
      updateProduct,
      updateStoreSettings,
    ],
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
      <DashboardFeedback
        toasts={toasts}
        confirm={confirm}
        close={() => setConfirm(null)}
        run={() => {
          confirm?.action();
          setConfirm(null);
        }}
      />
    </DashboardContext.Provider>
  );
}

function DashboardFeedback({
  toasts,
  confirm,
  close,
  run,
}: {
  toasts: Toast[];
  confirm: ConfirmState;
  close: () => void;
  run: () => void;
}) {
  return (
    <>
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toastItem) => (
          <div
            key={toastItem.id}
            className={`toast toast-${toastItem.tone}`}
          >
            {toastItem.message}
          </div>
        ))}
      </div>
      {confirm && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="confirm-modal card">
            <h2 id="confirm-title">{confirm.title}</h2>
            <p>{confirm.message}</p>
            <div className="modal-foot !px-0 !pb-0">
              <button className="btn-secondary ml-auto" onClick={close}>
                Cancel
              </button>
              <button
                className={
                  confirm.destructive
                    ? "btn-danger ml-2"
                    : "btn-primary ml-2"
                }
                onClick={run}
              >
                {confirm.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function useDashboard() {
  const value = useContext(DashboardContext);
  if (!value) throw new Error("useDashboard must be used inside DashboardProvider");
  return value;
}

export const orderStatuses: OrderStatus[] = [
  "Order Received",
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
];
