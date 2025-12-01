"use client";

import { useMemo } from "react";

const bubbleCount = 36;

export default function OceanBackdrop() {
  const bubbles = useMemo(
    () =>
      Array.from({ length: bubbleCount }, (_, index) => {
        const size = 4 + Math.random() * 10;
        const left = Math.random() * 100;
        const duration = 18 + Math.random() * 20;
        const delay = -Math.random() * 22;

        return {
          id: index,
          size,
          left,
          duration,
          delay,
        };
      }),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 h-full min-h-screen overflow-hidden" aria-hidden>
      <div className="absolute inset-0 ocean-bg" />

      <div className="absolute inset-0"> 
        {bubbles.map((bubble) => (
          <span
            key={bubble.id}
            className="bubble"
            style={{
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              left: `${bubble.left}%`,
              bottom: "-24vh",
              animationDuration: `${bubble.duration}s`,
              animationDelay: `${bubble.delay}s`,
              boxShadow: `0 0 ${bubble.size * 3}px rgba(255,255,255,0.6)`,
            }}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 via-slate-900/40 to-transparent" />
    </div>
  );
}
