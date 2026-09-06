/**
 * Application error model.
 *
 * Every failure that can reach a user is normalised into an `AppError` with a
 * stable machine-readable `code` and a Spanish `userMessage`. Raw Firebase
 * error strings never reach the interface.
 */

import { COPY } from "@/shared/i18n/copy";

/** Closed set of failures the application knows how to talk about. */
export type AppErrorCode =
  | "auth/invalid-credentials"
  | "auth/too-many-attempts"
  | "auth/network"
  | "auth/unknown"
  | "classes/not-found"
  | "classes/permission-denied"
  | "classes/duplicate-code"
  | "classes/unavailable"
  | "classes/unknown"
  | "validation/invalid-input";

/** A normalised, user-presentable application error. */
export interface AppError {
  readonly code: AppErrorCode;
  /** Spanish message safe to render directly in the interface. */
  readonly userMessage: string;
  /** Original error, kept for logging. Never rendered. */
  readonly cause?: unknown;
}

/**
 * Builds an `AppError`.
 *
 * @param code - Stable error code.
 * @param userMessage - Spanish text shown to the user.
 * @param cause - Original error, preserved for logs.
 * @returns The normalised error.
 */
export function createAppError(
  code: AppErrorCode,
  userMessage: string,
  cause?: unknown,
): AppError {
  return { code, userMessage, cause };
}

/** Firebase Auth error codes mapped to our own. */
const AUTH_CODE_MAP: Readonly<Record<string, AppErrorCode>> = {
  "auth/invalid-credential": "auth/invalid-credentials",
  "auth/invalid-email": "auth/invalid-credentials",
  "auth/user-not-found": "auth/invalid-credentials",
  "auth/wrong-password": "auth/invalid-credentials",
  "auth/user-disabled": "auth/invalid-credentials",
  "auth/too-many-requests": "auth/too-many-attempts",
  "auth/network-request-failed": "auth/network",
};

/** Firestore error codes mapped to our own. */
const FIRESTORE_CODE_MAP: Readonly<Record<string, AppErrorCode>> = {
  "permission-denied": "classes/permission-denied",
  unauthenticated: "classes/permission-denied",
  "not-found": "classes/not-found",
  unavailable: "classes/unavailable",
  "deadline-exceeded": "classes/unavailable",
};

/** Human-readable Spanish text for every error code. */
const MESSAGE_BY_CODE: Readonly<Record<AppErrorCode, string>> = {
  "auth/invalid-credentials": COPY.errors.invalidCredentials,
  "auth/too-many-attempts": COPY.errors.tooManyAttempts,
  "auth/network": COPY.errors.network,
  "auth/unknown": COPY.errors.unexpected,
  "classes/not-found": COPY.errors.classNotFound,
  "classes/permission-denied": COPY.errors.permissionDenied,
  "classes/duplicate-code": COPY.errors.duplicateCode,
  "classes/unavailable": COPY.errors.serviceUnavailable,
  "classes/unknown": COPY.errors.unexpected,
  "validation/invalid-input": COPY.errors.invalidInput,
};

/**
 * Reads the `code` property off an unknown thrown value.
 *
 * @param error - The caught value.
 * @returns The code string, or `undefined` when absent.
 */
function readErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const { code } = error as { code?: unknown };
  return typeof code === "string" ? code : undefined;
}

/**
 * Normalises a caught Firebase Auth error.
 *
 * @param error - The value thrown by the Firebase Auth SDK.
 * @returns The matching `AppError`, defaulting to `auth/unknown`.
 */
export function toAuthError(error: unknown): AppError {
  const code = AUTH_CODE_MAP[readErrorCode(error) ?? ""] ?? "auth/unknown";
  return createAppError(code, MESSAGE_BY_CODE[code], error);
}

/**
 * Normalises a caught Firestore error.
 *
 * @param error - The value thrown by the Firestore SDK.
 * @returns The matching `AppError`, defaulting to `classes/unknown`.
 */
export function toClassesError(error: unknown): AppError {
  const code =
    FIRESTORE_CODE_MAP[readErrorCode(error) ?? ""] ?? "classes/unknown";
  return createAppError(code, MESSAGE_BY_CODE[code], error);
}
