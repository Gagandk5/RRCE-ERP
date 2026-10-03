/**
 * Feature Flags Configuration and Evaluation Engine
 */

export interface FeatureFlagConfig {
  enabled: boolean;
  allowedRoles?: string[];
  description: string;
}

const DEFAULT_FLAGS: Record<string, FeatureFlagConfig> = {
  new_attendance_ui: {
    enabled: true,
    allowedRoles: ["FACULTY", "HOD", "PRINCIPAL"],
    description: "Access to next-gen attendance session interface",
  },
  fee_payment_gateway: {
    enabled: true,
    allowedRoles: ["STUDENT", "ADMISSIONS", "PRINCIPAL"],
    description: "Digital fee invoicing and online transaction processing",
  },
  branch_reallocation_v2: {
    enabled: true,
    allowedRoles: ["ADMISSIONS", "PRINCIPAL"],
    description: "Algorithmic branch reallocation and USN generator",
  },
  strict_account_lockout: {
    enabled: true,
    description: "Temporary account lockout after 5 consecutive failed login attempts",
  },
};

export function isFeatureEnabled(
  flagName: string,
  context?: { role?: string; userId?: string }
): boolean {
  // 1. Environment variable override (e.g., FEATURE_FLAG_NEW_ATTENDANCE_UI=true/false)
  const envKey = `FEATURE_FLAG_${flagName.toUpperCase()}`;
  if (process.env[envKey] !== undefined) {
    return process.env[envKey] === "true" || process.env[envKey] === "1";
  }

  const flag = DEFAULT_FLAGS[flagName];
  if (!flag) {
    return false;
  }

  if (!flag.enabled) {
    return false;
  }

  // Role-based targeting check
  if (flag.allowedRoles && context?.role) {
    return flag.allowedRoles.includes(context.role);
  }

  return true;
}

export function getAllFeatureFlags(context?: { role?: string }): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const flagName of Object.keys(DEFAULT_FLAGS)) {
    result[flagName] = isFeatureEnabled(flagName, context);
  }
  return result;
}
