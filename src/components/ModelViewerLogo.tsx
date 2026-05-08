"use client";

import Image from "next/image";

export default function ModelViewerLogo() {
  return (
    // Phase 5 targeted experiment: temporarily replace the persistent
    // <model-viewer> logo with the existing static logo image on all viewports.
    // To revert, restore the previous <model-viewer src="/logo-3d.glb" ... /> markup.
    <span className="relative block h-14 w-14" aria-label="Fish Your Style logo">
      <Image src="/logoF.png" alt="Fish Your Style logo" fill priority sizes="56px" className="object-contain" />
    </span>
  );
}
