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
    <div className="flex w-full min-w-[170px] max-w-[200px] flex-col gap-1" onClick={(event) => event.stopPropagation()}>
      {label ? <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-100/70">{label}</span> : null}
      <div className="relative flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 shadow-inner shadow-sky-900/40 focus-within:border-white/40 focus-within:ring-2 focus-within:ring-white/30">
        <span className={`h-2 w-2 rounded-full ${statusStyles[value].dotClass}`} aria-hidden />
        <select
          value={value}
          aria-label="Update order status"
          onChange={(event) => onChange(event.target.value as OrderStatus)}
          disabled={disabled}
          className="w-full appearance-none rounded-xl bg-transparent px-2 py-1 text-sm font-semibold text-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status} className="bg-slate-900 text-slate-100">
              {statusStyles[status].label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sky-100/70" aria-hidden>
          ⌄
        </span>
      </div>
    </div>
  );
}
