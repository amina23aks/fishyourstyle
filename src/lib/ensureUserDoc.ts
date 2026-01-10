import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { getDb } from "@/lib/firebaseClient";

export async function ensureUserDoc(uid: string): Promise<void> {
  if (!uid) return;
  const db = getDb();
  if (!db) return;

  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) return;

  await setDoc(
    userRef,
    {
      orderCount: 0,
      loyaltyRewardAvailable: false,
      loyaltyRewardPercent: 8,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
