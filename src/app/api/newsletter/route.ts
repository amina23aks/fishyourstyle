import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import {
  checkRateLimit,
  getOptionalTrimmedString,
  getTrimmedString,
  hasHoneypotValue,
  isPlainObject,
  isValidEmail,
} from "@/lib/apiProtection";
import { getAdminResources } from "@/lib/firebaseAdmin";
import { locales, type Locale } from "@/i18n/config";

const NEWSLETTER_RATE_LIMIT = {
  keyPrefix: "newsletter-post",
  limit: 5,
  windowMs: 10 * 60 * 1000,
};

function isLocale(value: string | undefined | null): value is Locale {
  return Boolean(value && (locales as readonly string[]).includes(value));
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, NEWSLETTER_RATE_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = (await request.json().catch(() => null)) as unknown;
    if (!isPlainObject(body)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    if (hasHoneypotValue(body)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const email = getTrimmedString(body, "email", 254)?.toLowerCase();
    const source = getOptionalTrimmedString(body, "source", 40) ?? "homepage";
    const locale = getOptionalTrimmedString(body, "locale", 8);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }

    const adminResources = getAdminResources();
    if (!adminResources) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured. Please add your Firebase environment variables." },
        { status: 503 },
      );
    }

    const existingSubscriber = await adminResources.db
      .collection("newsletterSubscribers")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!existingSubscriber.empty) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    await adminResources.db.collection("newsletterSubscribers").add({
      email,
      source: source === "homepage" ? "homepage" : "homepage",
      createdAt: FieldValue.serverTimestamp(),
      ...(isLocale(locale) ? { locale } : {}),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/newsletter] POST error", error);
    return NextResponse.json({ error: "Failed to join newsletter." }, { status: 500 });
  }
}
