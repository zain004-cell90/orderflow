"use client";

import { FormEvent, useState } from "react";
import { Plus, Trash2, UploadCloud, X } from "lucide-react";
import type {
  Product,
  ProductCustomField,
  ProductCustomFieldType,
  ProductStatus,
} from "@/lib/types";
import { safeImageSource,sanitizeMultiline,sanitizeText,validateImageFile } from "@/lib/validation";

export type ProductFormValues = {
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  status: ProductStatus;
  stock: number;
  sizes: string[];
  colors: string[];
  customFields: ProductCustomField[];
};
type FormErrors = Partial<
  Record<"name" | "category" | "price" | "stock" | "image", string>
>;
const categories = [
  "Fashion",
  "Beauty",
  "Accessories",
  "Electronics",
  "Home",
  "Food",
  "Digital Product",
  "Other",
];
export function ProductFormModal({
  title,
  submitLabel,
  product,
  onClose,
  onSave,
}: {
  title: string;
  submitLabel: string;
  product?: Product;
  onClose: () => void;
  onSave: (values: ProductFormValues) => void;
}) {
  const isKnown = product ? categories.includes(product.category) : true;
  const [image, setImage] = useState(product?.image || "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [category, setCategory] = useState(
    product ? (isKnown ? product.category : "Other") : "",
  );
  const [customCategory, setCustomCategory] = useState(
    product && !isKnown ? product.category : "",
  );
  const [customFields, setCustomFields] = useState<ProductCustomField[]>(
    product?.customFields || [],
  );
  const upload = (file?: File) => {
    if (!file) return;
    const error=validateImageFile(file,10_000_000);if(error){setErrors(value=>({...value,image:error}));return}
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };
  const updateField = (id: string, patch: Partial<ProductCustomField>) =>
    setCustomFields((v) =>
      v.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    );
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const nextErrors: FormErrors = {};
    const name = sanitizeText(d.get("name"),100),
      savedCategory = sanitizeText(category === "Other" ? customCategory : category,60),
      price = Number(d.get("price")),
      stock = Number(d.get("stock"));
    if (!name) nextErrors.name = "Product name is required.";
    if (!savedCategory) nextErrors.category = "Category is required.";
    if (!Number.isFinite(price) || price <= 0)
      nextErrors.price = "Enter a valid price greater than zero.";
    if (!Number.isFinite(stock) || stock < 0)
      nextErrors.stock = "Stock cannot be negative.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({
      name,
      category: savedCategory,
      price,
      stock,
      description: sanitizeMultiline(d.get("description"),1000),
      image:safeImageSource(image),
      status: String(d.get("status")) as ProductStatus,
      sizes: splitOptions(String(d.get("sizes"))),
      colors: splitOptions(String(d.get("colors"))),
      customFields: customFields
        .filter((field) => field.name.trim())
        .map((field) => ({
          ...field,
          name: sanitizeText(field.name,80),
          options: field.type === "Dropdown" ? field.options : [],
        })),
    });
  };
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-form-title"
    >
      <form className="modal product-form-modal" onSubmit={submit}>
        <div className="modal-head">
          <div>
            <h2 id="product-form-title">{title}</h2>
            <p>
              {product
                ? "Update product details and availability."
                : "Create a new product for your checkout page."}
            </p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>
        <div className="modal-body form-grid">
          <ProductField label="Product Name" error={errors.name}>
            <input
              name="name"
              className={`field ${errors.name ? "field-error" : ""}`}
              defaultValue={product?.name}
            />
          </ProductField>
          <ProductField label="Category" error={errors.category}>
            <select
              className={`field ${errors.category ? "field-error" : ""}`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select category</option>
              {categories.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </ProductField>
          {category === "Other" && (
            <ProductField label="Custom Category Name">
              <input
                className="field"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter category name"
              />
            </ProductField>
          )}
          <ProductField label="Price" error={errors.price}>
            <input
              name="price"
              inputMode="numeric"
              className={`field ${errors.price ? "field-error" : ""}`}
              defaultValue={product?.price}
            />
          </ProductField>
          <ProductField label="Stock" error={errors.stock}>
            <input
              name="stock"
              inputMode="numeric"
              className={`field ${errors.stock ? "field-error" : ""}`}
              defaultValue={product?.stock ?? 0}
            />
          </ProductField>
          <ProductField label="Status">
            <select
              name="status"
              className="field"
              defaultValue={product?.status || "Draft"}
            >
              {(["Active", "Draft", "Archived"] as ProductStatus[]).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </ProductField>
          <ProductField label="Image URL">
            <input
              className="field"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
            />
          </ProductField>
          <ProductField label="Description" full>
            <textarea
              name="description"
              className="field !pt-3 min-h-24"
              defaultValue={product?.description}
            />
          </ProductField>
          <ProductField label="Image Upload" full>
            <label className="upload upload-input">
              {image ? (
                <span
                  className="upload-preview"
                  style={{ backgroundImage: `url(${image})` }}
                />
              ) : (
                <UploadCloud className="text-indigo-600" size={25} />
              )}
              <span>
                <b>Click to upload</b>
                <br />
                PNG or JPG up to 10MB
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => upload(e.target.files?.[0])}
              />
            </label>
          </ProductField>
          <ProductField label="Size Options">
            <input
              name="sizes"
              className="field"
              defaultValue={product?.sizes.join(", ")}
              placeholder="S, M, L, XL"
            />
          </ProductField>
          <ProductField label="Color Options">
            <input
              name="colors"
              className="field"
              defaultValue={product?.colors.join(", ")}
              placeholder="Black, Blue, Red"
            />
          </ProductField>
          <div className="custom-fields-section full">
            <div className="custom-fields-head">
              <div>
                <h3>Custom Fields</h3>
                <p>
                  Add product-specific questions such as fabric, weight, or
                  engraving text.
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setCustomFields((v) => [
                    ...v,
                    {
                      id: `field-${Date.now()}`,
                      name: "",
                      type: "Text",
                      options: [],
                    },
                  ])
                }
              >
                <Plus size={13} />
                Add Custom Field
              </button>
            </div>
            {customFields.length ? (
              <div className="custom-fields-list">
                {customFields.map((field) => (
                  <CustomFieldEditor
                    key={field.id}
                    field={field}
                    onChange={(patch) => updateField(field.id, patch)}
                    onDelete={() =>
                      setCustomFields((v) => v.filter((x) => x.id !== field.id))
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="custom-fields-empty">No custom fields added.</div>
            )}
          </div>
        </div>
        <div className="modal-foot">
          <button
            type="button"
            className="btn-secondary ml-auto"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="btn-primary ml-2">{submitLabel}</button>
        </div>
      </form>
    </div>
  );
}
function CustomFieldEditor({
  field,
  onChange,
  onDelete,
}: {
  field: ProductCustomField;
  onChange: (patch: Partial<ProductCustomField>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="custom-field-card">
      <label>
        Field Label
        <input
          className="field"
          value={field.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Fabric, Weight, Gift Wrap..."
        />
      </label>
      <label>
        Field Type
        <select
          className="field"
          value={field.type}
          onChange={(e) =>
            onChange({ type: e.target.value as ProductCustomFieldType })
          }
        >
          {(
            [
              "Text",
              "Number",
              "Dropdown",
              "Checkbox",
              "Textarea",
              "Date",
            ] as ProductCustomFieldType[]
          ).map((x) => (
            <option key={x}>{x}</option>
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
              onChange({ options: splitOptions(e.target.value) })
            }
            placeholder="Cotton, Linen, Silk"
          />
        </label>
      )}
      <label className="custom-field-toggle">
        <input
          type="checkbox"
          checked={field.required ?? false}
          onChange={(e) => onChange({ required: e.target.checked })}
        />
        Required
      </label>
      <label className="custom-field-toggle">
        <input
          type="checkbox"
          checked={field.enabled ?? true}
          onChange={(e) => onChange({ enabled: e.target.checked })}
        />
        Enabled
      </label>
      <button
        type="button"
        className="icon-button custom-field-delete"
        onClick={onDelete}
        aria-label={`Delete ${field.name || "custom field"}`}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
function ProductField({
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
function splitOptions(value: string) {
  return value
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}
