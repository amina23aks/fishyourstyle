import type { OrderStatus } from "@/types/order";

export const STATUS_FILTER_OPTIONS: ("all" | OrderStatus)[] = [
  "all",
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export const statusStyles: Record<OrderStatus, { label: string; className: string; dotClass: string }> = {
  pending: {
    label: "Pending",
    className: "bg-amber-400/15 text-amber-100 ring-1 ring-amber-300/40",
    dotClass: "bg-amber-300",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-sky-400/15 text-sky-100 ring-1 ring-sky-300/40",
    dotClass: "bg-sky-300",
  },
  shipped: {
    label: "Shipped",
    className: "bg-indigo-400/15 text-indigo-100 ring-1 ring-indigo-300/40",
    dotClass: "bg-indigo-300",
  },
  delivered: {
    label: "Delivered",
    className: "bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-300/40",
    dotClass: "bg-emerald-300",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-rose-400/15 text-rose-100 ring-1 ring-rose-300/40",
    dotClass: "bg-rose-300",
  },
};
