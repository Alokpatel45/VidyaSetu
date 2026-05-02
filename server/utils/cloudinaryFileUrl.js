/**
 * multer-storage-cloudinary typically puts the final HTTPS URL on `file.path`;
 * Cloudinary APIs may expose `secure_url` on variants. Normalize here.
 */
export function cloudinaryPublicUrl(file) {
  if (!file) return null;
  const candidates = [file.secure_url, file.path, file.url];
  for (const c of candidates) {
    if (typeof c === "string" && /^https?:\/\//i.test(c)) {
      return c;
    }
  }
  return null;
}
