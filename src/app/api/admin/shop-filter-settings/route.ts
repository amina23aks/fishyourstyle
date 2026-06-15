export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { AdminAuthError, requireAdmin } from "@/lib/firebaseAdmin";
import {
  getShopFilterSettings,
  saveShopFilterSettings,
} from "@/lib/shop-filter-settings";

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

  const settings = await getShopFilterSettings();
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
    const settings = await saveShopFilterSettings(body);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[api/admin/shop-filter-settings] PUT error", error);
    return NextResponse.json(
      {
        error: "shop_filter_settings_update_failed",
        message:
          error instanceof Error ? error.message : "Unable to update shop filter settings.",
      },
      { status: 500 },
    );
  }
}
