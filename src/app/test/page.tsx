"use client";

import { useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { getDb } from "@/lib/firebaseClient";
// test

export default function TestPage() {
  useEffect(() => {
    const load = async () => {
      const db = getDb();
      if (!db) {
        console.warn("Firestore is not available in the current environment.");
        return;
      }

      const snap = await getDocs(collection(db, "products"));
      console.log("Products:", snap.docs.map((d) => d.data()));
    };
    load();
  }, []);

  return <div>Firebase Test Page</div>;
}
