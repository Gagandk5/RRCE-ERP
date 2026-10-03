import DOMPurify from "dompurify";

/**
 * Sanitize plain text or rich HTML content to prevent XSS attacks
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== "string") return "";
  // In server environments where window is undefined, DOMPurify works or falls back cleanly
  if (typeof window !== "undefined") {
    return DOMPurify.sanitize(dirty);
  }
  // Server-side fallback: strip script tags and event handlers
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "");
}

/**
 * Sanitize file names to prevent path traversal and arbitrary file overwrite attacks
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== "string") {
    return "file_" + Date.now();
  }

  // 1. Remove any path elements
  const basename = filename.replace(/^.*[\\\/]/, "");

  // 2. Remove null bytes and non-printable characters
  const clean = basename.replace(/[\x00-\x1f\x80-\x9f]/g, "");

  // 3. Remove dangerous shell/regex characters
  const safe = clean.replace(/[^a-zA-Z0-9._-]/g, "_");

  // 4. Disallow hidden dotfiles or path traversal attempts
  const normalized = safe.replace(/^\.+/, "");

  return normalized || "upload_" + Date.now();
}

/**
 * Allowed MIME types for student/faculty photo uploads
 */
export const ALLOWED_PHOTO_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/**
 * Allowed MIME types for academic assignments and records
 */
export const ALLOWED_ASSIGNMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);

export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_ASSIGNMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Validate an uploaded file against size and MIME type policies
 */
export function validateUploadedFile(
  file: { size: number; type: string; name: string },
  options: {
    allowedTypes?: Set<string>;
    maxSizeBytes?: number;
  } = {}
): { valid: boolean; error?: string } {
  const allowed = options.allowedTypes ?? ALLOWED_PHOTO_MIME_TYPES;
  const maxBytes = options.maxSizeBytes ?? MAX_PHOTO_SIZE_BYTES;

  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds the maximum limit of ${maxMb}MB.`,
    };
  }

  if (!allowed.has(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported file format (${file.type}). Allowed formats: ${Array.from(allowed).join(", ")}.`,
    };
  }

  return { valid: true };
}
