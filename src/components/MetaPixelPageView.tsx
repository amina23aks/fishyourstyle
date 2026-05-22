"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { pageView } from "@/lib/metaPixel";

export default function MetaPixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedLocationRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!pathname) return;

    const query = searchParams?.toString();
    const locationKey = query ? `${pathname}?${query}` : pathname;

    if (lastTrackedLocationRef.current === locationKey) return;

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    const maxAttempts = 10;
    const retryDelayMs = 150;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const tryTrack = (attempt: number) => {
      if (requestId !== requestIdRef.current) return;
      if (lastTrackedLocationRef.current === locationKey) return;

      const didTrack = pageView();
      if (didTrack) {
        lastTrackedLocationRef.current = locationKey;
        return;
      }

      if (attempt >= maxAttempts) return;

      timeoutId = setTimeout(() => {
        tryTrack(attempt + 1);
      }, retryDelayMs);
    };

    tryTrack(1);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [pathname, searchParams]);

  return null;
}
