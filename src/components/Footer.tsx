import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 text-sky-50 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md space-y-3">
          <p className="text-sm uppercase tracking-[0.28em] text-sky-200">
            Fish Your Style
          </p>
          <h2 className="text-2xl font-semibold text-white">
            Sea-inspired streetwear for explorers.
          </h2>
          <p className="text-sky-200">
            Built with Next.js, Tailwind, and a splash of ocean magic. More
            sections are coming as we wire up products, cart, and admin.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm md:grid-cols-3">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Navigate</h3>
            <ul className="space-y-2 text-sky-200">
              <li>
                <Link href="/shop" className="hover:text-white">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-white">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="/custom" className="hover:text-white">
                  Custom orders
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Support</h3>
            <ul className="space-y-2 text-sky-200">
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white">
                  Shipping & returns
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Follow</h3>
            <ul className="space-y-2 text-sky-200">
              <li>Instagram</li>
              <li>TikTok</li>
              <li>Behance</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-sky-800 bg-sky-900/20 py-4 text-center text-xs text-sky-200">
        © 2024 Fish Your Style — Crafted for the ocean-loving community.
      </div>
    </footer>
  );
}
