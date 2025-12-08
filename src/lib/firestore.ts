import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

let app: FirebaseApp | null = null;

/**
 * Get Firebase configuration from environment variables.
 * Uses server-side environment variables (without NEXT_PUBLIC_ prefix).
 * Works in both client and server environments.
 */
function getFirebaseConfig() {
  const apiKey = process.env.FIREBASE_API_KEY;
  const authDomain = process.env.FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  const appId = process.env.FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !storageBucket || !appId) {
    const missing = [];
    if (!apiKey) missing.push("FIREBASE_API_KEY");
    if (!authDomain) missing.push("FIREBASE_AUTH_DOMAIN");
    if (!projectId) missing.push("FIREBASE_PROJECT_ID");
    if (!storageBucket) missing.push("FIREBASE_STORAGE_BUCKET");
    if (!appId) missing.push("FIREBASE_APP_ID");
    
    throw new Error(
      `Firebase configuration is missing. Missing variables: ${missing.join(", ")}. ` +
      "Please check your .env file and ensure all Firebase variables are set."
    );
  }
  return { apiKey, authDomain, projectId, storageBucket, appId };
}

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
