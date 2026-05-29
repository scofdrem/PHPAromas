import { laravelApi } from "@/lib/laravelApi";

/**
 * Upload a file to the Laravel backend and return the URL.
 * Uses Laravel's /api/admin/media endpoint.
 */
export async function uploadImage(
  file: File,
  folder: string = "banners"
): Promise<{ objectKey: string; url: string }> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectKey = `${folder}/${timestamp}-${safeName}`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("path", objectKey);

  const result = await laravelApi.uploadMedia(formData);
  const url = result.url || "";

  return { objectKey, url };
}

/**
 * Resolve an image URL for display.
 * - https://... -> returns as-is
 * - data:... -> returns as-is (base64)
 * - /storage/... -> returns as-is (Laravel public storage)
 * - empty -> returns empty
 */
export async function resolveImageUrl(
  src: string
): Promise<string> {
  if (!src) return "";

  // Already a regular URL or data URI
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:")
  ) {
    return src;
  }

  // Laravel storage path
  if (src.startsWith("/storage/") || src.startsWith("storage/")) {
    return src.startsWith("/") ? src : `/${src}`;
  }

  return src;
}

/**
 * Check if a source string is a storage reference
 */
export function isStorageRef(src: string): boolean {
  return src.startsWith("storage://") || src.startsWith("/storage/");
}