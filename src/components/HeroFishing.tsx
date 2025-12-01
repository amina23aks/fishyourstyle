import Image from "next/image";
import Link from "next/link";

export default function HeroFishing() {
  const heroBubbles = [
    { size: 12, left: "44%", delay: "0s", duration: "9s" },
    { size: 10, left: "48%", delay: "1.2s", duration: "10s" },
    { size: 14, left: "52%", delay: "2.4s", duration: "11s" },
    { size: 9, left: "57%", delay: "3s", duration: "8s" },
    { size: 8, left: "61%", delay: "0.8s", duration: "9.5s" },
    { size: 7, left: "39%", delay: "2.8s", duration: "8.5s" },
    { size: 11, left: "55%", delay: "4s", duration: "10.5s" },
  ];

  const lightColumns = [
    { left: "30%", width: "8%", delay: "0s" },
    { left: "48%", width: "6%", delay: "3s" },
    { left: "62%", width: "10%", delay: "1.4s" },
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-x-[-6%] top-6 h-64 light-rays" />

        <div className="absolute inset-x-[-8%] top-[46%] h-28 opacity-85">
          <svg
            className="absolute bottom-[-2px] left-0 w-[200%] animate-wave origin-bottom scale-y-[0.45]"
            viewBox="0 0 1440 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="url(#waveGradient1)"
              d="M0,228C80,222 160,212 240,214C320,216 400,230 480,232C560,234 640,226 720,220C800,214 880,212 960,220C1040,228 1120,240 1200,244C1280,248 1360,242 1440,236V320H0Z"
            />
            <defs>
              <linearGradient id="waveGradient1" x1="0" x2="0" y1="0" y2="1">
                <stop stopColor="#8bd3ff" stopOpacity="0.88" />
                <stop offset="1" stopColor="#3f92e2" stopOpacity="0.72" />
              </linearGradient>
            </defs>
          </svg>
          <svg
            className="absolute bottom-0 left-0 w-[200%] animate-wave-slower origin-bottom scale-y-[0.42]"
            viewBox="0 0 1440 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="url(#waveGradient2)"
              d="M0,234C96,226 192,216 288,220C384,224 480,240 576,242C672,244 768,232 864,224C960,216 1056,214 1152,222C1248,230 1344,246 1440,250V320H0Z"
            />
            <defs>
              <linearGradient id="waveGradient2" x1="0" x2="0" y1="0" y2="1">
                <stop stopColor="#66b2f2" stopOpacity="0.85" />
                <stop offset="1" stopColor="#2c6fb9" stopOpacity="0.75" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="absolute inset-x-0 top-[48%] bottom-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-sky-200/10 to-transparent" />

          {lightColumns.map((beam, index) => (
            <div
              key={index}
              className="light-column absolute inset-y-6 rounded-full"
              style={{
                left: beam.left,
                width: beam.width,
                animationDelay: beam.delay,
              }}
            />
          ))}

          <div className="absolute left-[54%] top-12 h-64 w-64 -translate-x-1/2 rounded-full underwater-vortex" />

          <div className="pointer-events-none absolute inset-x-6 bottom-0 top-[10%]">
            {heroBubbles.map((bubble, index) => (
              <span
                key={index}
                className="hero-bubble"
                style={{
                  width: `${bubble.size}px`,
                  height: `${bubble.size}px`,
                  left: bubble.left,
                  animationDelay: bubble.delay,
                  animationDuration: bubble.duration,
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="relative px-6 pb-24 pt-16 sm:px-10 lg:min-h-[80vh] lg:px-16">
        <div className="relative flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <div className="relative order-2 w-full space-y-5 text-left text-white lg:order-1 lg:max-w-xl lg:space-y-6">
            <p className="text-xs uppercase tracking-[0.32em] text-sky-100">Premium drop</p>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">Fish Your Style</h1>
            <p className="text-lg text-sky-50/90">
              Luxury streetwear inspired by the deep sea. Glide over the waves with a playful mascot who tracks your moves.
            </p>
            <div className="flex flex-wrap justify-start gap-4 pt-4">
              <Link
                href="/shop"
                className="rounded-full bg-white/20 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/30"
              >
                Shop Now
              </Link>
              <Link
                href="/custom"
                className="rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white/90 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Custom Hoodie
              </Link>
            </div>
          </div>
          <div className="relative order-1 aspect-[16/9] w-full max-w-2xl lg:order-2 lg:max-w-[640px]">
            <div className="absolute inset-0 float-slow">
              <Image
                src="/hero/cat.png"
                alt="Cat on a wooden boat"
                fill
                priority
                className="object-contain drop-shadow-[0_14px_32px_rgba(0,0,0,0.4)]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
