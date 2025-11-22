"use client";

import { useEffect } from "react";
import { logPageView } from "@/lib/firebaseAnalytics";

export default function Home() {
  useEffect(() => {
    logPageView("home");
  }, []);

  return (
    <div style={{ padding: "40px", fontSize: "24px" }}>
      Welcome to Fish Your Style 🐱🎣
    </div>
  );
}
