import { NextResponse, type NextRequest } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebaseAdmin";
import { isAdminFromDecodedToken, verifyIdTokenFromHeaders } from "@/lib/auth/serverAuth";

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();

export async function POST(req: NextRequest) {
  const decodedToken = await verifyIdTokenFromHeaders(req.headers);
  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const callerEmail = decodedToken.email?.toLowerCase();
  const callerIsAdmin = isAdminFromDecodedToken(decodedToken);
  const isBootstrapSuperAdmin = SUPER_ADMIN_EMAIL && callerEmail === SUPER_ADMIN_EMAIL;

  if (!callerIsAdmin && !isBootstrapSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let targetEmail: string | undefined;
  try {
    const body = await req.json();
    if (typeof body?.email === "string") {
      targetEmail = body.email.trim();
    }
  } catch {
    // no-op: handled by validation below
  }

  if (!targetEmail) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const adminAuth = getFirebaseAdminAuth();
    const userRecord = await adminAuth.getUserByEmail(targetEmail);

    await adminAuth.setCustomUserClaims(userRecord.uid, { admin: true });

    return NextResponse.json({
      ok: true,
      uid: userRecord.uid,
      email: userRecord.email ?? targetEmail,
    });
  } catch (error) {
    console.error("Failed to set admin claim", error);
    return NextResponse.json({ error: "Unable to set admin claim" }, { status: 500 });
  }
}
