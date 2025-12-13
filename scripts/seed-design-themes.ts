import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

type AdminCredentials = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

const DESIGN_THEME = { slug: "simple", name: "Simple" } as const;

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

async function seedDesignThemes() {
  const db = getDb();
  const categoriesRef = db.collection("categories");
  const ref = categoriesRef.doc(DESIGN_THEME.slug);
  const snapshot = await ref.get();
  const exists = snapshot.exists;
  const timestamps = exists
    ? { updatedAt: FieldValue.serverTimestamp() }
    : { createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };

  await ref.set(
    {
      name: DESIGN_THEME.name,
      label: DESIGN_THEME.name,
      slug: DESIGN_THEME.slug,
      type: "design",
      ...timestamps,
    },
    { merge: true },
  );

  console.log(`Seeded design themes — created: ${exists ? 0 : 1}, updated: ${exists ? 1 : 0}`);
}

seedDesignThemes().catch((error) => {
  console.error("Failed to seed design themes", error);
  process.exit(1);
});
