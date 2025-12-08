import { statusStyles } from "../statusConfig";
import type { OrderStatus } from "@/types/order";

export function StatusBadge({ status }: { status: OrderStatus }) {
  const style = statusStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${style.className}`}
    >
      <span className={`h-2 w-2 rounded-full ${style.dotClass}`} aria-hidden />
      {style.label}
    </span>
  );
}
