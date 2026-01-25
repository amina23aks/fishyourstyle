"use client";

import { useEffect, useRef, useState } from "react";

const CURSOR_SIZE = 34;

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const canHover = window.matchMedia("(hover: hover)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    if (!canHover || !finePointer) {
      return;
    }

    setEnabled(true);
    document.documentElement.classList.add("custom-cursor-active");

    const cursorEl = cursorRef.current;

    const updatePosition = () => {
      const { x, y } = positionRef.current;
      if (cursorEl) {
        cursorEl.style.transform = `translate3d(${x - CURSOR_SIZE / 2}px, ${y - CURSOR_SIZE / 2}px, 0)`;
        cursorEl.style.opacity = "1";
      }
      rafRef.current = null;
    };

    const handlePointerMove = (event: PointerEvent) => {
      positionRef.current = { x: event.clientX, y: event.clientY };

      const target = event.target as HTMLElement | null;
      const isTextField = !!target?.closest(
        "input, textarea, select, option, [contenteditable='true']",
      );

      if (cursorEl) {
        cursorEl.style.opacity = isTextField ? "0" : "1";
      }

      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(updatePosition);
      }
    };

    const handlePointerLeave = () => {
      if (cursorEl) {
        cursorEl.style.opacity = "0";
      }
    };

    const handlePointerEnter = () => {
      if (cursorEl) {
        cursorEl.style.opacity = "1";
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("pointerenter", handlePointerEnter);

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("pointerenter", handlePointerEnter);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <div
      ref={cursorRef}
      className="custom-cursor"
      aria-hidden="true"
      style={{ backgroundImage: "url(/hook.png)" }}
    />
  );
}
