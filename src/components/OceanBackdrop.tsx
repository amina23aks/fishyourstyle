"use client";

export default function OceanBackdrop() {
  const bubbles = [
    { size: 14, left: "4%", delay: "0s", duration: "22s" },
    { size: 10, left: "12%", delay: "3s", duration: "24s" },
    { size: 16, left: "20%", delay: "6s", duration: "26s" },
    { size: 12, left: "28%", delay: "9s", duration: "23s" },
    { size: 9, left: "36%", delay: "4s", duration: "22s" },
    { size: 13, left: "44%", delay: "8s", duration: "25s" },
    { size: 11, left: "52%", delay: "2s", duration: "24s" },
    { size: 15, left: "60%", delay: "7s", duration: "27s" },
    { size: 10, left: "68%", delay: "1s", duration: "22s" },
    { size: 12, left: "76%", delay: "5s", duration: "24s" },
    { size: 14, left: "84%", delay: "11s", duration: "26s" },
    { size: 11, left: "92%", delay: "13s", duration: "25s" },
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
