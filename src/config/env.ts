/**
 * Typed, validated access to build-time environment configuration.
 *
 * Vite inlines `import.meta.env` at build time. Reading it through this module
 * means a missing variable fails once, loudly, at startup — instead of
 * surfacing later as an opaque Firebase error.
 */

/** Shape of the configuration the application needs to boot. */
export interface AppEnvironment {
  readonly firebase: {
    readonly apiKey: string;
    readonly authDomain: string;
    readonly projectId: string;
    readonly storageBucket: string;
    readonly messagingSenderId: string;
    readonly appId: string;
    /** Optional: Analytics is skipped entirely when this is absent. */
    readonly measurementId?: string;
  };
  /**
   * Domain appended to a username to build the Firebase Auth email.
   * Firebase Auth has no username provider, so `ana.perez` signs in as
   * `ana.perez@<authUsernameDomain>`. Accounts are provisioned in the Firebase
   * console; the domain never needs to resolve or receive mail.
   */
  readonly authUsernameDomain: string;
  readonly enableAnalyticsInDev: boolean;
  readonly isProduction: boolean;
}

/** Names of the required variables that were absent or blank. */
const missingKeys: string[] = [];

/**
 * Reads a required string variable, recording it when absent.
 *
 * Deliberately does not throw: this module is evaluated while the application's
 * imports are still resolving, above React, so a throw here would reach no
 * error boundary and every visitor would get a blank page. The caller renders
 * a designed screen from {@link missingEnvironmentKeys} instead.
 *
 * @param key - Name of the `VITE_*` variable.
 * @returns The trimmed value, or an empty string when it is missing.
 */
function readRequired(key: string): string {
  const value = import.meta.env[key] as string | undefined;

  if (typeof value !== "string" || value.trim() === "") {
    missingKeys.push(key);
    return "";
  }

  return value.trim();
}

/**
 * Reads an optional string variable.
 *
 * @param key - Name of the `VITE_*` variable.
 * @returns The trimmed value, or `undefined` when unset.
 */
function readOptional(key: string): string | undefined {
  const value = import.meta.env[key] as string | undefined;
  const trimmed = value?.trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * Loads the environment, recording any required variable that is absent.
 *
 * @returns The configuration, with empty strings where values are missing.
 */
function loadEnvironment(): AppEnvironment {
  return {
    firebase: {
      apiKey: readRequired("VITE_FIREBASE_API_KEY"),
      authDomain: readRequired("VITE_FIREBASE_AUTH_DOMAIN"),
      projectId: readRequired("VITE_FIREBASE_PROJECT_ID"),
      storageBucket: readRequired("VITE_FIREBASE_STORAGE_BUCKET"),
      messagingSenderId: readRequired("VITE_FIREBASE_MESSAGING_SENDER_ID"),
      appId: readRequired("VITE_FIREBASE_APP_ID"),
      measurementId: readOptional("VITE_FIREBASE_MEASUREMENT_ID"),
    },
    authUsernameDomain:
      readOptional("VITE_AUTH_USERNAME_DOMAIN") ?? "talendig.local",
    enableAnalyticsInDev:
      readOptional("VITE_ENABLE_ANALYTICS_IN_DEV") === "true",
    isProduction: import.meta.env.PROD,
  };
}

/** The application environment. Incomplete when {@link missingEnvironmentKeys} is not empty. */
export const env: AppEnvironment = loadEnvironment();

/**
 * Required variables that were absent or blank.
 *
 * Empty means the build is configured. Anything else means the application
 * cannot work and must say so rather than fail at the first Firebase call.
 */
export const missingEnvironmentKeys: readonly string[] = missingKeys;
