import { laravelApi } from "@/lib/laravelApi";
import type { Product, Category, Brand } from "@/data/products";
import type { SiteContent } from "@/data/siteContent";

// ─── Products ───

export async function fetchProducts(): Promise<Product[]> {
  try {
    return await laravelApi.getProducts();
  } catch (e) {
    console.error("Failed to fetch products:", e);
    return [];
  }
}

export async function createProduct(
  product: Omit<Product, "id">
): Promise<Product | null> {
  try {
    return await laravelApi.createProduct(product);
  } catch (e) {
    console.error("Failed to create product:", e);
    return null;
  }
}

export async function updateProduct(
  id: number,
  updates: Partial<Product>
): Promise<Product | null> {
  try {
    return await laravelApi.updateProduct(id, updates);
  } catch (e) {
    console.error("Failed to update product:", e);
    return null;
  }
}

export async function deleteProduct(id: number): Promise<boolean> {
  try {
    await laravelApi.deleteProduct(id);
    return true;
  } catch (e) {
    console.error("Failed to delete product:", e);
    return false;
  }
}

// ─── Categories ───

export async function fetchCategories(): Promise<Category[]> {
  try {
    return await laravelApi.getCategories();
  } catch (e) {
    console.error("Failed to fetch categories:", e);
    return [];
  }
}

export async function createCategory(
  category: Category
): Promise<Category | null> {
  try {
    return await laravelApi.createCategory({
      name: category.name,
      slug: category.slug,
      image: category.image,
    });
  } catch (e) {
    console.error("Failed to create category:", e);
    return null;
  }
}

export async function updateCategoryById(
  id: number,
  updates: Partial<Category>
): Promise<Category | null> {
  try {
    return await laravelApi.updateCategory(id, updates);
  } catch (e) {
    console.error("Failed to update category:", e);
    return null;
  }
}

export async function deleteCategoryById(id: number): Promise<boolean> {
  try {
    await laravelApi.deleteCategory(id);
    return true;
  } catch (e) {
    console.error("Failed to delete category:", e);
    return false;
  }
}

export async function findCategoryIdBySlug(
  slug: string
): Promise<number | null> {
  try {
    const categories = await laravelApi.getCategories();
    const found = categories.find((c) => c.slug === slug);
    return found ? found.id : null;
  } catch (e) {
    console.error("Failed to find category:", e);
    return null;
  }
}

// ─── Brands ───

export async function fetchBrands(): Promise<Brand[]> {
  try {
    return await laravelApi.getBrands();
  } catch (e) {
    console.error("Failed to fetch brands:", e);
    return [];
  }
}

// ─── Site Content ───
// The database stores site content as separate rows keyed by content_key:
// "hero", "section_headings", "about", "footer", "logo", "favicon", "pageTitle", "headerVisibility"
// Each row's content_value is a JSON string for that section.

function keyToField(key: string): keyof SiteContent {
  if (key === "section_headings") return "sectionHeadings";
  return key as keyof SiteContent;
}

function fieldToKey(field: keyof SiteContent): string {
  if (field === "sectionHeadings") return "section_headings";
  return field as string;
}

export async function fetchSiteContent(): Promise<SiteContent | null> {
  try {
    const content = await laravelApi.getSiteContent();
    if (!content || Object.keys(content).length === 0) return null;

    const result: Partial<SiteContent> = {};
    for (const [key, value] of Object.entries(content)) {
      if (!key || !value) continue;
      try {
        const field = keyToField(key);
        (result as Record<string, any>)[field] = JSON.parse(value);
      } catch {
        // skip unparseable rows
      }
    }

    // Validate core sections present (optional fields fall back to defaults)
    const coreKeys = ["hero", "sectionHeadings", "about", "footer"] as const;
    const hasCore = coreKeys.every((k) => k in result);
    return hasCore ? (result as SiteContent) : null;
  } catch (e) {
    console.error("Failed to fetch site content:", e);
    return null;
  }
}

export async function saveSiteContent(content: SiteContent): Promise<boolean> {
  try {
    const sections: (keyof SiteContent)[] = [
      "logo", "favicon", "pageTitle", "headerVisibility",
      "hero", "sectionHeadings", "about", "footer",
    ];

    for (const field of sections) {
      const key = fieldToKey(field);
      const value = JSON.stringify((content as Record<string, any>)[field]);
      await laravelApi.updateSiteContent(key, value);
    }
    return true;
  } catch (e) {
    console.error("Failed to save site content:", e);
    return false;
  }
}

// ─── Inquiries ───

export async function submitInquiry(data: {
  name: string;
  phone: string;
  message: string;
  product_name?: string;
  product_brand?: string;
}): Promise<boolean> {
  try {
    await laravelApi.createInquiry(data);
    return true;
  } catch (e) {
    console.error("Failed to submit inquiry:", e);
    return false;
  }
}