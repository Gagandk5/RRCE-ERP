/**
 * Institutional Password Policy Validator for RRCE ERP
 */

const COMMON_DISALLOWED_PASSWORDS = new Set([
  "password",
  "password123",
  "123456",
  "12345678",
  "admin",
  "admin123",
  "qwerty",
  "rrce",
  "rrce123",
  "welcome",
  "welcome123",
]);

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  score: number; // 0 to 4
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  if (!password || typeof password !== "string") {
    return {
      valid: false,
      errors: ["Password cannot be empty"],
      score: 0,
    };
  }

  // 1. Length check
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  } else if (password.length >= 12) {
    score += 1;
  }

  // 2. Disallow common passwords
  if (COMMON_DISALLOWED_PASSWORDS.has(password.toLowerCase().trim())) {
    errors.push("Password is too common or easily guessable");
  }

  // 3. Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter (A-Z)");
  } else {
    score += 1;
  }

  // 4. Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter (a-z)");
  } else {
    score += 1;
  }

  // 5. Digit check
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one numeric digit (0-9)");
  } else {
    score += 1;
  }

  // 6. Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    errors.push("Password must contain at least one special symbol (!@#$%^&*...)");
  } else {
    score += 1;
  }

  return {
    valid: errors.length === 0,
    errors,
    score: Math.min(4, Math.max(0, score)),
  };
}
