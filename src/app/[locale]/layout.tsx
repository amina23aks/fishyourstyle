import Navbar from "@/components/Navbar";
import Footer from "@/components/layout/Footer";

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-10 flex min-h-screen flex-col overflow-x-hidden pt-20">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
