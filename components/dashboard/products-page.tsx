"use client";

import {
  Copy,
  Download,
  Grid2X2,
  Image as ImageIcon,
  List,
  PackageSearch,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import type { Product, ProductStatus } from "@/lib/mock-data";
import { downloadCsv } from "@/lib/csv";
import { DashboardShell } from "./dashboard-shell";
import { useDashboard } from "./dashboard-store";
import { EmptyState } from "./shared";
import { ProductFormModal, type ProductFormValues } from "./product-form-modal";
import { ProfileCompletionModal } from "./profile-gate";

type ViewMode = "grid" | "list";
type SortMode =
  | "Newest"
  | "Oldest"
  | "Price Low to High"
  | "Price High to Low"
  | "Most Orders"
  | "Name A-Z";
const statuses: ["All", ...ProductStatus[]] = [
  "All",
  "Active",
  "Draft",
  "Archived",
];
const sortOptions: SortMode[] = [
  "Newest",
  "Oldest",
  "Price Low to High",
  "Price High to Low",
  "Most Orders",
  "Name A-Z",
];

export function ProductsPage() {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    askConfirm,
    toast,
    addNotification,
    storeSettings,
  } = useDashboard();
  const params = useSearchParams();
  const mobile = useMobileProducts();
  const perPage = mobile ? 4 : 6;
  const [query, setQuery] = useState(params.get("q") || "");
  const [status, setStatus] = useState<(typeof statuses)[number]>("All");
  const [sort, setSort] = useState<SortMode>("Newest");
  const [view, setView] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(params.get("add") === "true" && Boolean(storeSettings.storeName.trim()));
  const [profileGate, setProfileGate] = useState(params.get("add") === "true" && !storeSettings.storeName.trim());
  const [editing, setEditing] = useState<Product | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const startCreate=()=>storeSettings.storeName.trim()?setCreating(true):setProfileGate(true);
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const list = products.filter(
      (p) =>
        (status === "All" || p.status === status) &&
        `${p.name} ${p.category} ${p.price} ${p.status} ${p.description}`
          .toLowerCase()
          .includes(q),
    );
    return [...list].sort((a, b) =>
      sort === "Oldest"
        ? sortableId(a.id) - sortableId(b.id)
        : sort === "Price Low to High"
          ? a.price - b.price
          : sort === "Price High to Low"
            ? b.price - a.price
            : sort === "Most Orders"
              ? b.ordersCount - a.ordersCount
              : sort === "Name A-Z"
                ? a.name.localeCompare(b.name)
                : sortableId(b.id) - sortableId(a.id),
    );
  }, [products, query, status, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );
  const filtersActive =
    Boolean(query) || status !== "All" || sort !== "Newest" || page !== 1;
  const clearFilters = () => {
    setQuery("");
    setStatus("All");
    setSort("Newest");
    setPage(1);
    toast("Filters cleared", "info");
  };
  const save = (values: ProductFormValues, product?: Product) => {
    const now = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const variants = [
      ...(values.sizes.length ? [{ label: "Size", values: values.sizes }] : []),
      ...(values.colors.length
        ? [{ label: "Color", values: values.colors }]
        : []),
    ];
    if (product) {
      updateProduct(product.id, { ...values, variants, updatedAt: now });
      setEditing(null);
      setSelected((v) =>
        v?.id === product.id
          ? { ...v, ...values, variants, updatedAt: now }
          : v,
      );
      toast("Product updated successfully");
      return;
    }
    addProduct({
      id: Date.now(),
      ordersCount: 0,
      createdAt: now,
      updatedAt: now,
      variants,
      ...values,
    });
    setCreating(false);
    setStatus("All");
    setSort("Newest");
    setPage(1);
    toast("Product added successfully");
  };
  const duplicate = (product: Product) => {
    const now = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    addProduct({
      ...product,
      id: Date.now(),
      name: `${product.name} Copy`,
      status: "Draft",
      ordersCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    setSelected(null);
    setStatus("All");
    setSort("Newest");
    setPage(1);
    toast("Product duplicated");
  };
  const remove = (product: Product) =>
    askConfirm({
      title: "Delete product?",
      message:
        "This product will be removed from your checkout page. This action cannot be undone.",
      confirmLabel: "Delete Product",
      destructive: true,
      action: () => {
        deleteProduct(product.id);
        setSelected(null);
        setEditing(null);
        toast("Product deleted");
      },
    });
  const toggleStatus = (product: Product) => {
    const next: ProductStatus =
      product.status === "Active" ? "Draft" : "Active";
    updateProduct(product.id, {
      status: next,
      updatedAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    });
    setSelected((v) => (v?.id === product.id ? { ...v, status: next } : v));
    toast("Product status updated");
  };
  const exportProducts = (scope: "current" | "all") => {
    const source = scope === "current" ? visible : products;
    if (!source.length) {
      toast("No data available to export.", "error");
      return;
    }
    downloadCsv(
      "orderflow-products.csv",
      [
        "Product",
        "Category",
        "Price",
        "Status",
        "Orders",
        "Stock",
        "Sizes",
        "Colors",
        "Custom Fields",
      ],
      source.map((p) => [
        p.name,
        p.category,
        p.price,
        p.status,
        p.ordersCount,
        p.stock,
        p.sizes.join(" | "),
        p.colors.join(" | "),
        p.customFields.map((x) => x.name).join(" | "),
      ]),
    );
    toast("CSV exported successfully.");
    addNotification({
      title: "CSV export completed",
      message: `${source.length} products were exported.`,
      type: "Export Completed",
      actionUrl: "/dashboard/products",
    });
  };
  return (
    <DashboardShell
      title="Products"
      searchPlaceholder="Search products..."
      searchValue={query}
      onSearchChange={(value) => {
        setQuery(value);
        setPage(1);
      }}
      actionLabel="Add Product"
      action={startCreate}
    >
      <div className="subhead">
        <div>
          <h2>Products Inventory</h2>
          <p>Manage products, variants and availability.</p>
        </div>
        <div className="filter-actions product-filter-actions">
          <label className="compact-select">
            Status
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as typeof status);
                setPage(1);
              }}
            >
              {statuses.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="compact-select">
            Sort
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortMode);
                setPage(1);
              }}
            >
              {sortOptions.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <ViewToggle value={view} onChange={setView} />
          <div className="export-anchor">
            <button className="btn-secondary">
              <Download size={13} />
              Export
            </button>
            <div className="export-menu card">
              <button onClick={() => exportProducts("current")}>
                Export current view
              </button>
              <button onClick={() => exportProducts("all")}>
                Export all data
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="product-search-row">
        <label className="searchbar product-search">
          <Search size={14} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, category, price, status, or description..."
          />
        </label>
        {filtersActive && (
          <button className="btn-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        )}
      </div>
      {visible.length ? (
        view === "grid" ? (
          <div className="product-grid">
            {visible.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onView={setSelected}
                onEdit={setEditing}
                onDuplicate={duplicate}
                onDelete={remove}
                onToggle={toggleStatus}
              />
            ))}
          </div>
        ) : (
          <ProductList
            products={visible}
            onView={setSelected}
            onEdit={setEditing}
            onDuplicate={duplicate}
            onDelete={remove}
            onToggle={toggleStatus}
          />
        )
      ) : products.length === 0 ? (
        <EmptyState
          title="No products yet."
          text="Add your first product to start accepting orders."
          action={
            <button className="btn-primary" onClick={startCreate}>
              <Plus size={14} />
              Add Product
            </button>
          }
        />
      ) : (
        <EmptyState
          title="No products found."
          text="Try changing your search or filters."
          action={
            <button className="btn-primary" onClick={clearFilters}>
              Clear filters
            </button>
          }
        />
      )}
      <ProductPagination
        page={currentPage}
        pages={pages}
        count={filtered.length}
        perPage={perPage}
        onPage={setPage}
      />
      <ProfileCompletionModal open={profileGate} onClose={()=>setProfileGate(false)}/>
      {creating && (
        <ProductFormModal
          title="Add Product"
          submitLabel="Add Product"
          onClose={() => setCreating(false)}
          onSave={(values) => save(values)}
        />
      )}{" "}
      {editing && (
        <ProductFormModal
          title="Edit Product"
          submitLabel="Save Changes"
          product={editing}
          onClose={() => setEditing(null)}
          onSave={(values) => save(values, editing)}
        />
      )}{" "}
      {selected && (
        <ProductDetailsDrawer
          product={selected}
          onClose={() => setSelected(null)}
          onEdit={() => {
            setEditing(selected);
            setSelected(null);
          }}
          onDuplicate={() => duplicate(selected)}
          onDelete={() => remove(selected)}
          onToggle={() => toggleStatus(selected)}
        />
      )}
    </DashboardShell>
  );
}

function ProductCard({
  product,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onToggle,
}: {
  product: Product;
  onView: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDuplicate: (p: Product) => void;
  onDelete: (p: Product) => void;
  onToggle: (p: Product) => void;
}) {
  const { formatMoney } = useDashboard();
  return (
    <article className="product-card card">
      <button
        className="product-image product-image-button"
        onClick={() => onView(product)}
        aria-label={`View ${product.name}`}
        style={
          product.image
            ? {
                backgroundImage: `url(${product.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {!product.image && <ImageIcon size={38} />}
        <ProductStatusBadge status={product.status} />
      </button>
      <div className="product-info">
        <button className="product-name-button" onClick={() => onView(product)}>
          <h3>{product.name}</h3>
        </button>
        <div className="product-meta">
          <span>
            {product.category} · {product.ordersCount} orders
          </span>
          <button
            className={`product-power ${product.status === "Active" ? "on" : ""}`}
            onClick={() => onToggle(product)}
            aria-label={`Toggle status for ${product.name}`}
          >
            <Power size={14} />
          </button>
        </div>
        <div className="product-card-metrics">
          <div className="product-price">{formatMoney(product.price)}</div>
          <span>{product.stock} in stock</span>
        </div>
        <ProductActions
          product={product}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      </div>
    </article>
  );
}
function ProductActions({
  product,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  product: Product;
  onEdit: (p: Product) => void;
  onDuplicate: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  return (
    <div className="product-actions">
      <button onClick={() => onEdit(product)}>
        <Pencil size={13} />
        Edit
      </button>
      <button onClick={() => onDuplicate(product)}>
        <Copy size={13} />
        Duplicate
      </button>
      <button onClick={() => onDelete(product)} className="danger-action">
        <Trash2 size={13} />
        Delete
      </button>
    </div>
  );
}
function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const tone =
    status === "Active"
      ? "delivered"
      : status === "Draft"
        ? "packed"
        : "cancelled";
  return (
    <span className={`status status-${tone} product-status-badge`}>
      {status}
    </span>
  );
}
function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}) {
  return (
    <div className="view-toggle">
      <button
        aria-label="Grid view"
        className={value === "grid" ? "active" : ""}
        onClick={() => onChange("grid")}
      >
        <Grid2X2 size={15} />
      </button>
      <button
        aria-label="List view"
        className={value === "list" ? "active" : ""}
        onClick={() => onChange("list")}
      >
        <List size={15} />
      </button>
    </div>
  );
}

function ProductList({
  products,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onToggle,
}: {
  products: Product[];
  onView: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDuplicate: (p: Product) => void;
  onDelete: (p: Product) => void;
  onToggle: (p: Product) => void;
}) {
  const { formatMoney } = useDashboard();
  return (
    <>
      <section className="panel card product-list-table">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Orders</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <button
                    className="product-list-name"
                    onClick={() => onView(p)}
                  >
                    <span
                      className="product-list-thumb"
                      style={{ backgroundImage: `url(${p.image})` }}
                    />
                    <b>{p.name}</b>
                  </button>
                </td>
                <td>{p.category}</td>
                <td>
                  <b>{formatMoney(p.price)}</b>
                </td>
                <td>
                  <button onClick={() => onToggle(p)}>
                    <ProductStatusBadge status={p.status} />
                  </button>
                </td>
                <td>{p.ordersCount}</td>
                <td>{p.stock}</td>
                <td>
                  <ProductActions
                    product={p}
                    onEdit={onEdit}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <div className="product-list-mobile">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onView={onView}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onToggle={onToggle}
          />
        ))}
      </div>
    </>
  );
}

function ProductDetailsDrawer({
  product,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  onToggle,
}: {
  product: Product;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const { formatMoney } = useDashboard();
  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <aside
        className="detail-drawer product-detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
      >
        <div className="drawer-head">
          <div>
            <span className="eyebrow">Product details</span>
            <h2 id="product-detail-title">{product.name}</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close product details"
          >
            <X size={18} />
          </button>
        </div>
        <div className="drawer-body">
          <div
            className="product-drawer-image"
            style={{ backgroundImage: `url(${product.image})` }}
          >
            {!product.image && <PackageSearch size={42} />}
            <ProductStatusBadge status={product.status} />
          </div>
          <div className="product-drawer-title">
            <span>{product.category}</span>
            <strong>{formatMoney(product.price)}</strong>
          </div>
          <p className="product-drawer-description">{product.description}</p>
          <div className="drawer-info-grid">
            <span>
              <small>Orders</small>
              <b>{product.ordersCount}</b>
            </span>
            <span>
              <small>Stock</small>
              <b>{product.stock}</b>
            </span>
            <span>
              <small>Created</small>
              <b>{product.createdAt}</b>
            </span>
            <span>
              <small>Updated</small>
              <b>{product.updatedAt}</b>
            </span>
            <span className="full">
              <small>Sizes</small>
              <b>
                {product.sizes.length
                  ? product.sizes.join(" · ")
                  : "No size options"}
              </b>
            </span>
            <span className="full">
              <small>Colors</small>
              <b>
                {product.colors.length
                  ? product.colors.join(" · ")
                  : "No color options"}
              </b>
            </span>
          </div>
          {product.customFields.length > 0 && (
            <div className="product-custom-summary">
              <h3>Custom Fields</h3>
              {product.customFields.map((field) => (
                <div key={field.id}>
                  <span>
                    <b>{field.name}</b>
                    <small>{field.type}</small>
                  </span>
                  {field.options.length > 0 && (
                    <em>{field.options.join(" · ")}</em>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="drawer-actions drawer-actions-wrap">
            <button className="btn-secondary" onClick={onEdit}>
              <Pencil size={14} />
              Edit Product
            </button>
            <button className="btn-secondary" onClick={onDuplicate}>
              <Copy size={14} />
              Duplicate
            </button>
            <button className="btn-secondary" onClick={onToggle}>
              <Power size={14} />
              {product.status === "Active" ? "Set Draft" : "Activate"}
            </button>
            <button className="btn-danger" onClick={onDelete}>
              <Trash2 size={14} />
              Delete
            </button>
            <button className="btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function ProductPagination({
  page,
  pages,
  count,
  perPage,
  onPage,
}: {
  page: number;
  pages: number;
  count: number;
  perPage: number;
  onPage: (page: number) => void;
}) {
  const start = count ? (page - 1) * perPage + 1 : 0,
    end = Math.min(page * perPage, count);
  return (
    <div className="table-footer product-pagination">
      <span>
        Showing {start} to {end} of {count} products
      </span>
      <div className="pagination">
        <button
          className="page-btn page-word"
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className={`page-btn ${page === n ? "active" : ""}`}
            onClick={() => onPage(n)}
          >
            {n}
          </button>
        ))}
        <button
          className="page-btn page-word"
          disabled={page === pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
function subscribeProductsMobile(callback: () => void) {
  const media = window.matchMedia("(max-width: 767px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function productsMobileSnapshot() {
  return window.matchMedia("(max-width: 767px)").matches;
}
function useMobileProducts() {
  return useSyncExternalStore(
    subscribeProductsMobile,
    productsMobileSnapshot,
    () => false,
  );
}
function sortableId(id: string | number) {
  if (typeof id === "number") return id;
  const numeric = Number(id);
  if (Number.isFinite(numeric)) return numeric;
  return id.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}
