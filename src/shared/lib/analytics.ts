/**
 * Firebase Analytics facade.
 *
 * The only module allowed to import `firebase/analytics`. Callers log intent
 * through `trackEvent`, which is typed against a closed event map, so a typo in
 * an event name or payload is a compile error rather than a silent gap in the
 * dashboard.
 *
 * Analytics never breaks the application: initialisation is lazy and every
 * failure degrades to a no-op.
 */

import {
  isSupported,
  logEvent,
  setUserId,
  getAnalytics,
  type Analytics,
} from "firebase/analytics";
import { env } from "@/config/env";
import { firebaseApp } from "@/config/firebase";
import { logger } from "./logger";

/** Stable event names. Add a new event here and to `AnalyticsEventPayloads`. */
export const ANALYTICS_EVENTS = {
  searchPerformed: "class_search_performed",
  filtersApplied: "class_filters_applied",
  filtersCleared: "class_filters_cleared",
  classDetailOpened: "class_detail_opened",
  recordingOpened: "class_recording_opened",
  classCreated: "class_created",
  classUpdated: "class_updated",
  classDeleted: "class_deleted",
  loginSucceeded: "teacher_login_succeeded",
  loginFailed: "teacher_login_failed",
  errorStateShown: "error_state_shown",
} as const;

/** Union of valid event names. */
export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/**
 * Payload contract per event.
 *
 * Payloads carry ids, codes, counts and enum values only — never names, emails,
 * passwords or private recording URLs.
 */
export interface AnalyticsEventPayloads {
  [ANALYTICS_EVENTS.searchPerformed]: {
    query_length: number;
    result_count: number;
    has_filters: boolean;
  };
  [ANALYTICS_EVENTS.filtersApplied]: {
    filter_count: number;
    has_date_range: boolean;
    has_teacher: boolean;
    has_code: boolean;
  };
  [ANALYTICS_EVENTS.filtersCleared]: { surface: "public" | "admin" };
  [ANALYTICS_EVENTS.classDetailOpened]: { class_code: string };
  [ANALYTICS_EVENTS.recordingOpened]: {
    class_code: string;
    surface: "list" | "detail";
  };
  [ANALYTICS_EVENTS.classCreated]: { class_code: string };
  [ANALYTICS_EVENTS.classUpdated]: { class_code: string };
  [ANALYTICS_EVENTS.classDeleted]: { class_code: string };
  [ANALYTICS_EVENTS.loginSucceeded]: Record<string, never>;
  [ANALYTICS_EVENTS.loginFailed]: { reason: string };
  [ANALYTICS_EVENTS.errorStateShown]: { surface: string; error_code: string };
}

/**
 * The in-flight or settled resolution of the Analytics instance.
 *
 * The promise is cached rather than its result: several events fired in the
 * same tick would otherwise each see "not resolved yet" and start their own
 * initialisation before any of them finished.
 */
let analyticsResolution: Promise<Analytics | null> | undefined;

/**
 * Reports whether analytics should run in this build.
 *
 * @returns `true` in production, or in development when explicitly enabled.
 */
function isAnalyticsEnabled(): boolean {
  if (env.firebase.measurementId === undefined) return false;
  return env.isProduction || env.enableAnalyticsInDev;
}

/**
 * Resolves the Analytics instance once, caching the attempt itself.
 *
 * @returns The instance, or `null` when analytics is unavailable.
 */
function resolveAnalytics(): Promise<Analytics | null> {
  analyticsResolution ??= (async () => {
    if (!isAnalyticsEnabled()) return null;

    try {
      return (await isSupported()) ? getAnalytics(firebaseApp) : null;
    } catch (error) {
      // A broken analytics SDK must never take the application down.
      logger.warn("Analytics could not be initialised", { error });
      return null;
    }
  })();

  return analyticsResolution;
}

/**
 * Records an analytics event. Fire-and-forget: never throws, never awaited by
 * callers, and a no-op when analytics is disabled or unsupported.
 *
 * @param name - The event name, from `ANALYTICS_EVENTS`.
 * @param payload - The event payload matching `name`.
 */
export function trackEvent<TName extends AnalyticsEventName>(
  name: TName,
  payload: AnalyticsEventPayloads[TName],
): void {
  void resolveAnalytics()
    .then((analytics) => {
      if (analytics === null) return;
      logEvent(analytics, name, payload);
    })
    .catch((error: unknown) => {
      logger.warn("Analytics event could not be sent", { name, error });
    });
}

/**
 * Associates subsequent events with a signed-in teacher.
 *
 * The Firebase Auth UID is an opaque identifier and carries no personal data,
 * which is why it is the only identity value sent to analytics.
 *
 * @param userId - Firebase Auth UID, or `null` to clear on sign-out.
 */
export function identifyUser(userId: string | null): void {
  void resolveAnalytics()
    .then((analytics) => {
      if (analytics === null) return;
      setUserId(analytics, userId);
    })
    .catch((error: unknown) => {
      logger.warn("Analytics user id could not be set", { error });
    });
}
