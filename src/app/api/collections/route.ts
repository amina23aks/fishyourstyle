import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

type CollectionsResponse = {
  images: string[];
};

export async function GET() {
  const collectionsDir = path.join(process.cwd(), "public", "collections");
  try {
    const entries = await fs.readdir(collectionsDir, { withFileTypes: true });
    const images = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => !name.startsWith("."))
      .map((name) => `/collections/${name}`)
      .sort((a, b) => a.localeCompare(b));
    return NextResponse.json({ images } satisfies CollectionsResponse);
  } catch {
    return NextResponse.json({ images: [] } satisfies CollectionsResponse);
  }
}
