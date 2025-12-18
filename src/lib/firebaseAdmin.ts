import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

let adminApp: App | null = null;

function getFirebaseAdminApp(): App {
  if (adminApp) return adminApp;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin environment variables are not configured.");
  }

  adminApp = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return adminApp;
}

export async function verifyIdToken(idToken: string) {
  const auth = getAuth(getFirebaseAdminApp());
  return auth.verifyIdToken(idToken);
}

export async function verifyIdTokenFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");

  if (!authHeader) {
    throw new Error("Missing Authorization header.");
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new Error("Invalid Authorization header format. Use Bearer <idToken>.");
  }

  return verifyIdToken(token.trim());
}

export function isAdmin(decodedToken: DecodedIdToken | null | undefined): boolean {
  return decodedToken?.admin === true;
}

export async function setAdminClaim(uid: string) {
  const auth = getAuth(getFirebaseAdminApp());
  const user = await auth.getUser(uid);
  const existingClaims = user.customClaims ?? {};

  await auth.setCustomUserClaims(uid, { ...existingClaims, admin: true });
  await auth.revokeRefreshTokens(uid);
}
