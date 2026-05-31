import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Upload, X, Save, Check, AlertCircle, Plus, Trash2 } from "lucide-react";
import { laravelApi, type User as LaravelUser } from "@/lib/laravelApi";
import { type Product, type Category } from "@/data/products";
import { rebuildBrandsFromProducts } from "@/data/brandsStore";
import {
  useSiteContent,
  setSiteContent,
  persistSiteContent,
  type SiteContent,
  type Banner,
} from "@/data/siteContent";
import {
  useProductStore,
  addProduct,
  persistProductUpdate,
  persistProductDelete,
  persistBulkProductUpdate,
  useCategoryStore,
  addCategory,
  persistCategoryUpdate,
  persistCategoryDelete,
} from "@/data/productsStore";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Tab =
  | "products"
  | "brands"
  | "hero"
  | "headings"
  | "about"
  | "footer"
  | "categories"
  | "settings";

type MainTab = "catalogue" | "landing" | "settings";
type CatalogueSubTab = "products" | "brands" | "categories";
type LandingSubTab = "home" | "footers";
type HomeSection = "logo" | "hero" | "headings" | "about" | "navigation";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  last_login: string | null;
  created_at: string | null;
}

/* ─── Image Upload Helper (with cloud storage) ─── */
function ImageUpload({
  value,
  onChange,
  label,
  folder = "banners",
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
  folder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Resolve preview URL for display
  useEffect(() => {
    if (!value) {
      setPreviewUrl("");
      return;
    }
    if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:")) {
      setPreviewUrl(value);
      return;
    }
    if (value.startsWith("storage://")) {
      // Resolve storage URL asynchronously
      import("@/utils/storage").then(({ resolveImageUrl }) => {
        resolveImageUrl(value).then((url) => setPreviewUrl(url));
      });
      return;
    }
    setPreviewUrl(value);
  }, [value]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const { uploadImage } = await import("@/utils/storage");
      const result = await uploadImage(file, folder);
      onChange(result.url);
    } catch (err) {
      console.error("Upload failed:", err);
      // Fallback to base64 if upload fails
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) onChange(e.target.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label className="block text-white/40 text-xs mb-1">{label}</label>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative border border-dashed cursor-pointer transition-colors overflow-hidden ${
          uploading
            ? "border-[#C69B56]/50 bg-[#C69B56]/5"
            : dragOver
            ? "border-[#C69B56] bg-[#C69B56]/5"
            : "border-white/20 hover:border-white/40"
        } ${previewUrl ? "h-40" : "h-24 flex items-center justify-center"}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-[#C69B56]">
            <div className="w-5 h-5 border-2 border-[#C69B56]/30 border-t-[#C69B56] rounded-full animate-spin" />
            <span className="text-[10px]">Загрузка...</span>
          </div>
        ) : previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                setPreviewUrl("");
              }}
              className="absolute top-2 right-2 w-6 h-6 bg-black/70 flex items-center justify-center text-white/70 hover:text-white"
            >
              <X size={12} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-white/30">
            <Upload size={20} />
            <span className="text-[10px]">Нажмите или перетащите файл</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // Reset input so same file can be re-selected
          e.target.value = "";
        }}
      />
      {/* Fallback URL input */}
      <div className="mt-1">
        <input
          value={value && !value.startsWith("data:") && !value.startsWith("storage://") ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Или вставьте URL изображения"
          className="w-full bg-black border border-white/10 text-white text-xs px-3 py-1.5 focus:border-[#C69B56] outline-none placeholder:text-white/20"
        />
      </div>
    </div>
  );
}

/* ─── Field Helper ─── */
function Field({
  label,
  value,
  onChange,
  type = "text",
  rows,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-white/40 text-xs mb-1">{label}</label>
      {rows ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2 focus:border-[#C69B56] outline-none resize-none placeholder:text-white/20"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2 focus:border-[#C69B56] outline-none placeholder:text-white/20"
        />
      )}
    </div>
  );
}

/* ─── Main Admin Component ─── */
export default function Admin() {
  const siteContent = useSiteContent();
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("catalogue");
  const [activeCatalogueSubTab, setActiveCatalogueSubTab] = useState<CatalogueSubTab>("products");
  const [activeLandingSubTab, setActiveLandingSubTab] = useState<LandingSubTab>("home");
  const [activeHomeSection, setActiveHomeSection] = useState<HomeSection>("hero");
  // Derived active tab - used for backwards compat with existing content panels
  const activeTab = activeMainTab === "catalogue"
    ? activeCatalogueSubTab
    : activeMainTab === "landing"
    ? (activeLandingSubTab === "footers" ? "footer" : activeHomeSection)
    : "settings";

  // Products state — from reactive store (persisted to backend)
  const { products: productList } = useProductStore();
  const { categories: storeCategories } = useCategoryStore();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formCategory, setFormCategory] = useState("niche");
  const [formGender, setFormGender] = useState<"women" | "men" | "unisex">(
    "unisex"
  );
  const [formAgeRange, setFormAgeRange] = useState<
    "18-25" | "25-35" | "35-45" | "45+"
  >("25-35");
  const [formVolumes, setFormVolumes] = useState("2, 5, 10, 20, 30");
  const [formImage, setFormImage] = useState("");
  const [formFeatured, setFormFeatured] = useState(false);
  const [formNew, setFormNew] = useState(false);

  // Dynamic brands derived from product list
  const uniqueBrands = [...new Set(productList.map((p) => p.brand))].sort();

  // Rebuild dynamic brand store whenever productList changes
  useEffect(() => {
    rebuildBrandsFromProducts(productList);
  }, [productList]);

  // Site content draft state
  const [draft, setDraft] = useState<SiteContent>({ ...siteContent });
  const [saved, setSaved] = useState(false);

  // Account management state
  const [accountEmail, setAccountEmail] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountRole, setAccountRole] = useState("");
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountMsg, setAccountMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Feedback email state
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Mail (SMTP) settings state
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [emailFrom, setEmailFrom] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [mailLoading, setMailLoading] = useState(false);
  const [mailMsg, setMailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Categories management state — from reactive store
  const [categoryList, setCategoryList] = useState<Category[]>([...storeCategories]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [formCatName, setFormCatName] = useState("");
  const [formCatSlug, setFormCatSlug] = useState("");
  const [formCatImage, setFormCatImage] = useState("");

  // Users management state
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersMsg, setUsersMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Brand management state
  const [renameBrand, setRenameBrand] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteBrandConfirm, setDeleteBrandConfirm] = useState<string | null>(null);

  // Footer links management state
  const [showAddFooterLinkForm, setShowAddFooterLinkForm] = useState(false);
  const [formFooterLinkName, setFormFooterLinkName] = useState("");
  const [formFooterLinkPath, setFormFooterLinkPath] = useState("");
  const [formFooterLinkOrder, setFormFooterLinkOrder] = useState(0);
  const [editingFooterLink, setEditingFooterLink] = useState<{ name: string; path: string; order: number } | null>(null);

  // Nav links management state
  const [showAddNavLinkForm, setShowAddNavLinkForm] = useState(false);
  const [formNavLinkName, setFormNavLinkName] = useState("");
  const [formNavLinkPath, setFormNavLinkPath] = useState("");
  const [formNavLinkOrder, setFormNavLinkOrder] = useState(0);
  const [editingNavLink, setEditingNavLink] = useState<number | null>(null);

  // Bulk edit state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkModal, setBulkModal] = useState<null | "brand" | "category" | "tags">(null);
  const [bulkBrandValue, setBulkBrandValue] = useState("");
  const [bulkCategoryValue, setBulkCategoryValue] = useState("");
  const [bulkFeatured, setBulkFeatured] = useState(false);
  const [bulkNew, setBulkNew] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const selectedCount = selectedIds.size;
  const allSelected = productList.length > 0 && selectedIds.size === productList.length;

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(productList.map((p) => p.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const applyBulkBrand = async () => {
    if (!bulkBrandValue.trim()) return;
    const ids = Array.from(selectedIds);
    await persistBulkProductUpdate(ids, { brand: bulkBrandValue.trim() });
    showToast(`Бренд обновлён для ${selectedIds.size} продуктов`);
    setConfirmModal(false);
    setBulkModal(null);
    setBulkBrandValue("");
    clearSelection();
  };

  const applyBulkCategory = async () => {
    if (!bulkCategoryValue.trim()) return;
    const ids = Array.from(selectedIds);
    await persistBulkProductUpdate(ids, { category: bulkCategoryValue.trim() });
    showToast(`Категория обновлена для ${selectedIds.size} продуктов`);
    setConfirmModal(false);
    setBulkModal(null);
    setBulkCategoryValue("");
    clearSelection();
  };

  const applyBulkTags = async () => {
    const ids = Array.from(selectedIds);
    await persistBulkProductUpdate(ids, {
      isFeatured: bulkFeatured || undefined,
      isNew: bulkNew || undefined,
    });
    showToast(`Теги обновлены для ${selectedIds.size} продуктов`);
    setConfirmModal(false);
    setBulkModal(null);
    setBulkFeatured(false);
    setBulkNew(false);
    clearSelection();
  };

  // Get current values for selected products (for display in modals)
  const selectedProducts = productList.filter((p) => selectedIds.has(p.id));
  const selectedBrands = [...new Set(selectedProducts.map((p) => p.brand))];
  const selectedCategories = [...new Set(selectedProducts.map((p) => p.category))];
  const hasFeatured = selectedProducts.some((p) => p.isFeatured);
  const hasNew = selectedProducts.some((p) => p.isNew);

  // Unique categories from product list
  const uniqueCategories = [...new Set(productList.map((p) => p.category))].sort();

  // Load account data on mount
  useEffect(() => {
    const loadAccount = async () => {
      try {
        const user = await laravelApi.getAccount();
        setAccountEmail(user.email || "");
        setAccountName(user.name || "");
        setAccountRole(user.role || "");
      } catch {
        // silently fail - user may not be authenticated
      }
    };
    const loadFeedbackEmail = async () => {
      try {
        const res = await laravelApi.getFeedbackEmail();
        setFeedbackEmail(res.feedback_email || "");
      } catch {
        // silently fail
      }
    };
    loadAccount();
    loadFeedbackEmail();

    // Load SMTP/Mail settings from database (persists across redeployments)
    const loadMailSettings = async () => {
      try {
        const settings = await laravelApi.getSmtpSettings();
        setSmtpHost(settings.smtp_host || "");
        setSmtpPort(settings.smtp_port || "");
        setSmtpUser(settings.smtp_user || "");
        setSmtpPassword(settings.smtp_password || "");
        setEmailFrom(settings.email_from || "");
        setEmailTo(settings.email_to || "");
      } catch {
        // silently fail - user may not be authenticated
      }
    };
    loadMailSettings();
  }, []);

  const updateDraft = (updater: (prev: SiteContent) => SiteContent) => {
    setDraft((prev) => updater(prev));
    setSaved(false);
  };

  const [saving, setSaving] = useState(false);

  const saveContent = async () => {
    setSaving(true);
    const ok = await persistSiteContent(draft);
    setSaving(false);
    setSaved(ok);
    if (!ok) {
      // Still update local state even if backend save fails
      setSiteContent(draft);
    }
    setTimeout(() => setSaved(false), 2000);
  };

  const resetDraft = () => {
    setDraft({ ...siteContent });
    setSaved(false);
  };

  // Product form helpers
  const resetForm = () => {
    setFormName("");
    setFormBrand("");
    setFormCategory("niche");
    setFormGender("unisex");
    setFormAgeRange("25-35");
    setFormVolumes("2, 5, 10, 20, 30");
    setFormImage("");
    setFormFeatured(false);
    setFormNew(false);
    setEditingProduct(null);
    setShowAddForm(false);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormBrand(p.brand);
    setFormCategory(p.category);
    setFormGender(p.gender);
    setFormAgeRange(p.ageRange);
    setFormVolumes(p.volumes.join(", "));
    setFormImage(p.image);
    setFormFeatured(!!p.isFeatured);
    setFormNew(!!p.isNew);
    setShowAddForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formBrand.trim()) return;
    const volumes = formVolumes
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => v > 0);

    if (editingProduct) {
      await persistProductUpdate(editingProduct.id, {
        name: formName,
        brand: formBrand,
        category: formCategory,
        gender: formGender,
        ageRange: formAgeRange,
        volumes,
        image: formImage || editingProduct.image,
        isFeatured: formFeatured || undefined,
        isNew: formNew || undefined,
      });
    } else {
      await addProduct({
        name: formName,
        brand: formBrand,
        category: formCategory,
        gender: formGender,
        ageRange: formAgeRange,
        volumes,
        image:
          formImage ||
          "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&q=80",
        isFeatured: formFeatured || undefined,
        isNew: formNew || undefined,
        description: "",
        instagramUrl: "",
      });
    }
    resetForm();
  };

  const handleDelete = async (id: number) => {
    await persistProductDelete(id);
  };

  // Banner helpers
  const updateBanner = (
    index: number,
    field: keyof Banner,
    value: string
  ) => {
    updateDraft((prev) => {
      const banners = [...prev.about.banners];
      banners[index] = { ...banners[index], [field]: value };
      return { ...prev, about: { ...prev.about, banners } };
    });
  };

  const addBanner = () => {
    updateDraft((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        banners: [
          ...prev.about.banners,
          { title: "Новый баннер", link: "/catalogue", image: "" },
        ],
      },
    }));
  };

  const removeBanner = (index: number) => {
    updateDraft((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        banners: prev.about.banners.filter((_, i) => i !== index),
      },
    }));
  };

  const mainTabs: { key: MainTab; label: string }[] = [
    { key: "catalogue", label: "Каталог" },
    { key: "landing", label: "Управление лэндингом" },
    { key: "settings", label: "Настройки" },
  ];
  const catalogueSubTabs: { key: CatalogueSubTab; label: string }[] = [
    { key: "products", label: "Продукты" },
    { key: "brands", label: "Бренды" },
    { key: "categories", label: "Категории" },
  ];
  const landingSubTabs: { key: LandingSubTab; label: string }[] = [
    { key: "home", label: "Главная" },
    { key: "footers", label: "Колонтитулы" },
  ];
  const homeSections: { key: HomeSection; label: string }[] = [
    { key: "logo", label: "Лого" },
    { key: "hero", label: "Герой-баннер" },
    { key: "headings", label: "Заголовки" },
    { key: "about", label: "О нас" },
    { key: "navigation", label: "Навигация" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-white/40 mb-8">
          <Link
            to="/"
            className="hover:text-[#C69B56] transition-colors"
          >
            Главная
          </Link>
          <span>/</span>
          <span className="text-white/70">Админ-панель</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-light tracking-[0.1em] uppercase mb-8">
          Админ-панель
        </h1>
        <div className="w-16 h-px bg-[#C69B56] mb-8" />

        {/* Main Tabs */}
        <div className="flex gap-1 mb-4 border-b border-white/10 overflow-x-auto">
          {mainTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveMainTab(tab.key)}
              className={`px-4 py-3 text-xs tracking-[0.1em] uppercase transition-colors whitespace-nowrap ${
                activeMainTab === tab.key
                  ? "text-[#C69B56] border-b-2 border-[#C69B56]"
                  : "text-white/40 hover:text-white/70 border-b-2 border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Catalogue Sub Tabs */}
        {activeMainTab === "catalogue" && (
          <div className="flex gap-1 mb-8 border-b border-white/5 overflow-x-auto">
            {catalogueSubTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveCatalogueSubTab(tab.key)}
                className={`px-4 py-2 text-[10px] tracking-[0.1em] uppercase transition-colors whitespace-nowrap ${
                  activeCatalogueSubTab === tab.key
                    ? "text-[#C69B56] border-b-2 border-[#C69B56]/50"
                    : "text-white/30 hover:text-white/60 border-b-2 border-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Landing Sub Tabs */}
        {activeMainTab === "landing" && (
          <div className="flex gap-1 mb-4 border-b border-white/5 overflow-x-auto">
            {landingSubTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveLandingSubTab(tab.key)}
                className={`px-4 py-2 text-[10px] tracking-[0.1em] uppercase transition-colors whitespace-nowrap ${
                  activeLandingSubTab === tab.key
                    ? "text-[#C69B56] border-b-2 border-[#C69B56]/50"
                    : "text-white/30 hover:text-white/60 border-b-2 border-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Home Sections (under Landing > Home) */}
        {activeMainTab === "landing" && activeLandingSubTab === "home" && (
          <div className="flex gap-1 mb-8 border-b border-white/[0.02] overflow-x-auto">
            {homeSections.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveHomeSection(tab.key)}
                className={`px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase transition-colors whitespace-nowrap ${
                  activeHomeSection === tab.key
                    ? "text-[#C69B56]/80 border-b-2 border-[#C69B56]/30"
                    : "text-white/20 hover:text-white/50 border-b-2 border-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* PRODUCTS TAB */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === "products" && (
          <div>
            {/* Toast */}
            {toast && (
              <div className="fixed top-6 right-6 z-50 bg-green-600/90 text-white text-sm px-5 py-3 shadow-lg animate-fade-in" role="alert">
                {toast}
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <p className="text-white/50 text-sm">
                {productList.length} продуктов
                {selectedCount > 0 && (
                  <span className="ml-2 text-[#C69B56]">
                    ({selectedCount} выбрано)
                  </span>
                )}
              </p>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddForm(true);
                }}
                className="bg-[#C69B56] text-black text-xs tracking-[0.1em] uppercase px-4 py-2 font-medium hover:bg-[#d4aa65] transition-colors"
              >
                + Добавить продукт
              </button>
            </div>

            {/* Bulk Actions Bar */}
            {selectedCount > 0 && (
              <div className="bg-[#1A1A1A] border border-[#C69B56]/30 p-3 mb-4 flex flex-wrap items-center gap-3">
                <span className="text-[#C69B56] text-xs tracking-wide uppercase font-medium">
                  Массовые действия:
                </span>
                <button
                  onClick={() => {
                    setBulkBrandValue(selectedBrands.length === 1 ? selectedBrands[0] : "");
                    setBulkModal("brand");
                  }}
                  className="border border-white/20 text-white/60 text-xs tracking-wide px-3 py-1.5 hover:text-white hover:border-white/40 transition-colors"
                >
                  Изменить бренд
                </button>
                <button
                  onClick={() => {
                    setBulkCategoryValue(selectedCategories.length === 1 ? selectedCategories[0] : "");
                    setBulkModal("category");
                  }}
                  className="border border-white/20 text-white/60 text-xs tracking-wide px-3 py-1.5 hover:text-white hover:border-white/40 transition-colors"
                >
                  Изменить категорию
                </button>
                <button
                  onClick={() => {
                    setBulkFeatured(hasFeatured);
                    setBulkNew(hasNew);
                    setBulkModal("tags");
                  }}
                  className="border border-white/20 text-white/60 text-xs tracking-wide px-3 py-1.5 hover:text-white hover:border-white/40 transition-colors"
                >
                  Изменить теги
                </button>
                <button
                  onClick={clearSelection}
                  className="ml-auto text-white/30 hover:text-white/60 text-xs transition-colors"
                >
                  Снять выделение
                </button>
              </div>
            )}

            {/* Bulk Edit Brand Modal */}
            {bulkModal === "brand" && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60" role="dialog" aria-modal="true" aria-label="Массовое изменение бренда">
                <div className="bg-[#1A1A1A] border border-white/10 p-6 w-full max-w-md mx-4">
                  <h3 className="text-[#C69B56] text-sm tracking-[0.1em] uppercase mb-4">
                    Массовое изменение бренда
                  </h3>
                  <p className="text-white/40 text-xs mb-3">
                    Текущий бренд:{" "}
                    <span className="text-white/70">
                      {selectedBrands.length === 1 ? selectedBrands[0] : "Разные значения"}
                    </span>
                  </p>
                  <label className="block text-white/40 text-xs mb-1">
                    Новый бренд *
                  </label>
                  <select
                    value={uniqueBrands.includes(bulkBrandValue) ? bulkBrandValue : ""}
                    onChange={(e) => setBulkBrandValue(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2 focus:border-[#C69B56] outline-none mb-2"
                  >
                    <option value="">— Выберите бренд —</option>
                    {uniqueBrands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <input
                    value={uniqueBrands.includes(bulkBrandValue) ? "" : bulkBrandValue}
                    onChange={(e) => setBulkBrandValue(e.target.value)}
                    placeholder="Или введите новый бренд"
                    className="w-full bg-black border border-white/10 text-white text-xs px-3 py-1.5 focus:border-[#C69B56] outline-none placeholder:text-white/20"
                  />
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        if (!bulkBrandValue.trim()) return;
                        setConfirmModal(true);
                      }}
                      disabled={!bulkBrandValue.trim()}
                      className="bg-[#C69B56] text-black text-xs tracking-[0.1em] uppercase px-5 py-2 font-medium hover:bg-[#d4aa65] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Применить
                    </button>
                    <button
                      onClick={() => {
                        setBulkModal(null);
                        setBulkBrandValue("");
                      }}
                      className="border border-white/20 text-white/50 text-xs tracking-[0.1em] uppercase px-5 py-2 hover:text-white/80 hover:border-white/40 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Edit Category Modal */}
            {bulkModal === "category" && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60" role="dialog" aria-modal="true" aria-label="Массовое изменение категории">
                <div className="bg-[#1A1A1A] border border-white/10 p-6 w-full max-w-md mx-4">
                  <h3 className="text-[#C69B56] text-sm tracking-[0.1em] uppercase mb-4">
                    Массовое изменение категории
                  </h3>
                  <p className="text-white/40 text-xs mb-3">
                    Текущая категория:{" "}
                    <span className="text-white/70">
                      {selectedCategories.length === 1 ? selectedCategories[0] : "Разные значения"}
                    </span>
                  </p>
                  <label className="block text-white/40 text-xs mb-1">
                    Новая категория *
                  </label>
                  <select
                    value={bulkCategoryValue}
                    onChange={(e) => setBulkCategoryValue(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2 focus:border-[#C69B56] outline-none"
                  >
                    <option value="">— Выберите категорию —</option>
                    {uniqueCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="niche">Нишевая</option>
                    <option value="luxury">Люксовая</option>
                    <option value="women">Женская</option>
                    <option value="men">Мужская</option>
                    <option value="unisex">Унисекс</option>
                    <option value="decants">Отливанты</option>
                  </select>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        if (!bulkCategoryValue.trim()) return;
                        setConfirmModal(true);
                      }}
                      disabled={!bulkCategoryValue.trim()}
                      className="bg-[#C69B56] text-black text-xs tracking-[0.1em] uppercase px-5 py-2 font-medium hover:bg-[#d4aa65] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Применить
                    </button>
                    <button
                      onClick={() => {
                        setBulkModal(null);
                        setBulkCategoryValue("");
                      }}
                      className="border border-white/20 text-white/50 text-xs tracking-[0.1em] uppercase px-5 py-2 hover:text-white/80 hover:border-white/40 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Edit Tags Modal */}
            {bulkModal === "tags" && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60" role="dialog" aria-modal="true" aria-label="Массовое изменение тегов">
                <div className="bg-[#1A1A1A] border border-white/10 p-6 w-full max-w-md mx-4">
                  <h3 className="text-[#C69B56] text-sm tracking-[0.1em] uppercase mb-4">
                    Массовое изменение тегов
                  </h3>
                  <p className="text-white/40 text-xs mb-4">
                    Текущие теги выбранных продуктов
                  </p>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer bg-black border border-white/5 p-3 hover:border-white/20 transition-colors">
                      <input
                        type="checkbox"
                        checked={bulkFeatured}
                        onChange={(e) => setBulkFeatured(e.target.checked)}
                        className="accent-[#C69B56] w-4 h-4"
                      />
                      <div>
                        <span className="text-white/70 text-sm">Хит продаж</span>
                        <p className="text-white/30 text-[10px]">
                          {hasFeatured ? "У некоторых продуктов уже установлен" : "Не установлен"}
                        </p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer bg-black border border-white/5 p-3 hover:border-white/20 transition-colors">
                      <input
                        type="checkbox"
                        checked={bulkNew}
                        onChange={(e) => setBulkNew(e.target.checked)}
                        className="accent-[#C69B56] w-4 h-4"
                      />
                      <div>
                        <span className="text-white/70 text-sm">Новинка</span>
                        <p className="text-white/30 text-[10px]">
                          {hasNew ? "У некоторых продуктов уже установлен" : "Не установлен"}
                        </p>
                      </div>
                    </label>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setConfirmModal(true)}
                      className="bg-[#C69B56] text-black text-xs tracking-[0.1em] uppercase px-5 py-2 font-medium hover:bg-[#d4aa65] transition-colors"
                    >
                      Применить
                    </button>
                    <button
                      onClick={() => {
                        setBulkModal(null);
                        setBulkFeatured(false);
                        setBulkNew(false);
                      }}
                      className="border border-white/20 text-white/50 text-xs tracking-[0.1em] uppercase px-5 py-2 hover:text-white/80 hover:border-white/40 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Modal */}
            {confirmModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" role="dialog" aria-modal="true" aria-label="Подтверждение">
                <div className="bg-[#1A1A1A] border border-white/10 p-6 w-full max-w-sm mx-4">
                  <h3 className="text-white text-sm mb-2">
                    Подтвердите действие
                  </h3>
                  <p className="text-white/50 text-xs mb-6">
                    {bulkModal === "brand" && `Изменить бренд на «${bulkBrandValue}» для ${selectedCount} продуктов?`}
                    {bulkModal === "category" && `Изменить категорию на «${bulkCategoryValue}» для ${selectedCount} продуктов?`}
                    {bulkModal === "tags" && `Обновить теги для ${selectedCount} продуктов?`}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (bulkModal === "brand") applyBulkBrand();
                        else if (bulkModal === "category") applyBulkCategory();
                        else if (bulkModal === "tags") applyBulkTags();
                      }}
                      className="bg-[#C69B56] text-black text-xs tracking-[0.1em] uppercase px-5 py-2 font-medium hover:bg-[#d4aa65] transition-colors"
                    >
                      Да, применить
                    </button>
                    <button
                      onClick={() => setConfirmModal(false)}
                      className="border border-white/20 text-white/50 text-xs tracking-[0.1em] uppercase px-5 py-2 hover:text-white/80 hover:border-white/40 transition-colors"
                    >
                      Нет, отмена
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add/Edit Form */}
            {showAddForm && (
              <div className="bg-[#1A1A1A] border border-white/10 p-6 mb-6">
                <h3 className="text-[#C69B56] text-sm tracking-[0.1em] uppercase mb-4">
                  {editingProduct
                    ? "Редактировать продукт"
                    : "Новый продукт"}
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field
                    label="Название *"
                    value={formName}
                    onChange={setFormName}
                  />
                  <div>
                    <label className="block text-white/40 text-xs mb-1">
                      Бренд *
                    </label>
                    <select
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2 focus:border-[#C69B56] outline-none"
                    >
                      <option value="">— Выберите бренд —</option>
                      {uniqueBrands.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                    <input
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      placeholder="Или введите новый бренд"
                      className="w-full bg-black border border-white/10 text-white text-xs px-3 py-1.5 mt-1 focus:border-[#C69B56] outline-none placeholder:text-white/20"
                    />
                  </div>
                  <div>
                    <label className="block text-white/40 text-xs mb-1">
                      Категория
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2 focus:border-[#C69B56] outline-none"
                    >
                      <option value="niche">Нишевая</option>
                      <option value="luxury">Люксовая</option>
                      <option value="women">Женская</option>
                      <option value="men">Мужская</option>
                      <option value="unisex">Унисекс</option>
                      <option value="decants">Отливанты</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/40 text-xs mb-1">
                      Пол
                    </label>
                    <select
                      value={formGender}
                      onChange={(e) =>
                        setFormGender(
                          e.target.value as "women" | "men" | "unisex"
                        )
                      }
                      className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2 focus:border-[#C69B56] outline-none"
                    >
                      <option value="women">Женский</option>
                      <option value="men">Мужской</option>
                      <option value="unisex">Унисекс</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/40 text-xs mb-1">
                      Возраст
                    </label>
                    <select
                      value={formAgeRange}
                      onChange={(e) =>
                        setFormAgeRange(
                          e.target.value as
                            | "18-25"
                            | "25-35"
                            | "35-45"
                            | "45+"
                        )
                      }
                      className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2 focus:border-[#C69B56] outline-none"
                    >
                      <option value="18-25">18–25</option>
                      <option value="25-35">25–35</option>
                      <option value="35-45">35–45</option>
                      <option value="45+">45+</option>
                    </select>
                  </div>
                  <Field
                    label="Объёмы (через запятую)"
                    value={formVolumes}
                    onChange={setFormVolumes}
                  />

                  <ImageUpload
                    label="Изображение"
                    value={formImage}
                    onChange={setFormImage}
                  />
                  <div className="flex items-center gap-6 pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formFeatured}
                        onChange={(e) => setFormFeatured(e.target.checked)}
                        className="accent-[#C69B56]"
                      />
                      <span className="text-white/50 text-xs">Хит продаж</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formNew}
                        onChange={(e) => setFormNew(e.target.checked)}
                        className="accent-[#C69B56]"
                      />
                      <span className="text-white/50 text-xs">Новинка</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSave}
                    className="bg-[#C69B56] text-black text-xs tracking-[0.1em] uppercase px-5 py-2 font-medium hover:bg-[#d4aa65] transition-colors"
                  >
                    {editingProduct ? "Сохранить" : "Добавить"}
                  </button>
                  <button
                    onClick={resetForm}
                    className="border border-white/20 text-white/50 text-xs tracking-[0.1em] uppercase px-5 py-2 hover:text-white/80 hover:border-white/40 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}

            {/* Product Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-xs tracking-wide uppercase">
                    <th className="text-left py-3 px-2 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="accent-[#C69B56]"
                        aria-label="Выбрать все"
                      />
                    </th>
                    <th className="text-left py-3 px-2">ID</th>
                    <th className="text-left py-3 px-2">Название</th>
                    <th className="text-left py-3 px-2">Бренд</th>
                    <th className="text-left py-3 px-2">Категория</th>
                    <th className="text-left py-3 px-2">Теги</th>
                    <th className="text-right py-3 px-2">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {productList.map((p) => (
                    <tr
                      key={p.id}
                      className={`border-b border-white/5 hover:bg-white/[0.02] ${
                        selectedIds.has(p.id) ? "bg-[#C69B56]/5" : ""
                      }`}
                    >
                      <td className="py-3 px-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="accent-[#C69B56]"
                          aria-label={`Выбрать ${p.name}`}
                        />
                      </td>
                      <td className="py-3 px-2 text-white/30">{p.id}</td>
                      <td className="py-3 px-2 text-white/80">{p.name}</td>
                      <td className="py-3 px-2 text-white/50">{p.brand}</td>
                      <td className="py-3 px-2 text-white/50">
                        {p.category}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          {p.isFeatured && (
                            <span className="text-[10px] bg-[#C69B56]/20 text-[#C69B56] px-2 py-0.5">
                              Хит
                            </span>
                          )}
                          {p.isNew && (
                            <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5">
                              Новинка
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-white/40 hover:text-[#C69B56] text-xs mr-3 transition-colors"
                        >
                          Изменить
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-white/40 hover:text-red-400 text-xs transition-colors"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* BRANDS TAB */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === "brands" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-white/50 text-sm">
                {uniqueBrands.length} брендов
              </p>
            </div>

            {/* Brand Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-xs tracking-wide uppercase">
                    <th className="text-left py-3 px-2">Бренд</th>
                    <th className="text-left py-3 px-2">Slug</th>
                    <th className="text-left py-3 px-2">Продуктов</th>
                    <th className="text-right py-3 px-2">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueBrands.map((brand) => {
                    const count = productList.filter((p) => p.brand === brand).length;
                    const slug = brand
                      .toLowerCase()
                      .trim()
                      .replace(/&/g, "and")
                      .replace(/[^a-z0-9а-яё]+/gi, "-")
                      .replace(/^-|-$/g, "");
                    return (
                      <tr
                        key={brand}
                        className="border-b border-white/5 hover:bg-white/[0.02]"
                      >
                        <td className="py-3 px-2 text-white/80 font-medium">
                          {renameBrand === brand ? (
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              className="bg-black border border-[#C69B56] text-white text-sm px-3 py-1 focus:border-[#C69B56] outline-none w-full"
                              autoFocus
                              onKeyDown={async (e) => {
                                if (e.key === "Enter" && renameValue.trim()) {
                                  const brandProducts = productList.filter((p) => p.brand === brand);
                                  for (const p of brandProducts) {
                                    await persistProductUpdate(p.id, { brand: renameValue.trim() });
                                  }
                                  setRenameBrand(null);
                                }
                                if (e.key === "Escape") setRenameBrand(null);
                              }}
                            />
                          ) : (
                            brand
                          )}
                        </td>
                        <td className="py-3 px-2 text-white/40 text-xs font-mono">
                          {slug}
                        </td>
                        <td className="py-3 px-2 text-[#C69B56]/60 text-xs">
                          {count}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {renameBrand === brand ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={async () => {
                                  if (!renameValue.trim()) return;
                                  const brandProducts = productList.filter((p) => p.brand === brand);
                                  for (const p of brandProducts) {
                                    await persistProductUpdate(p.id, { brand: renameValue.trim() });
                                  }
                                  setRenameBrand(null);
                                }}
                                className="text-green-400 text-xs hover:text-green-300 transition-colors"
                              >
                                Сохранить
                              </button>
                              <button
                                onClick={() => setRenameBrand(null)}
                                className="text-white/40 text-xs hover:text-white/70 transition-colors"
                              >
                                Отмена
                              </button>
                            </div>
                          ) : deleteBrandConfirm === brand ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-red-400/60 text-[10px] mr-1">
                                Удалить {count} прод.?
                              </span>
                              <button
                                onClick={async () => {
                                  const brandProducts = productList.filter((p) => p.brand === brand);
                                  for (const p of brandProducts) {
                                    await persistProductDelete(p.id);
                                  }
                                  setDeleteBrandConfirm(null);
                                }}
                                className="text-xs px-2 py-1 bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 transition-colors"
                              >
                                Да
                              </button>
                              <button
                                onClick={() => setDeleteBrandConfirm(null)}
                                className="text-xs px-2 py-1 border border-white/20 text-white/40 hover:text-white/70 transition-colors"
                              >
                                Нет
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => {
                                  setRenameBrand(brand);
                                  setRenameValue(brand);
                                }}
                                className="text-white/40 hover:text-[#C69B56] text-xs transition-colors"
                              >
                                Переименовать
                              </button>
                              <button
                                onClick={() => setDeleteBrandConfirm(brand)}
                                className="text-white/40 hover:text-red-400 text-xs transition-colors"
                              >
                                Удалить
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {uniqueBrands.length === 0 && (
              <div className="bg-[#1A1A1A] border border-white/10 p-8 text-center">
                <p className="text-white/30 text-sm">Нет брендов. Добавьте продукты с брендами на вкладке «Продукты».</p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* HERO BANNER TAB */}
        {/* ═══════════════════════════════════════════ */}
        {/* ═══════════════════════════════════════════ */}
        {/* LOGO TAB (Landing > Home > Logo) */}
        {/* ═══════════════════════════════════════════ */}
        {activeMainTab === "landing" && activeLandingSubTab === "home" && activeHomeSection === "logo" && (
          <div>
            <h3 className="text-[#C69B56] text-sm tracking-[0.1em] uppercase mb-6">
              Настройки логотипа и брендинга
            </h3>

            <div className="bg-[#1A1A1A] border border-white/10 p-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <ImageUpload
                  label="Логотип (кнопка домой)"
                  value={draft.logo}
                  onChange={(v) =>
                    updateDraft((prev) => ({ ...prev, logo: v }))
                  }
                  folder="branding"
                />
                <ImageUpload
                  label="Favicon"
                  value={draft.favicon}
                  onChange={(v) =>
                    updateDraft((prev) => ({ ...prev, favicon: v }))
                  }
                  folder="branding"
                />
                <div className="sm:col-span-2">
                  <Field
                    label="Заголовок вкладки в браузере"
                    value={draft.pageTitle}
                    onChange={(v) =>
                      updateDraft((prev) => ({ ...prev, pageTitle: v }))
                    }
                    placeholder="1000 Ароматов | Элитная парфюмерия на распив"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="mt-6 border border-white/5 p-4 bg-black">
                <p className="text-white/30 text-[10px] uppercase tracking-wider mb-3">
                  Предпросмотр
                </p>
                <div className="flex items-center gap-4">
                  {draft.logo && (
                    <img
                      src={draft.logo}
                      alt="Logo preview"
                      className="h-8 object-contain"
                    />
                  )}
                  {draft.favicon && (
                    <img
                      src={draft.favicon}
                      alt="Favicon preview"
                      className="w-4 h-4 object-contain"
                    />
                  )}
                  <span className="text-white/40 text-xs truncate">
                    {draft.pageTitle}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveContent}
                  className="bg-[#C69B56] text-black text-xs tracking-[0.1em] uppercase px-5 py-2 font-medium hover:bg-[#d4aa65] transition-colors"
                >
                  Сохранить
                </button>
                <button
                  onClick={resetDraft}
                  className="border border-white/20 text-white/50 text-xs tracking-[0.1em] uppercase px-5 py-2 hover:text-white/80 hover:border-white/40 transition-colors"
                >
                  Сбросить
                </button>
                {saved && (
                  <span className="text-green-400 text-xs self-center">
                    ✓ Сохранено
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "hero" && (
          <div>
            <h3 className="text-[#C69B56] text-sm tracking-[0.1em] uppercase mb-6">
              Редактирование героя-баннера
            </h3>

            <div className="bg-[#1A1A1A] border border-white/10 p-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <ImageUpload
                  label="Фоновое изображение"
                  value={draft.hero.backgroundImage}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, backgroundImage: v },
                    }))
                  }
                />
                <Field
                  label="Подзаголовок"
                  value={draft.hero.subtitle}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, subtitle: v },
                    }))
                  }
                />
                <Field
                  label="Заголовок — строка 1"
                  value={draft.hero.headingLine1}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, headingLine1: v },
                    }))
                  }
                />
                <Field
                  label="Заголовок — строка 2 (выделенная)"
                  value={draft.hero.headingLine2}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, headingLine2: v },
                    }))
                  }
                />
                <div className="sm:col-span-2">
                  <Field
                    label="Описание"
                    value={draft.hero.description}
                    onChange={(v) =>
                      updateDraft((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, description: v },
                      }))
                    }
                    rows={3}
                  />
                </div>
                <Field
                  label="Текст кнопки"
                  value={draft.hero.buttonText}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, buttonText: v },
                    }))
                  }
                />
                <Field
                  label="Ссылка кнопки"
                  value={draft.hero.buttonLink}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, buttonLink: v },
                    }))
                  }
                />
              </div>

              {/* Preview */}
              <div className="mt-6 border border-white/5 overflow-hidden">
                <p className="text-white/30 text-[10px] uppercase tracking-wider px-4 py-2 bg-black/50">
                  Предпросмотр
                </p>
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={draft.hero.backgroundImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
                  <div className="absolute inset-0 flex items-center px-6">
                    <div>
                      <p className="text-[#C69B56] text-[10px] tracking-[0.2em] uppercase mb-1">
                        {draft.hero.subtitle}
                      </p>
                      <p className="text-white text-lg font-light">
                        {draft.hero.headingLine1}{" "}
                        <span className="text-[#C69B56]">
                          {draft.hero.headingLine2}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveContent}
                  className="bg-[#C69B56] text-black text-xs tracking-[0.1em] uppercase px-5 py-2 font-medium hover:bg-[#d4aa65] transition-colors"
                >
                  Сохранить
                </button>
                <button
                  onClick={resetDraft}
                  className="border border-white/20 text-white/50 text-xs tracking-[0.1em] uppercase px-5 py-2 hover:text-white/80 hover:border-white/40 transition-colors"
                >
                  Сбросить
                </button>
                {saved && (
                  <span className="text-green-400 text-xs self-center">
                    ✓ Сохранено
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION HEADINGS TAB */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === "headings" && (
          <div>
            <h3 className="text-[#C69B56] text-sm tracking-[0.1em] uppercase mb-6">
              Редактирование заголовков секций
            </h3>

            <div className="bg-[#1A1A1A] border border-white/10 p-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <Field
                  label="Заголовок «Категории»"
                  value={draft.sectionHeadings.categories}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      sectionHeadings: {
                        ...prev.sectionHeadings,
                        categories: v,
                      },
                    }))
                  }
                />
                <Field
                  label="Заголовок «Хиты продаж»"
                  value={draft.sectionHeadings.featured}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      sectionHeadings: {
                        ...prev.sectionHeadings,
                        featured: v,
                      },
                    }))
                  }
                />
                <Field
                  label="Заголовок «Новинки»"
                  value={draft.sectionHeadings.newArrivals}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      sectionHeadings: {
                        ...prev.sectionHeadings,
                        newArrivals: v,
                      },
                    }))
                  }
                />
                <Field
                  label="Заголовок «О нас»"
                  value={draft.sectionHeadings.about}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      sectionHeadings: { ...prev.sectionHeadings, about: v },
                    }))
                  }
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveContent}
                  className="bg-[#C69B56] text-black text-xs tracking-[0.1em] uppercase px-5 py-2 font-medium hover:bg-[#d4aa65] transition-colors"
                >
                  Сохранить
                </button>
                <button
                  onClick={resetDraft}
                  className="border border-white/20 text-white/50 text-xs tracking-[0.1em] uppercase px-5 py-2 hover:text-white/80 hover:border-white/40 transition-colors"
                >
                  Сбросить
                </button>
                {saved && (
                  <span className="text-green-400 text-xs self-center">
                    ✓ Сохранено
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* ABOUT US TAB */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === "about" && (
          <div>
            <h3 className="text-[#C69B56] text-sm tracking-[0.1em] uppercase mb-6">
              Редактирование секции «О нас»
            </h3>

            {/* Banners */}
            <div className="bg-[#1A1A1A] border border-white/10 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white/70 text-xs tracking-[0.1em] uppercase">
                  Баннеры
                </h4>
                <button
                  onClick={addBanner}
                  className="text-[#C69B56] text-xs tracking-wide hover:text-[#d4aa65] transition-colors"
                >
                  + Добавить баннер
                </button>
              </div>

              <div className="space-y-4">
                {draft.about.banners.map((banner, i) => (
                  <div
                    key={i}
                    className="bg-black border border-white/5 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/30 text-[10px] uppercase tracking-wider">
                        Баннер {i + 1}
                      </span>
                      <button
                        onClick={() => removeBanner(i)}
                        className="text-white/30 hover:text-red-400 text-xs transition-colors"
                      >
                        Удалить
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field
                        label="Заголовок"
                        value={banner.title}
                        onChange={(v) => updateBanner(i, "title", v)}
                      />
                      <Field
                        label="Ссылка (URL)"
                        value={banner.link}
                        onChange={(v) => updateBanner(i, "link", v)}
                        placeholder="/catalogue или https://..."
                      />
                      <div className="sm:col-span-2">
                        <ImageUpload
                          label="Изображение баннера"
                          value={banner.image}
                          onChange={(v) => updateBanner(i, "image", v)}
                        />
                      </div>
                    </div>
                    {/* Banner preview */}
                    {banner.image && (
                      <div className="mt-3 border border-white/5 overflow-hidden">
                        <p className="text-white/20 text-[10px] uppercase tracking-wider px-3 py-1 bg-black/50">
                          Предпросмотр
                        </p>
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img
                            src={banner.image}
                            alt={banner.title}
                            className="w-full h-full object-cover opacity-50"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <span className="text-white text-sm font-medium tracking-wide">
                              {banner.title}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {draft.about.banners.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-white/30 text-xs">Нет баннеров. Нажмите «+ Добавить баннер» чтобы создать.</p>
                </div>
              )}
            </div>

            {/* About Details */}
            <div className="bg-[#1A1A1A] border border-white/10 p-6">
              <h4 className="text-white/70 text-xs tracking-[0.1em] uppercase mb-4">
                Описание и контакты
              </h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Название"
                  value={draft.about.title}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      about: { ...prev.about, title: v },
                    }))
                  }
                />
                <div />
                <div className="sm:col-span-2">
                  <Field
                    label="Описание — абзац 1"
                    value={draft.about.description1}
                    onChange={(v) =>
                      updateDraft((prev) => ({
                        ...prev,
                        about: { ...prev.about, description1: v },
                      }))
                    }
                    rows={3}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Field
                    label="Описание — абзац 2"
                    value={draft.about.description2}
                    onChange={(v) =>
                      updateDraft((prev) => ({
                        ...prev,
                        about: { ...prev.about, description2: v },
                      }))
                    }
                    rows={3}
                  />
                </div>
                <Field
                  label="Локация"
                  value={draft.about.location}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      about: { ...prev.about, location: v },
                    }))
                  }
                />
                <Field
                  label="Телефон"
                  value={draft.about.phone}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      about: { ...prev.about, phone: v },
                    }))
                  }
                />
                <Field
                  label="Email"
                  value={draft.about.email}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      about: { ...prev.about, email: v },
                    }))
                  }
                />
                <Field
                  label="Часы работы"
                  value={draft.about.workingHours}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      about: { ...prev.about, workingHours: v },
                    }))
                  }
                />
                <div className="sm:col-span-2">
                  <Field
                    label="URL карты"
                    value={draft.about.mapUrl}
                    onChange={(v) =>
                      updateDraft((prev) => ({
                        ...prev,
                        about: { ...prev.about, mapUrl: v },
                      }))
                    }
                    placeholder="https://www.openstreetmap.org/..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveContent}
                  className="bg-[#C69B56] text-black text-xs tracking-[0.1em] uppercase px-5 py-2 font-medium hover:bg-[#d4aa65] transition-colors"
                >
                  Сохранить
                </button>
                <button
                  onClick={resetDraft}
                  className="border border-white/20 text-white/50 text-xs tracking-[0.1em] uppercase px-5 py-2 hover:text-white/80 hover:border-white/40 transition-colors"
                >
                  Сбросить
                </button>
                {saved && (
                  <span className="text-green-400 text-xs self-center">
                    ✓ Сохранено
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* NAVIGATION TAB (Landing > Home > Navigation) */}
        {/* ═══════════════════════════════════════════ */}
        {activeMainTab === "landing" && activeLandingSubTab === "home" && activeHomeSection === "navigation" && (
          <div>
            <h3 className="text-[#C69B56] text-sm tracking-[0.1em] uppercase mb-6">
              Управление навигацией
            </h3>

            <div className="bg-[#1A1A1A] border border-white/10 p-6">
              <h4 className="text-white/70 text-xs tracking-[0.1em] uppercase mb-2">
                Ссылки в шапке (navLinks)
              </h4>
              <p className="text-white/30 text-xs mb-4">
                Основные ссылки навигации, отображаемые в Header и Footer. Ссылки сортируются по порядку.
              </p>

              {showAddNavLinkForm && (
                <div className="bg-black/50 border border-white/10 p-4 mb-4">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Field
                      label="Название *"
                      value={formNavLinkName}
                      onChange={setFormNavLinkName}
                      placeholder="Например: Каталог"
                    />
                    <Field
                      label="Путь *"
                      value={formNavLinkPath}
                      onChange={setFormNavLinkPath}
                      placeholder="/catalogue"
                    />
                    <Field
                      label="Порядок"
                      value={formNavLinkOrder.toString()}
                      onChange={(v) => setFormNavLinkOrder(parseInt(v) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => {
                        if (!formNavLinkName.trim() || !formNavLinkPath.trim()) return;
                        if (editingNavLink !== null) {
                          // Edit existing
                          updateDraft((prev) => {
                            const links = [...prev.navLinks];
                            links[editingNavLink] = {
                              name: formNavLinkName.trim(),
                              path: formNavLinkPath.trim(),
                              order: formNavLinkOrder,
                            };
                            return { ...prev, navLinks: links };
                          });
                        } else {
                          // Add new
                          updateDraft((prev) => ({
                            ...prev,
                            navLinks: [
                              ...prev.navLinks,
                              {
                                name: formNavLinkName.trim(),
                                path: formNavLinkPath.trim(),
                                order: formNavLinkOrder,
                              },
                            ],
                          }));
                        }
                        setShowAddNavLinkForm(false);
                        setEditingNavLink(null);
                        setFormNavLinkName("");
                        setFormNavLinkPath("");
                        setFormNavLinkOrder(0);
                      }}
                      className="bg-[#C69B56] text-black text-xs tracking-[0.1em] uppercase px-4 py-2 font-medium hover:bg-[#d4aa65] transition-colors"
                    >
                      {editingNavLink !== null ? "Сохранить" : "Добавить"}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddNavLinkForm(false);
                        setEditingNavLink(null);
                        setFormNavLinkName("");
                        setFormNavLinkPath("");
                        setFormNavLinkOrder(0);
                      }}
                      className="border border-white/20 text-white/50 text-xs tracking-[0.1em] uppercase px-4 py-2 hover:text-white/80 hover:border-white/40 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}

              {!showAddNavLinkForm && (
                <button
                  onClick={() => {
                    setEditingNavLink(null);
                    setFormNavLinkName("");
                    setFormNavLinkPath("");
                    setFormNavLinkOrder(0);
                    setShowAddNavLinkForm(true);
                  }}
                  className="text-[#C69B56] text-xs hover:text-[#d4aa65] transition-colors mb-4 block"
                >
                  + Добавить ссылку
                </button>
              )}

              {draft.navLinks.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40 text-xs tracking-wide uppercase">
                        <th className="text-left py-2 px-2">Название</th>
                        <th className="text-left py-2 px-2">Путь</th>
                        <th className="text-left py-2 px-2">Порядок</th>
                        <th className="text-right py-2 px-2">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...draft.navLinks]
                        .map((link, idx) => ({ link, idx }))
                        .sort((a, b) => a.link.order - b.link.order)
                        .map(({ link, idx }) => (
                          <tr
                            key={`${link.path}-${idx}`}
                            className="border-b border-white/5 hover:bg-white/[0.02]"
                          >
                            <td className="py-2 px-2 text-white/80">{link.name}</td>
                            <td className="py-2 px-2 text-white/40 text-xs font-mono">
                              {link.path}
                            </td>
                            <td className="py-2 px-2 text-[#C69B56]/60 text-xs">
                              {link.order}
                            </td>
                            <td className="py-2 px-2 text-right">
                              <button
                                onClick={() => {
                                  setEditingNavLink(idx);
                                  setFormNavLinkName(link.name);
                                  setFormNavLinkPath(link.path);
                                  setFormNavLinkOrder(link.order);
                                  setShowAddNavLinkForm(true);
                                }}
                                className="text-white/40 hover:text-[#C69B56] text-xs mr-3 transition-colors"
                              >
                                Изменить
                              </button>
                              <button
                                onClick={() => {
                                  updateDraft((prev) => ({
                                    ...prev,
                                    navLinks: prev.navLinks.filter((_, i) => i !== idx),
                                  }));
                                }}
                                className="text-white/40 hover:text-red-400 text-xs transition-colors"
                              >
                                Удалить
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {draft.navLinks.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-white/30 text-xs">Нет ссылок навигации. Нажмите «+ Добавить ссылку» чтобы создать.</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveContent}
                  className="bg-[#C69B56] text-black text-xs tracking-[0.1em] uppercase px-5 py-2 font-medium hover:bg-[#d4aa65] transition-colors"
                >
                  Сохранить
                </button>
                <button
                  onClick={resetDraft}
                  className="border border-white/20 text-white/50 text-xs tracking-[0.1em] uppercase px-5 py-2 hover:text-white/80 hover:border-white/40 transition-colors"
                >
                  Сбросить
                </button>
                {saved && (
                  <span className="text-green-400 text-xs self-center">
                    ✓ Сохранено
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* FOOTER TAB (Landing > Footers) */}
        {/* ═══════════════════════════════════════════ */}
        {activeMainTab === "landing" && activeLandingSubTab === "footers" && (
          <div>
            <h3 className="text-[#C69B56] text-sm tracking-[0.1em] uppercase mb-6">
              Редактирование колонтитулов
            </h3>

            {/* Header Visibility */}
            <div className="bg-[#1A1A1A] border border-white/10 p-6 mb-6">
              <h4 className="text-white/70 text-xs tracking-[0.1em] uppercase mb-4">
                Верхний колонтитул (Header)
              </h4>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.headerVisibility.logo}
                    onChange={(e) =>
                      updateDraft((prev) => ({
                        ...prev,
                        headerVisibility: { ...prev.headerVisibility, logo: e.target.checked },
                      }))
                    }
                    className="accent-[#C69B56] w-4 h-4"
                  />
                  <span className="text-white/70 text-sm">Показывать логотип</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.headerVisibility.links}
                    onChange={(e) =>
                      updateDraft((prev) => ({
                        ...prev,
                        headerVisibility: { ...prev.headerVisibility, links: e.target.checked },
                      }))
                    }
                    className="accent-[#C69B56] w-4 h-4"
                  />
                  <span className="text-white/70 text-sm">Показывать навигацию</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.headerVisibility.search}
                    onChange={(e) =>
                      updateDraft((prev) => ({
                        ...prev,
                        headerVisibility: { ...prev.headerVisibility, search: e.target.checked },
                      }))
                    }
                    className="accent-[#C69B56] w-4 h-4"
                  />
                  <span className="text-white/70 text-sm">Показывать поиск</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.headerVisibility.login}
                    onChange={(e) =>
                      updateDraft((prev) => ({
                        ...prev,
                        headerVisibility: { ...prev.headerVisibility, login: e.target.checked },
                      }))
                    }
                    className="accent-[#C69B56] w-4 h-4"
                  />
                  <span className="text-white/70 text-sm">Показывать кнопку входа</span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveContent}
                  className="bg-[#C69B56] text-black text-xs tracking-[0.1em] uppercase px-5 py-2 font-medium hover:bg-[#d4aa65] transition-colors"
                >
                  Сохранить
                </button>
                <button
                  onClick={resetDraft}
                  className="border border-white/20 text-white/50 text-xs tracking-[0.1em] uppercase px-5 py-2 hover:text-white/80 hover:border-white/40 transition-colors"
                >
                  Сбросить
                </button>
                {saved && (
                  <span className="text-green-400 text-xs self-center">
                    ✓ Сохранено
                  </span>
                )}
              </div>
            </div>

            {/* Footer Section */}
            <div className="bg-[#1A1A1A] border border-white/10 p-6">
              <h4 className="text-white/70 text-xs tracking-[0.1em] uppercase mb-4">
                Нижний колонтитул (Footer)
              </h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field
                    label="Описание бренда"
                    value={draft.footer.brandDescription}
                    onChange={(v) =>
                      updateDraft((prev) => ({
                        ...prev,
                        footer: { ...prev.footer, brandDescription: v },
                      }))
                    }
                    rows={2}
                  />
                </div>
                <Field
                  label="Telegram"
                  value={draft.footer.telegram}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      footer: { ...prev.footer, telegram: v },
                    }))
                  }
                  placeholder="@username"
                />
                <Field
                  label="Viber"
                  value={draft.footer.viber}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      footer: { ...prev.footer, viber: v },
                    }))
                  }
                  placeholder="+375 (XX) XXX-XX-XX"
                />
                <Field
                  label="Instagram"
                  value={draft.footer.instagram}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      footer: { ...prev.footer, instagram: v },
                    }))
                  }
                  placeholder="@username"
                />
                <Field
                  label="Email"
                  value={draft.footer.email}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      footer: { ...prev.footer, email: v },
                    }))
                  }
                />
                <Field
                  label="Телефон"
                  value={draft.footer.phone}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      footer: { ...prev.footer, phone: v },
                    }))
                  }
                />
                <Field
                  label="Копирайт"
                  value={draft.footer.copyright}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      footer: { ...prev.footer, copyright: v },
                    }))
                  }
                />
                <Field
                  label="Текст «Политика конфиденциальности»"
                  value={draft.footer.privacyPolicyText}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      footer: { ...prev.footer, privacyPolicyText: v },
                    }))
                  }
                />
                <Field
                  label="Текст «Оферта»"
                  value={draft.footer.offerText}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      footer: { ...prev.footer, offerText: v },
                    }))
                  }
                />
                <Field
                  label="URL «Политика конфиденциальности» (PDF)"
                  value={draft.footer.privacyPolicyUrl}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      footer: { ...prev.footer, privacyPolicyUrl: v },
                    }))
                  }
                  placeholder="/privacy.pdf или https://..."
                />
                <Field
                  label="URL «Оферта» (PDF)"
                  value={draft.footer.offerUrl}
                  onChange={(v) =>
                    updateDraft((prev) => ({
                      ...prev,
                      footer: { ...prev.footer, offerUrl: v },
                    }))
                  }
                  placeholder="/offer.pdf или https://..."
                />
              </div>

              {/* Footer Links Manager */}
              <div className="mt-8">
                <h4 className="text-[#C69B56] text-xs tracking-[0.1em] uppercase mb-4 font-medium">
                  Ссылки в подвале (footerLinks)
                </h4>
                <p className="text-white/30 text-xs mb-4">
                  Дополнительные ссылки, отображаемые в блоке «Навигация» футера
                </p>

                {showAddFooterLinkForm && (
                  <div className="bg-black/50 border border-white/10 p-4 mb-4">
                    <div className="grid sm:grid-cols-3 gap-3">
                      <Field
                        label="Название *"
                        value={formFooterLinkName}
                        onChange={setFormFooterLinkName}
                        placeholder="Например: Доставка"
                      />
                      <Field
                        label="Путь *"
                        value={formFooterLinkPath}
                        onChange={setFormFooterLinkPath}
                        placeholder="/delivery"
                      />
                      <Field
                        label="Порядок"
                        value={formFooterLinkOrder.toString()}
                        onChange={(v) => setFormFooterLinkOrder(parseInt(v) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => {
                          if (!formFooterLinkName.trim() || !formFooterLinkPath.trim()) return;
                          updateDraft((prev) => ({
                            ...prev,
                            footer: {
                              ...prev.footer,
                              footerLinks: [
                                ...prev.footer.footerLinks,
                                {
                                  name: formFooterLinkName.trim(),
                                  path: formFooterLinkPath.trim(),
                                  order: formFooterLinkOrder,
                                },
                              ],
                            },
                          }));
                          setShowAddFooterLinkForm(false);
                          setFormFooterLinkName("");
                          setFormFooterLinkPath("");
                          setFormFooterLinkOrder(0);
                        }}
                        className="bg-[#C69B56] text-black text-xs tracking-[0.1em] uppercase px-4 py-2 font-medium hover:bg-[#d4aa65] transition-colors"
                      >
                        Добавить
                      </button>
                      <button
                        onClick={() => {
                          setShowAddFooterLinkForm(false);
                          setFormFooterLinkName("");
                          setFormFooterLinkPath("");
                          setFormFooterLinkOrder(0);
                        }}
                        className="border border-white/20 text-white/50 text-xs tracking-[0.1em] uppercase px-4 py-2 hover:text-white/80 hover:border-white/40 transition-colors"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}

                {!showAddFooterLinkForm && (
                  <button
                    onClick={() => {
                      setEditingFooterLink(null);
                      setFormFooterLinkName("");
                      setFormFooterLinkPath("");
                      setFormFooterLinkOrder(0);
                      setShowAddFooterLinkForm(true);
                    }}
                    className="text-[#C69B56] text-xs hover:text-[#d4aa65] transition-colors mb-4 block"
                  >
                    + Добавить ссылку
                  </button>
                )}

                {draft.footer.footerLinks.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-white/40 text-xs tracking-wide uppercase">
                          <th className="text-left py-2 px-2">Название</th>
                          <th className="text-left py-2 px-2">Путь</th>
                          <th className="text-left py-2 px-2">Порядок</th>
                          <th className="text-right py-2 px-2">Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...draft.footer.footerLinks]
                          .sort((a, b) => a.order - b.order)
                          .map((link, idx) => (
                            <tr
                              key={`${link.path}-${idx}`}
                              className="border-b border-white/5 hover:bg-white/[0.02]"
                            >
                              <td className="py-2 px-2 text-white/80">{link.name}</td>
                              <td className="py-2 px-2 text-white/40 text-xs font-mono">
                                {link.path}
                              </td>
                              <td className="py-2 px-2 text-[#C69B56]/60 text-xs">
                                {link.order}
                              </td>
                              <td className="py-2 px-2 text-right">
                                <button
                                  onClick={() => {
                                    setEditingFooterLink(link);
                                    setFormFooterLinkName(link.name);
                                    setFormFooterLinkPath(link.path);
                                    setFormFooterLinkOrder(link.order);
                                    setShowAddFooterLinkForm(true);
                                  }}
                                  className="text-white/40 hover:text-[#C69B56] text-xs mr-3 transition-colors"
                                >
                                  Изменить
                                </button>
                                <button
                                  onClick={() => {
                                    updateDraft((prev) => ({
                                      ...prev,
                                      footer: {
                                        ...prev.footer,
                                        footerLinks: prev.footer.footerLinks.filter(
                                          (l) => l !== link
                                        ),
                                      },
                                    }));
                                  }}
                                  className="text-white/40 hover:text-red-400 text-xs transition-colors"
                                >
                                  Удалить
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveContent}
                  className="bg-[#C69B56] text-black text-xs tracking-[0.1em] uppercase px-5 py-2 font-medium hover:bg-[#d4aa65] transition-colors"
                >
                  Сохранить
                </button>
                <button
                  onClick={resetDraft}
                  className="border border-white/20 text-white/50 text-xs tracking-[0.1em] uppercase px-5 py-2 hover:text-white/80 hover:border-white/40 transition-colors"
                >
                  Сбросить
                </button>
                {saved && (
                  <span className="text-green-400 text-xs self-center">
                    ✓ Сохранено
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* CATEGORIES TAB */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === "categories" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-white/50 text-sm">
                {categoryList.length} категорий
              </p>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setFormCatName("");
                  setFormCatSlug("");
                  setFormCatImage("");
                  setShowAddCategoryForm(true);
                }}
                className="bg-[#C69B56] text-black text-xs tracking-[0.1em] uppercase px-4 py-2 font-medium hover:bg-[#d4aa65] transition-colors"
              >
                + Добавить категорию
              </button>
            </div>

            {/* Add/Edit Category Form */}
            {showAddCategoryForm && (
              <div className="bg-[#1A1A1A] border border-white/10 p-6 mb-6">
                <h3 className="text-[#C69B56] text-sm tracking-[0.1em] uppercase mb-4">
                  {editingCategory ? "Редактировать категорию" : "Новая категория"}
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field
                    label="Название *"
                    value={formCatName}
                    onChange={(v) => {
                      setFormCatName(v);
                      if (!editingCategory) {
                        setFormCatSlug(
                          v
                            .toLowerCase()
                            .replace(/[^a-z0-9а-яё]+/gi, "-")
                            .replace(/^-|-$/g, "")
                        );
                      }
                    }}
                    placeholder="Например: Нишевая"
                  />
                  <Field
                    label="Slug (URL-идентификатор) *"
                    value={formCatSlug}
                    onChange={setFormCatSlug}
                    placeholder="Например: niche"
                  />
                  <div className="sm:col-span-2">
                    <ImageUpload
                      label="Изображение"
                      value={formCatImage}
                      onChange={setFormCatImage}
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={async () => {
                      if (!formCatName.trim() || !formCatSlug.trim()) return;
                      if (editingCategory) {
                        await persistCategoryUpdate(editingCategory.slug, {
                          name: formCatName.trim(),
                          slug: formCatSlug.trim(),
                          image: formCatImage || editingCategory.image,
                        });
                        setCategoryList((prev) =>
                          prev.map((c) =>
                            c.slug === editingCategory.slug
                              ? {
                                  name: formCatName.trim(),
                                  slug: formCatSlug.trim(),
                                  image: formCatImage || c.image,
                                }
                              : c
                          )
                        );
                      } else {
                        const created = await addCategory({
                          name: formCatName.trim(),
                          slug: formCatSlug.trim(),
                          image:
                            formCatImage ||
                            "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&q=80",
                        });
                        if (created) {
                          setCategoryList((prev) => [...prev, created]);
                        }
                      }
                      setShowAddCategoryForm(false);
                      setEditingCategory(null);
                      setFormCatName("");
                      setFormCatSlug("");
                      setFormCatImage("");
                    }}
                    className="bg-[#C69B56] text-black text-xs tracking-[0.1em] uppercase px-5 py-2 font-medium hover:bg-[#d4aa65] transition-colors"
                  >
                    {editingCategory ? "Сохранить" : "Добавить"}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCategoryForm(false);
                      setEditingCategory(null);
                      setFormCatName("");
                      setFormCatSlug("");
                      setFormCatImage("");
                    }}
                    className="border border-white/20 text-white/50 text-xs tracking-[0.1em] uppercase px-5 py-2 hover:text-white/80 hover:border-white/40 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}

            {/* Category Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-xs tracking-wide uppercase">
                    <th className="text-left py-3 px-2">Изображение</th>
                    <th className="text-left py-3 px-2">Название</th>
                    <th className="text-left py-3 px-2">Slug</th>
                    <th className="text-left py-3 px-2">Продуктов</th>
                    <th className="text-right py-3 px-2">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryList.map((cat) => (
                    <tr
                      key={cat.slug}
                      className="border-b border-white/5 hover:bg-white/[0.02]"
                    >
                      <td className="py-3 px-2">
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-10 h-10 object-cover rounded-sm"
                        />
                      </td>
                      <td className="py-3 px-2 text-white/80">{cat.name}</td>
                      <td className="py-3 px-2 text-white/40 text-xs font-mono">
                        {cat.slug}
                      </td>
                      <td className="py-3 px-2 text-[#C69B56]/60 text-xs">
                        {productList.filter((p) => p.category === cat.slug).length}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setFormCatName(cat.name);
                            setFormCatSlug(cat.slug);
                            setFormCatImage(cat.image);
                            setShowAddCategoryForm(true);
                          }}
                          className="text-white/40 hover:text-[#C69B56] text-xs mr-3 transition-colors"
                        >
                          Изменить
                        </button>
                        <button
                          onClick={async () => {
                            await persistCategoryDelete(cat.slug);
                            setCategoryList((prev) =>
                              prev.filter((c) => c.slug !== cat.slug)
                            );
                          }}
                          className="text-white/40 hover:text-red-400 text-xs transition-colors"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* ═══════════════════════════════════════════ */}
        {/* SETTINGS TAB */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === "settings" && (
          <div>
            <h3 className="text-[#C69B56] text-sm tracking-[0.1em] uppercase mb-6">
              Настройки приложения
            </h3>

            {/* Feedback Email */}
            <div className="bg-[#1A1A1A] border border-white/10 p-6 mb-6">
              <h4 className="text-white/70 text-xs tracking-[0.1em] uppercase mb-2">
                Email для обратной связи
              </h4>
              <p className="text-white/30 text-xs mb-4">
                Адрес электронной почты, на который будут поступать заявки и обращения клиентов
              </p>
              <div className="max-w-md">
                <label className="block text-white/40 text-xs mb-1">Email обратной связи</label>
                <input
                  type="email"
                  value={feedbackEmail}
                  onChange={(e) => {
                    setFeedbackEmail(e.target.value);
                    setFeedbackMsg(null);
                  }}
                  className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2 focus:border-[#C69B56] outline-none placeholder:text-white/20"
                  placeholder="feedback@example.com"
                />
              </div>

              {feedbackMsg && (
                <div className={`flex items-center gap-2 mt-4 text-xs ${feedbackMsg.type === "success" ? "text-green-400" : "text-red-400"}`}>
                  {feedbackMsg.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
                  {feedbackMsg.text}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={async () => {
                    setFeedbackLoading(true);
                    setFeedbackMsg(null);
                    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                    if (!emailRegex.test(feedbackEmail.trim())) {
                      setFeedbackMsg({ type: "error", text: "Введите корректный email адрес" });
                      setFeedbackLoading(false);
                      return;
                    }
                    try {
                      await laravelApi.updateFeedbackEmail(feedbackEmail.trim().toLowerCase());
                      setFeedbackMsg({ type: "success", text: "Email обратной связи обновлён" });
                    } catch (err: any) {
                      const detail = err?.response?.data?.detail || err?.message || "Ошибка сохранения";
                      setFeedbackMsg({ type: "error", text: typeof detail === "string" ? detail : "Ошибка сохранения настроек" });
                    } finally {
                      setFeedbackLoading(false);
                    }
                  }}
                  disabled={feedbackLoading}
                  className="bg-[#C69B56] text-black text-xs tracking-[0.1em] uppercase px-5 py-2 font-medium hover:bg-[#d4aa65] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save size={12} />
                  {feedbackLoading ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </div>

            {/* Mail (SMTP) Settings */}
            <div className="bg-[#1A1A1A] border border-white/10 p-6">
              <h4 className="text-white/70 text-xs tracking-[0.1em] uppercase mb-2">
                Настройки почты (SMTP)
              </h4>
              <p className="text-white/30 text-xs mb-4">
                Конфигурация SMTP-сервера для отправки email-уведомлений о новых заявках
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/40 text-xs mb-1">SMTP_HOST</label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => {
                      setSmtpHost(e.target.value);
                      setMailMsg(null);
                    }}
                    className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2 focus:border-[#C69B56] outline-none placeholder:text-white/20"
                    placeholder="smtp.gmail.com"
                  />
                  <span className="text-white/20 text-[10px]">Адрес SMTP-сервера</span>
                </div>
                <div>
                  <label className="block text-white/40 text-xs mb-1">SMTP_PORT</label>
                  <input
                    type="text"
                    value={smtpPort}
                    onChange={(e) => {
                      setSmtpPort(e.target.value);
                      setMailMsg(null);
                    }}
                    className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2 focus:border-[#C69B56] outline-none placeholder:text-white/20"
                    placeholder="587"
                  />
                  <span className="text-white/20 text-[10px]">Порт (587 — TLS, 465 — SSL)</span>
                </div>
                <div>
                  <label className="block text-white/40 text-xs mb-1">SMTP_USER</label>
                  <input
                    type="text"
                    value={smtpUser}
                    onChange={(e) => {
                      setSmtpUser(e.target.value);
                      setMailMsg(null);
                    }}
                    className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2 focus:border-[#C69B56] outline-none placeholder:text-white/20"
                    placeholder="your-email@gmail.com"
                  />
                  <span className="text-white/20 text-[10px]">Логин SMTP-сервера</span>
                </div>
                <div>
                  <label className="block text-white/40 text-xs mb-1">SMTP_PASSWORD</label>
                  <input
                    type="password"
                    value={smtpPassword}
                    onChange={(e) => {
                      setSmtpPassword(e.target.value);
                      setMailMsg(null);
                    }}
                    className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2 focus:border-[#C69B56] outline-none placeholder:text-white/20"
                    placeholder="••••••••"
                  />
                  <span className="text-white/20 text-[10px]">Пароль или app-specific пароль</span>
                </div>
                <div>
                  <label className="block text-white/40 text-xs mb-1">EMAIL_FROM</label>
                  <input
                    type="email"
                    value={emailFrom}
                    onChange={(e) => {
                      setEmailFrom(e.target.value);
                      setMailMsg(null);
                    }}
                    className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2 focus:border-[#C69B56] outline-none placeholder:text-white/20"
                    placeholder="noreply@example.com"
                  />
                  <span className="text-white/20 text-[10px]">Адрес отправителя уведомлений</span>
                </div>
                <div>
                  <label className="block text-white/40 text-xs mb-1">EMAIL_TO</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => {
                      setEmailTo(e.target.value);
                      setMailMsg(null);
                    }}
                    className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2 focus:border-[#C69B56] outline-none placeholder:text-white/20"
                    placeholder="admin@example.com"
                  />
                  <span className="text-white/20 text-[10px]">Адрес получателя уведомлений о заявках</span>
                </div>
              </div>

              {mailMsg && (
                <div className={`flex items-center gap-2 mt-4 text-xs ${mailMsg.type === "success" ? "text-green-400" : "text-red-400"}`}>
                  {mailMsg.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
                  {mailMsg.text}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={async () => {
                    setMailLoading(true);
                    setMailMsg(null);
                    try {
                      await laravelApi.updateSmtpSettings({
                        smtp_host: smtpHost.trim(),
                        smtp_port: smtpPort.trim(),
                        smtp_user: smtpUser.trim(),
                        smtp_password: smtpPassword,
                        email_from: emailFrom.trim(),
                        email_to: emailTo.trim(),
                      });
                      setMailMsg({ type: "success", text: "Настройки почты сохранены и применены немедленно." });
                    } catch (err: any) {
                      const detail = err?.response?.data?.detail || err?.message || "Ошибка сохранения";
                      setMailMsg({ type: "error", text: typeof detail === "string" ? detail : "Ошибка сохранения настроек почты" });
                    } finally {
                      setMailLoading(false);
                    }
                  }}
                  disabled={mailLoading}
                  className="bg-[#C69B56] text-black text-xs tracking-[0.1em] uppercase px-5 py-2 font-medium hover:bg-[#d4aa65] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save size={12} />
                  {mailLoading ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}