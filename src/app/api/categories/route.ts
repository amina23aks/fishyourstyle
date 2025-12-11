import { NextResponse } from "next/server";
import {
  addCategory,
  addDesign,
  deleteCategory,
  deleteDesign,
  getSelectableCollections,
  getSelectableCollectionsAndDesigns,
  getSelectableDesigns,
} from "@/lib/categories";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    if (typeParam === "category") {
      const categories = await getSelectableCollections();
      return NextResponse.json(categories);
    }

    if (typeParam === "design") {
      const designs = await getSelectableDesigns();
      return NextResponse.json(designs);
    }

    const collectionsAndDesigns = await getSelectableCollectionsAndDesigns();
    return NextResponse.json(collectionsAndDesigns);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type } = body;
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (type === "design") {
      await addDesign(name);
      return NextResponse.json({ name, type: "design" });
    }
    await addCategory(name);
    return NextResponse.json({ name, type: "category" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create category";
    const status = /permission/i.test(message) ? 403 : 500;
    console.error("Failed to create category:", error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const typeParam = searchParams.get("type") ?? "category";

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    if (typeParam === "design") {
      await deleteDesign(slug);
      return NextResponse.json({ slug, type: "design" });
    }

    await deleteCategory(slug);
    return NextResponse.json({ slug, type: "category" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete entry";
    const status = /permission/i.test(message) ? 403 : 500;
    console.error("Failed to delete category or design:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
