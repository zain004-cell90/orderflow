/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CheckoutConfig,
  Customer,
  Notification,
  Order,
  OrderStatus,
  Product,
  StoreSettings,
} from "@/lib/types";
import {
  fieldTypeToDb,
  mapCheckoutConfig,
  mapCustomer,
  mapNotification,
  mapOrder,
  mapProduct,
  mapStoreSettings,
  productStatusToDb,
  statusToDb,
  toPlanDb,
} from "./mappers";
import { isInvalidRefreshTokenError } from "./errors";

export type DashboardData = {
  store: any | null;
  profile: any | null;
  subscription: any | null;
  checkoutPage: any | null;
  checkoutConfig: CheckoutConfig | null;
  storeSettings: StoreSettings | null;
  orders: Order[];
  products: Product[];
  customers: Customer[];
  notifications: Notification[];
};

export async function loadDashboardData(
  supabase: SupabaseClient,
): Promise<DashboardData> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    if (isInvalidRefreshTokenError(userError)) {
      throw new Error("Your session expired. Please log in again.");
    }
    throw userError;
  }
  const user = userData.user;
  if (!user) throw new Error("You must be logged in.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (profileError) throw profileError;

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("*, store_settings(*), subscriptions(*)")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (storeError) throw storeError;

  if (!store) {
    return {
      store: null,
      profile,
      subscription: null,
      checkoutPage: null,
      checkoutConfig: null,
      storeSettings: null,
      orders: [],
      products: [],
      customers: [],
      notifications: [],
    };
  }

  const [productsResult, ordersResult, customersResult, notificationsResult, pageResult] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          "*, product_options(*, product_option_values(*)), product_custom_fields(*)",
        )
        .eq("store_id", store.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select(
          "*, order_items(*), order_timeline(*), order_custom_field_values(*)",
        )
        .eq("store_id", store.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("customers")
        .select("*, orders(*, order_items(*))")
        .eq("store_id", store.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("notifications")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("checkout_pages")
        .select("*, checkout_fields(*)")
        .eq("store_id", store.id)
        .maybeSingle(),
    ]);

  for (const result of [
    productsResult,
    ordersResult,
    customersResult,
    notificationsResult,
    pageResult,
  ]) {
    if (result.error) throw result.error;
  }

  const settings = Array.isArray(store.store_settings)
    ? store.store_settings[0]
    : store.store_settings;
  const subscription = Array.isArray(store.subscriptions)
    ? store.subscriptions[0]
    : store.subscriptions;
  const checkoutPage = pageResult.data;

  return {
    store,
    profile,
    subscription,
    checkoutPage,
    storeSettings: mapStoreSettings(store, settings),
    checkoutConfig: checkoutPage
      ? mapCheckoutConfig(
          store,
          checkoutPage,
          settings,
          checkoutPage.checkout_fields || [],
        )
      : null,
    products: (productsResult.data || []).map(mapProduct),
    orders: (ordersResult.data || []).map(mapOrder),
    customers: (customersResult.data || []).map(mapCustomer),
    notifications: (notificationsResult.data || []).map(mapNotification),
  };
}

export async function createOrUpdateStoreFromOnboarding(
  supabase: SupabaseClient,
  input: {
    storeName: string;
    country: string;
    currency: string;
    timezone: string;
    phoneFormat: string;
    dateFormat: string;
    businessPhone?: string;
    businessEmail?: string;
    category?: string;
    logoUrl?: string;
    requirePhone: boolean;
    requireAddress: boolean;
    trackingEnabled: boolean;
  },
) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    if (isInvalidRefreshTokenError(userError)) {
      throw new Error("Your session expired. Please log in again.");
    }
    throw userError;
  }
  const user = userData.user;
  if (!user) throw new Error("You must be logged in.");

  const slug = slugify(input.storeName || `${user.email?.split("@")[0]} store`);
  const { data: existing } = await supabase
    .from("stores")
    .select("id, slug")
    .eq("owner_id", user.id)
    .maybeSingle();

  const storePayload = {
    owner_id: user.id,
    name: input.storeName,
    slug: existing?.slug || slug,
    logo_url: input.logoUrl || null,
    country: input.country,
    currency: input.currency,
    timezone: input.timezone,
    business_phone: input.businessPhone || null,
    business_email: input.businessEmail || null,
    category: input.category || null,
    is_setup_complete: true,
  };

  const { data: store, error: storeError } = existing
    ? await supabase
        .from("stores")
        .update(storePayload)
        .eq("id", existing.id)
        .select("*")
        .single()
    : await supabase.from("stores").insert(storePayload).select("*").single();
  if (storeError) throw storeError;

  const { error: settingsError } = await supabase.from("store_settings").upsert(
    {
      store_id: store.id,
      phone_required: input.requirePhone,
      address_required: input.requireAddress,
      city_required: true,
      order_tracking_enabled: input.trackingEnabled,
      cod_enabled: true,
      thank_you_message:
        "Thanks. Your order has been received. The seller will confirm it soon.",
      date_format: input.dateFormat,
      phone_format: input.phoneFormat,
    },
    { onConflict: "store_id" },
  );
  if (settingsError) throw settingsError;

  const { error: pageError } = await supabase.from("checkout_pages").upsert(
    {
      store_id: store.id,
      slug: store.slug,
      title: `${store.name} Checkout`,
      is_active: true,
    },
    { onConflict: "store_id" },
  );
  if (pageError) throw pageError;

  const { error: subscriptionError } = await supabase.from("subscriptions").upsert(
    {
      store_id: store.id,
      plan: "free",
      status: "active",
      orders_limit: 25,
    },
    { onConflict: "store_id" },
  );
  if (subscriptionError) throw subscriptionError;

  return store;
}

export async function saveProduct(
  supabase: SupabaseClient,
  storeId: string,
  values: Partial<Product>,
  productId?: string | number,
) {
  const payload = {
    store_id: storeId,
    name: values.name,
    category: values.category,
    price: values.price,
    description: values.description,
    image_url: values.image,
    status: productStatusToDb[values.status || "Draft"],
    stock: values.stock || 0,
  };
  const { data: product, error } = productId
    ? await supabase
        .from("products")
        .update(payload)
        .eq("id", productId)
        .select("*")
        .single()
    : await supabase.from("products").insert(payload).select("*").single();
  if (error) throw error;

  await replaceProductOptions(supabase, product.id, "Size", values.sizes || []);
  await replaceProductOptions(supabase, product.id, "Color", values.colors || []);
  await replaceProductCustomFields(supabase, product.id, values.customFields || []);
  return product;
}

async function replaceProductOptions(
  supabase: SupabaseClient,
  productId: string,
  name: string,
  values: string[],
) {
  const { data: existing } = await supabase
    .from("product_options")
    .select("id")
    .eq("product_id", productId)
    .eq("name", name)
    .maybeSingle();
  if (!values.length) {
    if (existing) await supabase.from("product_options").delete().eq("id", existing.id);
    return;
  }
  const { data: option, error } = await supabase
    .from("product_options")
    .upsert(
      { id: existing?.id, product_id: productId, name, type: "dropdown" },
      { onConflict: "id" },
    )
    .select("id")
    .single();
  if (error) throw error;
  await supabase.from("product_option_values").delete().eq("option_id", option.id);
  if (values.length) {
    const { error: valuesError } = await supabase
      .from("product_option_values")
      .insert(values.map((value) => ({ option_id: option.id, value })));
    if (valuesError) throw valuesError;
  }
}

async function replaceProductCustomFields(
  supabase: SupabaseClient,
  productId: string,
  fields: Product["customFields"],
) {
  await supabase.from("product_custom_fields").delete().eq("product_id", productId);
  if (!fields.length) return;
  const { error } = await supabase.from("product_custom_fields").insert(
    fields.map((field, index) => ({
      product_id: productId,
      label: field.name,
      type: fieldTypeToDb[field.type],
      required: field.required || false,
      enabled: field.enabled ?? true,
      options: field.options,
      sort_order: index,
    })),
  );
  if (error) throw error;
}

export async function updateOrderStatus(
  supabase: SupabaseClient,
  orderNumberOrId: string,
  status: OrderStatus,
) {
  const dbStatus = statusToDb[status];
  const { data: order, error } = await supabase
    .from("orders")
    .update({ status: dbStatus })
    .or(`id.eq.${orderNumberOrId},order_number.eq.${orderNumberOrId}`)
    .select("id, store_id, order_number")
    .single();
  if (error) throw error;
  await supabase.from("order_timeline").insert({
    order_id: order.id,
    status: dbStatus,
    note: `Status updated to ${status}.`,
  });
  await supabase.from("notifications").insert({
    store_id: order.store_id,
    title: "Order status updated",
    message: `${order.order_number} is now ${status}.`,
    type: "order_status_updated",
    action_url: `/dashboard/orders?order=${order.order_number}`,
  });
}

export async function saveCheckoutConfig(
  supabase: SupabaseClient,
  storeId: string,
  checkoutPageId: string,
  config: CheckoutConfig,
) {
  const { error: storeError } = await supabase
    .from("stores")
    .update({ name: config.storeName, logo_url: config.logo || null })
    .eq("id", storeId);
  if (storeError) throw storeError;
  const { error: settingsError } = await supabase
    .from("store_settings")
    .update({
      button_color: config.buttonColor,
      accent_color: config.brandColor,
      phone_required: config.requirePhone,
      address_required: config.requireAddress,
      city_required: config.requireCity,
      allow_multiple_products: config.allowMultipleProducts,
      order_tracking_enabled: config.trackingEnabled,
      cod_enabled: config.codEnabled,
      thank_you_message: config.thankYouMessage,
      default_order_status: statusToDb[config.defaultOrderStatus],
    })
    .eq("store_id", storeId);
  if (settingsError) throw settingsError;
  const { error: pageError } = await supabase
    .from("checkout_pages")
    .update({ selected_product_id: config.selectedProductId || null })
    .eq("id", checkoutPageId);
  if (pageError) throw pageError;
  await supabase.from("checkout_fields").delete().eq("checkout_page_id", checkoutPageId);
  if (config.customFields.length) {
    const { error: fieldsError } = await supabase.from("checkout_fields").insert(
      config.customFields.map((field, index) => ({
        checkout_page_id: checkoutPageId,
        label: field.label,
        type: fieldTypeToDb[field.type],
        required: field.required,
        enabled: field.enabled,
        options: field.options,
        sort_order: index,
      })),
    );
    if (fieldsError) throw fieldsError;
  }
}

export async function uploadImage(
  supabase: SupabaseClient,
  bucket: "store-logos" | "product-images",
  userId: string,
  file: File,
) {
  const extension = file.name.split(".").pop() || "png";
  const path = `${userId}/${Date.now()}-${Math.random().toString(16).slice(2)}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export function slugify(value: string) {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "store"}-${Math.random().toString(36).slice(2, 7)}`;
}

export function toNotificationDbType(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes("export")) return "export_completed";
  if (normalized.includes("checkout link")) return "checkout_link_copied";
  if (normalized.includes("checkout")) return "checkout_page_updated";
  if (normalized.includes("order status")) return "order_status_updated";
  if (normalized.includes("new order")) return "new_order";
  if (normalized.includes("product added")) return "product_created";
  if (normalized.includes("product deleted")) return "product_deleted";
  if (normalized.includes("customer added")) return "customer_created";
  if (normalized.includes("customer updated")) return "customer_updated";
  return "settings_updated";
}

export { toPlanDb };
