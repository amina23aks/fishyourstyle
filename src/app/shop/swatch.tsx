"use client";

import { forwardRef } from "react";
import { motion } from "@/lib/motion";

export type SwatchProps = {
  label: string;
  colorHex?: string;
  selected?: boolean;
  onSelect?: () => void;
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
};

const sizeClasses: Record<NonNullable<SwatchProps["size"]>, string> = {
  xs: "h-7 px-2.5 text-[11px]",
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
};

export const Swatch = forwardRef<HTMLButtonElement, SwatchProps>(
  (
    { label, colorHex, selected = false, onSelect, size = "sm", showLabel = true },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        type="button"
        aria-pressed={selected}
        aria-label={label}
        onClick={onSelect}
        className={`inline-flex items-center gap-2 rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${sizeClasses[size]} ${selected ? "border-white bg-white/15 text-white" : "border-white/20 bg-white/5 text-white/80 hover:border-white/40"}`}
        whileHover={{ transform: "translateY(-1px)" }}
        whileTap={{ scale: 0.97 }}
      >
        <span
          aria-hidden
          className="h-3 w-3 rounded-full border border-white/30 shadow-[0_0_0_3px_rgba(255,255,255,0.05)]"
          style={{ backgroundColor: colorHex ?? "#e5e7eb" }}
        />
        {showLabel && (
          <span className="whitespace-nowrap text-[13px] font-medium leading-none">
            {label}
          </span>
        )}
      </motion.button>
    );
  },
);

Swatch.displayName = "Swatch";
