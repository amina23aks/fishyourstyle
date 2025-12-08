"use client";

export default function OceanBackdrop() {
  const bubbles = [
    { size: 14, left: "8%", delay: "0s", duration: "16s" },
    { size: 11, left: "26%", delay: "4s", duration: "18s" },
    { size: 16, left: "44%", delay: "2s", duration: "20s" },
    { size: 12, left: "62%", delay: "6s", duration: "17s" },
    { size: 10, left: "78%", delay: "1s", duration: "19s" },
    { size: 13, left: "92%", delay: "8s", duration: "18s" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 h-full min-h-screen overflow-hidden" aria-hidden>
      <div className="absolute inset-0 ocean-bg" />

      {/* Preserve the original soft ocean glow */}
      <div className="absolute inset-0 bg-[radial-gradient(180%_48%_at_50%_0%,rgba(255,255,255,0.18),transparent_54%)] mix-blend-soft-light opacity-45" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#020617] via-[#020617]/70 to-transparent" />

      {/* Bubble effect layer (visible across the page height but masked above the wave) */}
      <div className="bubble-field ocean-bubble-mask">
        {bubbles.map((bubble, index) => (
          <span
            key={index}
            style={{
              left: bubble.left,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              animationDelay: bubble.delay,
              animationDuration: bubble.duration,
            }}
          />
        ))}
      </div>
    </div>
  );
}
