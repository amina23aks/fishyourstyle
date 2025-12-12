import "server-only";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";


function getAdminCredentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  } satisfies Parameters<typeof cert>[0];
}

let adminDb: Firestore | null = null;

export function isAdminConfigured(): boolean {
  return Boolean(getAdminCredentials());
}

export function getAdminDb(): Firestore | null {
  if (adminDb) return adminDb;

  const credentials = getAdminCredentials();
  if (!credentials) return null;

  const existing = getApps();
  const app = existing.length ? existing[0] : initializeApp({ credential: cert(credentials) });
  adminDb = getFirestore(app);
  return adminDb;
}
