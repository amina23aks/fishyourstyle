"use client";

import { motion } from "@/lib/motion";

type FavoriteButtonProps = {
  active: boolean;
  loading?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
};

export function FavoriteButton({
  active,
  loading = false,
  onClick,
  size = "md",
  className = "",
  ariaLabel,
}: FavoriteButtonProps) {
  const dimension = size === "sm" ? "h-9 w-9" : "h-11 w-11";

  return (
    <motion.button
      type="button"
      aria-pressed={active}
      aria-label={ariaLabel ?? (active ? "Remove from favorites" : "Add to favorites")}
      disabled={loading}
      whileTap={{ scale: 0.92 }}
      animate={{
        scale: active ? 1.05 : 1,
      }}
      className={`inline-flex ${dimension} items-center justify-center rounded-full border text-white shadow-md backdrop-blur transition ${
        active
          ? "border-transparent bg-rose-500/80 text-white"
          : "border-white/60 bg-white/10 text-white hover:border-white hover:bg-white/15"
      } ${loading ? "opacity-60 pointer-events-none" : ""} ${className}`}
      onClick={onClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.9"
        className="h-5 w-5 drop-shadow-sm"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21s-6.5-3.94-9-8.14C1 9.5 2.5 5 6.5 5A5.5 5.5 0 0 1 12 8.5 5.5 5.5 0 0 1 17.5 5C21.5 5 23 9.5 21 12.86 18.5 17.06 12 21 12 21Z"
        />
      </svg>
    </motion.button>
  );
}
