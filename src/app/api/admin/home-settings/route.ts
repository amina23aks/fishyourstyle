export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { AdminAuthError, requireAdmin } from "@/lib/firebaseAdmin";
import { getHomeSettings, saveHomeSettings } from "@/lib/home-settings";

function adminAuthResponse(error: unknown) {
  const status = error instanceof AdminAuthError ? error.status : 401;
  const code = status === 403 ? "forbidden" : "unauthorized";
  return NextResponse.json(
    {
      error: code,
      message:
        error instanceof Error ? error.message : "Unable to verify admin access.",
    },
    { status },
  );
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
  } catch (error) {
    return adminAuthResponse(error);
  }

  const settings = await getHomeSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);
  } catch (error) {
    return adminAuthResponse(error);
  }

  try {
    const body = await request.json();
    const settings = await saveHomeSettings(body);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[api/admin/home-settings] PUT error", error);
    return NextResponse.json(
      {
        error: "settings_update_failed",
        message:
          error instanceof Error ? error.message : "Unable to update settings.",
      },
      { status: 500 },
    );
  }
}
