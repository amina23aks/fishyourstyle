"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

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
  const [shouldRender, setShouldRender] = useState(false);
  const [cursorEnabled, setCursorEnabled] = useState(false);

  useEffect(() => {
    const browserWindow = globalThis as Window &
      typeof globalThis & {
        requestIdleCallback?: (
          callback: IdleRequestCallback,
          options?: IdleRequestOptions
        ) => number;
        cancelIdleCallback?: (handle: number) => void;
      };
    let timeoutId: number | null = null;
    let idleId: number | null = null;

    if (browserWindow.requestIdleCallback) {
      idleId = browserWindow.requestIdleCallback(() => setShouldRender(true), {
        timeout: 1200,
      });
    } else {
      timeoutId = browserWindow.setTimeout(() => setShouldRender(true), 200);
    }

    return () => {
      if (idleId !== null) {
        browserWindow.cancelIdleCallback?.(idleId);
      }
      if (timeoutId !== null) {
        browserWindow.clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updateCursorEnabled = () => setCursorEnabled(mediaQuery.matches);

    updateCursorEnabled();
    mediaQuery.addEventListener("change", updateCursorEnabled);

    return () => {
      mediaQuery.removeEventListener("change", updateCursorEnabled);
    };
  }, []);

  if (!shouldRender) {
    return null;
  }

  return (
    <>
      {cursorEnabled ? <CustomCursor /> : null}
      <CookiesBanner />
      <AuthModal />
    </>
  );
}
