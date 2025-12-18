import type { DecodedIdToken } from "firebase-admin/auth";
import { getFirebaseAdminAuth } from "../firebaseAdmin";

type HeadersLike = {
  get(name: string): string | null;
};

export function isAdminFromDecodedToken(decodedToken: DecodedIdToken | null | undefined): boolean {
  return decodedToken?.admin === true;
}

export function getBearerTokenFromHeaders(headers: HeadersLike): string | null {
  const authorizationHeader = headers.get("authorization") ?? headers.get("Authorization");
  if (!authorizationHeader) return null;

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;

  return token;
}

export async function verifyIdTokenFromHeaders(
  headers: HeadersLike,
): Promise<DecodedIdToken | null> {
  const token = getBearerTokenFromHeaders(headers);
  if (!token) return null;

  try {
    const adminAuth = getFirebaseAdminAuth();
    return await adminAuth.verifyIdToken(token);
  } catch (error) {
    console.error("Failed to verify Firebase ID token", error);
    return null;
  }
}
