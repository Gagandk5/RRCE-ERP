import { logger } from "./logger";

export function captureException(
  error: unknown,
  context: Record<string, unknown> = {}
) {
  logger.error({ error, ...context }, "Captured application error");

  // If Sentry is initialized in browser or server, forward exception
  if (typeof window !== "undefined" && (window as any).Sentry) {
    (window as any).Sentry.captureException(error, { extra: context });
  }
}

export function trackUserAction(action: string, metadata: Record<string, unknown> = {}) {
  logger.info({ action, ...metadata }, `User Action: ${action}`);
}
