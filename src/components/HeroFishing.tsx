import Image from "next/image";
import Link from "next/link";

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
  return (
    <section className="relative overflow-hidden">
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

      <div className="relative px-6 pb-20 pt-14 sm:px-10 lg:px-16">
        <div className="absolute inset-x-0 bottom-20 h-px bg-gradient-to-r from-transparent via-sky-200/50 to-transparent" aria-hidden />

        <div className="relative flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <div className="relative order-2 w-full space-y-5 text-left text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.32)] lg:order-1 lg:max-w-xl lg:space-y-6">
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
          <div className="relative order-1 w-full max-w-2xl lg:order-2 lg:max-w-[640px] aspect-[16/9]">
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
