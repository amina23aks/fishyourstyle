import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";

import { getAdminAuth } from "@/lib/firebaseAdmin";

const FALLBACK_ADMIN_EMAILS = ["fishyourstyle.supp@gmail.com"] as const;

function parseAdminAllowlist(): string[] {
  const configured = process.env.ADMIN_EMAIL_ALLOWLIST;
  if (!configured || !configured.trim()) {
    return [...FALLBACK_ADMIN_EMAILS];
  }

  const emails = configured
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return emails.length > 0 ? emails : [...FALLBACK_ADMIN_EMAILS];
}

class AuthHttpError extends Error {}

function parseBearerToken(request: Request): string {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!authHeader) {
    throw new AuthHttpError("Missing Authorization header.");
  }

  const [scheme, token] = authHeader.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    throw new AuthHttpError("Invalid Authorization header format. Use Bearer <idToken>.");
  }

  return token.trim();
}

export async function getDecodedToken(request: Request): Promise<DecodedIdToken> {
  const token = parseBearerToken(request);
  const auth = getAdminAuth();
  if (!auth) {
    throw new AuthHttpError("Firebase Admin is not configured.");
  }

  try {
    return await auth.verifyIdToken(token);
  } catch {
    throw new AuthHttpError("Invalid token.");
  }
}

export function isAdminAuthorized(decodedToken: DecodedIdToken | null | undefined): boolean {
  if (!decodedToken) return false;
  if (decodedToken.admin === true) return true;
  const email = decodedToken.email?.toLowerCase();
  if (!email) return false;
  return parseAdminAllowlist().includes(email);
}

