import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

let app: FirebaseApp | null = null;

function getFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !storageBucket || !appId) {
    console.warn("Firebase config is missing; skipping client initialization.");
    return null;
  }

  return { apiKey, authDomain, projectId, storageBucket, appId };
}

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;

  if (app) return app;

  const config = getFirebaseConfig();
  if (!config) return null;

  app = !getApps().length ? initializeApp(config) : getApp();
  return app;
}

export function getDb(): Firestore | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  return getFirestore(firebaseApp);
}

export function getAuthInstance(): Auth | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  return getAuth(firebaseApp);
}
