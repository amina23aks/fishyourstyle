import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

let app: FirebaseApp | null = null;

/**
 * Get Firebase configuration from environment variables.
 * Uses server-side environment variables (without NEXT_PUBLIC_ prefix).
 * Works in both client and server environments.
 */
function getFirebaseConfig() {
  console.log("[firestore.ts] Getting Firebase configuration...");
  
  const apiKey = process.env.FIREBASE_API_KEY;
  const authDomain = process.env.FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  const appId = process.env.FIREBASE_APP_ID;

  console.log("[firestore.ts] Environment variables check:");
  console.log("  - FIREBASE_API_KEY:", apiKey ? `${apiKey.substring(0, 10)}...` : "MISSING");
  console.log("  - FIREBASE_AUTH_DOMAIN:", authDomain || "MISSING");
  console.log("  - FIREBASE_PROJECT_ID:", projectId || "MISSING");
  console.log("  - FIREBASE_STORAGE_BUCKET:", storageBucket || "MISSING");
  console.log("  - FIREBASE_APP_ID:", appId ? `${appId.substring(0, 10)}...` : "MISSING");

  if (!apiKey || !authDomain || !projectId || !storageBucket || !appId) {
    const missing = [];
    if (!apiKey) missing.push("FIREBASE_API_KEY");
    if (!authDomain) missing.push("FIREBASE_AUTH_DOMAIN");
    if (!projectId) missing.push("FIREBASE_PROJECT_ID");
    if (!storageBucket) missing.push("FIREBASE_STORAGE_BUCKET");
    if (!appId) missing.push("FIREBASE_APP_ID");
    
    console.error("[firestore.ts] ERROR: Missing environment variables:", missing.join(", "));
    throw new Error(
      `Firebase configuration is missing. Missing variables: ${missing.join(", ")}. ` +
      "Please check your .env file and ensure all Firebase variables are set."
    );
  }

  console.log("[firestore.ts] All Firebase environment variables are present.");
  return { apiKey, authDomain, projectId, storageBucket, appId };
}

/**
 * Get or initialize Firebase app instance.
 * Works in both client and server environments.
 */
function getFirebaseApp(): FirebaseApp {
  if (app) {
    console.log("[firestore.ts] Using existing Firebase app instance.");
    return app;
  }

  console.log("[firestore.ts] Initializing new Firebase app...");
  const config = getFirebaseConfig();
  
  try {
    const existingApps = getApps();
    console.log(`[firestore.ts] Existing Firebase apps count: ${existingApps.length}`);
    
    if (existingApps.length > 0) {
      console.log("[firestore.ts] Using existing Firebase app.");
      app = getApp();
    } else {
      console.log("[firestore.ts] Creating new Firebase app instance...");
      app = initializeApp(config);
      console.log("[firestore.ts] Firebase app initialized successfully.");
    }
    
    return app;
  } catch (error) {
    console.error("[firestore.ts] ERROR initializing Firebase app:", error);
    throw error;
  }
}

/**
 * Get Firestore instance for server-side operations (API routes).
 * This uses the Firebase client SDK which works in Node.js environments.
 */
export function getServerDb(): Firestore {
  console.log("[firestore.ts] getServerDb() called");
  
  try {
    const firebaseApp = getFirebaseApp();
    console.log("[firestore.ts] Firebase app obtained, getting Firestore instance...");
    
    const db = getFirestore(firebaseApp);
    console.log("[firestore.ts] Firestore instance obtained successfully.");
    
    return db;
  } catch (error) {
    console.error("[firestore.ts] ERROR in getServerDb():", error);
    throw error;
  }
}
