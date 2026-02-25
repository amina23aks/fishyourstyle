import { NextResponse } from "next/server";
import { deleteCategory } from "@/lib/categories";
import { getDecodedToken, isAdminAuthorized } from "@/lib/adminAuth.server";

async function requireAdmin(request: Request): Promise<NextResponse | null> {
  let decoded;
  try {
    decoded = await getDecodedToken(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify token.";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  if (!isAdminAuthorized(decoded)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}


