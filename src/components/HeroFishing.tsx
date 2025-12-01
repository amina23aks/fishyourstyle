import Image from "next/image";
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

export default function HeroFishing() {
  const illustrationRef = useRef<HTMLDivElement>(null);
  const leftEyeRef = useRef<HTMLImageElement>(null);
  const rightEyeRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const wrapper = illustrationRef.current;
      if (!wrapper || !leftEyeRef.current || !rightEyeRef.current) return;

      const rect = wrapper.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      const moveX = Math.max(Math.min(x * 12, 12), -12);
      const moveY = Math.max(Math.min(y * 8, 8), -8);

      leftEyeRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`;
      rightEyeRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`;
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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_30%,rgba(255,255,255,0.1))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_90%,rgba(56,189,248,0.16),transparent_40%)]" />

          <div className="float-slow relative h-full w-full">
            <Image
              src="/hero/cat_base.png"
              alt="Cat on a wooden boat"
              fill
              priority
              className="object-contain drop-shadow-[0_14px_32px_rgba(0,0,0,0.4)]"
            />

            <Image
              src="/hero/rod.png"
              alt="Fishing rod"
              fill
              className="absolute inset-0 object-contain animate-rod-swing"
              priority
            />

            <Image
              src="/hero/hook_glow.png"
              alt="Hook glow"
              width={180}
              height={180}
              className="pointer-events-none absolute -left-6 bottom-10 animate-pulse opacity-90"
            />

            <Image
              ref={leftEyeRef}
              src="/hero/eye_left.png"
              alt="Left eye"
              width={72}
              height={72}
              className="absolute left-[320px] top-[200px] transition-transform duration-150 ease-out will-change-transform"
            />

            <Image
              ref={rightEyeRef}
              src="/hero/eye_right.png"
              alt="Right eye"
              width={72}
              height={72}
              className="absolute left-[410px] top-[200px] transition-transform duration-150 ease-out will-change-transform"
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-sky-950/50 via-sky-900/20 to-transparent" />
          </div>
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