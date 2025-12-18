import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

type AdminResources = {
  app: App;
  db: Firestore;
  auth: Auth;
};

function logEnvDetection() {
  const hasAdminProject = Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID);
  const hasAdminEmail = Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
  const hasAdminKey = Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY);
  const hasLegacyProject = Boolean(process.env.FIREBASE_PROJECT_ID);
  const hasLegacyEmail = Boolean(process.env.FIREBASE_CLIENT_EMAIL);
  const hasLegacyKey = Boolean(process.env.FIREBASE_PRIVATE_KEY);

  console.log("[firebaseAdmin] Env detection", {
    FIREBASE_ADMIN_PROJECT_ID: hasAdminProject,
    FIREBASE_ADMIN_CLIENT_EMAIL: hasAdminEmail,
    FIREBASE_ADMIN_PRIVATE_KEY: hasAdminKey,
    FIREBASE_PROJECT_ID: hasLegacyProject,
    FIREBASE_CLIENT_EMAIL: hasLegacyEmail,
    FIREBASE_PRIVATE_KEY: hasLegacyKey,
  });
}

function normalizePrivateKey(value: string): string {
  let key = value.trim();
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

function getAdminCredentials() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL ?? process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    return null;
  }

  const privateKey = normalizePrivateKey(privateKeyRaw);
  const hasHeader = privateKey.includes("BEGIN PRIVATE KEY");
  console.log("[firebaseAdmin] Private key info", {
    length: privateKey.length,
    hasHeader,
  });

  return { projectId, clientEmail, privateKey };
}

let resources: AdminResources | null = null;

export function isAdminConfigured(): boolean {
  return Boolean(getAdminCredentials());
}

function initAdmin(): AdminResources | null {
  const credentials = getAdminCredentials();
  if (!credentials) return null;

  logEnvDetection();

  let app: App;
  if (!getApps().length) {
    app = initializeApp({ credential: cert(credentials) });
    console.log("[firebaseAdmin] Firebase Admin app initialized");
  } else {
    app = getApps()[0]!;
    console.log("[firebaseAdmin] Firebase Admin app already initialized");
  }

  const db = getFirestore(app);
  db.settings({ ignoreUndefinedProperties: true });
  const auth = getAuth(app);
  return { app, db, auth };
}

export function getAdminResources(): AdminResources | null {
  if (resources) return resources;
  const initialized = initAdmin();
  if (!initialized) return null;
  resources = initialized;
  return resources;
}

export function getAdminDb(): Firestore | null {
  const res = getAdminResources();
  return res?.db ?? null;
}

export function getAdminAuth(): Auth | null {
  const res = getAdminResources();
  return res?.auth ?? null;
}
