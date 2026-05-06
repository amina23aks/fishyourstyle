import { NextResponse } from "next/server";
import { verifyIdTokenFromRequest } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  let decodedToken;

  try {
    decodedToken = await verifyIdTokenFromRequest(request);
  } catch (error) {
    return NextResponse.json(
      {
        eligible: false,
        error: "unauthorized",
        message: error instanceof Error ? error.message : "Unable to verify the provided token.",
      },
      { status: 401 },
    );
  }

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;

  if (!superAdminEmail) {
    return NextResponse.json(
      {
        eligible: false,
        uid: decodedToken.uid,
        email: decodedToken.email ?? null,
        error: "not_configured",
        message: "SUPER_ADMIN_EMAIL is not configured on the server.",
      },
      { status: 500 },
    );
  }

  const email = decodedToken.email ?? null;
  const eligible = Boolean(email && email.toLowerCase() === superAdminEmail.toLowerCase());

  return NextResponse.json({
    eligible,
    uid: decodedToken.uid,
    email,
    message: eligible
      ? "Signed-in user matches SUPER_ADMIN_EMAIL."
      : "Signed-in user does not match SUPER_ADMIN_EMAIL.",
  });
}
