/**
 * Application logger.
 *
 * A thin indirection over the console so that error reporting has one seam:
 * pointing `error` at Crashlytics or Sentry later touches this file only.
 * Debug output is suppressed in production builds.
 */

import { env } from "@/config/env";

/** Structured context attached to a log entry. */
export type LogContext = Readonly<Record<string, unknown>>;

/** The logging surface available to the rest of the application. */
export interface Logger {
  debug(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, cause?: unknown, context?: LogContext): void;
}

/** The application logger. */
export const logger: Logger = {
  debug(message, context) {
    if (env.isProduction) return;
    console.debug(`[talendig] ${message}`, context ?? {});
  },

  warn(message, context) {
    console.warn(`[talendig] ${message}`, context ?? {});
  },

  error(message, cause, context) {
    console.error(`[talendig] ${message}`, { cause, ...context });
  },
};
