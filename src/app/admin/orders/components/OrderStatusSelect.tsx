import { statusStyles, STATUS_OPTIONS } from "../statusConfig";
import type { OrderStatus } from "@/types/order";

export function OrderStatusSelect({
  value,
  onChange,
  disabled,
  label,
}: {
  value: OrderStatus;
  onChange: (status: OrderStatus) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div
      className={`inline-flex w-full min-w-[140px] max-w-[180px] ${label ? "flex-col gap-1" : "items-center"}`}
      onClick={(event) => event.stopPropagation()}
    >
      {label ? <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-100/70">{label}</span> : null}
      <div className="relative flex w-full items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-[7px] shadow-inner shadow-sky-900/40 focus-within:border-white/35 focus-within:ring-2 focus-within:ring-white/25">
        <span className={`h-1.5 w-1.5 rounded-full ${statusStyles[value].dotClass}`} aria-hidden />
        <select
          value={value}
          aria-label="Update order status"
          onChange={(event) => onChange(event.target.value as OrderStatus)}
          disabled={disabled}
          className="w-full appearance-none rounded-lg bg-transparent px-1.5 py-1 text-[13px] font-semibold text-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status} className="bg-slate-900 text-slate-100">
              {statusStyles[status].label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-sky-100/70" aria-hidden>
          ⌄
        </span>
      </div>
    </div>
  );
}
