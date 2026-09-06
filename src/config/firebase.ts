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
import { env } from "./env";

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
  return existingApp ?? initializeApp(env.firebase);
}

/** The singleton Firebase app instance. */
export const firebaseApp: FirebaseApp = getFirebaseApp();

/** Firebase Authentication handle, used by the auth service only. */
export const firebaseAuth: Auth = getAuth(firebaseApp);

/** Cloud Firestore handle, used by the repository adapters only. */
export const firestore: Firestore = getFirestore(firebaseApp);
