import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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
    throw new Error(
      "Missing Firebase Admin credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)",
    );
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

async function purgeCollection(name: string): Promise<number> {
  const db = getDb();
  const snapshot = await db.collection(name).get();
  let count = 0;

  for (const doc of snapshot.docs) {
    await doc.ref.delete();
    count += 1;
  }

  return count;
}

async function main() {
  if (process.env.CONFIRM_CLEANUP !== "true") {
    throw new Error("Set CONFIRM_CLEANUP=true to run the cleanup. This is destructive.");
  }

  const [productsDeleted, categoriesDeleted] = await Promise.all([
    purgeCollection("products"),
    purgeCollection("categories"),
  ]);

  console.log(`Deleted ${productsDeleted} product(s)`);
  console.log(`Deleted ${categoriesDeleted} category/design entries`);
}

main().catch((error) => {
  console.error("Cleanup failed", error);
  process.exit(1);
});
