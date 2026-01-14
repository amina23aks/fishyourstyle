"use client";

export default function ModelViewerLogo() {
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
