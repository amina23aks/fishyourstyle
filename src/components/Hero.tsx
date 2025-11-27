import Link from "next/link";

const featureHighlights = [
  "بحر يغمق تدريجيًا مع التمرير",
  "قارب + قط = هوية العلامة",
  "جاهز لتوصيل المنتجات و3D لاحقًا",
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-sky-100 via-sky-200 to-sky-500 shadow-xl shadow-sky-100/60">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.45),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.38),transparent_30%),radial-gradient(circle_at_50%_60%,rgba(255,255,255,0.3),transparent_30%)]" />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-2 md:px-10 lg:px-14">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.28em] text-sky-700">
            Fish Your Style amina
          </p>
          <h1 className="text-4xl font-semibold text-slate-900 md:text-5xl">
            Luxury sea-inspired streetwear for the modern explorer hhhhhh .
          </h1>
          <p className="max-w-xl text-lg text-slate-700">
            We are starting with the essentials: structure, navigation, and a
            hero that sets the ocean mood. The shop, cart, and admin flows will
            plug into this shell step by step.hhh
          </p>

          <div className="flex flex-col gap-3 text-sm text-sky-900 sm:flex-row sm:flex-wrap sm:items-center">
            {featureHighlights.map((item) => (
              <span
                key={item}
                className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 shadow-sm shadow-sky-200 backdrop-blur"
              >
                <span className="text-lg">🌊</span>
                {item}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            <Link
              href="/shop"
              className="rounded-full bg-sky-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 hover:shadow-sky-300"
            >
              Shop the collection
            </Link>
            <Link
              href="/collections"
              className="rounded-full border border-sky-200 bg-white/70 px-5 py-3 text-sm font-semibold text-sky-900 shadow-sm shadow-sky-200 transition hover:-translate-y-0.5"
            >
              Browse categories
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-10 -right-10 bottom-6 h-6 rounded-full bg-sky-900/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/70 p-6 shadow-2xl shadow-sky-200/70 backdrop-blur">
            <div className="float-slow rounded-3xl bg-gradient-to-b from-sky-200/70 via-sky-300/60 to-sky-500/60 p-6 text-center shadow-inner shadow-sky-100">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-800">
                Hero Preview
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-900">
                Boat + Cat + Deep Sea
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Visual assets plug in here. Add your 3D model, Cloudinary hero,
                or illustration when ready.
              </p>
              <div className="mt-6 grid gap-3 text-left text-sm text-slate-800">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 shadow-sm shadow-sky-200">
                  <span className="text-base">🎣</span> Floating boat + cat placeholder
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 shadow-sm shadow-sky-200">
                  <span className="text-base">💧</span> Gradient from sky to deep sea
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 shadow-sm shadow-sky-200">
                  <span className="text-base">✨</span> Ready for parallax/3D drop-in
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
