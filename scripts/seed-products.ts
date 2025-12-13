import { readFile } from "fs/promises";
import { join } from "path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

import type { Product } from "../src/types/product";

const CANONICAL_CATEGORIES = new Set(["hoodies", "pants", "ensembles", "tshirts", "sweatshirts"]);
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
const DESIGN_THEME = "simple";

type JsonProduct = Product & {
  basePrice?: number;
  discountPercent?: number;
  finalPrice?: number;
  designTheme?: string;
  status?: "active" | "inactive";
  stock?: number;
  inStock?: boolean;
  tags?: string[];
};

type SeedCounts = { created: number; updated: number; skipped: number };

type AdminCredentials = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function getCredentials(): AdminCredentials {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)");
  }

  return { projectId, clientEmail, privateKey } satisfies AdminCredentials;
}

function getDb() {
  const creds = getCredentials();
  if (!getApps().length) {
    initializeApp({
      credential: cert(creds),
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

function normalizeImages(value: unknown): { main: string; gallery: string[] } {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as { main?: unknown; gallery?: unknown };
    const main = typeof obj.main === "string" ? obj.main : "";
    const gallery = Array.isArray(obj.gallery)
      ? (obj.gallery as unknown[])
          .map((item) => (typeof item === "string" ? item : null))
          .filter((item): item is string => Boolean(item))
      : [];
    return { main: main || gallery[0] || "", gallery };
  }

  if (Array.isArray(value)) {
    const [main, ...gallery] = (value as unknown[])
      .map((item) => (typeof item === "string" ? item : null))
      .filter((item): item is string => Boolean(item));
    return { main: main || gallery[0] || "", gallery };
  }

  return { main: "", gallery: [] };
}

function normalizeColors(value: unknown): Product["colors"] {
  if (!Array.isArray(value)) return [];
  return value.reduce<Product["colors"]>((acc, item) => {
    if (typeof item === "string") {
      acc.push({ id: item, labelFr: item, labelAr: item, image: "" });
      return acc;
    }
    if (item && typeof item === "object") {
      const color = item as { id?: unknown; labelFr?: unknown; labelAr?: unknown; image?: unknown; hex?: unknown };
      const id = typeof color.id === "string" && color.id ? color.id : typeof color.hex === "string" ? color.hex : null;
      if (!id) return acc;
      acc.push({
        id,
        labelFr: typeof color.labelFr === "string" ? color.labelFr : id,
        labelAr: typeof color.labelAr === "string" ? color.labelAr : typeof color.labelFr === "string" ? color.labelFr : id,
        image: typeof color.image === "string" ? color.image : "",
      });
    }
    return acc;
  }, []);
}

function normalizeCategory(category: unknown): string {
  if (typeof category !== "string") return "tshirts";
  const normalized = category.toLowerCase().trim();
  if (CANONICAL_CATEGORIES.has(normalized)) return normalized;
  return CATEGORY_SLUG_MAP[normalized] ?? "tshirts";
}

function normalizeStatus(status: unknown): "active" | "inactive" {
  return status === "inactive" ? "inactive" : "active";
}

function normalizeProduct(raw: JsonProduct) {
  const slug = raw.slug || slugify(raw.nameFr || raw.nameAr || raw.id || "");
  if (!slug) return null;

  const basePrice = Number(raw.basePrice ?? raw.priceDzd ?? 0);
  const discountPercent = Number(raw.discountPercent ?? 0);
  const finalPrice =
    typeof raw.finalPrice === "number" && !Number.isNaN(raw.finalPrice)
      ? raw.finalPrice
      : Math.max(basePrice * (1 - discountPercent / 100), 0);
  const images = normalizeImages(raw.images);
  const colors = normalizeColors(raw.colors);

  return {
    slug,
    name: raw.nameFr || raw.nameAr || slug,
    description: raw.descriptionFr || raw.descriptionAr || "",
    basePrice,
    discountPercent,
    finalPrice,
    category: normalizeCategory(raw.category),
    designTheme: DESIGN_THEME,
    sizes: Array.isArray(raw.sizes) ? raw.sizes : [],
    colors,
    stock: typeof raw.stock === "number" ? raw.stock : Number(raw.stock ?? 0),
    inStock: typeof raw.inStock === "boolean" ? raw.inStock : Boolean(raw.stock ?? 0),
    images,
    gender: raw.gender ?? null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    status: normalizeStatus(raw.status),
  };
}

async function seedProducts(): Promise<SeedCounts> {
  const db = getDb();
  const dataPath = join(process.cwd(), "src", "data", "products.json");
  const raw = await readFile(dataPath, "utf-8");
  const products = JSON.parse(raw) as JsonProduct[];

  const counts: SeedCounts = { created: 0, updated: 0, skipped: 0 };

  for (const product of products) {
    const normalized = normalizeProduct(product);
    if (!normalized) {
      counts.skipped += 1;
      console.warn("Skipping product without slug:", product);
      continue;
    }

    const ref = db.collection("products").doc(normalized.slug);
    const snapshot = await ref.get();
    const exists = snapshot.exists;
    const timestamps = exists
      ? { updatedAt: FieldValue.serverTimestamp() }
      : { createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };

    await ref.set(
      {
        ...normalized,
        ...timestamps,
      },
      { merge: true },
    );

    counts[exists ? "updated" : "created"] += 1;
  }

  return counts;
}

seedProducts()
  .then((counts) => {
    console.log(
      `Seeded products — created: ${counts.created}, updated: ${counts.updated}, skipped: ${counts.skipped}`,
    );
  })
  .catch((error) => {
    console.error("Failed to seed products", error);
    process.exit(1);
  });
