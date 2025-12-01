"use client";

export default function OceanBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 h-full min-h-screen overflow-hidden" aria-hidden>
      <div className="absolute inset-0 ocean-bg" />

      <div className="absolute inset-0 bg-[radial-gradient(180%_48%_at_50%_0%,rgba(255,255,255,0.24),transparent_54%)] mix-blend-soft-light opacity-60" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#020617] via-[#020617]/70 to-transparent" />
    </div>
  );
}
