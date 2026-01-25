import type { Metadata } from "next";
import FAQAccordion from "@/components/FAQAccordion";
import PageShell from "@/components/PageShell";
import { faqItems } from "@/data/faqItems";

export const metadata: Metadata = {
  title: "الأسئلة المتكررة | Fish Your Style",
  description:
    "إجابات عن أكثر الأسئلة شيوعًا حول الطلبات، الشحن، والدفع عند الاستلام.",
};

export default function FAQPage() {
  return (
    <PageShell>
      <section className="flex w-full flex-col gap-10 rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-lg shadow-black/30 sm:p-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">
            الأسئلة المتكررة
          </h1>
          <p className="mt-3 text-sm text-sky-100 sm:text-base">
            هنا تجد إجابات عن أكثر الأسئلة شيوعًا قبل إتمام طلبك.
          </p>
        </header>
        <FAQAccordion items={faqItems} />
      </section>
    </PageShell>
  );
}
