type SoldOutTooltipProps = {
  show: boolean;
  message?: string;
  className?: string;
};

export function SoldOutTooltip({ show, message = "Out of stock", className = "" }: SoldOutTooltipProps) {
  return (
    <div
      className={`pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center transition-all duration-150 ${
        show ? "opacity-100 scale-100" : "opacity-0 scale-95"
      } ${className}`}
      style={{ top: "-6px" }}
      role="tooltip"
      aria-hidden={!show}
    >
      <div className="whitespace-nowrap rounded-md bg-[rgba(255,0,0,0.12)] px-2.5 py-1 text-xs font-semibold leading-none text-rose-100 shadow-sm ring-1 ring-red-400/20 backdrop-blur-[1px]">
        {message}
      </div>
      <div className="h-2 w-2 -mt-[2px] rotate-45 bg-[rgba(255,0,0,0.12)] ring-1 ring-red-400/20" />
    </div>
  );
}
