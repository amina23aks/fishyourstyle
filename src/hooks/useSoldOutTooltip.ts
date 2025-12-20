import { useEffect, useRef, useState } from "react";

export function useSoldOutTooltip(isSoldOut: boolean) {
  const [showTooltip, setShowTooltip] = useState(false);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, []);

  const handlePointerEnter = () => {
    if (!isSoldOut) return;
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setShowTooltip(true);
  };

  const handlePointerLeave = () => {
    if (!isSoldOut) return;
    hideTimer.current = setTimeout(() => setShowTooltip(false), 80);
  };

  const handlePointerDown = () => {
    if (!isSoldOut) return;
    setShowTooltip(true);
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    hideTimer.current = setTimeout(() => setShowTooltip(false), 1200);
  };

  return {
    showTooltip,
    tooltipHandlers: {
      onPointerEnter: handlePointerEnter,
      onPointerLeave: handlePointerLeave,
      onPointerDown: handlePointerDown,
    },
  };
}
