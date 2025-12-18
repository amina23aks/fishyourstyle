import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth, type DecodedIdToken } from "firebase-admin/auth";

type AdminResources = {
  app: App;
  db: Firestore;
  auth: Auth;
};

function normalizePrivateKey(value: string): string {
  let key = value.trim();
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

function getAdminCredentials() {
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID;
  const clientEmail =
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL ?? process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw =
    process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    return null;
  }

  const privateKey = normalizePrivateKey(privateKeyRaw);

  return { projectId, clientEmail, privateKey };
}

let resources: AdminResources | null = null;

export function isAdminConfigured(): boolean {
  return Boolean(getAdminCredentials());
}

function initAdmin(): AdminResources | null {
  const credentials = getAdminCredentials();
  if (!credentials) return null;

  const app: App =
    getApps().length > 0
      ? getApps()[0]!
      : initializeApp({ credential: cert(credentials) });

  // IMPORTANT: do NOT call db.settings() here to avoid “settings() only once” error
  const db = getFirestore(app);
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
  return getAdminResources()?.db ?? null;
}

export function getAdminAuth(): Auth | null {
  return getAdminResources()?.auth ?? null;
}

function ensureAdminAuth(): Auth {
  const auth = getAdminAuth();
  if (!auth) {
    throw new Error(
      "Firebase Admin is not configured. Check FIREBASE_ADMIN_* or FIREBASE_* env vars."
    );
  }
  return auth;
}

export async function verifyIdToken(idToken: string) {
  const auth = ensureAdminAuth();
  return auth.verifyIdToken(idToken);
}

export async function verifyIdTokenFromRequest(request: Request) {
  const authHeader =
    request.headers.get("authorization") ??
    request.headers.get("Authorization");

  if (!authHeader) {
    throw new Error("Missing Authorization header.");
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme.toLowerCase() !== "bearer" || !token) {
    throw new Error(
      "Invalid Authorization header format. Use Bearer <idToken>."
    );
  }

  return verifyIdToken(token.trim());
}

export function isAdmin(
  decodedToken: DecodedIdToken | null | undefined
): boolean {
  return decodedToken?.admin === true;
}

export async function setAdminClaim(uid: string) {
  const auth = ensureAdminAuth();
  const user = await auth.getUser(uid);
  const existingClaims = user.customClaims ?? {};

  await auth.setCustomUserClaims(uid, { ...existingClaims, admin: true });
  await auth.revokeRefreshTokens(uid);
}
