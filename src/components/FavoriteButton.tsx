"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "@/lib/motion";

type FavoriteButtonProps = {
  isFavorite: boolean;
  onToggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  size?: "sm" | "md";
  disabled?: boolean;
};

const sizes: Record<NonNullable<FavoriteButtonProps["size"]>, string> = {
  sm: "h-9 w-9",
  md: "h-10 w-10",
};

function HeartIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M12 21s-6.6-3.8-9.6-8C-1.1 7.4 2 2 6.8 3.1 8.9 3.6 10 5.3 12 5.3s3.1-1.7 5.2-2.2C21 2 24.1 7.4 21.6 13c-3 4.2-9.6 8-9.6 8z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M12 20s-6-3.4-8.7-7.1C1 9.2 2.7 4.2 6.9 3.6 8.8 3.4 10 4.4 12 6c2-1.6 3.2-2.6 5.1-2.4 4.2.5 5.9 5.6 3.6 9.3C18 16.6 12 20 12 20z" />
    </svg>
  );
}

function FavoriteButtonComponent({
  isFavorite,
  onToggle,
  className,
  size = "md",
  disabled = false,
}: FavoriteButtonProps) {
  const base =
    "relative inline-flex items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black backdrop-blur";
  const sizeClass = sizes[size];
  const stateClass = isFavorite
    ? "bg-red-500 border-red-400 text-white shadow-[0_0_18px_rgba(239,68,68,0.55)]"
    : "bg-transparent border-white/70 text-white hover:bg-white/10";

  return (
    <motion.button
      type="button"
      aria-pressed={isFavorite}
      disabled={disabled}
      className={[base, sizeClass, stateClass, className].filter(Boolean).join(" ")}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      animate={isFavorite ? { transform: "scale(1.05)" } : { transform: "scale(1)" }}
      transition={{ duration: 0.2 }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle(event);
      }}
    >
      <AnimatePresence>
        {isFavorite && (
          <motion.span
            key="favorite-glow"
            className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-red-400/60"
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 1.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
      <HeartIcon filled={isFavorite} />
    </motion.button>
  );
}

export const FavoriteButton = memo(FavoriteButtonComponent);
