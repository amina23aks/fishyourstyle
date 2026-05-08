"use client";

import { useCallback, useRef } from "react";

export type FlyToCartTarget = HTMLElement | null;

/**
 * useFlyToCart
 * - cartRef: attach to the cart button/icon that should bounce
 * - flyToCart(imageEl): call with the product image element when adding to cart
 */
export function useFlyToCart() {
  // Cart ref kept to a button element for compatibility with ref typing on native buttons.
  // Anchors can still be targeted via the data attribute fallback selector below.
  const cartRef = useRef<HTMLButtonElement | null>(null);

  const bounceCart = useCallback((cartEl: HTMLElement) => {
    cartEl.classList.remove("cart-bounce");
    // Force a style flush so rapid add-to-cart clicks restart the tiny feedback animation.
    void cartEl.offsetWidth;
    cartEl.classList.add("cart-bounce");
    cartEl.addEventListener(
      "animationend",
      () => {
        cartEl.classList.remove("cart-bounce");
      },
      { once: true },
    );
  }, []);

  const flyToCart = useCallback((imageEl: HTMLImageElement | null) => {
    if (typeof window === "undefined") return;

    const cartEl = cartRef.current ?? (document.querySelector("[data-cart-target=\"true\"]") as HTMLElement | null);
    if (!cartEl) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

    if (reduceMotion || coarsePointer || !imageEl) {
      bounceCart(cartEl);
      return;
    }

    const imageRect = imageEl.getBoundingClientRect();
    const cartRect = cartEl.getBoundingClientRect();
    const previewSize = Math.min(72, Math.max(44, imageRect.width * 0.28));
    const startX = imageRect.left + imageRect.width / 2 - previewSize / 2;
    const startY = imageRect.top + imageRect.height / 2 - previewSize / 2;

    const flyingImage = document.createElement("div");
    Object.assign(flyingImage.style, {
      position: "fixed",
      left: `${startX}px`,
      top: `${startY}px`,
      width: `${previewSize}px`,
      height: `${previewSize}px`,
      margin: "0",
      zIndex: "9999",
      pointerEvents: "none",
      borderRadius: "9999px",
      overflow: "hidden",
      backgroundImage: `url(${imageEl.currentSrc || imageEl.src})`,
      backgroundPosition: "center",
      backgroundSize: "cover",
      boxShadow: "0 8px 18px rgba(15, 23, 42, 0.22)",
      contain: "layout paint style",
      willChange: "transform, opacity",
      transform: "translate3d(0, 0, 0) scale(1)",
    });

    document.body.appendChild(flyingImage);

    const fromX = startX + previewSize / 2;
    const fromY = startY + previewSize / 2;
    const toX = cartRect.left + cartRect.width / 2;
    const toY = cartRect.top + cartRect.height / 2;
    const deltaX = toX - fromX;
    const deltaY = toY - fromY;

    const animation = flyingImage.animate(
      [
        { transform: "translate3d(0, 0, 0) scale(1)", opacity: 0.92 },
        { transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.3)`, opacity: 0 },
      ],
      { duration: 360, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
    );

    animation.onfinish = () => {
      flyingImage.remove();
      bounceCart(cartEl);
    };
  }, [bounceCart]);

  return { cartRef, flyToCart };
}
