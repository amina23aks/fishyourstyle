"use client";

import { memo, useMemo } from "react";
import { motion } from "@/lib/motion";

import { useFavorites } from "@/hooks/use-favorites";

type FavoriteButtonProps = {
  productId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses: Record<NonNullable<FavoriteButtonProps["size"]>, string> = {
  sm: "h-9 w-9 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-11 w-11 text-lg",
};

function HeartIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-5 w-5">
      <path d="M12 21s-6.6-3.8-9.6-8C-1.1 7.4 2 2 6.8 3.1 8.9 3.6 10 5.3 12 5.3s3.1-1.7 5.2-2.2C21 2 24.1 7.4 21.6 13c-3 4.2-9.6 8-9.6 8z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden className="h-5 w-5">
      <path d="M12 20s-6-3.4-8.7-7.1C1 9.2 2.7 4.2 6.9 3.6 8.8 3.4 10 4.4 12 6c2-1.6 3.2-2.6 5.1-2.4 4.2.5 5.9 5.6 3.6 9.3C18 16.6 12 20 12 20z" />
    </svg>
  );
}

function FavoriteButtonComponent({ productId, className, size = "md" }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, isUpdating } = useFavorites();
  const active = isFavorite(productId);

  const buttonClasses = useMemo(
    () => {
      const base =
        "group relative inline-flex items-center justify-center overflow-hidden rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black";
      const sizeClass = sizeClasses[size];
      const variant = active
        ? "border-transparent bg-gradient-to-br from-rose-400 via-pink-400 to-amber-300 text-white shadow-lg shadow-rose-500/40"
        : "border-white/40 bg-black/50 text-white hover:border-white/60 hover:bg-white/10";
      return [base, sizeClass, variant, className].filter(Boolean).join(" ");
    },
    [active, className, size],
  );

  return (
    <motion.button
      type="button"
      className={buttonClasses}
      whileTap={{ scale: 0.92 }}
      animate={active ? { transform: "scale(1.04)" } : { transform: "scale(1)" }}
      transition={{ duration: 0.25 }}
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggleFavorite(productId);
      }}
      disabled={isUpdating}
    >
      <span
        aria-hidden
        className={[
          "absolute inset-0 opacity-0 transition duration-200",
          active ? "bg-white/10 opacity-100 blur-md" : "bg-white/0",
        ].join(" ")}
      />
      <HeartIcon filled={active} />
      <span className="sr-only">{active ? "Remove from favorites" : "Add to favorites"}</span>
    </motion.button>
  );
}

export const FavoriteButton = memo(FavoriteButtonComponent);
