"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";

type OverlayComponents = {
  CookiesBanner: ComponentType;
  AuthModal: ComponentType;
};

export default function ClientOverlays() {
  const [shouldRender, setShouldRender] = useState(false);
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
    if (!shouldRender) return;
    let isActive = true;
    Promise.all([
      import("@/components/CookiesBanner"),
      import("@/components/AuthModal"),
    ])
      .then(([cookiesModule, authModule]) => {
        if (!isActive) return;
        setOverlays({
          CookiesBanner: cookiesModule.default,
          AuthModal: authModule.default,
        });
      })
      .catch((error) => {
        console.error("[client-overlays] failed to load overlays", error);
      });
    return () => {
      isActive = false;
    };
  }, [shouldRender]);

  if (!shouldRender || !overlays) {
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
