/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  CheckoutConfig,
  CheckoutFieldType,
  Customer,
  Notification,
  NotificationType,
  Order,
  OrderStatus,
  Product,
  ProductCustomField,
  ProductStatus,
  StoreSettings,
} from "@/lib/types";

export const statusToUi: Record<string, OrderStatus> = {
  received: "Order Received",
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const statusToDb: Record<OrderStatus, string> = {
  "Order Received": "received",
  Pending: "received",
  Confirmed: "confirmed",
  Packed: "packed",
  Shipped: "shipped",
  Delivered: "delivered",
  Cancelled: "cancelled",
};

export const productStatusToUi: Record<string, ProductStatus> = {
  active: "Active",
  draft: "Draft",
  archived: "Archived",
};

export const productStatusToDb: Record<ProductStatus, string> = {
  Active: "active",
  Draft: "draft",
  Archived: "archived",
};

export const fieldTypeToUi: Record<string, CheckoutFieldType> = {
  text: "Text",
  number: "Number",
  dropdown: "Dropdown",
  checkbox: "Checkbox",
  textarea: "Textarea",
  date: "Date",
};

export const fieldTypeToDb: Record<CheckoutFieldType, string> = {
  Text: "text",
  Number: "number",
  Dropdown: "dropdown",
  Checkbox: "checkbox",
  Textarea: "textarea",
  Date: "date",
};

const notificationTypeToUi: Record<string, NotificationType> = {
  new_order: "New Order",
  order_status_updated: "Order Status Updated",
  product_created: "Product Added",
  product_updated: "Settings Updated",
  product_deleted: "Product Deleted",
  customer_created: "Customer Added",
  customer_updated: "Customer Updated",
  settings_updated: "Settings Updated",
  checkout_page_updated: "Checkout Page Updated",
  checkout_link_copied: "Checkout Link Copied",
  export_completed: "Export Completed",
  plan_limit_reached: "Settings Updated",
};

export function toPlanUi(plan?: string) {
  return plan === "growth" ? "Growth" : plan === "starter" ? "Starter" : "Free";
}

export function toPlanDb(plan?: string) {
  return plan?.toLowerCase() === "growth"
    ? "growth"
    : plan?.toLowerCase() === "starter"
      ? "starter"
      : "free";
}

export function toRelativeTime(value?: string) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  const delta = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(delta / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function formatDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function initials(name?: string) {
  return (name || "OF")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function mapProduct(row: any): Product {
  const options = Array.isArray(row.product_options) ? row.product_options : [];
  const optionValue = (label: string) =>
    options
      .find((option: any) => option.name?.toLowerCase() === label)
      ?.product_option_values?.map((value: any) => value.value) || [];
  const customFields: ProductCustomField[] = (
    Array.isArray(row.product_custom_fields) ? row.product_custom_fields : []
  ).map((field: any) => ({
    id: field.id,
    name: field.label,
    type: fieldTypeToUi[field.type] || "Text",
    options: Array.isArray(field.options) ? field.options : [],
    required: field.required,
    enabled: field.enabled,
  }));
  return {
    id: row.id,
    name: row.name,
    category: row.category || "Other",
    price: Number(row.price || 0),
    image: row.image_url || "",
    status: productStatusToUi[row.status] || "Draft",
    ordersCount: Number(row.orders_count || 0),
    stock: Number(row.stock || 0),
    description: row.description || "",
    variants: options.map((option: any) => ({
      label: option.name,
      values: option.product_option_values?.map((value: any) => value.value) || [],
    })),
    colors: optionValue("color"),
    sizes: optionValue("size"),
    customFields,
    createdAt: formatDate(row.created_at),
    updatedAt: formatDate(row.updated_at),
  };
}

export function mapOrder(row: any): Order {
  const firstItem = Array.isArray(row.order_items) ? row.order_items[0] : null;
  const selected = firstItem?.selected_options || {};
  const selectedCustomFields =
    selected && typeof selected.custom_fields === "object" && !Array.isArray(selected.custom_fields)
      ? selected.custom_fields
      : {};
  const variantParts = [
    selected.Size || selected.size,
    selected.Color || selected.color,
    selected.Variant || selected.variant,
    selected.variant_label,
  ].filter((value) => typeof value === "string" && value.trim());
  const timeline = (Array.isArray(row.order_timeline) ? row.order_timeline : []).map(
    (item: any) => ({
      status: statusToUi[item.status] || "Order Received",
      label: statusToUi[item.status] || "Order Received",
      timestamp: new Date(item.created_at).toLocaleString("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    }),
  );
  return {
    id: row.order_number || row.id,
    orderNumber: row.order_number,
    storeId: row.store_id,
    customer: row.customer_name,
    customerName: row.customer_name,
    initials: initials(row.customer_name),
    phone: row.phone,
    email: row.email || "",
    product: firstItem?.product_name || "Order",
    productId: firstItem?.product_id,
    productName: firstItem?.product_name,
    productImage: firstItem?.product_image_url,
    date: formatDate(row.created_at),
    createdAt: row.created_at,
    amount: Number(row.total_amount || 0),
    totalAmount: Number(row.total_amount || 0),
    status: statusToUi[row.status] || "Order Received",
    address: row.address || "",
    quantity: Number(firstItem?.quantity || 1),
    variant: variantParts.join(" · "),
    size: selected.Size || selected.size || "",
    color: selected.Color || selected.color || "",
    city: row.city || "",
    paymentMethod: "Cash on Delivery",
    notes: row.notes || "",
    productCustomFields: Object.fromEntries(
      Object.entries(selectedCustomFields).map(([key, value]) => [
        key,
        formatFieldValue(value),
      ]),
    ),
    checkoutCustomFields: Object.fromEntries(
      (row.order_custom_field_values || []).map((field: any) => [
        field.field_label,
        formatFieldValue(field.value),
      ]),
    ),
    timeline,
  };
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) return value.map(formatFieldValue).filter(Boolean).join(", ");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${prettyKey(key)}: ${formatFieldValue(item)}`)
      .filter((item) => !item.endsWith(": "))
      .join(", ");
  }
  return String(value);
}

function prettyKey(value: string): string {
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function mapCustomer(row: any): Customer {
  const histories = Array.isArray(row.orders) ? row.orders : [];
  const totalSpent = Number(row.total_spent || 0);
  const ordersCount = Number(row.orders_count || histories.length || 0);
  return {
    id: row.id,
    name: row.name,
    initials: initials(row.name),
    email: row.email || "",
    phone: row.phone,
    country: row.country || "",
    city: row.city || "",
    address: row.address || "",
    ordersCount,
    totalSpent,
    avgTicket: ordersCount ? Math.round(totalSpent / ordersCount) : 0,
    isRepeatCustomer: ordersCount > 1,
    createdAt: formatDate(row.created_at),
    notes: row.notes || "",
    orderHistory: histories.map((order: any) => ({
      id: order.order_number || order.id,
      date: formatDate(order.created_at),
      products: order.order_items?.[0]?.product_name || "Order",
      amount: Number(order.total_amount || 0),
      status: statusToUi[order.status] || "Order Received",
    })),
  };
}

export function mapNotification(row: any): Notification {
  return {
    id: row.id,
    title: row.title,
    message: row.message || "",
    type: notificationTypeToUi[row.type] || "Settings Updated",
    createdAt: toRelativeTime(row.created_at),
    isRead: row.is_read,
    actionUrl: row.action_url || undefined,
  };
}

export function mapStoreSettings(store: any, settings: any): StoreSettings {
  return {
    storeName: store?.name || "",
    businessPhone: store?.business_phone || "",
    businessEmail: store?.business_email || "",
    country: store?.country || "PK",
    currency: store?.currency || "PKR",
    timezone: store?.timezone || "Asia/Karachi",
    phoneFormat: settings?.phone_format || "",
    dateFormat: settings?.date_format || "DD/MM/YYYY",
    logo: store?.logo_url || "",
  };
}

export function mapCheckoutConfig(store: any, page: any, settings: any, fields: any[]): CheckoutConfig {
  return {
    storeId: store?.slug || page?.slug || store?.id || "store-id",
    storeName: store?.name || "Your Store",
    logo: store?.logo_url || "",
    brandColor: settings?.accent_color || "#60A5FA",
    buttonColor: settings?.button_color || "#4F46E5",
    selectedProductId: page?.selected_product_id || "",
    optionalFields: {
      email: settings?.email_field_enabled ?? true,
      referral: settings?.referral_field_enabled ?? false,
      giftNote: settings?.gift_note_field_enabled ?? false,
    },
    customFields: (fields || []).map((field) => ({
      id: field.id,
      label: field.label,
      type: fieldTypeToUi[field.type] || "Text",
      required: field.required,
      enabled: field.enabled,
      options: Array.isArray(field.options) ? field.options : [],
    })),
    codEnabled: settings?.cod_enabled ?? true,
    requirePhone: settings?.phone_required ?? true,
    requireAddress: settings?.address_required ?? true,
    requireCity: settings?.city_required ?? true,
    allowMultipleProducts: settings?.allow_multiple_products ?? false,
    trackingEnabled: settings?.order_tracking_enabled ?? true,
    thankYouMessage: settings?.thank_you_message || "Thanks. Your order has been received.",
    defaultOrderStatus: statusToUi[settings?.default_order_status] || "Order Received",
    updatedAt: page?.updated_at || settings?.updated_at || new Date().toISOString(),
  };
}
