import type { ShippingMode, WilayaShipping } from "@/data/shipping";

type DeliveryModeCardsProps = {
  value: ShippingMode;
  quote?: WilayaShipping;
  onChange: (mode: ShippingMode) => void;
  homeLabel: string;
  homeDescription: string;
  deskLabel: string;
  deskDescription: string;
};

const formatShippingPrice = (price: number) =>
  `${new Intl.NumberFormat("fr-DZ").format(price)} DZD`;

export default function DeliveryModeCards({
  value,
  quote,
  onChange,
  homeLabel,
  homeDescription,
  deskLabel,
  deskDescription,
}: DeliveryModeCardsProps) {
  const modes = [
    { mode: "home" as const, label: homeLabel, description: homeDescription, price: quote?.home },
    { mode: "desk" as const, label: deskLabel, description: deskDescription, price: quote?.desk },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {modes.map(({ mode, label, description, price }) => {
        const selected = value === mode;

        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            aria-pressed={selected}
            className={`flex min-w-0 items-start gap-2 rounded-xl border p-3 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300/80 ${
              selected
                ? "border-lime-300 bg-lime-300/10 text-white"
                : "border-white/20 bg-slate-950/60 text-white hover:border-white/40"
            }`}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
                selected ? "border-lime-300" : "border-white/50"
              }`}
            >
              {selected ? <span className="size-2 rounded-full bg-lime-300" /> : null}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
              <span className="mt-0.5 text-[11px] leading-4 text-sky-100/75">{description}</span>
              {price != null ? (
                <span className="mt-1 text-xs font-bold text-lime-200">
                  {formatShippingPrice(price)}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
