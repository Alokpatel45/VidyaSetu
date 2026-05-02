import { API_URL } from "../config";

/**
 * Builds a usable URL for course images / lecture videos.
 * Supports absolute Cloudinary URLs and legacy paths served from API origin.
 */
export function resolveMediaUrl(pathOrUrl) {
  if (pathOrUrl == null || pathOrUrl === "") return "";

  const trimmed = String(pathOrUrl).trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const path = trimmed.replace(/\\/g, "/").replace(/^\//, "");
  return `${API_URL}/${path}`;
}
