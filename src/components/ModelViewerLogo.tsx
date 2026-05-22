"use client";

import Script from "next/script";

export default function ModelViewerLogo() {
  return (
    <>
      <Script
        id="model-viewer-web-component"
        src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
        type="module"
        strategy="lazyOnload"
      />
      <model-viewer
        src="/logo-3d.glb"
        loading="lazy"
        camera-controls
        auto-rotate
        rotation-per-second="120deg"
        disable-zoom
        shadow-intensity="1"
        className="h-14 w-14"
        aria-label="Fish Your Style 3D logo"
      />
    </>
  );
}
