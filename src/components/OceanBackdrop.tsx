"use client";

export default function OceanBackdrop() {
  const bubbles = [
    { size: 10, left: "6%", delay: "0s", duration: "24s" },
    { size: 14, left: "18%", delay: "4s", duration: "26s" },
    { size: 9, left: "26%", delay: "2s", duration: "22s" },
    { size: 12, left: "34%", delay: "7s", duration: "28s" },
    { size: 16, left: "44%", delay: "1.5s", duration: "30s" },
    { size: 11, left: "52%", delay: "6s", duration: "25s" },
    { size: 13, left: "63%", delay: "3.5s", duration: "27s" },
    { size: 9, left: "71%", delay: "5s", duration: "23s" },
    { size: 15, left: "83%", delay: "0.8s", duration: "29s" },
    { size: 10, left: "92%", delay: "6.5s", duration: "24s" },
    { size: 12, left: "13%", delay: "8s", duration: "28s" },
    { size: 8, left: "57%", delay: "9s", duration: "24s" },
    { size: 14, left: "76%", delay: "10s", duration: "32s" },
    { size: 11, left: "4%", delay: "11s", duration: "30s" },
    { size: 9, left: "29%", delay: "12s", duration: "26s" },
    { size: 12, left: "48%", delay: "13s", duration: "28s" },
    { size: 10, left: "68%", delay: "14s", duration: "25s" },
    { size: 13, left: "87%", delay: "15s", duration: "31s" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 h-full min-h-screen overflow-hidden" aria-hidden>
      <div className="absolute inset-0 ocean-bg" />

      {/* Preserve the original soft ocean glow */}
      <div className="absolute inset-0 bg-[radial-gradient(180%_48%_at_50%_0%,rgba(255,255,255,0.24),transparent_54%)] mix-blend-soft-light opacity-60" />

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
