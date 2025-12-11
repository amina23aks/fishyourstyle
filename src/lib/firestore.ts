import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

import { getFirebaseConfig } from "./firebaseConfig";

let app: FirebaseApp | null = null;

/**
 * Get or initialize Firebase app instance.
 * Works in both client and server environments.
 */
function getFirebaseApp(): FirebaseApp {
  if (app) {
    return app;
  }

  const config = getFirebaseConfig();

  try {
    const existingApps = getApps();

    app = existingApps.length > 0 ? getApp() : initializeApp(config);
    return app;
  } catch (error) {
    throw error;
  }
}

/**
 * Get Firestore instance for server-side operations (API routes).
 * This uses the Firebase client SDK which works in Node.js environments.
 */
export function getServerDb(): Firestore {
  try {
    const firebaseApp = getFirebaseApp();
    return getFirestore(firebaseApp);
  } catch (error) {
    throw error;
  }
}
