type SoldOutMarkProps = {
  className?: string;
};

export function SoldOutMark({ className = "" }: SoldOutMarkProps) {
  return (
    <span className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className}`}>
      <span className="block h-[2px] w-[70%] rotate-45 rounded-full bg-[rgba(255,0,0,0.6)]" />
      <span className="block h-[2px] w-[70%] -rotate-45 rounded-full bg-[rgba(255,0,0,0.6)]" />
    </span>
  );
}
