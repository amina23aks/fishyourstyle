"use client";

import type { ComponentType } from "react";
import { useEffect, useState } from "react";

type OverlayComponents = {
  CookiesBanner: ComponentType;
  AuthModal: ComponentType;
};

export default function ClientOverlays() {
  const [overlays, setOverlays] = useState<OverlayComponents | null>(null);

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
    let isCancelled = false;

    const loadOverlays = () => {
      Promise.all([
        import("@/components/CookiesBanner"),
        import("@/components/AuthModal"),
      ])
        .then(([cookiesModule, authModule]) => {
          if (isCancelled) return;
          setOverlays({
            CookiesBanner: cookiesModule.default,
            AuthModal: authModule.default,
          });
        })
        .catch((error) => {
          console.error("Failed to load overlay components", error);
        });
    };

    if (browserWindow.requestIdleCallback) {
      idleId = browserWindow.requestIdleCallback(loadOverlays, {
        timeout: 1200,
      });
    } else {
      timeoutId = browserWindow.setTimeout(loadOverlays, 200);
    }

    return () => {
      isCancelled = true;
      if (idleId !== null) {
        browserWindow.cancelIdleCallback?.(idleId);
      }
      if (timeoutId !== null) {
        browserWindow.clearTimeout(timeoutId);
      }
    };
  }, []);

  if (!overlays) {
    return null;
  }

  const { CookiesBanner, AuthModal } = overlays;

  return (
    <>
      <CookiesBanner />
      <AuthModal />
    </>
  );
}
