"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const particles = [
  { id: 0, left: "12%", size: 8, delay: 0, duration: 8 },
  { id: 1, left: "22%", size: 10, delay: 1.2, duration: 9.5 },
  { id: 2, left: "34%", size: 6, delay: 2.4, duration: 7.5 },
  { id: 3, left: "46%", size: 12, delay: 0.8, duration: 10 },
  { id: 4, left: "58%", size: 7, delay: 3.2, duration: 8.5 },
  { id: 5, left: "66%", size: 9, delay: 1.8, duration: 9 },
  { id: 6, left: "74%", size: 5, delay: 2.1, duration: 7.8 },
  { id: 7, left: "82%", size: 11, delay: 0.6, duration: 8.8 },
  { id: 8, left: "8%", size: 6, delay: 4.2, duration: 8 },
  { id: 9, left: "28%", size: 7, delay: 5, duration: 7.2 },
  { id: 10, left: "52%", size: 5, delay: 4.6, duration: 8.4 },
  { id: 11, left: "70%", size: 9, delay: 5.4, duration: 9.6 },
  { id: 12, left: "90%", size: 6, delay: 3.8, duration: 8.2 },
];

const LEFT_EYE_ORIGIN = { x: 358, y: 168 };
const RIGHT_EYE_ORIGIN = { x: 404, y: 175 };

export default function HeroFishing() {
  const illustrationRef = useRef<HTMLDivElement>(null);
  const leftEyeRef = useRef<SVGGElement>(null);
  const rightEyeRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const wrapper = illustrationRef.current;
      const leftEye = leftEyeRef.current;
      const rightEye = rightEyeRef.current;

      if (!wrapper || !leftEye || !rightEye) return;

      const rect = wrapper.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      const moveX = Math.max(Math.min(x * 12, 12), -12);
      const moveY = Math.max(Math.min(y * 8, 8), -8);

      leftEye.setAttribute(
        "transform",
        `translate(${LEFT_EYE_ORIGIN.x + moveX} ${LEFT_EYE_ORIGIN.y + moveY})`,
      );
      rightEye.setAttribute(
        "transform",
        `translate(${RIGHT_EYE_ORIGIN.x + moveX} ${RIGHT_EYE_ORIGIN.y + moveY})`,
      );
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-sky-200 via-sky-600 to-sky-950 shadow-2xl shadow-sky-900/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.4),transparent_36%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.32),transparent_32%),radial-gradient(circle_at_50%_60%,rgba(255,255,255,0.2),transparent_34%)]" />
      <div className="absolute inset-0 opacity-60 mix-blend-screen" aria-hidden>
        {particles.map((bubble) => (
          <span
            key={bubble.id}
            className="bubble"
            style={{
              left: bubble.left,
              width: bubble.size,
              height: bubble.size,
              animationDelay: `${bubble.delay}s`,
              animationDuration: `${bubble.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-2 md:px-10 lg:px-14">
        <div
          ref={illustrationRef}
          className="relative h-[420px] overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100/30 via-sky-300/10 to-sky-900/30 backdrop-blur"
        >
          <svg
            viewBox="0 0 760 480"
            role="presentation"
            className="float-slow relative h-full w-full text-white drop-shadow-[0_14px_32px_rgba(0,0,0,0.4)]"
          >
            <defs>
              <linearGradient id="sky-ocean" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.72" />
                <stop offset="40%" stopColor="#0ea5e9" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="boat" x1="0%" x2="100%" y1="0%" y2="80%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="water-line" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.28" />
              </linearGradient>
              <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="12" result="colored" />
                <feMerge>
                  <feMergeNode in="colored" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect width="760" height="480" fill="url(#sky-ocean)" />
            <circle cx="140" cy="96" r="68" fill="#ffffff" opacity="0.18" />
            <circle cx="170" cy="110" r="48" fill="#bae6fd" opacity="0.12" />
            <rect
              x="0"
              y="308"
              width="760"
              height="200"
              fill="url(#water-line)"
              opacity="0.7"
            />
            <rect x="-20" y="330" width="800" height="160" fill="#020617" opacity="0.35" />

            <g filter="url(#glow)">
              <circle cx="92" cy="340" r="70" fill="#38bdf8" opacity="0.32" />
              <circle cx="630" cy="60" r="50" fill="#38bdf8" opacity="0.14" />
            </g>

            <g className="animate-rod-swing" style={{ transformOrigin: "420px 140px" }}>
              <path
                d="M420 140 C460 130 520 120 600 170"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="6"
                strokeLinecap="round"
                strokeOpacity="0.82"
              />
              <path
                d="M600 170 Q616 200 608 232"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="608" cy="236" r="12" fill="#38bdf8" opacity="0.6" filter="url(#glow)" />
              <circle cx="608" cy="236" r="6" fill="#e0f2fe" />
            </g>

            <g>
              <path
                d="M160 320 C230 352 330 370 420 372 C520 374 620 352 670 330 L610 354 C530 386 320 392 200 358 Z"
                fill="url(#boat)"
                stroke="#92400e"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M230 314 C330 336 480 338 560 316"
                stroke="#fef3c7"
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.7"
              />
              <path
                d="M250 300 C330 320 460 320 540 300"
                stroke="#f8fafc"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.3"
              />
            </g>

            <g>
              <ellipse cx="380" cy="270" rx="74" ry="64" fill="#1f2937" opacity="0.4" />
              <ellipse cx="380" cy="270" rx="66" ry="54" fill="#0ea5e9" opacity="0.12" />
            </g>

            <g>
              <circle cx="382" cy="224" r="66" fill="#0f172a" />
              <circle cx="382" cy="172" r="54" fill="#111827" />
              <circle cx="382" cy="168" r="52" fill="#0b1224" />
              <polygon points="336,152 360,120 360,160" fill="#0b1224" />
              <polygon points="426,160 404,122 404,166" fill="#0b1224" />
              <path
                d="M336 212 C346 220 358 224 370 222"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.7"
              />
              <path
                d="M396 224 C410 220 426 214 432 204"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.7"
              />
              <circle cx="380" cy="245" r="22" fill="#0ea5e9" opacity="0.32" />
              <circle cx="380" cy="245" r="10" fill="#38bdf8" opacity="0.64" />
              <rect x="360" y="210" width="44" height="26" rx="10" fill="#0ea5e9" opacity="0.25" />
              <rect x="366" y="214" width="32" height="16" rx="8" fill="#e0f2fe" opacity="0.18" />
            </g>

            <g>
              <circle cx="358" cy="168" r="26" fill="#f8fafc" />
              <circle cx="404" cy="175" r="26" fill="#f8fafc" />
            </g>

            <g ref={leftEyeRef} transform={`translate(${LEFT_EYE_ORIGIN.x} ${LEFT_EYE_ORIGIN.y})`}>
              <circle r="15" fill="#38bdf8" />
              <circle r="7" fill="#0f172a" />
              <circle cx="-3" cy="-3" r="3" fill="#e0f2fe" />
            </g>
            <g ref={rightEyeRef} transform={`translate(${RIGHT_EYE_ORIGIN.x} ${RIGHT_EYE_ORIGIN.y})`}>
              <circle r="15" fill="#38bdf8" />
              <circle r="7" fill="#0f172a" />
              <circle cx="-3" cy="-3" r="3" fill="#e0f2fe" />
            </g>

            <path
              d="M342 186 C350 194 358 196 370 186"
              stroke="#e0f2fe"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.7"
            />
            <circle cx="382" cy="190" r="3" fill="#cbd5e1" />

            <g opacity="0.75">
              <path
                d="M120 356 Q240 332 360 352 T600 358"
                fill="none"
                stroke="#bae6fd"
                strokeWidth="5"
                strokeLinecap="round"
                strokeOpacity="0.6"
              />
              <path
                d="M90 380 Q200 360 320 380 T590 380"
                fill="none"
                stroke="#7dd3fc"
                strokeWidth="4"
                strokeLinecap="round"
                strokeOpacity="0.4"
              />
            </g>
          </svg>
        </div>

        <div className="relative z-10 space-y-5 text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
          <p className="text-xs uppercase tracking-[0.32em] text-sky-200">Premium drop</p>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">Fish Your Style</h1>
          <p className="text-lg text-sky-100/90">
            Luxury streetwear inspired by the deep sea. A cat, a boat, and a glowing hook that follows your cursor with playful eyes.
          </p>
          <div className="flex flex-wrap gap-3 pt-2 text-sm text-sky-100">
            <span className="rounded-full bg-white/15 px-4 py-2 backdrop-blur">Sky → ocean gradient</span>
            <span className="rounded-full bg-white/15 px-4 py-2 backdrop-blur">Floating boat + rod swing</span>
            <span className="rounded-full bg-white/15 px-4 py-2 backdrop-blur">Mouse-tracking eyes</span>
          </div>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href="/shop"
              className="rounded-xl bg-white/20 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/30"
            >
              Shop Now
            </Link>
            <Link
              href="/custom"
              className="rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white/90 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              Custom Hoodie
            </Link>
          </div>
        </div>
      </div>

      <div className="relative h-28 bg-gradient-to-b from-transparent via-sky-950/40 to-[#020617]/90" />
    </section>
  );
}
