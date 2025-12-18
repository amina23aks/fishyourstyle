import { NextResponse } from "next/server";
import { setAdminClaim, verifyIdTokenFromRequest } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  let decodedToken;

  try {
    decodedToken = await verifyIdTokenFromRequest(request);
  } catch (error) {
    return NextResponse.json(
      {
        error: "unauthorized",
        message: error instanceof Error ? error.message : "Unable to verify the provided token.",
      },
      { status: 401 },
    );
  }

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const isSuperAdmin =
    superAdminEmail && decodedToken.email
      ? decodedToken.email.toLowerCase() === superAdminEmail.toLowerCase()
      : false;

  if (!isSuperAdmin) {
    return NextResponse.json(
      {
        error: "forbidden",
        message: "Only the configured SUPER_ADMIN_EMAIL may assign admin claims.",
      },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const uid = (body as { uid?: unknown }).uid;

  if (!uid || typeof uid !== "string") {
    return NextResponse.json(
      { error: "bad_request", message: "A valid target uid is required." },
      { status: 400 },
    );
  }

  try {
    await setAdminClaim(uid);
    return NextResponse.json({ success: true, uid, admin: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: "server_error",
        message: "Failed to set admin claim.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
