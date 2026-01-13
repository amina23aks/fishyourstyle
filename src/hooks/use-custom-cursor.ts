"use client";

import { useEffect } from "react";

export function useCustomCursor(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");

    if (reducedMotion.matches || coarsePointer.matches) {
      return;
    }

    const cursor = document.createElement("div");
    cursor.setAttribute("aria-hidden", "true");
    cursor.style.position = "fixed";
    cursor.style.top = "0";
    cursor.style.left = "0";
    cursor.style.width = "18px";
    cursor.style.height = "18px";
    cursor.style.borderRadius = "999px";
    cursor.style.border = "1px solid rgba(255, 255, 255, 0.7)";
    cursor.style.boxShadow = "0 0 14px rgba(56, 189, 248, 0.35)";
    cursor.style.pointerEvents = "none";
    cursor.style.zIndex = "9999";
    cursor.style.transform = "translate3d(-100px, -100px, 0)";
    cursor.style.transition = "opacity 0.2s ease";
    cursor.style.opacity = "0";

    document.body.appendChild(cursor);

    let rafId = 0;
    let currentX = -100;
    let currentY = -100;
    let targetX = -100;
    let targetY = -100;

    const update = () => {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      cursor.style.transform = `translate3d(${currentX - 9}px, ${currentY - 9}px, 0)`;
      rafId = window.requestAnimationFrame(update);
    };

    const handleMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursor.style.opacity = "1";
    };

    const handleLeave = () => {
      cursor.style.opacity = "0";
    };

    document.addEventListener("pointermove", handleMove, { passive: true });
    document.addEventListener("pointerdown", handleMove, { passive: true });
    document.addEventListener("pointerleave", handleLeave);

    rafId = window.requestAnimationFrame(update);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerdown", handleMove);
      document.removeEventListener("pointerleave", handleLeave);
      cursor.remove();
    };
  }, [enabled]);
}
