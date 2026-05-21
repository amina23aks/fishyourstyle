"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { pageView } from "@/lib/metaPixel";

export default function MetaPixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedLocationRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    const query = searchParams?.toString();
    const locationKey = query ? `${pathname}?${query}` : pathname;

    if (lastTrackedLocationRef.current === locationKey) return;

    lastTrackedLocationRef.current = locationKey;
    pageView();
  }, [pathname, searchParams]);

  return null;
}
