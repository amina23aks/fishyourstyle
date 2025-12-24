"use client";

import { memo } from "react";
import { motion } from "@/lib/motion";

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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="white"
      strokeWidth="1.2"
      className="h-5 w-5"
    >
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
    ? "bg-gradient-to-br from-rose-500 to-pink-400 border-rose-400 text-white shadow-lg shadow-rose-500/40"
    : "bg-slate-900/10 border-white/80 text-white hover:bg-slate-900/30";

  return (
    <motion.button
      type="button"
      aria-pressed={isFavorite}
      disabled={disabled}
      className={[base, sizeClass, stateClass, className].filter(Boolean).join(" ")}
      whileTap={{ scale: 0.92 }}
      whileHover={disabled ? undefined : { scale: 1.05 }}
      animate={isFavorite ? { transform: "scale(1.05)" } : { transform: "scale(1)" }}
      transition={{ duration: 0.2 }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle(event);
      }}
    >
      <span className={isFavorite ? "text-red-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.45)]" : "text-white"}>
        <HeartIcon filled={isFavorite} />
      </span>
    </motion.button>
  );
}

export const FavoriteButton = memo(FavoriteButtonComponent);
