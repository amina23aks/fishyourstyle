"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const MODEL_VIEWER_SCRIPT_ID = "model-viewer-script";
const MODEL_VIEWER_SRC = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";

function loadModelViewer() {
  if (typeof window === "undefined") return;
  if (customElements.get("model-viewer")) return;
  if (document.getElementById(MODEL_VIEWER_SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = MODEL_VIEWER_SCRIPT_ID;
  script.src = MODEL_VIEWER_SRC;
  script.type = "module";
  script.async = true;
  document.head.appendChild(script);
}

export default function ModelViewerLogo() {
  const [canRenderModel, setCanRenderModel] = useState(false);

  useEffect(() => {
    const scheduleLoad = () => {
      loadModelViewer();
      window.customElements.whenDefined("model-viewer").then(() => setCanRenderModel(true)).catch(() => {
        setCanRenderModel(false);
      });
    };

    if (customElements.get("model-viewer")) {
      setCanRenderModel(true);
      return;
    }

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(scheduleLoad, { timeout: 1800 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(scheduleLoad, 1200);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  if (!canRenderModel) {
    return (
      <Image
        src="/logoF.png"
        alt="Fish Your Style logo"
        width={56}
        height={56}
        sizes="56px"
        className="h-14 w-14 object-contain"
        priority
      />
    );
  }

  return (
    <model-viewer
      src="/logo-3d.glb"
      loading="lazy"
      reveal="interaction"
      camera-controls
      auto-rotate
      rotation-per-second="60deg"
      disable-zoom
      shadow-intensity="0.8"
      className="h-14 w-14"
      aria-label="Fish Your Style 3D logo"
    />
  );
}
