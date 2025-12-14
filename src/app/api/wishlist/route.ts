import { NextRequest, NextResponse } from "next/server";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getServerDb } from "@/lib/firestore";
import { isFirebaseConfigured } from "@/lib/firebaseConfig";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email." }, { status: 400 });
    }

    if (!isFirebaseConfigured()) {
      return NextResponse.json(
        { error: "Firebase is not configured. Please add your Firebase environment variables." },
        { status: 503 },
      );
    }

    const db = getServerDb();
    await addDoc(collection(db, "wishlist"), {
      email,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to join wishlist.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
