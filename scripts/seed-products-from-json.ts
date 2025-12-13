/**
 * One-time seeding script to push legacy JSON products into Firestore.
 * Use for initial migration only; do not run on every deploy or inside Vercel builds.
 * Requires FIREBASE_* environment variables (same as the app) and a local Firebase project with write access.
 *
 * Run locally with:
 *   npm run seed:products
 * or:
 *   ts-node scripts/seed-products-from-json.ts
 */

import { readFile } from "fs/promises";
import { join } from "path";
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
} from "firebase/firestore";

import { getServerDb } from "../src/lib/firestore";

type JsonProduct = {
  id?: string;
  slug?: string;
  name?: string;
  nameFr?: string;
  basePrice?: number;
  priceDzd?: number;
  discountPercent?: number;
  category?: string;
  designTheme?: string;
  sizes?: string[];
  colors?: Array<{ hex?: string; id?: string }> | string[];
  images?: { main?: string; gallery?: string[] } | string[];
  stock?: number;
  inStock?: boolean;
  description?: string;
  descriptionFr?: string;
  gender?: "unisex" | "men" | "women" | string;
};

const CATEGORY_SLUG_MAP: Record<string, string> = {
  hoodie: "hoodies",
  hoodies: "hoodies",
  pant: "pants",
  pants: "pants",
  ensemble: "ensembles",
  ensembles: "ensembles",
  tshirt: "tshirts",
  tshirts: "tshirts",
  sweatshirt: "sweatshirts",
  sweatshirts: "sweatshirts",
};

const PRODUCTS_PATH = join(process.cwd(), "src", "data", "products.json");

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function computeFinalPrice(basePrice: number, discountPercent: number) {
  return Math.max(basePrice * (1 - discountPercent / 100), 0);
}

function normalizeCategory(value: string | undefined | null): string {
  if (!value) return "tshirts";
  const normalized = value.toLowerCase().trim();
  return CATEGORY_SLUG_MAP[normalized] ?? "tshirts";
}

function normalizeDesignTheme(value: string | undefined | null): string {
  if (!value) return "simple";
  return "simple";
}

function normalizeColors(input: JsonProduct["colors"]): { hex: string }[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((entry) => {
      if (typeof entry === "string") {
        if (/^#([0-9A-F]{3}){1,2}$/i.test(entry)) return { hex: entry };
        return { hex: `#${entry.replace("#", "")}` };
      }
      if (entry && typeof entry === "object") {
        const hex = (entry.hex ?? entry.id ?? "").toString();
        if (hex && /^#?([0-9A-F]{3}){1,2}$/i.test(hex)) {
          return { hex: hex.startsWith("#") ? hex : `#${hex}` };
        }
      }
      return { hex: "#e5e7eb" };
    })
    .filter((color) => Boolean(color.hex));
}

function normalizeImages(images: JsonProduct["images"]): { main: string; gallery: string[] } {
  if (images && typeof images === "object" && !Array.isArray(images)) {
    const main = typeof images.main === "string" ? images.main : "";
    const gallery = Array.isArray(images.gallery)
      ? (images.gallery as unknown[])
          .map((entry) => (typeof entry === "string" ? entry : null))
          .filter((entry): entry is string => Boolean(entry))
      : [];
    return { main: main || gallery[0] || "", gallery };
  }

  if (Array.isArray(images)) {
    const [main, ...gallery] = (images as unknown[])
      .map((entry) => (typeof entry === "string" ? entry : null))
      .filter((entry): entry is string => Boolean(entry));
    return { main: main || gallery[0] || "", gallery };
  }

  return { main: "", gallery: [] };
}

async function findExistingBySlug(productsRef: ReturnType<typeof collection>, slug: string) {
  const existingSnapshot = await getDocs(query(productsRef, where("slug", "==", slug), limit(1)));
  const existingDoc = existingSnapshot.docs[0];
  if (!existingDoc) return null;
  return { id: existingDoc.id, data: existingDoc.data() as DocumentData };
}

async function main() {
  console.log("Seeding products from JSON → Firestore...");
  const raw = await readFile(PRODUCTS_PATH, "utf-8");
  const jsonProducts = JSON.parse(raw) as JsonProduct[];

  const db = getServerDb();
  const productsRef = collection(db, "products");

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of jsonProducts) {
    const name = item.nameFr ?? item.name;
    if (!name) {
      console.warn("⚠️  Skipping product without a name", item);
      skipped += 1;
      continue;
    }

    const slug = item.slug?.trim() || slugify(name);
    const basePrice = Number.isFinite(item.basePrice) ? (item.basePrice as number) : Number(item.priceDzd ?? 0);
    const discountPercent = Number.isFinite(item.discountPercent) ? (item.discountPercent as number) : 0;
    const finalPrice = computeFinalPrice(basePrice, discountPercent);
    const colors = normalizeColors(item.colors);
    const images = normalizeImages(item.images);
    const sizes = Array.isArray(item.sizes) ? item.sizes.map((s) => s.toString().toUpperCase()) : [];
    const stock = typeof item.stock === "number" ? item.stock : 0;
    const inStock = typeof item.inStock === "boolean" ? item.inStock : stock > 0;
    const designTheme = normalizeDesignTheme(item.designTheme);
    const category = normalizeCategory(item.category);
    const description = (item.descriptionFr ?? item.description ?? "").trim();

    const existing = await findExistingBySlug(productsRef, slug);
    const targetId = existing?.id ?? item.id ?? slug;
    const createdAt = existing?.data?.createdAt ?? serverTimestamp();

    const payload = {
      name,
      slug,
      description: description || undefined,
      basePrice,
      discountPercent,
      finalPrice,
      category,
      designTheme,
      sizes,
      colors,
      stock,
      inStock,
      images,
      gender: item.gender ?? undefined,
      updatedAt: serverTimestamp(),
      createdAt,
    };

    await setDoc(doc(productsRef, targetId), payload, { merge: true });
    if (existing) {
      updated += 1;
      console.log(`↻ Updated ${slug}`);
    } else {
      imported += 1;
      console.log(`+ Imported ${slug}`);
    }
  }

  console.log("\nSeeding complete");
  console.log(`Imported: ${imported}`);
  console.log(`Updated : ${updated}`);
  console.log(`Skipped : ${skipped}`);
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});

