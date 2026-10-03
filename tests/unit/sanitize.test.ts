import { describe, it, expect } from "vitest";
import {
  sanitizeFilename,
  validateUploadedFile,
  ALLOWED_PHOTO_MIME_TYPES,
  ALLOWED_ASSIGNMENT_MIME_TYPES,
} from "@/lib/sanitize";

describe("lib/sanitize - File and Path Traversal Protections", () => {
  it("should strip path traversal sequences and dangerous characters from filenames", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("..\\..\\windows\\system32.dll")).toBe("system32.dll");
    expect(sanitizeFilename("student<script>.png")).toBe("student_script_.png");
    expect(sanitizeFilename("profile photo (1).jpg")).toBe("profile_photo__1_.jpg");
  });

  it("should validate file sizes against limits", () => {
    const validFile = { size: 2 * 1024 * 1024, type: "image/jpeg", name: "photo.jpg" };
    expect(validateUploadedFile(validFile, { allowedTypes: ALLOWED_PHOTO_MIME_TYPES }).valid).toBe(true);

    const oversizedFile = { size: 6 * 1024 * 1024, type: "image/jpeg", name: "huge.jpg" };
    expect(validateUploadedFile(oversizedFile, { allowedTypes: ALLOWED_PHOTO_MIME_TYPES }).valid).toBe(false);
  });

  it("should reject disallowed MIME types", () => {
    const exeFile = { size: 1024, type: "application/x-msdownload", name: "virus.exe" };
    const res = validateUploadedFile(exeFile, { allowedTypes: ALLOWED_PHOTO_MIME_TYPES });
    expect(res.valid).toBe(false);
    expect(res.error).toContain("Unsupported file format");
  });

  it("should accept valid PDF for assignments", () => {
    const pdfFile = { size: 4 * 1024 * 1024, type: "application/pdf", name: "assignment1.pdf" };
    expect(validateUploadedFile(pdfFile, { allowedTypes: ALLOWED_ASSIGNMENT_MIME_TYPES }).valid).toBe(true);
  });
});
