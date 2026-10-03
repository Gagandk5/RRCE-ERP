import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  base: {
    service: "rrce-erp",
    env: process.env.NODE_ENV || "development",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "password",
      "passwordHash",
      "newPassword",
      "confirmPassword",
      "currentPassword",
      "token",
      "refreshToken",
      "jwt",
      "secret",
      "authorization",
      "cookie",
      "headers.authorization",
      "headers.cookie",
      "body.password",
      "*.password",
    ],
    censor: "[REDACTED]",
  },
});

export function createChildLogger(moduleName: string, extraContext: Record<string, unknown> = {}) {
  return logger.child({
    module: moduleName,
    ...extraContext,
  });
}

export default logger;
