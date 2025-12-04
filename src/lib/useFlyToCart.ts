"use client";

import { useRef } from "react";

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

  const flyToCart = (imageEl: HTMLImageElement | null) => {
    if (typeof window === "undefined") return;

    const cartEl = cartRef.current ?? (document.querySelector("[data-cart-target=\"true\"]") as HTMLElement | null);
    if (!imageEl || !cartEl) return;

    const imageRect = imageEl.getBoundingClientRect();
    const cartRect = cartEl.getBoundingClientRect();

    const flyingImage = imageEl.cloneNode(true) as HTMLImageElement;
    Object.assign(flyingImage.style, {
      position: "fixed",
      left: `${imageRect.left}px`,
      top: `${imageRect.top}px`,
      width: `${imageRect.width}px`,
      height: `${imageRect.height}px`,
      margin: "0",
      zIndex: 9999,
      pointerEvents: "none",
      borderRadius: "9999px",
      overflow: "hidden",
    });

    document.body.appendChild(flyingImage);

    const fromX = imageRect.left + imageRect.width / 2;
    const fromY = imageRect.top + imageRect.height / 2;
    const toX = cartRect.left + cartRect.width / 2;
    const toY = cartRect.top + cartRect.height / 2;

    const deltaX = toX - fromX;
    const deltaY = toY - fromY;

    const animation = flyingImage.animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.2)`, opacity: 0.2 },
      ],
      { duration: 650, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
    );

    animation.onfinish = () => {
      flyingImage.remove();

      cartEl.classList.add("cart-bounce");
      cartEl.addEventListener(
        "animationend",
        () => {
          cartEl.classList.remove("cart-bounce");
        },
        { once: true },
      );
    };
  };

  return { cartRef, flyToCart };
}
