"use client";

import { useEffect, useRef, useState } from "react";

const CURSOR_SIZE = 34;
const POINTER_SCALE = 1.18;
const INTERACTIVE_SELECTOR =
  "button, a, input, textarea, select, [role='button'], [data-cursor='pointer']";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const currentRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const canHover = window.matchMedia("(hover: hover)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    if (!canHover || !finePointer) {
      return;
    }

    setEnabled(true);
    document.documentElement.classList.add("custom-cursor-active");

    const updatePosition = () => {
      const cursorEl = cursorRef.current;
      if (!cursorEl) {
        rafRef.current = null;
        return;
      }
      const target = targetRef.current;
      currentRef.current = { x: target.x, y: target.y };
      cursorEl.style.transform = `translate3d(${target.x - CURSOR_SIZE / 2}px, ${target.y - CURSOR_SIZE / 2}px, 0) scale(var(--cursor-scale, 1))`;
      cursorEl.style.opacity = "1";
      rafRef.current = window.requestAnimationFrame(updatePosition);
    };

    const handlePointerMove = (event: PointerEvent) => {
      targetRef.current = { x: event.clientX, y: event.clientY };

      const target = event.target as HTMLElement | null;
      const isInteractive = !!target?.closest(INTERACTIVE_SELECTOR);

      const cursorEl = cursorRef.current;
      if (cursorEl) {
        cursorEl.style.opacity = "1";
        cursorEl.dataset.state = isInteractive ? "pointer" : "default";
        cursorEl.style.setProperty("--cursor-scale", isInteractive ? String(POINTER_SCALE) : "1");
      }

      if (!isRunningRef.current) {
        currentRef.current = { x: targetRef.current.x, y: targetRef.current.y };
        isRunningRef.current = true;
        rafRef.current = window.requestAnimationFrame(updatePosition);
      }
    };

    const handlePointerLeave = () => {
      const cursorEl = cursorRef.current;
      if (cursorEl) {
        cursorEl.style.opacity = "0";
      }
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = null;
      isRunningRef.current = false;
    };

    const handlePointerEnter = () => {
      const cursorEl = cursorRef.current;
      if (cursorEl) {
        cursorEl.style.opacity = "1";
      }
      if (!isRunningRef.current) {
        isRunningRef.current = true;
        rafRef.current = window.requestAnimationFrame(updatePosition);
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
      rafRef.current = null;
      isRunningRef.current = false;
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
