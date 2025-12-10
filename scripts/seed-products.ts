/**
 * One-time seeding script to import products from src/data/products.json into Firestore.
 * Run locally only. Requires Firebase Admin credentials in env:
 * FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *
 * Usage:
 *   ts-node scripts/seed-products.ts
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
  colors?: string[];
  stock?: number;
  inStock?: boolean;
  images?: string[];
  gender?: string | null;
};

function getAdminApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin credentials.");
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function seedProducts() {
  const db = getAdminApp();
  const dataPath = join(process.cwd(), "src", "data", "products.json");
  const raw = await readFile(dataPath, "utf-8");
  const products = JSON.parse(raw) as JsonProduct[];

  const batch = db.batch();

  for (const p of products) {
    const slug = p.slug || (p.name ? slugify(p.name) : p.id);
    if (!slug) {
      console.warn("Skipping product without slug or name:", p);
      continue;
    }

    const basePrice = Number(p.basePrice ?? 0);
    const discountPercent = Number(p.discountPercent ?? 0);
    const finalPrice =
      typeof p.finalPrice === "number"
        ? p.finalPrice
        : Math.max(basePrice * (1 - discountPercent / 100), 0);

    const ref = db.collection("products").doc(slug);
    batch.set(ref, {
      name: p.name ?? slug,
      slug,
      description: p.description ?? "",
      basePrice,
      discountPercent,
      finalPrice,
      category: p.category ?? "uncategorized",
      designTheme: p.designTheme ?? "basic",
      sizes: p.sizes ?? [],
      colors: (p.colors ?? []).map((hex) => ({ hex })),
      stock: p.stock ?? 0,
      inStock: p.inStock ?? (p.stock ?? 0) > 0,
      images: p.images ?? [],
      gender: p.gender ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await batch.commit();
  console.log("Seed complete");
}

seedProducts().catch((error) => {
  console.error(error);
  process.exit(1);
});

