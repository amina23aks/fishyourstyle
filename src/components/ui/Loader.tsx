import type { CSSProperties } from "react";

type LoaderProps = {
  size?: number;
  className?: string;
  label?: string;
};

export default function Loader({ size = 22, className, label = "Loading" }: LoaderProps) {
  const style = { "--loader-size": `${size}px` } as CSSProperties;

  return (
    <span
      role="status"
      aria-label={label}
      className={`wave-loader inline-block ${className ?? ""}`.trim()}
      style={style}
    />
  );
}
