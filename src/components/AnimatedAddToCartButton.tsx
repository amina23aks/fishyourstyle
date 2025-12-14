"use client";

import { useCallback, useMemo, useState } from "react";

type ButtonState = "idle" | "loading" | "added";

type AnimatedAddToCartButtonProps = {
  onClick?: () => boolean | void | Promise<boolean | void>;
  className?: string;
  disabled?: boolean;
};

const baseClasses =
  "relative inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-black/15 backdrop-blur transition-transform duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60";

const CartIcon = () => (
  <svg
    aria-hidden
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    className="h-[17px] w-[17px]"
  >
    <path d="M3 4h2l1.6 11.2a1 1 0 0 0 1 .9h8.2a1 1 0 0 0 1-.82L18.6 7.5H6.2" />
    <circle cx="10" cy="19.5" r="0.9" />
    <circle cx="15.6" cy="19.5" r="0.9" />
  </svg>
);

const CheckIcon = () => (
  <svg
    aria-hidden
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="h-[16px] w-[16px]"
  >
    <path d="M4 10.5 8 14l8-8" />
  </svg>
);

export function AnimatedAddToCartButton({ onClick, className, disabled }: AnimatedAddToCartButtonProps) {
  const [state, setState] = useState<ButtonState>("idle");

  const handleClick = useCallback(() => {
    if (state !== "idle" || disabled) {
      return;
    }

    // The onClick handler can be sync or async.
    // We need to handle both cases gracefully.
    Promise.resolve(onClick?.()).then(result => {
      // result could be true, false, void, or undefined.
      // We treat void/undefined as success (true).
      if (result === false) {
        // The parent explicitly signaled a failure (e.g. out of stock), so do nothing.
        return;
      }

      // The action was successful, so start the animation sequence.
      setState("loading");

      window.setTimeout(() => {
        setState("added");
        window.setTimeout(() => setState("idle"), 900);
      }, 500);
    });
  }, [disabled, onClick, state]);

  const content = useMemo(() => {
    if (state === "loading") {
      return (
        <>
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-white/70 border-t-transparent align-middle transition-transform duration-150" style={{ transform: "scale(0.95)" }}>
            <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
          </span>
          <span className="text-xs uppercase tracking-[0.12em] text-slate-900/80">Adding</span>
        </>
      );
    }

    if (state === "added") {
      return (
        <>
          <CheckIcon />
          <span className="text-sm">Added</span>
        </>
      );
    }

    return (
      <>
        <CartIcon />
        <span className="text-sm">Add to cart</span>
      </>
    );
  }, [state]);

  const scaleClass = state === "loading" ? "scale-[0.97]" : state === "added" ? "scale-[0.99]" : "hover:scale-[1.01] active:scale-[0.98]";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={`${baseClasses} ${scaleClass} ${className ?? ""} ${disabled ? "opacity-70 cursor-not-allowed pointer-events-none" : ""}`.trim()}
      aria-live="polite"
    >
      {content}
    </button>
  );
}
