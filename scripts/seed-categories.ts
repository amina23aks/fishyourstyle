import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

type AdminCredentials = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

const CATEGORIES = [
  { slug: "hoodies", name: "Hoodies" },
  { slug: "pants", name: "Pants" },
  { slug: "ensembles", name: "Ensembles" },
  { slug: "tshirts", name: "Tshirts" },
  { slug: "sweatshirts", name: "Sweatshirts" },
];

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
    initializeApp({ credential: cert(creds) });
  }
  return getFirestore();
}

async function seedCategories() {
  const db = getDb();
  let created = 0;
  let updated = 0;

  for (const category of CATEGORIES) {
    const ref = db.collection("categories").doc(category.slug);
    const snapshot = await ref.get();
    const exists = snapshot.exists;
    const timestamps = exists
      ? { updatedAt: FieldValue.serverTimestamp() }
      : { createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
    await ref.set(
      {
        name: category.name,
        label: category.name,
        slug: category.slug,
        type: "collection",
        ...timestamps,
      },
      { merge: true },
    );
    if (exists) updated += 1;
    else created += 1;
  }

  console.log(`Seeded categories — created: ${created}, updated: ${updated}`);
}

seedCategories().catch((error) => {
  console.error("Failed to seed categories", error);
  process.exit(1);
});
