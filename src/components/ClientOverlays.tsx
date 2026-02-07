"use client";

import dynamic from "next/dynamic";

const CustomCursor = dynamic(() => import("@/components/ui/CustomCursor"), {
  ssr: false,
});

const CookiesBanner = dynamic(() => import("@/components/CookiesBanner"), {
  ssr: false,
});

const AuthModal = dynamic(() => import("@/components/AuthModal"), {
  ssr: false,
});

export default function ClientOverlays() {
  return (
    <>
      <CustomCursor />
      <CookiesBanner />
      <AuthModal />
    </>
  );
}
