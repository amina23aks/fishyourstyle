import Image from "next/image";
import Link from "next/link";

export default function HeroFishing() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#bfe3ff] via-[#83c1f2] to-[#0a325a]">
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a325a] via-[#0c4579] to-transparent" aria-hidden />

      <div className="relative px-6 pb-24 pt-16 sm:px-10 lg:px-16">
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
