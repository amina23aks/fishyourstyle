/**
 * Migration script to import products from JSON to Firestore.
 * 
 * Usage:
 *   npx tsx scripts/importProductsFromJson.ts
 * 
 * Make sure FIREBASE_* env vars are set before running.
 * 
 * This script:
 * - Reads products from src/data/products.json
 * - Maps them to Firestore AdminProduct schema
 * - Checks for existing products by slug to avoid duplicates
 * - Imports/updates products in the products collection
 */

import { readFileSync } from "fs";
import { join } from "path";
import { collection, doc, setDoc, getDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { getServerDb } from "../src/lib/firestore";
import type { AdminProductInput } from "../src/lib/admin-products";

interface JsonProduct {
  id: string;
  slug: string;
  nameFr: string;
  nameAr?: string;
  category: string; // Now accepts any string
  kind?: string;
  fit?: string;
  priceDzd: number;
  currency?: string;
  gender?: "unisex" | "men" | "women";
  sizes: string[];
  colors: Array<{ id: string; labelFr: string; labelAr?: string; image?: string }> | string[];
  images: { main: string; gallery?: string[] };
  descriptionFr?: string;
  descriptionAr?: string;
  status?: "active" | "inactive";
  designTheme?: string;
  tags?: string[];
  discountPercent?: number;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function computeFinalPrice(basePrice: number, discountPercent: number): number {
  return Math.max(basePrice * (1 - discountPercent / 100), 0);
}

function normalizeColors(colors: JsonProduct["colors"]): { hex: string }[] {
  if (!Array.isArray(colors)) return [];
  
  return colors.map((color) => {
    if (typeof color === "string") {
      // If it's a hex string, use it; otherwise treat as color name
      if (/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
        return { hex: color };
      }
      // Map color names to hex (simplified - you may need to expand this)
      const colorMap: Record<string, string> = {
        black: "#111827",
        noir: "#1f2937",
        white: "#f9fafb",
        blanc: "#f9fafb",
        grey: "#9ca3af",
        gris: "#9ca3af",
        gray: "#9ca3af",
        blue: "#2563eb",
        bleu: "#2563eb",
        red: "#ef4444",
        rouge: "#dc2626",
        green: "#22c55e",
        vert: "#16a34a",
        beige: "#d6c9a5",
      };
      const normalized = color.toLowerCase().replace(/\s+/g, "");
      return { hex: colorMap[normalized] ?? "#e5e7eb" };
    }
    
    // If it's an object with id, try to extract hex from id or use a default
    if (color && typeof color === "object" && "id" in color) {
      const colorId = String(color.id);
      if (/^#([0-9A-F]{3}){1,2}$/i.test(colorId)) {
        return { hex: colorId };
      }
      // Map color names
      const colorMap: Record<string, string> = {
        black: "#111827",
        noir: "#1f2937",
        white: "#f9fafb",
        blanc: "#f9fafb",
        grey: "#9ca3af",
        gris: "#9ca3af",
        gray: "#9ca3af",
        blue: "#2563eb",
        bleu: "#2563eb",
        red: "#ef4444",
        rouge: "#dc2626",
        green: "#22c55e",
        vert: "#16a34a",
        beige: "#d6c9a5",
      };
      const normalized = colorId.toLowerCase().replace(/\s+/g, "");
      return { hex: colorMap[normalized] ?? "#e5e7eb" };
    }
    
    return { hex: "#e5e7eb" };
  });
}

async function importProducts() {
  try {
    console.log("Reading products.json...");
    const jsonPath = join(process.cwd(), "src", "data", "products.json");
    const fileContent = readFileSync(jsonPath, "utf-8");
    const jsonProducts: JsonProduct[] = JSON.parse(fileContent);

    console.log(`Found ${jsonProducts.length} products in JSON`);

    const db = getServerDb();
    const productsRef = collection(db, "products");

    // Fetch existing products to check for duplicates
    console.log("Checking for existing products...");
    const existingSnapshot = await getDocs(query(productsRef));
    const existingSlugs = new Set<string>();
    const existingIds = new Set<string>();
    
    existingSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.slug) existingSlugs.add(data.slug);
      existingIds.add(doc.id);
    });

    console.log(`Found ${existingIds.size} existing products in Firestore\n`);

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const jsonProduct of jsonProducts) {
      try {
        // Skip inactive products
        if (jsonProduct.status === "inactive") {
          console.log(`⊘ Skipping inactive product: ${jsonProduct.id}`);
          skipped++;
          continue;
        }

        const productSlug = jsonProduct.slug || slugify(jsonProduct.nameFr);
        
        // Check if product already exists (by ID or slug)
        const existsById = existingIds.has(jsonProduct.id);
        const existsBySlug = existingSlugs.has(productSlug);
        
        if (existsById || existsBySlug) {
          if (existsById) {
            console.log(`↻ Updating existing product by ID: ${jsonProduct.id} (${jsonProduct.nameFr})`);
          } else {
            console.log(`↻ Updating existing product by slug: ${productSlug} (${jsonProduct.nameFr})`);
          }
          // Will use merge: true to update, not overwrite
        } else {
          console.log(`+ Importing new product: ${jsonProduct.id} (${jsonProduct.nameFr})`);
        }

        // Build images array (main + gallery)
        const images: string[] = [];
        if (jsonProduct.images?.main) {
          images.push(jsonProduct.images.main);
        }
        if (jsonProduct.images?.gallery && Array.isArray(jsonProduct.images.gallery)) {
          images.push(...jsonProduct.images.gallery.filter(Boolean));
        }

        // Normalize colors
        const colors = normalizeColors(jsonProduct.colors);

        // Compute final price
        const discountPercent = jsonProduct.discountPercent ?? 0;
        const finalPrice = computeFinalPrice(jsonProduct.priceDzd, discountPercent);

        // Map designTheme - handle various formats
        let designTheme = "basic";
        if (jsonProduct.designTheme) {
          const theme = jsonProduct.designTheme.toLowerCase();
          // Map common variations
          if (theme === "harry potter" || theme === "harry-potter") {
            designTheme = "harry-potter";
          } else if (["cars", "nature", "anime", "basic"].includes(theme)) {
            designTheme = theme;
          } else {
            designTheme = theme; // Use custom theme as-is
          }
        }

        // Map stock and inStock
        let stock = 0;
        let inStock = false;
        // JSON doesn't have stock field typically, so default to 0/false
        // If you want to set inStock based on status, you could do:
        // inStock = jsonProduct.status === "active";

        // Map to AdminProductInput format
        const productData: AdminProductInput = {
          name: jsonProduct.nameFr,
          slug: productSlug,
          description: jsonProduct.descriptionFr?.trim() || undefined,
          basePrice: jsonProduct.priceDzd,
          discountPercent,
          finalPrice,
          category: jsonProduct.category,
          designTheme,
          sizes: (jsonProduct.sizes || []).filter((s): s is "S" | "M" | "L" | "XL" => 
            ["S", "M", "L", "XL"].includes(s.toUpperCase())
          ) as ("S" | "M" | "L" | "XL")[],
          colors,
          stock,
          inStock,
          images,
          gender: jsonProduct.gender || undefined,
        };

        // Use the product ID from JSON as the document ID
        const docRef = doc(productsRef, jsonProduct.id);
        await setDoc(docRef, {
          ...productData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });

        if (existsById || existsBySlug) {
          updated++;
        } else {
          imported++;
        }
      } catch (error) {
        console.error(`✗ Error importing ${jsonProduct.id}:`, error);
        errors++;
      }
    }

    console.log("\n=== Import Summary ===");
    console.log(`New products imported: ${imported}`);
    console.log(`Existing products updated: ${updated}`);
    console.log(`Skipped (inactive): ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log("\nDone!");
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// Run the import
importProducts();

