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
    <div className="flex flex-col gap-1" onClick={(event) => event.stopPropagation()}>
      {label ? <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-100/70">{label}</span> : null}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${statusStyles[value].className}`}>
          <span className={`h-2 w-2 rounded-full ${statusStyles[value].dotClass}`} aria-hidden />
          {statusStyles[value].label}
        </span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as OrderStatus)}
          disabled={disabled}
          className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white shadow-inner shadow-sky-900/40 transition hover:bg-white/15 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status} className="bg-slate-900 text-slate-100">
              {statusStyles[status].label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
