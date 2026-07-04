"use client";

import { ChangeEvent, DragEvent, FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bell,
  Check,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  ImageUp,
  LockKeyhole,
  Plus,
  SlidersHorizontal,
  Store,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { downloadCsv } from "@/lib/csv";
import { defaultCheckoutConfig } from "@/lib/mock-data";
import {
  countryOptions,
  defaultAccountSettings,
  defaultAutomationSettings,
  defaultBillingSettings,
} from "@/lib/settings";
import {
  readCheckoutConfig,
  readStorage,
  storageKeys,
  writeStorage,
} from "@/lib/storage";
import type {
  AccountSettings,
  AutomationSettings,
  BillingSettings,
  CheckoutConfig,
  CheckoutField,
  CheckoutFieldType,
  CountryCode,
  StoreSettings,
} from "@/lib/types";
import { DashboardShell } from "./dashboard-shell";
import { useDashboard } from "./dashboard-store";
import { useAuth } from "@/components/auth/auth-provider";

type Tab = "store" | "checkout" | "account" | "billing";
const tabs = [
  { id: "store" as Tab, label: "Store Settings", icon: Store },
  {
    id: "checkout" as Tab,
    label: "Checkout Settings",
    icon: SlidersHorizontal,
  },
  { id: "account" as Tab, label: "Account Settings", icon: UserRound },
  { id: "billing" as Tab, label: "Plans & Billing", icon: CreditCard },
];
const checkoutFieldTypes: CheckoutFieldType[] = [
  "Text",
  "Number",
  "Dropdown",
  "Checkbox",
  "Textarea",
  "Date",
];

export function SettingsPage() {
  const params = useSearchParams();
  const requested = params.get("tab");
  const [tab, setTab] = useState<Tab>(
    tabs.some((item) => item.id === requested) ? (requested as Tab) : "store",
  );
  return (
    <DashboardShell title="Settings" searchPlaceholder="Search settings...">
      <div className="settings-layout functional-settings">
        <nav className="settings-nav" aria-label="Settings sections">
          {tabs.slice(0, 3).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
          <label>Billing</label>
          {tabs.slice(3).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>
        <section>
          {tab === "store" && <StoreSettingsPanel />}
          {tab === "checkout" && <CheckoutSettingsPanel />}
          {tab === "account" && <AccountSettingsPanel />}
          {tab === "billing" && <BillingPanel />}
        </section>
      </div>
    </DashboardShell>
  );
}

function StoreSettingsPanel() {
  const {
    storeSettings,
    updateStoreSettings,
    toast,
    addNotification,
    orders,
    products,
    customers,
  } = useDashboard();
  const [store, setStore] = useState<StoreSettings>(storeSettings);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [automation, setAutomation] = useState<AutomationSettings>(
    defaultAutomationSettings,
  );
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStore(storeSettings);
      setAutomation(
        readStorage(storageKeys.automation, defaultAutomationSettings),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [storeSettings]);
  const field = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setStore((value) => ({ ...value, [e.target.name]: e.target.value }));
  const country = (code: CountryCode) => {
    const item = countryOptions.find((option) => option.code === code)!;
    setStore((value) => ({
      ...value,
      country: code,
      timezone: item.timezone,
      phoneFormat: item.phone,
    }));
  };
  const save = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!store.storeName.trim()) next.storeName = "Store name is required.";
    if (store.businessEmail && !/^\S+@\S+\.\S+$/.test(store.businessEmail))
      next.email = "Enter a valid business email.";
    if (
      store.businessPhone &&
      store.businessPhone.replace(/\D/g, "").length < 6
    )
      next.phone = "Enter a valid phone number.";
    setErrors(next);
    if (Object.keys(next).length) {
      toast("Check the highlighted store fields", "error");
      return;
    }
    updateStoreSettings(store);
    const checkout = readCheckoutConfig(defaultCheckoutConfig);
    writeStorage(storageKeys.checkout, {
      ...checkout,
      storeName: store.storeName,
      logo: store.logo,
      updatedAt: new Date().toISOString(),
    });
    toast("Store settings saved");
  };
  const logo = (file?: File) =>
    handleImage(file, toast, (result) => {
      setStore((value) => ({ ...value, logo: result }));
      addNotification({
        title: "Logo uploaded",
        message: "Your store logo was updated.",
        type: "Settings Updated",
        actionUrl: "/dashboard/settings",
      });
    });
  const toggleAutomation = (key: keyof AutomationSettings) => {
    const next = { ...automation, [key]: !automation[key] };
    setAutomation(next);
    writeStorage(storageKeys.automation, next);
    toast("Automation setting saved", "info");
  };
  return (
    <>
      <form onSubmit={save} className="settings-card card">
        <h3>Store Profile</h3>
        <p>Manage your public store identity and international preferences.</p>
        <div className="settings-form">
          <SettingsField label="Store Name" error={errors.storeName}>
            <input
              name="storeName"
              className="field"
              value={store.storeName}
              onChange={field}
            />
          </SettingsField>
          <SettingsField label="Country">
            <select
              name="country"
              className="field"
              value={store.country}
              onChange={(e) => country(e.target.value as CountryCode)}
            >
              {countryOptions.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </SettingsField>
          <SettingsField label="Currency">
            <div className="currency-readonly">
              <b>{store.currency}</b>
              <small>
                Currency is set during onboarding and cannot be changed later.
              </small>
            </div>
          </SettingsField>
          <SettingsField label="Timezone">
            <select
              name="timezone"
              className="field"
              value={store.timezone}
              onChange={field}
            >
              {countryOptions.map((item) => (
                <option key={item.timezone}>{item.timezone}</option>
              ))}
            </select>
          </SettingsField>
          <SettingsField label="Business Phone" error={errors.phone}>
            <input
              name="businessPhone"
              className="field"
              value={store.businessPhone}
              onChange={field}
            />
          </SettingsField>
          <SettingsField label="Business Email" error={errors.email}>
            <input
              name="businessEmail"
              type="email"
              className="field"
              value={store.businessEmail}
              onChange={field}
            />
          </SettingsField>
          <SettingsField label="Phone Format">
            <input
              name="phoneFormat"
              className="field"
              value={store.phoneFormat}
              onChange={field}
            />
          </SettingsField>
          <SettingsField label="Date Format">
            <select
              name="dateFormat"
              className="field"
              value={store.dateFormat}
              onChange={field}
            >
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </SettingsField>
          <div className="form-group full">
            <span>Store Logo</span>
            <LogoUploader
              value={store.logo}
              onUpload={logo}
              onRemove={() => setStore((value) => ({ ...value, logo: "" }))}
            />
          </div>
        </div>
        <div className="settings-actions">
          <button className="btn-primary">Save Changes</button>
        </div>
      </form>
      <section className="settings-card card">
        <h3>Global Automation</h3>
        <p>Configure practical frontend workflow defaults.</p>
        <AutomationToggle
          label="Auto-create customer from new order"
          text="Create or update a customer record after checkout."
          value={automation.autoCreateCustomer}
          onToggle={() => toggleAutomation("autoCreateCustomer")}
        />
        <AutomationToggle
          label="Auto-mark repeat customer"
          text="Mark customers as repeat buyers after another order."
          value={automation.autoMarkRepeat}
          onToggle={() => toggleAutomation("autoMarkRepeat")}
        />
        <AutomationToggle
          label="Low stock alert"
          text="Create a warning when stock reaches 10 units."
          value={automation.lowStockAlert}
          onToggle={() => toggleAutomation("lowStockAlert")}
        />
        <AutomationToggle
          label="Daily order summary"
          text="Prepare a daily order summary notification."
          value={automation.dailyOrderSummary}
          onToggle={() => toggleAutomation("dailyOrderSummary")}
        />
        <AutomationToggle
          label="Order tracking page enabled"
          text="Allow customers to use the public tracking page."
          value={automation.trackingPageEnabled}
          onToggle={() => toggleAutomation("trackingPageEnabled")}
        />
        <div className="automation-usage">
          <span>
            <b>{orders.length}</b> Orders
          </span>
          <span>
            <b>{products.length}</b> Products
          </span>
          <span>
            <b>{customers.length}</b> Customers
          </span>
        </div>
      </section>
    </>
  );
}

function CheckoutSettingsPanel() {
  const { toast, addNotification, askConfirm } = useDashboard();
  const [saved, setSaved] = useState<CheckoutConfig>(defaultCheckoutConfig);
  const [config, setConfig] = useState<CheckoutConfig>(defaultCheckoutConfig);
  const patch = (next: Partial<CheckoutConfig>) =>
    setConfig((value) => ({ ...value, ...next }));
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const loaded = readCheckoutConfig(defaultCheckoutConfig);
      setSaved(loaded);
      setConfig(loaded);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const updateField = (id: string, next: Partial<CheckoutField>) =>
    patch({
      customFields: config.customFields.map((field) =>
        field.id === id ? { ...field, ...next } : field,
      ),
    });
  const addField = () =>
    patch({
      customFields: [
        ...config.customFields,
        {
          id: `settings-field-${Date.now()}`,
          label: "",
          type: "Text",
          required: false,
          enabled: true,
          options: [],
        },
      ],
    });
  const removeField = (id: string) =>
    patch({
      customFields: config.customFields.filter((field) => field.id !== id),
    });
  const save = () => {
    const next = { ...config, updatedAt: new Date().toISOString() };
    writeStorage(storageKeys.checkout, next);
    setSaved(next);
    setConfig(next);
    toast("Checkout settings saved");
    addNotification({
      title: "Checkout settings updated",
      message: "Public checkout behavior and fields were saved.",
      type: "Checkout Page Updated",
      actionUrl: "/dashboard/settings?tab=checkout",
    });
  };
  const reset = () =>
    askConfirm({
      title: "Reset checkout settings?",
      message:
        "Unsaved checkout settings will return to the last saved version.",
      confirmLabel: "Reset Settings",
      action: () => {
        setConfig(saved);
        toast("Checkout settings reset", "info");
      },
    });
  const copy = async () => {
    const url = `${window.location.origin}/checkout/${config.storeId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Checkout link copied");
      addNotification({
        title: "Checkout link copied",
        message: url,
        type: "Checkout Link Copied",
        actionUrl: "/dashboard/settings?tab=checkout",
      });
    } catch {
      toast("Could not copy checkout link", "error");
    }
  };
  return (
    <section className="settings-card card checkout-settings-panel">
      <h3>Checkout Settings</h3>
      <p>
        Configure COD collection, required delivery details, tracking, and
        custom fields.
      </p>
      <div className="checkout-link-preview">
        <div>
          <small>Checkout Link Preview</small>
          <b>{`orderflow.com/checkout/${config.storeId}`}</b>
        </div>
        <button
          className="icon-button"
          onClick={copy}
          aria-label="Copy checkout link"
        >
          <Copy size={14} />
        </button>
      </div>
      <div className="settings-toggle-grid">
        <AutomationToggle
          label="COD Enabled"
          text="Collect payment when the order is delivered."
          value={config.codEnabled}
          onToggle={() => patch({ codEnabled: !config.codEnabled })}
        />
        <AutomationToggle
          label="Require Phone Number"
          text="Require a contact number at checkout."
          value={config.requirePhone}
          onToggle={() => patch({ requirePhone: !config.requirePhone })}
        />
        <AutomationToggle
          label="Require Address"
          text="Require a complete delivery address."
          value={config.requireAddress}
          onToggle={() => patch({ requireAddress: !config.requireAddress })}
        />
        <AutomationToggle
          label="Require City"
          text="Require the buyer's city."
          value={config.requireCity}
          onToggle={() => patch({ requireCity: !config.requireCity })}
        />
        <AutomationToggle
          label="Allow Multiple Products"
          text="Allow multi-product ordering when supported."
          value={config.allowMultipleProducts}
          onToggle={() =>
            patch({ allowMultipleProducts: !config.allowMultipleProducts })
          }
        />
        <AutomationToggle
          label="Order Tracking Enabled"
          text="Show tracking links after checkout."
          value={config.trackingEnabled}
          onToggle={() => patch({ trackingEnabled: !config.trackingEnabled })}
        />
      </div>
      <div className="settings-form checkout-copy-fields">
        <SettingsField label="Thank You Message" full>
          <textarea
            className="field min-h-24 !pt-3"
            value={config.thankYouMessage}
            onChange={(e) => patch({ thankYouMessage: e.target.value })}
          />
        </SettingsField>
        <SettingsField label="Default Order Status">
          <select
            className="field"
            value={config.defaultOrderStatus}
            onChange={(e) =>
              patch({
                defaultOrderStatus: e.target
                  .value as CheckoutConfig["defaultOrderStatus"],
              })
            }
          >
            <option>Order Received</option>
            <option>Pending</option>
            <option>Confirmed</option>
          </select>
        </SettingsField>
      </div>
      <div className="settings-custom-fields">
        <div className="builder-heading">
          <div>
            <h4>Custom Checkout Fields</h4>
            <p>
              These fields appear in the public checkout and dashboard preview.
            </p>
          </div>
          <button className="btn-secondary" onClick={addField}>
            <Plus size={13} />
            Add Field
          </button>
        </div>
        {config.customFields.length ? (
          <div className="checkout-field-list">
            {config.customFields.map((field) => (
              <SettingsCheckoutField
                key={field.id}
                field={field}
                onChange={(next) => updateField(field.id, next)}
                onDelete={() => removeField(field.id)}
              />
            ))}
          </div>
        ) : (
          <div className="custom-fields-empty">
            No custom checkout fields added.
          </div>
        )}
      </div>
      <div className="settings-actions settings-action-cluster">
        <button className="btn-secondary" onClick={reset}>
          Reset Checkout Settings
        </button>
        <button className="btn-secondary" onClick={copy}>
          <Copy size={13} />
          Copy Checkout Link
        </button>
        <button
          className="btn-secondary"
          onClick={() =>
            window.open(
              `/checkout/${config.storeId}`,
              "_blank",
              "noopener,noreferrer",
            )
          }
        >
          <ExternalLink size={13} />
          Open Checkout Page
        </button>
        <button className="btn-primary" onClick={save}>
          Save Checkout Settings
        </button>
      </div>
    </section>
  );
}

function AccountSettingsPanel() {
  const { toast, addNotification } = useDashboard();
  const [account, setAccount] = useState<AccountSettings>(
    defaultAccountSettings,
  );
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    const timer = window.setTimeout(
      () =>
        setAccount(readStorage(storageKeys.account, defaultAccountSettings)),
      0,
    );
    return () => window.clearTimeout(timer);
  }, []);
  const saveProfile = () => {
    const next: Record<string, string> = {};
    if (!account.fullName.trim()) next.name = "Full name is required.";
    if (!/^\S+@\S+\.\S+$/.test(account.email))
      next.email = "Enter a valid email address.";
    setErrors(next);
    if (Object.keys(next).length) {
      toast("Check the highlighted account fields", "error");
      return;
    }
    writeStorage(storageKeys.account, account);
    toast("Profile saved");
    addNotification({
      title: "Account settings updated",
      message: "Your profile information was saved.",
      type: "Settings Updated",
      actionUrl: "/dashboard/settings?tab=account",
    });
  };
  const changePassword = () => {
    const next: Record<string, string> = {};
    if (!passwords.current) next.current = "Enter your current password.";
    if (passwords.next.length < 8)
      next.password = "Password must contain at least 8 characters.";
    if (passwords.next !== passwords.confirm)
      next.confirm = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length) {
      toast("Check the password fields", "error");
      return;
    }
    setPasswords({ current: "", next: "", confirm: "" });
    toast("Password changed for this session");
    addNotification({
      title: "Account settings updated",
      message: "Your password settings were changed.",
      type: "Settings Updated",
      actionUrl: "/dashboard/settings?tab=account",
    });
  };
  const avatar = (file?: File) =>
    handleImage(file, toast, (result) => {
      setAccount((value) => ({ ...value, avatar: result }));
      addNotification({
        title: "Logo uploaded",
        message: "Your profile avatar was updated.",
        type: "Settings Updated",
        actionUrl: "/dashboard/settings?tab=account",
      });
    });
  return (
    <section className="settings-card card">
      <h3>Account Settings</h3>
      <p>Update your frontend profile, avatar, and password.</p>
      <div className="account-avatar-row">
        <LogoUploader
          value={account.avatar}
          onUpload={avatar}
          onRemove={() => setAccount((value) => ({ ...value, avatar: "" }))}
          compact
        />
      </div>
      <div className="settings-form">
        <SettingsField label="Full Name" error={errors.name}>
          <input
            className="field"
            value={account.fullName}
            onChange={(e) =>
              setAccount((value) => ({ ...value, fullName: e.target.value }))
            }
          />
        </SettingsField>
        <SettingsField label="Email Address" error={errors.email}>
          <input
            className="field"
            type="email"
            value={account.email}
            onChange={(e) =>
              setAccount((value) => ({ ...value, email: e.target.value }))
            }
          />
        </SettingsField>
      </div>
      <div className="settings-actions">
        <button className="btn-primary" onClick={saveProfile}>
          Save Profile
        </button>
      </div>
      <div className="settings-password-section">
        <h4>
          <LockKeyhole size={14} />
          Change Password
        </h4>
        <div className="settings-form">
          <SettingsField label="Current Password" error={errors.current}>
            <input
              className="field"
              type="password"
              value={passwords.current}
              onChange={(e) =>
                setPasswords((value) => ({ ...value, current: e.target.value }))
              }
            />
          </SettingsField>
          <SettingsField label="New Password" error={errors.password}>
            <input
              className="field"
              type="password"
              value={passwords.next}
              onChange={(e) =>
                setPasswords((value) => ({ ...value, next: e.target.value }))
              }
            />
          </SettingsField>
          <SettingsField label="Confirm Password" error={errors.confirm}>
            <input
              className="field"
              type="password"
              value={passwords.confirm}
              onChange={(e) =>
                setPasswords((value) => ({ ...value, confirm: e.target.value }))
              }
            />
          </SettingsField>
        </div>
        <div className="settings-actions">
          <button className="btn-primary" onClick={changePassword}>
            Change Password
          </button>
        </div>
      </div>
      <div className="notification-settings">
        <h4>
          <Bell size={14} />
          Notification Access
        </h4>
        <p>
          Use the notification bell to review settings changes and mark them as
          read.
        </p>
      </div>
    </section>
  );
}

function BillingPanel() {
  const { user } = useAuth();
  const { orders, products, customers, toast, addNotification } =
    useDashboard();
  const [billing, setBilling] = useState<BillingSettings>(
    defaultBillingSettings,
  );
  const [modal, setModal] = useState<"upgrade" | "manage" | null>(null);
  const currentPlan = user?.plan || billing.plan;
  useEffect(() => {
    const timer = window.setTimeout(
      () =>
        (() => {
          const loaded = readStorage(
            storageKeys.billing,
            defaultBillingSettings,
          );
          setBilling(loaded);
          writeStorage(storageKeys.billing, loaded);
        })(),
      0,
    );
    return () => window.clearTimeout(timer);
  }, []);
  const billingAction = (action: "upgrade" | "manage") => {
    setModal(action);
    addNotification({
      title: "Billing action clicked",
      message:
        action === "upgrade"
          ? "Upgrade options were opened."
          : "Billing management was opened.",
      type: "Settings Updated",
      actionUrl: "/dashboard/settings?tab=billing",
    });
  };
  const invoice = () => {
    downloadCsv(
      "orderflow-invoice.csv",
      ["Invoice Field", "Value"],
      [
        ["Plan", currentPlan],
        ["Invoice Date", billing.lastInvoiceDate],
        [
          "Amount",
          currentPlan === "Starter"
            ? "Rs 799"
            : currentPlan === "Growth"
              ? "Rs 1,999"
              : "Rs 0",
        ],
        ["Orders", orders.length],
        ["Products", products.length],
        ["Customers", customers.length],
      ],
    );
    toast("CSV exported successfully.");
    addNotification({
      title: "CSV export completed",
      message: "Invoice CSV export completed.",
      type: "Export Completed",
      actionUrl: "/dashboard/settings?tab=billing",
    });
  };
  return (
    <>
      <section className="settings-card card billing-panel">
        <span className="eyebrow">Current plan</span>
        <h3 className="billing-plan-title">{currentPlan}</h3>
        <p>
          {currentPlan === "Free"
            ? "Core ordering tools for stores getting started."
            : `${currentPlan} plan for active social sellers.`}
        </p>
        <div className="billing-usage-grid">
          <Usage
            label="Orders used"
            value={`${orders.length} / ${currentPlan === "Free" ? "25" : currentPlan === "Starter" ? "150" : "500"}`}
          />
          <Usage
            label="Products used"
            value={`${products.length} / ${currentPlan === "Free" ? "25" : "Unlimited"}`}
          />
          <Usage label="Customers" value={String(customers.length)} />
          <Usage
            label="Storage used"
            value={`${billing.storageUsedMb} MB / ${currentPlan === "Free" ? "500 MB" : "10 GB"}`}
          />
        </div>
        <div className="plan-card-grid three-plans">
          <PlanCard
            name="Free"
            price="Rs 0 / month"
            current={currentPlan === "Free"}
            badge="Start free"
            items={[
              "25 orders per month",
              "Branded checkout",
              "Customer tracking",
            ]}
            action={() =>
              currentPlan === "Free"
                ? toast("Free is your current plan", "info")
                : billingAction("manage")
            }
          />
          <PlanCard
            name="Starter"
            price="Rs 799 / month"
            current={currentPlan === "Starter"}
            featured
            badge="Best for new sellers"
            items={[
              "150 orders per month",
              "Tracking tools",
              "Customer database",
            ]}
            action={() =>
              currentPlan === "Starter"
                ? billingAction("manage")
                : billingAction("upgrade")
            }
          />
          <PlanCard
            name="Growth"
            price="Rs 1,999 / month"
            current={currentPlan === "Growth"}
            badge="For growing stores"
            items={[
              "500 orders per month",
              "Growth analytics",
              "Priority support",
            ]}
            action={() => billingAction("upgrade")}
          />
        </div>
        <div className="settings-actions settings-action-cluster">
          <button
            className="btn-secondary"
            onClick={() => billingAction("manage")}
          >
            Manage Billing
          </button>
          <button className="btn-secondary" onClick={invoice}>
            <Download size={13} />
            Download Invoice
          </button>
          <button
            className="btn-primary"
            onClick={() => billingAction("upgrade")}
          >
            Upgrade to Starter
          </button>
        </div>
      </section>
      {modal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="billing-modal-title"
        >
          <div className="modal billing-placeholder-modal">
            <div className="modal-head">
              <div>
                <h2 id="billing-modal-title">
                  {modal === "upgrade" ? "Choose a plan" : "Manage Billing"}
                </h2>
                <p>Billing integration will be connected in a later phase.</p>
              </div>
              <button
                className="icon-button"
                onClick={() => setModal(null)}
                aria-label="Close billing modal"
              >
                <X size={17} />
              </button>
            </div>
            <div className="modal-body">
              <div className="billing-coming-soon">
                <CreditCard size={28} />
                <h3>Billing will be connected soon.</h3>
                <p>
                  No payment or subscription change will be made in this
                  frontend preview.
                </p>
              </div>
            </div>
            <div className="modal-foot">
              <button
                className="btn-primary ml-auto"
                onClick={() => {
                  setModal(null);
                  toast("Billing preview closed", "info");
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SettingsCheckoutField({
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
            {checkoutFieldTypes.map((type) => (
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
                    .map((value) => value.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Option one, Option two"
            />
          </label>
        )}
      </div>
      <div className="checkout-field-actions">
        <AutomationToggle
          label="Required"
          value={field.required}
          onToggle={() => onChange({ required: !field.required })}
        />
        <AutomationToggle
          label="Enabled"
          value={field.enabled}
          onToggle={() => onChange({ enabled: !field.enabled })}
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
function SettingsField({
  label,
  error,
  full = false,
  children,
}: {
  label: string;
  error?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`form-group ${full ? "full" : ""}`}>
      <span>{label}</span>
      {children}
      {error && <small className="form-error">{error}</small>}
    </label>
  );
}
function AutomationToggle({
  label,
  text,
  value,
  onToggle,
}: {
  label: string;
  text?: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="automation-row">
      <div>
        <strong>{label}</strong>
        {text && <p>{text}</p>}
      </div>
      <button
        type="button"
        className={`toggle ${value ? "on" : ""}`}
        onClick={onToggle}
        aria-label={`Toggle ${label}`}
        aria-pressed={value}
      />
    </div>
  );
}
function LogoUploader({
  value,
  onUpload,
  onRemove,
  compact = false,
}: {
  value: string;
  onUpload: (file?: File) => void;
  onRemove: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`logo-uploader ${compact ? "compact" : ""}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        onUpload(event.dataTransfer.files[0]);
      }}
    >
      <label className="upload upload-input">
        {value ? (
          <span
            className="settings-logo"
            style={{ backgroundImage: `url(${value})` }}
          />
        ) : (
          <span className="stat-icon">
            <ImageUp size={18} />
          </span>
        )}
        <span>
          <b>Click to upload or drag and drop</b>
          <br />
          PNG, JPG or SVG
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          onChange={(event) => onUpload(event.target.files?.[0])}
        />
      </label>
      {value && (
        <button type="button" className="remove-upload" onClick={onRemove}>
          <Trash2 size={13} />
          Remove image
        </button>
      )}
    </div>
  );
}
function PlanCard({
  name,
  price,
  items,
  current,
  featured = false,
  badge,
  action,
}: {
  name: string;
  price: string;
  items: string[];
  current: boolean;
  featured?: boolean;
  badge?: string;
  action: () => void;
}) {
  return (
    <article className={`plan-choice ${featured ? "featured" : ""}`}>
      <div>
        <h4>{name}</h4>
        <span>{current ? "Current Plan" : badge}</span>
      </div>
      <strong>{price}</strong>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <Check size={12} />
            {item}
          </li>
        ))}
      </ul>
      <button
        className={featured ? "btn-primary" : "btn-secondary"}
        onClick={action}
      >
        {current
          ? "Manage Plan"
          : name === "Free"
            ? "Start free"
            : `Choose ${name}`}
      </button>
    </article>
  );
}
function Usage({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
function handleImage(
  file: File | undefined,
  toast: (message: string, tone?: "success" | "error" | "info") => void,
  onSuccess: (value: string) => void,
) {
  if (!file) return;
  const allowed = ["image/png", "image/jpeg", "image/svg+xml"];
  if (!allowed.includes(file.type)) {
    toast("Upload a PNG, JPG, or SVG image", "error");
    return;
  }
  if (file.size > 2_000_000) {
    toast("Image must be smaller than 2 MB", "error");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    onSuccess(String(reader.result));
    toast("Logo uploaded");
  };
  reader.readAsDataURL(file);
}
