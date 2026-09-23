/**
 * Firebase SDK initialisation.
 *
 * This is the only module that calls `initializeApp`. Everything else receives
 * the `Auth`, `Firestore` and `Analytics` handles from here, so swapping the
 * backend or stubbing it in tests has exactly one seam.
 */

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { env, missingEnvironmentKeys } from "./env";

/**
 * Stand-in configuration used when the build is missing variables.
 *
 * `getAuth` throws on an empty API key, and this module is evaluated above
 * React, so that throw would blank the page. Initialising with syntactically
 * valid placeholders keeps the import side-effect-free; `App` refuses to render
 * the application at all when `missingEnvironmentKeys` is not empty, so no call
 * ever reaches this configuration.
 */
const PLACEHOLDER_CONFIG = {
  apiKey: "missing-api-key",
  authDomain: "missing.invalid",
  projectId: "missing-project",
  storageBucket: "missing.invalid",
  messagingSenderId: "0",
  appId: "0:0:web:0",
} as const;

/**
 * Returns the singleton Firebase app, creating it on first call.
 *
 * Guarding on `getApps()` keeps Vite's hot module replacement from registering
 * a second app instance on every edit.
 *
 * @returns The initialised Firebase app.
 */
function getFirebaseApp(): FirebaseApp {
  const [existingApp] = getApps();
  if (existingApp !== undefined) return existingApp;

  return initializeApp(
    missingEnvironmentKeys.length === 0 ? env.firebase : PLACEHOLDER_CONFIG,
  );
}

/** The singleton Firebase app instance. */
export const firebaseApp: FirebaseApp = getFirebaseApp();

/** Firebase Authentication handle, used by the auth service only. */
export const firebaseAuth: Auth = getAuth(firebaseApp);

/** Cloud Firestore handle, used by the repository adapters only. */
export const firestore: Firestore = getFirestore(firebaseApp);
