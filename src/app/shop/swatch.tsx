"use client";

import { forwardRef } from "react";
import { motion } from "@/lib/motion";
import { SoldOutTooltipWrapper } from "@/components/SoldOutTooltipWrapper";

export type SwatchProps = {
  label: string;
  colorHex?: string;
  selected?: boolean;
  onSelect?: () => void;
  size?: "xs" | "sm" | "md" | "lg" | "card";
  showLabel?: boolean;
  disabled?: boolean;
  isSoldOut?: boolean;
};

const sizeClasses: Record<NonNullable<SwatchProps["size"]>, string> = {
  xs: "h-[22px] px-2 text-[9px]",
  sm: "h-8 px-3 text-[12px]",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-3.5 text-sm",
  card: "h-6 px-1.5 text-[8.5px]",
};

const dotSizes: Record<NonNullable<SwatchProps["size"]>, string> = {
  xs: "h-2.5 w-2.5",
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
  card: "h-3.5 w-3.5",
};

export const Swatch = forwardRef<HTMLButtonElement, SwatchProps>(
  (
    {
      label,
      colorHex,
      selected = false,
      onSelect,
      size = "sm",
      showLabel = true,
      disabled = false,
      isSoldOut = false,
    },
    ref,
  ) => {
    const isDisabled = disabled || isSoldOut;
    const handleClick = () => {
      if (isDisabled) return;
      onSelect?.();
    };
    const baseClasses = selected
      ? "border-white/80 bg-white/20 text-white shadow-[0_0_0_4px_rgba(255,255,255,0.08)] ring-2 ring-white/80"
      : "border-white/20 bg-white/5 text-white/80 hover:border-white/40";
    const disabledClasses = isDisabled ? "cursor-not-allowed opacity-60 ring-0 hover:border-white/20" : "";
    const accessibleLabel = isDisabled ? `${label} (sold out)` : label;

    return (
      <SoldOutTooltipWrapper isSoldOut={isDisabled} className="inline-flex">
        <motion.button
          ref={ref}
          type="button"
          aria-pressed={selected}
          aria-label={accessibleLabel}
          aria-disabled={isDisabled}
          disabled={isDisabled}
          onClick={handleClick}
          className={`relative inline-flex items-center gap-2 rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${sizeClasses[size]} ${baseClasses} ${disabledClasses}`.trim()}
          whileHover={isDisabled ? undefined : { transform: "translateY(-1px)" }}
          whileTap={isDisabled ? undefined : { scale: 0.97 }}
        >
          <span className="relative flex items-center justify-center">
            <span
              aria-hidden
              className={`${dotSizes[size]} rounded-full border border-white/30 shadow-[0_0_0_3px_rgba(255,255,255,0.05)] ${isDisabled ? "opacity-60" : ""}`}
              style={{ backgroundColor: colorHex ?? "#e5e7eb" }}
            />
            {isDisabled ? (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <svg
                  className="h-3/4 w-3/4"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <line
                    x1="5"
                    y1="5"
                    x2="19"
                    y2="19"
                    className="stroke-red-400/80"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="19"
                    y1="5"
                    x2="5"
                    y2="19"
                    className="stroke-red-400/80"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            ) : null}
          </span>
          {showLabel && (
            <span className="whitespace-nowrap text-[13px] font-medium leading-none">
              {label}
            </span>
          )}
        </motion.button>
      </SoldOutTooltipWrapper>
    );
  },
);

Swatch.displayName = "Swatch";
