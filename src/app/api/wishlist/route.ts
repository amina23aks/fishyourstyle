import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import {
  checkRateLimit,
  getTrimmedString,
  hasHoneypotValue,
  isPlainObject,
  isValidEmail,
} from "@/lib/apiProtection";
import { getAdminResources } from "@/lib/firebaseAdmin";

const WISHLIST_RATE_LIMIT = {
  keyPrefix: "wishlist-post",
  limit: 3,
  windowMs: 10 * 60 * 1000,
};

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, WISHLIST_RATE_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = (await request.json().catch(() => null)) as unknown;
    if (!isPlainObject(body)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    if (hasHoneypotValue(body)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const email = getTrimmedString(body, "email", 254);

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please provide a valid email." }, { status: 400 });
    }

    const adminResources = getAdminResources();
    if (!adminResources) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured. Please add your Firebase environment variables." },
        { status: 503 },
      );
    }

    await adminResources.db.collection("wishlist").add({
      email,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/wishlist] POST error", error);
    return NextResponse.json({ error: "Failed to join wishlist." }, { status: 500 });
  }
}
