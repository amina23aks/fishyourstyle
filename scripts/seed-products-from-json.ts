/**
 * One-time seeding script to import products from src/data/products.json into Firestore.
 * Safe to run multiple times: uses slug (or id) as deterministic doc id and overwrites/updates.
 *
 * Usage:
 *   npm run seed:products
 *
 * Requires Firebase Admin credentials in env:
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */

import { readFile } from "fs/promises";
import { join } from "path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

type JsonProduct = {
  id?: string;
  slug?: string;
  name?: string;
  description?: string;
  basePrice?: number;
  discountPercent?: number;
  finalPrice?: number;
  category?: string;
  designTheme?: string;
  sizes?: string[];
  colors?: Array<{ hex?: string } | string>;
  stock?: number;
  inStock?: boolean;
  images?: string[];
  gender?: string | null;
};

function getAdminDb() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.");
  }
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
  return getFirestore();
}

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

function normalizeColors(colors: JsonProduct["colors"]) {
  if (!Array.isArray(colors)) return [];
  return colors
    .map((c) => {
      if (typeof c === "string") return { hex: c };
      if (c && typeof c === "object" && "hex" in c) return { hex: (c as any).hex as string };
      return null;
    })
    .filter((c): c is { hex: string } => Boolean(c?.hex));
}

async function seed() {
  const db = getAdminDb();
  const dataPath = join(process.cwd(), "src", "data", "products.json");
  const raw = await readFile(dataPath, "utf-8");
  const products = JSON.parse(raw) as JsonProduct[];

  let created = 0;
  let updated = 0;

  for (const p of products) {
    const slug = p.slug || (p.name ? slugify(p.name) : p.id);
    if (!slug) {
      console.warn("Skipping product without slug/name/id:", p);
      continue;
    }
    const ref = db.collection("products").doc(slug);
    const basePrice = Number(p.basePrice ?? 0);
    const discountPercent = Number(p.discountPercent ?? 0);
    const finalPrice =
      typeof p.finalPrice === "number" ? p.finalPrice : Math.max(basePrice * (1 - discountPercent / 100), 0);

    const payload = {
      name: p.name ?? slug,
      slug,
      description: p.description ?? "",
      basePrice,
      discountPercent,
      finalPrice,
      category: p.category ?? "uncategorized",
      designTheme: p.designTheme ?? "basic",
      sizes: p.sizes ?? [],
      colors: normalizeColors(p.colors),
      stock: p.stock ?? 0,
      inStock: p.inStock ?? (p.stock ?? 0) > 0,
      images: p.images ?? [],
      gender: p.gender ?? null,
      updatedAt: new Date(),
      createdAt: new Date(),
    };

    const existing = await ref.get();
    if (existing.exists) {
      await ref.set(payload, { merge: true });
      updated += 1;
    } else {
      await ref.set(payload);
      created += 1;
    }
  }

  console.log(`Seeding complete. Created: ${created}, Updated: ${updated}`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
/**
 * One-time seeding script to push legacy JSON products into Firestore.
 * Use for initial migration only; do not run on every deploy.
 *
 * Run with:
 *   ts-node scripts/seed-products-from-json.ts
 * or via npm:
 *   npm run seed:products
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

function normalizeImages(images: JsonProduct["images"]): string[] {
  if (Array.isArray(images)) {
    return images.filter(Boolean) as string[];
  }
  if (images && typeof images === "object") {
    const list: string[] = [];
    if (images.main) list.push(images.main);
    if (Array.isArray(images.gallery)) list.push(...images.gallery.filter(Boolean));
    return list;
  }
  return [];
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
    const designTheme = (item.designTheme ?? "basic").toString().toLowerCase();
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
      category: item.category ?? "uncategorized",
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

