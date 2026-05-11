"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function ModelViewerLogo() {
  const [useStaticLogo, setUseStaticLogo] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce)");
    const updateLogoMode = () => setUseStaticLogo(mediaQuery.matches);

    updateLogoMode();
    mediaQuery.addEventListener("change", updateLogoMode);

    return () => mediaQuery.removeEventListener("change", updateLogoMode);
  }, []);

  if (useStaticLogo) {
    return (
      <Image
        src="/logoF.png"
        alt="Fish Your Style logo"
        width={56}
        height={56}
        priority
        className="h-14 w-14 object-contain"
      />
    );
  }

  return (
    <model-viewer
      src="/logo-3d.glb"
      loading="eager"
      camera-controls
      auto-rotate
      rotation-per-second="120deg"
      disable-zoom
      shadow-intensity="1"
      className="h-14 w-14"
      aria-label="Fish Your Style 3D logo"
    />
  );
}
