import { NextResponse } from "next/server";
import { deleteCategory } from "@/lib/categories";
import { AdminAuthError, requireAdmin } from "@/lib/firebaseAdmin";

function adminAuthResponse(error: unknown) {
  const status = error instanceof AdminAuthError ? error.status : 401;
  const code = status === 403 ? "forbidden" : "unauthorized";
  return NextResponse.json(
    {
      error: code,
      message: error instanceof Error ? error.message : "Unable to verify admin access.",
    },
    { status },
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
  } catch (error) {
    return adminAuthResponse(error);
  }

  try {
    const { id } = await params;
    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}

