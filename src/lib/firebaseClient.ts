import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp,
} from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);
let app: FirebaseApp | null = null;

function getOrInitializeApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  if (!hasFirebaseConfig) return null;
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseApp(): FirebaseApp | null {
  return getOrInitializeApp();
}

export function getDb(): Firestore | null {
  const appInstance = getOrInitializeApp();
  return appInstance ? getFirestore(appInstance) : null;
}

export function getAuthInstance(): Auth | null {
  const appInstance = getOrInitializeApp();
  return appInstance ? getAuth(appInstance) : null;
}
