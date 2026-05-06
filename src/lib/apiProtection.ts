import { NextRequest, NextResponse } from "next/server";

const FALLBACK_IP = "unknown";

type RateLimitOptions = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var fishYourStyleRateLimits: Map<string, RateLimitEntry> | undefined;
}

const rateLimitStore = globalThis.fishYourStyleRateLimits ?? new Map<string, RateLimitEntry>();
globalThis.fishYourStyleRateLimits = rateLimitStore;

/**
 * Lightweight in-memory rate limiting for public API abuse protection.
 *
 * Vercel limitation: serverless instances do not share memory and may be
 * recycled, so this is best-effort protection per warm function instance.
 * Use a shared external store if the app later needs globally consistent limits.
 */
export function checkRateLimit(request: NextRequest, options: RateLimitOptions): NextResponse | null {
  const ip = getClientIp(request);
  const key = `${options.keyPrefix}:${ip}`;
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + options.windowMs });
    cleanupRateLimitStore(now);
    return null;
  }

  if (current.count >= options.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
        },
      },
    );
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return null;
}

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();
  return (
    firstForwardedIp ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    FALLBACK_IP
  );
}

export function hasHoneypotValue(payload: Record<string, unknown>, fields = ["website", "company"]): boolean {
  return fields.some((field) => {
    const value = payload[field];
    return typeof value === "string" && value.trim().length > 0;
  });
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function getTrimmedString(payload: Record<string, unknown>, field: string, maxLength: number): string | null {
  const value = payload[field];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}

export function getOptionalTrimmedString(
  payload: Record<string, unknown>,
  field: string,
  maxLength: number,
): string | undefined | null {
  const value = payload[field];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > maxLength) return null;
  return trimmed;
}

export function isValidEmail(email: string): boolean {
  if (email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function cleanupRateLimitStore(now: number) {
  if (rateLimitStore.size < 500) return;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}
