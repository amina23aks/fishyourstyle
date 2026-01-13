"use client";

import { useCustomCursor } from "@/hooks/use-custom-cursor";

type CustomCursorProps = {
  enabled?: boolean;
};

export default function CustomCursor({ enabled = true }: CustomCursorProps) {
  useCustomCursor(enabled);
  return null;
}
