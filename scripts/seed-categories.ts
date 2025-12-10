/**
 * One-time script to seed initial categories into Firestore.
 * 
 * Usage:
 *   npx tsx scripts/seed-categories.ts
 * 
 * This creates the default categories (Hoodies, Pants, Ensembles, Tshirts)
 * if they don't already exist.
 */

import { collection, doc, setDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { getServerDb } from "../src/lib/categories";

const defaultCategories = [
  { name: "Hoodies", slug: "hoodies" },
  { name: "Pants", slug: "pants" },
  { name: "Ensembles", slug: "ensembles" },
  { name: "Tshirts", slug: "tshirts" },
];

async function seedCategories() {
  try {
    console.log("Seeding categories...");
    const db = getServerDb();
    const categoriesRef = collection(db, "categories");

    // Check existing categories
    const snapshot = await getDocs(categoriesRef);
    const existingSlugs = new Set(snapshot.docs.map((doc) => doc.data().slug));

    let created = 0;
    let skipped = 0;

    for (const cat of defaultCategories) {
      if (existingSlugs.has(cat.slug)) {
        console.log(`⊘ Category "${cat.name}" already exists`);
        skipped++;
        continue;
      }

      const docRef = doc(categoriesRef);
      await setDoc(docRef, {
        name: cat.name,
        slug: cat.slug,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log(`✓ Created category: ${cat.name} (${cat.slug})`);
      created++;
    }

    console.log("\n=== Seed Summary ===");
    console.log(`Created: ${created}`);
    console.log(`Skipped (existing): ${skipped}`);
    console.log("\nDone!");
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

seedCategories();

