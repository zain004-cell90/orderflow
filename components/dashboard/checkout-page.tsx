"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  Check,
  ExternalLink,
  ImageUp,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { defaultCheckoutConfig } from "@/lib/mock-data";
import { readCheckoutConfig, storageKeys, writeStorage } from "@/lib/storage";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { saveCheckoutConfig } from "@/lib/supabase/data";
import type {
  CheckoutConfig,
  CheckoutField,
  CheckoutFieldType,
  Product,
} from "@/lib/types";
import { sanitizeMultiline, sanitizeText } from "@/lib/validation";
import { DashboardShell } from "./dashboard-shell";
import { useDashboard } from "./dashboard-store";
import { ProfileCompletionModal } from "./profile-gate";

const fieldTypes: CheckoutFieldType[] = [
  "Text",
  "Number",
  "Dropdown",
  "Checkbox",
  "Textarea",
  "Date",
];
const hexPattern = /^#[0-9A-Fa-f]{6}$/;

export function CheckoutPage() {
  const {
    products,
    formatMoney,
    toast,
    addNotification,
    askConfirm,
    storeSettings,
  } = useDashboard();
  const [saved, setSaved] = useState<CheckoutConfig>(defaultCheckoutConfig);
  const [draft, setDraft] = useState<CheckoutConfig>(defaultCheckoutConfig);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [profileGate, setProfileGate] = useState(false);
  const [colorErrors, setColorErrors] = useState({ brand: "", button: "" });
  useEffect(() => {
    const id = window.setTimeout(() => {
      const config = readCheckoutConfig(defaultCheckoutConfig);
      setSaved(config);
      setDraft(config);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);
  const selectedProduct = useMemo(
    () => products.find((x) => x.id === draft.selectedProductId) || products[0],
    [products, draft.selectedProductId],
  );
  const patch = (next: Partial<CheckoutConfig>) =>
    setDraft((v) => ({ ...v, ...next }));
  const updateColor = (key: "brandColor" | "buttonColor", value: string) => {
    const valid = hexPattern.test(value);
    setColorErrors((v) => ({
      ...v,
      [key === "brandColor" ? "brand" : "button"]: valid
        ? ""
        : "Use a 6-digit hex color such as #3525CD.",
    }));
    patch({ [key]: value } as Partial<CheckoutConfig>);
  };
  const upload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      patch({ logo: String(reader.result) });
      toast("Logo uploaded");
    };
    reader.readAsDataURL(file);
  };
  const addField = () =>
    patch({
      customFields: [
        ...draft.customFields,
        {
          id: `checkout-field-${Date.now()}`,
          label: "",
          type: "Text",
          required: false,
          enabled: true,
          options: [],
        },
      ],
    });
  const updateField = (id: string, next: Partial<CheckoutField>) =>
    patch({
      customFields: draft.customFields.map((field) =>
        field.id === id ? { ...field, ...next } : field,
      ),
    });
  const deleteField = (id: string) =>
    patch({
      customFields: draft.customFields.filter((field) => field.id !== id),
    });
  const save = async () => {
    if (colorErrors.brand || colorErrors.button) {
      toast("Fix invalid colors before saving", "error");
      return;
    }
    const config = {
      ...draft,
      storeName: sanitizeText(draft.storeName, 80),
      thankYouMessage: sanitizeMultiline(draft.thankYouMessage, 500),
      customFields: draft.customFields.map((field) => ({
        ...field,
        label: sanitizeText(field.label, 80),
        options: field.options
          .map((option) => sanitizeText(option, 80))
          .filter(Boolean),
      })),
      updatedAt: new Date().toISOString(),
    };
    try {
      if (isSupabaseConfigured()) {
        const supabase = createSupabaseBrowserClient();
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            config.storeId,
          );
        const storeQuery = supabase
          .from("stores")
          .select("id, slug, checkout_pages(id)")
          .limit(1);
        const { data: store, error } = await (isUuid
          ? storeQuery.eq("id", config.storeId).single()
          : storeQuery.eq("slug", config.storeId).single());
        if (error) throw error;
        const checkoutPage = Array.isArray(store.checkout_pages)
          ? store.checkout_pages[0]
          : store.checkout_pages;
        if (!checkoutPage?.id) throw new Error("Checkout page was not found.");
        await saveCheckoutConfig(supabase, store.id, checkoutPage.id, config);
      }
      writeStorage(storageKeys.checkout, config);
      setSaved(config);
      setDraft(config);
      toast("Checkout page saved");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not save checkout page.", "error");
      return;
    }
    addNotification({
      title: "Checkout page updated",
      message: "Your public COD checkout was updated.",
      type: "Checkout Page Updated",
      actionUrl: "/dashboard/checkout",
    });
  };
  const reset = () =>
    askConfirm({
      title: "Reset checkout changes?",
      message:
        "Unsaved checkout changes will be restored to the last saved version.",
      confirmLabel: "Reset Changes",
      action: () => {
        setDraft(saved);
        setColorErrors({ brand: "", button: "" });
        toast("Changes reset", "info");
      },
    });
  const copy = async () => {
    if (!storeSettings.storeName.trim()) {
      setProfileGate(true);
      return;
    }
    const link = `${window.location.origin}/checkout/${draft.storeId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast("Checkout link copied");
      addNotification({
        title: "Checkout link copied",
        message: link,
        type: "Checkout Link Copied",
        actionUrl: "/dashboard/checkout",
      });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast("Could not copy checkout link", "error");
    }
  };
  const openCheckout = () => {
    if (!storeSettings.storeName.trim()) {
      setProfileGate(true);
      return;
    }
    window.open(`/checkout/${draft.storeId}`, "_blank", "noopener,noreferrer");
  };
  return (
    <DashboardShell
      title="Checkout Page"
      actionLabel={copied ? "Copied" : "Copy Checkout Link"}
      action={copy}
      searchPlaceholder={`orderflow.com/checkout/${draft.storeId}`}
    >
      <ProfileCompletionModal
        open={profileGate}
        onClose={() => setProfileGate(false)}
      />
      <div className="checkout-toolbar">
        <button className="btn-secondary" onClick={reset}>
          <RotateCcw size={14} />
          Reset Changes
        </button>
        <button className="btn-secondary" onClick={() => setPreviewOpen(true)}>
          Preview
        </button>
        <button className="btn-secondary" onClick={openCheckout}>
          <ExternalLink size={14} />
          Open Checkout
        </button>
        <button className="btn-primary" onClick={save}>
          <Save size={14} />
          Save Changes
        </button>
      </div>
      <div className="checkout-layout">
        <section className="checkout-builder-controls">
          <div className="settings-block">
            <h3>Store Branding</h3>
            <label className="form-group">
              <span>Store Display Name</span>
              <input
                className="field"
                value={draft.storeName}
                onChange={(e) => patch({ storeName: e.target.value })}
              />
            </label>
            <label className="form-group mt-4">
              <span>Store Logo</span>
              <span className="upload upload-input !min-h-20 !flex !justify-start !text-left !px-4">
                {draft.logo ? (
                  <span
                    className="checkout-logo-preview"
                    style={{ backgroundImage: `url(${draft.logo})` }}
                  />
                ) : (
                  <ImageUp size={22} className="text-indigo-600" />
                )}
                <span className="ml-3">
                  <b>Upload PNG, JPG or SVG</b>
                  <br />
                  Recommended size 200×200px
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    upload(e.target.files?.[0])
                  }
                />
              </span>
            </label>
            {draft.logo && (
              <button
                className="remove-logo-button"
                onClick={() => patch({ logo: "" })}
              >
                <Trash2 size={13} />
                Remove logo
              </button>
            )}
          </div>
          <div className="settings-block">
            <h3>Theme Colors</h3>
            <ColorControl
              label="Brand Accent"
              value={draft.brandColor}
              error={colorErrors.brand}
              onChange={(value) => updateColor("brandColor", value)}
            />
            <ColorControl
              label="Button Color"
              value={draft.buttonColor}
              error={colorErrors.button}
              onChange={(value) => updateColor("buttonColor", value)}
            />
          </div>
          <div className="settings-block">
            <h3>Preview Product</h3>
            <label className="form-group">
              <span>Selected Product</span>
              <select
                className="field"
                value={draft.selectedProductId}
                onChange={(e) =>
                  patch({ selectedProductId: e.target.value })
                }
              >
                {products
                  .filter((x) => x.status !== "Archived")
                  .map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <div className="settings-block">
            <h3>Optional Checkout Fields</h3>
            <FieldToggle
              label="Email"
              checked={draft.optionalFields.email}
              onChange={(checked) =>
                patch({
                  optionalFields: { ...draft.optionalFields, email: checked },
                })
              }
            />
            <FieldToggle
              label="How did you hear about us?"
              checked={draft.optionalFields.referral}
              onChange={(checked) =>
                patch({
                  optionalFields: {
                    ...draft.optionalFields,
                    referral: checked,
                  },
                })
              }
            />
            <FieldToggle
              label="Gift Note"
              checked={draft.optionalFields.giftNote}
              onChange={(checked) =>
                patch({
                  optionalFields: {
                    ...draft.optionalFields,
                    giftNote: checked,
                  },
                })
              }
            />
          </div>
          <div className="settings-block checkout-custom-builder">
            <div className="builder-heading">
              <div>
                <h3>Custom Checkout Fields</h3>
                <p>
                  Add delivery instructions, landmarks, usernames, or any
                  seller-specific question.
                </p>
              </div>
              <button className="btn-secondary" onClick={addField}>
                <Plus size={13} />
                Add Field
              </button>
            </div>
            {draft.customFields.length ? (
              <div className="checkout-field-list">
                {draft.customFields.map((field) => (
                  <CheckoutFieldEditor
                    key={field.id}
                    field={field}
                    onChange={(next) => updateField(field.id, next)}
                    onDelete={() => deleteField(field.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="custom-fields-empty">
                No custom checkout fields added.
              </div>
            )}
          </div>
        </section>
        <section id="checkout-live-preview" className="checkout-stage">
          <div className="browser-frame">
            <div className="browser-bar">
              <span className="browser-dot" />
              <span className="browser-dot !bg-amber-200" />
              <span className="browser-dot !bg-green-200" />
              <span className="browser-address">
                {draft.storeId}.orderflow.local/checkout
              </span>
            </div>
            <CheckoutPreview
              config={draft}
              product={selectedProduct}
              formatMoney={formatMoney}
            />
          </div>
        </section>
      </div>
      {previewOpen && (
        <div
          className="modal-backdrop checkout-preview-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-preview-title"
        >
          <div className="modal checkout-preview-modal">
            <div className="modal-head">
              <div>
                <h2 id="checkout-preview-title">Customer Checkout Preview</h2>
                <p>
                  This is what buyers see when they open your checkout link.
                </p>
              </div>
              <button
                className="icon-button"
                onClick={() => setPreviewOpen(false)}
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <CheckoutPreview
                config={draft}
                product={selectedProduct}
                formatMoney={formatMoney}
                full
              />
            </div>
            <div className="modal-foot">
              <button
                className="btn-secondary ml-auto"
                onClick={() => setPreviewOpen(false)}
              >
                Close
              </button>
              <button className="btn-primary" onClick={openCheckout}>
                Open Public Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function ColorControl({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: string;
  error: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="form-group mt-4">
      <span>{label}</span>
      <span className={`color-input ${error ? "field-error" : ""}`}>
        <input
          type="color"
          value={hexPattern.test(value) ? value : "#3525cd"}
          onChange={(e) => onChange(e.target.value)}
          className="swatch !p-0 !border-0"
        />
        <input
          aria-label={`${label} hex`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
        />
      </span>
      {error && <small className="form-error">{error}</small>}
    </label>
  );
}
function FieldToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="toggle-row">
      <span>{label}</span>
      <button
        className={`toggle ${checked ? "on" : ""}`}
        onClick={() => onChange(!checked)}
        aria-label={`Toggle ${label}`}
        aria-pressed={checked}
      />
    </div>
  );
}
function CheckoutFieldEditor({
  field,
  onChange,
  onDelete,
}: {
  field: CheckoutField;
  onChange: (next: Partial<CheckoutField>) => void;
  onDelete: () => void;
}) {
  return (
    <article className="checkout-field-card">
      <div className="checkout-field-grid">
        <label>
          Field Label
          <input
            className="field"
            value={field.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Delivery Instructions"
          />
        </label>
        <label>
          Field Type
          <select
            className="field"
            value={field.type}
            onChange={(e) =>
              onChange({ type: e.target.value as CheckoutFieldType })
            }
          >
            {fieldTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        {field.type === "Dropdown" && (
          <label className="full">
            Dropdown Options
            <input
              className="field"
              value={field.options.join(", ")}
              onChange={(e) =>
                onChange({
                  options: e.target.value
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Option one, Option two"
            />
          </label>
        )}
      </div>
      <div className="checkout-field-actions">
        <FieldToggle
          label="Required"
          checked={field.required}
          onChange={(required) => onChange({ required })}
        />
        <FieldToggle
          label="Enabled"
          checked={field.enabled}
          onChange={(enabled) => onChange({ enabled })}
        />
        <button
          className="icon-button danger-action"
          onClick={onDelete}
          aria-label={`Delete ${field.label || "custom field"}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </article>
  );
}
function CheckoutPreview({
  config,
  product,
  formatMoney,
  full = false,
}: {
  config: CheckoutConfig;
  product?: Product;
  formatMoney: (amount: number) => string;
  full?: boolean;
}) {
  const accent = hexPattern.test(config.brandColor)
      ? config.brandColor
      : "#3525CD",
    button = hexPattern.test(config.buttonColor)
      ? config.buttonColor
      : "#0060AC";
  return (
    <div className={`builder-preview ${full ? "full" : ""}`}>
      <div className="builder-preview-main">
        <div className="checkout-store-brand">
          {config.logo ? (
            <span
              className="checkout-store-logo"
              style={{ backgroundImage: `url(${config.logo})` }}
            />
          ) : (
            <span
              className="checkout-store-logo fallback"
              style={{ background: accent }}
            >
              {config.storeName.charAt(0) || "O"}
            </span>
          )}
          <div>
            <b>{config.storeName || "Your Store"}</b>
            <small>Secure COD order form</small>
          </div>
        </div>
        <div className="builder-product">
          <span
            className="builder-product-image"
            style={{ backgroundImage: `url(${product?.image || ""})` }}
          />
          <div>
            <b>{product?.name || "Select a product"}</b>
            <strong style={{ color: accent }}>
              {formatMoney(product?.price || 0)}
            </strong>
            <small>Cash on Delivery</small>
          </div>
        </div>
        <div className="builder-form-grid">
          <PreviewInput label="Full Name" />
          <PreviewInput label="Phone Number" />
          <PreviewInput label="City" />
          <PreviewInput label="Complete Address" full />
          {config.optionalFields.email && <PreviewInput label="Email" />}
          {config.optionalFields.referral && (
            <PreviewInput label="How did you hear about us?" />
          )}
          {config.optionalFields.giftNote && (
            <PreviewInput label="Gift Note" full />
          )}
          {product?.customFields.map((field) => (
            <PreviewInput key={field.id} label={field.name} />
          ))}
          {config.customFields
            .filter((x) => x.enabled)
            .map((field) => (
              <PreviewInput
                key={field.id}
                label={`${field.label || "Custom Field"}${field.required ? " *" : ""}`}
                full={field.type === "Textarea"}
              />
            ))}
        </div>
        <div className="cod-notice">
          <Check size={14} />
          Payment will be collected when your order is delivered.
        </div>
        <button className="btn-primary w-full" style={{ background: button }}>
          Confirm COD Order
        </button>
      </div>
    </div>
  );
}
function PreviewInput({
  label,
  full = false,
}: {
  label: string;
  full?: boolean;
}) {
  return <div className={`preview-input ${full ? "full" : ""}`}>{label}</div>;
}
