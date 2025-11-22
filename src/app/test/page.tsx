"use client";

import { useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

export default function TestPage() {
  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "products"));
      console.log("Products:", snap.docs.map((d) => d.data()));
    };
    load();
  }, []);

  return <div>Firebase Test Page</div>;
}
