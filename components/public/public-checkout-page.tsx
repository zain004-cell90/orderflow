"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  Store,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/formatters";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  mapCheckoutConfig,
  mapProduct,
  mapStoreSettings,
} from "@/lib/supabase/mappers";
import {
  monthlyOrderCount,
  orderLimitFor,
  readMockStores,
} from "@/lib/mock-auth";
import {
  sanitizeEmail,
  sanitizeMultiline,
  sanitizePhone,
  sanitizeText,
} from "@/lib/validation";
import {
  defaultCheckoutConfig,
} from "@/lib/mock-data";
import {
  readCheckoutConfig,
  readCustomers,
  readNotifications,
  readOrders,
  readProducts,
  readSettings,
  storageKeys,
  writeStorage,
} from "@/lib/storage";
import type {
  CheckoutConfig,
  CheckoutField,
  Customer,
  EntityId,
  Notification,
  Order,
  Product,
  StoreSettings,
} from "@/lib/types";

const initialSettings: StoreSettings = {
  storeName: "The Modern Entrepreneur",
  businessPhone: "+92 300 1234567",
  businessEmail: "support@modernentrepreneur.pk",
  country: "PK",
  currency: "PKR",
  timezone: "Asia/Karachi",
  phoneFormat: "+92 300 1234567",
  dateFormat: "DD/MM/YYYY",
  logo: "",
};
const countryNames: Record<string, string> = {
  PK: "Pakistan",
  IN: "India",
  ID: "Indonesia",
  BR: "Brazil",
  US: "United States",
  GB: "United Kingdom",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
};
type CheckoutCartItem = {
  key: string;
  productId: EntityId;
  quantity: number;
  size: string;
  color: string;
};

export function PublicCheckoutPage({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [config, setConfig] = useState<CheckoutConfig>({
    ...defaultCheckoutConfig,
    storeId,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState(initialSettings);
  const [selectedId, setSelectedId] = useState<EntityId>(
    defaultCheckoutConfig.selectedProductId,
  );
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [cartItems, setCartItems] = useState<CheckoutCartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [limitReached, setLimitReached] = useState(false);
  const formId = "public-checkout-form";
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isSupabaseConfigured()) {
        const supabase = createSupabaseBrowserClient();
        const baseQuery = supabase
          .from("stores")
          .select(
            "*, store_settings(*), checkout_pages(*, checkout_fields(*)), products(*, product_options(*, product_option_values(*)), product_custom_fields(*))",
          );
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            storeId,
          );
        const query = isUuid ? baseQuery.eq("id", storeId) : baseQuery.eq("slug", storeId);
        query
          .maybeSingle()
          .then(({ data, error }) => {
            if (error) {
              setErrors({
                form: "Could not load this checkout page. Please refresh or contact the seller.",
              });
              setReady(true);
              return;
            }
            if (!data) {
              setReady(true);
              return;
            }
            const settingsRow = Array.isArray(data.store_settings)
              ? data.store_settings[0]
              : data.store_settings;
            const page = Array.isArray(data.checkout_pages)
              ? data.checkout_pages[0]
              : data.checkout_pages;
            const loadedProducts: Product[] = (data.products || []).map(mapProduct);
            setConfig(
              page
                ? mapCheckoutConfig(data, page, settingsRow, page.checkout_fields || [])
                : { ...defaultCheckoutConfig, storeId: data.slug || data.id, storeName: data.name },
            );
            setProducts(loadedProducts);
            setSettings(mapStoreSettings(data, settingsRow));
            const firstActive = loadedProducts.find((item) => item.status === "Active");
            setSelectedId(page?.selected_product_id || firstActive?.id || "");
            setReady(true);
          });
        return;
      }
      const saved = readCheckoutConfig({ ...defaultCheckoutConfig, storeId });
      const loadedProducts = readProducts([]);
      setConfig({ ...saved, storeId });
      setProducts(loadedProducts);
      setSettings(readSettings(initialSettings));
      setSelectedId(saved.selectedProductId || loadedProducts[0]?.id || 0);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [storeId]);
  const activeProducts = useMemo(
    () => products.filter((x) => x.status === "Active"),
    [products],
  );
  const product =
    activeProducts.find((x) => sameId(x.id, selectedId)) || activeProducts[0];
  const checkoutItems = useMemo(() => {
    if (!config.allowMultipleProducts) {
      return product
        ? [
            {
              item: {
                key: "single",
                productId: product.id,
                quantity,
                size,
                color,
              },
              product,
            },
          ]
        : [];
    }
    return cartItems
      .map((item) => ({
        item,
        product: activeProducts.find((value) => sameId(value.id, item.productId)),
      }))
      .filter(
        (value): value is { item: CheckoutCartItem; product: Product } =>
          Boolean(value.product),
      );
  }, [activeProducts, cartItems, color, config.allowMultipleProducts, product, quantity, size]);
  const total = checkoutItems.reduce(
    (sum, { item, product }) => sum + product.price * item.quantity,
    0,
  );
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSize(product?.sizes[0] || "");
      setColor(product?.colors[0] || "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [product?.id, product?.sizes, product?.colors]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!activeProducts.length) {
        setCartItems([]);
        return;
      }
      setCartItems((items) => {
        const valid = items.filter((item) =>
          activeProducts.some((product) => sameId(product.id, item.productId)),
        );
        if (valid.length) return valid;
        return [createCartItem(product || activeProducts[0])];
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeProducts, product]);
  const setPrimaryProduct = (value: EntityId) => {
    setSelectedId(value);
    if (!config.allowMultipleProducts) return;
    const nextProduct = activeProducts.find((item) => sameId(item.id, value));
    if (!nextProduct) return;
    setCartItems((items) =>
      items.length
        ? [
            {
              ...items[0],
              productId: value,
              size: nextProduct.sizes[0] || "",
              color: nextProduct.colors[0] || "",
            },
            ...items.slice(1),
          ]
        : [createCartItem(nextProduct)],
    );
  };
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!checkoutItems.length) {
      setErrors({ form: "No active product is available for this checkout page." });
      return;
    }
    const storedOrders = readOrders([]);
    const store =
      readMockStores().find((item) => item.id === storeId) ||
      readMockStores().find((item) => item.id === "store-id");
    const storeOrders = storedOrders.filter(
      (order) => !order.storeId || order.storeId === storeId,
    );
    if (!isSupabaseConfigured() &&
      monthlyOrderCount(storeOrders) >= orderLimitFor(store?.plan || "Free")
    ) {
      setLimitReached(true);
      return;
    }
    const data = new FormData(e.currentTarget);
    const required = {
      customerName: sanitizeText(data.get("customerName"), 80),
      phone: sanitizePhone(data.get("phone")),
      city: sanitizeText(data.get("city"), 80),
      address: sanitizeMultiline(data.get("address"), 300),
    };
    const nextErrors: Record<string, string> = {};
    if (!required.customerName)
      nextErrors.customerName = "This field is required.";
    if (config.requirePhone && !required.phone)
      nextErrors.phone = "This field is required.";
    if (config.requireCity && !required.city)
      nextErrors.city = "This field is required.";
    if (config.requireAddress && !required.address)
      nextErrors.address = "This field is required.";
    if (required.phone && required.phone.replace(/\D/g, "").length < 6)
      nextErrors.phone = "Enter a valid phone number.";
    const submittedAt = new Date();
    const orderPhone =
      required.phone || `NO-PHONE-${submittedAt.getTime().toString(36)}`;
    config.customFields
      .filter((x) => x.enabled && x.required)
      .forEach((field) => {
        if (!data.get(`checkout-${field.id}`))
          nextErrors[`checkout-${field.id}`] = "This field is required.";
      });
    checkoutItems.forEach(({ item, product }) => {
      product.customFields
        .filter((field) => (field.enabled ?? true) && field.required)
        .forEach((field) => {
          const key = productFieldName(
            item.key,
            field.id,
            config.allowMultipleProducts,
          );
          if (!data.get(key)) nextErrors[key] = "This field is required.";
        });
      });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    const nextNumber =
      Math.max(
        1000,
        ...storedOrders.map(
          (order) =>
            Number((order.orderNumber || order.id).replace(/\D/g, "")) || 0,
        ),
      ) + 1;
    const orderNumber = `ORD-${nextNumber}`;
    const now = submittedAt;
    const orderItems = checkoutItems.map(({ item, product }) => {
      const productFields = Object.fromEntries(
        product.customFields
          .filter((field) => field.enabled ?? true)
          .map((field) => [
            field.name,
            sanitizeText(
              data.get(
                productFieldName(
                  item.key,
                  field.id,
                  config.allowMultipleProducts,
                ),
              ),
              200,
            ),
          ]),
      );
      return {
        item,
        product,
        productFields,
        lineTotal: product.price * item.quantity,
        variant:
          [item.size, item.color].filter(Boolean).join(" · ") || "Standard",
      };
    });
    const firstLine = orderItems[0];
    const productFields = firstLine?.productFields || {};
    const productSummary =
      orderItems.map(({ item, product }) => `${item.quantity} × ${product.name}`).join(", ") ||
      firstLine?.product.name ||
      "Order items";
    const checkoutFields = Object.fromEntries(
      config.customFields
        .filter((field) => field.enabled)
        .map((field) => [
          field.label || field.id,
          sanitizeText(data.get(`checkout-${field.id}`), 300),
        ]),
    );
    const email = sanitizeEmail(data.get("email"));
    const order: Order = {
      id: orderNumber,
      orderNumber,
      storeId,
      customer: required.customerName,
      customerName: required.customerName,
      initials: initials(required.customerName),
      phone: orderPhone,
      email,
      product: productSummary,
      productId: firstLine.product.id,
      productName: productSummary,
      productImage: firstLine.product.image,
      date: now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      createdAt: now.toISOString(),
      amount: total,
      totalAmount: total,
      status: config.defaultOrderStatus,
      address: required.address,
      quantity: orderItems.reduce((sum, { item }) => sum + item.quantity, 0),
      variant: [size, color].filter(Boolean).join(" · ") || "Standard",
      size: orderItems.length > 1 ? "" : firstLine.item.size,
      color: orderItems.length > 1 ? "" : firstLine.item.color,
      city: required.city,
      paymentMethod: "Cash on Delivery",
      notes: sanitizeMultiline(data.get("giftNote"), 500),
      productCustomFields: productFields,
      checkoutCustomFields: checkoutFields,
      timeline: [
        {
          status: "Received",
          label: "Order Received",
          timestamp: now.toLocaleString(),
        },
      ],
    };
    if (isSupabaseConfigured()) {
      try {
        const supabase = createSupabaseBrowserClient();
        // Public checkout writes orders only through RPC so private seller tables stay protected by RLS.
        const { data: created, error } = await supabase.rpc("create_checkout_order", {
          payload: {
            store_slug: storeId,
            customer: {
              name: required.customerName,
              phone: orderPhone,
              email,
              city: required.city,
              address: required.address,
            },
            notes: order.notes,
            items: orderItems.map(
              ({ item, product, productFields, lineTotal, variant }) => ({
                product_id: product.id,
                product_name: product.name,
                product_image: product.image,
                quantity: item.quantity,
                unit_price: product.price,
                total_price: lineTotal,
                size: item.size,
                color: item.color,
                variant_label: variant,
                custom_fields: productFields,
              }),
            ),
            checkout_custom_fields: checkoutFields,
          },
        });
        if (error) {
          if (error.message.toLowerCase().includes("order limit")) {
            setLimitReached(true);
            setSubmitting(false);
            return;
          }
          throw error;
        }
        const orderNumber = (created as { order_number?: string })?.order_number || order.orderNumber;
        window.sessionStorage.setItem("orderflow.last-order", orderNumber || "");
        window.sessionStorage.setItem(
          "orderflow.last-checkout-config",
          JSON.stringify(config),
        );
        router.push(`/checkout/success?orderId=${encodeURIComponent(orderNumber || "")}&store=${encodeURIComponent(storeId)}&phone=${encodeURIComponent(orderPhone)}`);
        return;
      } catch (error) {
        setErrors({
          form:
            error instanceof Error
              ? error.message
              : "Could not submit this order. Please try again.",
        });
        setSubmitting(false);
        return;
      }
    }
    writeStorage(storageKeys.orders, [order, ...storedOrders]);
    const storedCustomers = readCustomers([]);
    const existing = storedCustomers.find(
      (x) => normalizePhone(x.phone) === normalizePhone(orderPhone),
    );
    let nextCustomers: Customer[];
    if (existing) {
      const ordersCount = existing.ordersCount + 1,
        totalSpent = existing.totalSpent + total;
      nextCustomers = storedCustomers.map((customer) =>
        customer.id === existing.id
          ? {
              ...customer,
              name: required.customerName,
              email: email || customer.email,
              city: required.city,
              address: required.address,
              ordersCount,
              totalSpent,
              avgTicket: Math.round(totalSpent / ordersCount),
              isRepeatCustomer: true,
              orderHistory: [
                {
                  id: orderNumber,
                  date: order.date,
                  products: productSummary,
                  amount: total,
                  status: config.defaultOrderStatus,
                },
                ...customer.orderHistory,
              ],
            }
          : customer,
      );
    } else {
      nextCustomers = [
        {
          id: orderNumber,
          name: required.customerName,
          initials: initials(required.customerName),
          email,
          phone: orderPhone,
          country: countryNames[settings.country] || "",
          city: required.city,
          address: required.address,
          ordersCount: 1,
          totalSpent: total,
          avgTicket: total,
          isRepeatCustomer: false,
          createdAt: order.date,
          notes: "",
          orderHistory: [
            {
              id: orderNumber,
              date: order.date,
              products: productSummary,
              amount: total,
              status: config.defaultOrderStatus,
            },
          ],
        },
        ...storedCustomers,
      ];
    }
    writeStorage(storageKeys.customers, nextCustomers);
    writeStorage(
      storageKeys.products,
      products.map((item) =>
        orderItems.some((line) => sameId(line.product.id, item.id))
          ? {
              ...item,
              ordersCount:
                item.ordersCount +
                orderItems
                  .filter((line) => sameId(line.product.id, item.id))
                  .reduce((sum, line) => sum + line.item.quantity, 0),
              stock: Math.max(
                0,
                item.stock -
                  orderItems
                    .filter((line) => sameId(line.product.id, item.id))
                    .reduce((sum, line) => sum + line.item.quantity, 0),
              ),
            }
          : item,
      ),
    );
    const storedNotifications = readNotifications([]);
    const notification: Notification = {
      id: `public-order-${orderNumber}`,
      title: "New order received",
      message: `${required.customerName} placed ${orderNumber}.`,
      type: "New Order",
      createdAt: "Just now",
      isRead: false,
      actionUrl: `/dashboard/orders?order=${orderNumber}`,
    };
    writeStorage(storageKeys.notifications, [
      notification,
      ...storedNotifications,
    ]);
    window.sessionStorage.setItem("orderflow.last-order", orderNumber);
    window.sessionStorage.setItem(
      "orderflow.last-checkout-config",
      JSON.stringify(config),
    );
    router.push(`/checkout/success?orderId=${encodeURIComponent(orderNumber)}`);
  };
  if (!ready) return <PublicCheckoutSkeleton />;
  if (limitReached)
    return (
      <main
        className="public-checkout-page"
        style={
          {
            "--checkout-accent": config.brandColor,
            "--checkout-button": config.buttonColor,
          } as React.CSSProperties
        }
      >
        <header className="public-checkout-header">
          <Link href="/" className="checkout-public-brand">
            <i>
              <Store size={18} />
            </i>
            <b>{config.storeName}</b>
          </Link>
          {config.trackingEnabled && (
            <Link className="public-track-link" href="/track">
              Track Order
            </Link>
          )}
        </header>
        <section className="public-limit-state card">
          <Package size={34} />
          <h1>This store cannot accept more orders this month.</h1>
          <p>
            The seller has reached their monthly OrderFlow order limit. Please
            contact them directly or try again next month.
          </p>
          <Link className="btn-primary" href="/contact">
            Contact support
          </Link>
        </section>
      </main>
    );
  return (
    <main
      className="public-checkout-page"
      style={
        {
          "--checkout-accent": config.brandColor,
          "--checkout-button": config.buttonColor,
        } as React.CSSProperties
      }
    >
      <header className="public-checkout-header">
        <Link href="/" className="checkout-public-brand">
          {config.logo ? (
            <span style={{ backgroundImage: `url(${config.logo})` }} />
          ) : (
            <i>
              <Store size={18} />
            </i>
          )}
          <b>{config.storeName}</b>
        </Link>
        {config.trackingEnabled && (
          <Link className="public-track-link" href="/track">
            Track Order
          </Link>
        )}
      </header>
      <div className="public-checkout-shell">
        <section className="public-product-panel">
          <span className="checkout-kicker">Cash on Delivery</span>
          <h1>Complete your order</h1>
          <p>
            Select your product and enter delivery details. No online payment is
            required.
          </p>
          <label className="public-field">
            <span>Product</span>
            <select
              value={product?.id || 0}
              onChange={(e) => setPrimaryProduct(e.target.value)}
              disabled={!activeProducts.length}
            >
              {activeProducts.length ? (
                activeProducts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))
              ) : (
                <option value="">No active products yet</option>
              )}
            </select>
          </label>
          {!activeProducts.length && (
            <div className="public-error public-form-error" role="alert">
              This store has no active products available right now.
            </div>
          )}
          {product && (
            <div className="public-product-card">
              <div
                className="public-product-image"
                style={{ backgroundImage: `url(${product.image})` }}
              >
                {!product.image && <Package size={40} />}
              </div>
              <div>
                <h2>{product.name}</h2>
                <strong>
                  {formatCurrency(product.price, settings.currency)}
                </strong>
                <p>{product.description}</p>
              </div>
            </div>
          )}
          {config.allowMultipleProducts ? (
            <MultiProductSelector
              products={activeProducts}
              items={cartItems}
              errors={errors}
              formId={formId}
              onChange={setCartItems}
            />
          ) : (
          <div className="public-option-grid">
            {product?.sizes.length ? (
              <label className="public-field">
                <span>Size</span>
                <select value={size} onChange={(e) => setSize(e.target.value)}>
                  {product.sizes.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            ) : null}
            {product?.colors.length ? (
              <label className="public-field">
                <span>Color</span>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                >
                  {product.colors.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="public-field">
              <span>Quantity</span>
              <span className="quantity-control">
                <button
                  type="button"
                  onClick={() => setQuantity((x) => Math.max(1, x - 1))}
                >
                  <Minus size={14} />
                </button>
                <b>{quantity}</b>
                <button type="button" onClick={() => setQuantity((x) => x + 1)}>
                  <Plus size={14} />
                </button>
              </span>
            </label>
            {product?.customFields
              .filter((field) => field.enabled ?? true)
              .map((field) => (
                <DynamicField
                  key={field.id}
                  field={{
                    id: field.id,
                    label: field.name,
                    type: field.type,
                    required: field.required || false,
                    enabled: field.enabled ?? true,
                    options: field.options,
                  }}
                  name={`product-${field.id}`}
                  error={errors[`product-${field.id}`]}
                  formId={formId}
                />
              ))}
          </div>
          )}
        </section>
        <form id={formId} className="public-customer-form" onSubmit={submit}>
          <div className="public-form-head">
            <div>
              <h2>Delivery details</h2>
              <p>Fields marked with * are required.</p>
            </div>
            <ShieldCheck size={24} />
          </div>
          {errors.form && (
            <div className="public-error public-form-error" role="alert">
              {errors.form}
            </div>
          )}
          <div className="public-form-grid">
            <PublicInput
              name="customerName"
              label="Full Name *"
              error={errors.customerName}
            />
            <PublicInput
              name="phone"
              label={`Phone Number${config.requirePhone ? " *" : ""}`}
              inputMode="tel"
              error={errors.phone}
            />
            <PublicInput
              name="city"
              label={`City${config.requireCity ? " *" : ""}`}
              error={errors.city}
            />
            <PublicInput
              name="address"
              label={`Complete Address${config.requireAddress ? " *" : ""}`}
              textarea
              full
              error={errors.address}
            />
            {config.optionalFields.email && (
              <PublicInput name="email" label="Email" type="email" />
            )}
            {config.optionalFields.referral && (
              <PublicInput name="referral" label="How did you hear about us?" />
            )}
            {config.optionalFields.giftNote && (
              <PublicInput name="giftNote" label="Gift Note" textarea full />
            )}
            {config.customFields
              .filter((x) => x.enabled)
              .map((field) => (
                <DynamicField
                  key={field.id}
                  field={field}
                  name={`checkout-${field.id}`}
                  error={errors[`checkout-${field.id}`]}
                />
              ))}
          </div>
          <div className="public-cod-notice">
            <CheckCircle2 size={20} />
            <span>
              <b>{config.codEnabled ? "Cash on Delivery" : "Manual Order"}</b>
              <small>
                {config.codEnabled
                  ? "Payment will be collected when your order is delivered."
                  : "The seller will contact you to confirm payment and delivery."}
              </small>
            </span>
          </div>
          <div className="public-total">
            <span>Total Amount</span>
            <strong>{formatCurrency(total, settings.currency)}</strong>
          </div>
          <button className="public-confirm-button" disabled={submitting || !product}>
            {submitting
              ? "Submitting order..."
              : config.codEnabled
                ? "Confirm COD Order"
                : "Confirm Order"}
          </button>
          <p className="public-form-foot">
            By confirming, you agree that the seller may contact you about this
            order.
          </p>
        </form>
      </div>
    </main>
  );
}

function MultiProductSelector({
  products,
  items,
  errors,
  formId,
  onChange,
}: {
  products: Product[];
  items: CheckoutCartItem[];
  errors: Record<string, string>;
  formId: string;
  onChange: (items: CheckoutCartItem[]) => void;
}) {
  const updateItem = (key: string, patch: Partial<CheckoutCartItem>) => {
    onChange(items.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };
  const chooseProduct = (key: string, productId: EntityId) => {
    const product = products.find((item) => sameId(item.id, productId));
    if (!product) return;
    updateItem(key, {
      productId,
      size: product.sizes[0] || "",
      color: product.colors[0] || "",
    });
  };
  const addItem = () => {
    const product = products[0];
    if (!product) return;
    onChange([...items, createCartItem(product)]);
  };
  const removeItem = (key: string) => {
    if (items.length <= 1) return;
    onChange(items.filter((item) => item.key !== key));
  };
  if (!products.length) return null;
  return (
    <div className="public-multi-products">
      <div className="builder-heading">
        <div>
          <h4>Products in this order</h4>
          <p>Add one or more products before confirming your order.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={addItem}>
          <Plus size={13} />
          Add Product
        </button>
      </div>
      {items.map((item, index) => {
        const product =
          products.find((value) => sameId(value.id, item.productId)) || products[0];
        return (
          <article className="public-cart-item" key={item.key}>
            <div className="public-cart-head">
              <b>Product {index + 1}</b>
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(item.key)}>
                  Remove
                </button>
              )}
            </div>
            <div className="public-option-grid">
              <label className="public-field">
                <span>Product</span>
                <select
                  value={product.id}
                  onChange={(e) => chooseProduct(item.key, e.target.value)}
                >
                  {products.map((value) => (
                    <option key={value.id} value={value.id}>
                      {value.name}
                    </option>
                  ))}
                </select>
              </label>
              {product.sizes.length ? (
                <label className="public-field">
                  <span>Size</span>
                  <select
                    value={item.size}
                    onChange={(e) => updateItem(item.key, { size: e.target.value })}
                  >
                    {product.sizes.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              ) : null}
              {product.colors.length ? (
                <label className="public-field">
                  <span>Color</span>
                  <select
                    value={item.color}
                    onChange={(e) => updateItem(item.key, { color: e.target.value })}
                  >
                    {product.colors.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="public-field">
                <span>Quantity</span>
                <span className="quantity-control">
                  <button
                    type="button"
                    onClick={() =>
                      updateItem(item.key, {
                        quantity: Math.max(1, item.quantity - 1),
                      })
                    }
                  >
                    <Minus size={14} />
                  </button>
                  <b>{item.quantity}</b>
                  <button
                    type="button"
                    onClick={() =>
                      updateItem(item.key, { quantity: item.quantity + 1 })
                    }
                  >
                    <Plus size={14} />
                  </button>
                </span>
              </label>
              {product.customFields
                .filter((field) => field.enabled ?? true)
                .map((field) => (
                  <DynamicField
                    key={`${item.key}-${field.id}`}
                    field={{
                      id: field.id,
                      label: field.name,
                      type: field.type,
                      required: field.required || false,
                      enabled: field.enabled ?? true,
                      options: field.options,
                    }}
                    name={productFieldName(item.key, field.id, true)}
                    error={errors[productFieldName(item.key, field.id, true)]}
                    formId={formId}
                  />
                ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function PublicInput({
  name,
  label,
  error,
  type = "text",
  textarea = false,
  full = false,
  inputMode,
}: {
  name: string;
  label: string;
  error?: string;
  type?: string;
  textarea?: boolean;
  full?: boolean;
  inputMode?: "tel";
}) {
  const errorId = `${name}-error`;
  return (
    <label className={`public-field ${full ? "full" : ""}`}>
      <span>{label}</span>
      {textarea ? (
        <textarea
          name={name}
          maxLength={1000}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
      ) : (
        <input
          name={name}
          type={type}
          inputMode={inputMode}
          maxLength={type === "email" ? 254 : 160}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
      )}{" "}
      {error && (
        <small id={errorId} role="alert" className="public-error">
          {error}
        </small>
      )}
    </label>
  );
}
function DynamicField({
  field,
  name,
  error,
  formId,
}: {
  field: CheckoutField;
  name: string;
  error?: string;
  formId?: string;
}) {
  const errorId = `${name}-error`;
  return (
    <label
      className={`public-field ${field.type === "Textarea" ? "full" : ""}`}
    >
      <span>
        {field.label}
        {field.required ? " *" : ""}
      </span>
      {field.type === "Dropdown" ? (
        <select
          name={name}
          form={formId}
          defaultValue=""
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        >
          <option value="">Select an option</option>
          {field.options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : field.type === "Checkbox" ? (
        <span className="public-checkbox">
          <input
            type="checkbox"
            name={name}
            form={formId}
            value="Yes"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />{" "}
          Yes
        </span>
      ) : field.type === "Textarea" ? (
        <textarea
          name={name}
          form={formId}
          maxLength={1000}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
      ) : (
        <input
          name={name}
          form={formId}
          maxLength={300}
          type={
            field.type === "Number"
              ? "number"
              : field.type === "Date"
                ? "date"
                : "text"
          }
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
      )}{" "}
      {error && (
        <small id={errorId} role="alert" className="public-error">
          {error}
        </small>
      )}
    </label>
  );
}
function createCartItem(product: Product): CheckoutCartItem {
  return {
    key: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    productId: product.id,
    quantity: 1,
    size: product.sizes[0] || "",
    color: product.colors[0] || "",
  };
}
function productFieldName(
  itemKey: string,
  fieldId: string,
  multiple: boolean,
) {
  return multiple ? `product-${itemKey}-${fieldId}` : `product-${fieldId}`;
}
function sameId(left: EntityId, right: EntityId) {
  return String(left) === String(right);
}
function initials(name: string) {
  return name
    .split(/\s+/)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}
function PublicCheckoutSkeleton() {
  return (
    <main className="public-checkout-page">
      <div className="public-checkout-shell">
        <div className="skeleton-panel" />
        <div className="skeleton-panel" />
      </div>
    </main>
  );
}
