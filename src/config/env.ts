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

/**
 * Reads a required string variable.
 *
 * @param key - Name of the `VITE_*` variable.
 * @returns The trimmed value.
 * @throws {Error} When the variable is missing or blank.
 */
function readRequired(key: string): string {
  const value = import.meta.env[key] as string | undefined;

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `Missing environment variable "${key}". Copy .env.example to .env.local and fill it in.`,
    );
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
 * Loads and validates the environment.
 *
 * @returns The validated configuration.
 * @throws {Error} When a required variable is missing.
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

/** The validated application environment. */
export const env: AppEnvironment = loadEnvironment();
