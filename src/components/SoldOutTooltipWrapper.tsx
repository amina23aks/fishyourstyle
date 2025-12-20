import type { ReactNode } from "react";
import { SoldOutTooltip } from "./SoldOutTooltip";
import { useSoldOutTooltip } from "@/hooks/useSoldOutTooltip";

type SoldOutTooltipWrapperProps = {
  isSoldOut: boolean;
  children: ReactNode;
  className?: string;
};

export function SoldOutTooltipWrapper({ isSoldOut, children, className = "" }: SoldOutTooltipWrapperProps) {
  const { showTooltip, tooltipHandlers } = useSoldOutTooltip(isSoldOut);

  return (
    <div className={`relative ${className}`} {...tooltipHandlers}>
      {isSoldOut ? <SoldOutTooltip show={showTooltip} /> : null}
      {children}
    </div>
  );
}
