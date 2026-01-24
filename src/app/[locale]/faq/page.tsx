import type { Metadata } from "next";
import FAQAccordion, { type FAQItem } from "@/components/FAQAccordion";

export const metadata: Metadata = {
  title: "الأسئلة المتكررة | Fish Your Style",
  description:
    "إجابات عن أكثر الأسئلة شيوعًا حول الطلبات، الشحن، والدفع عند الاستلام.",
};

const faqItems: FAQItem[] = [
  {
    question: "كيف أقدّم طلب من متجر Fish Your Style؟",
    answer:
      "اختَر المنتج الذي يعجبك، حدّد اللون والمقاس، ثم أضفه إلى سلة المشتريات. بعد ذلك انتقل إلى صفحة إنهاء الطلب، املأ بياناتك (الاسم، رقم الهاتف، العنوان)، وسنقوم بتأكيد طلبك معك عبر الهاتف أو واتساب قبل الشحن.",
  },
  {
    question: "ما هي طريقة الدفع المتاحة؟",
    answer:
      "الدفع حاليًا يتم عند الاستلام (Cash On Delivery) داخل الجزائر. تقوم بدفع ثمن الطلب ورسوم التوصيل مباشرة لمندوب التوصيل عند استلامك للطلب.",
  },
  {
    question: "كم يستغرق وقت التوصيل؟",
    answer:
      "مدة التوصيل تختلف حسب الولاية، لكنها غالبًا بين 2 إلى 5 أيام عمل بعد تأكيد الطلب. في بعض الولايات البعيدة قد تزيد المدة يومًا أو يومين.",
  },
  {
    question: "هل يمكنني تغيير المقاس أو اللون بعد تأكيد الطلب؟",
    answer:
      "إذا اكتشفت أنك اخترت مقاسًا أو لونًا غير مناسب، يرجى التواصل معنا في أسرع وقت عبر واتساب أو رسالة على الصفحة قبل شحن الطلب، وسنحاول تعديل الطلب إن أمكن.",
  },
  {
    question: "هل يمكنني استرجاع أو استبدال المنتج؟",
    answer:
      "نقبل الاستبدال أو الاسترجاع خلال فترة محددة إذا كان المنتج غير مستخدم وفي حالته الأصلية مع الكرتونة والملصقات. قد تُطبق بعض الشروط حسب نوع المنتج والولاية.",
  },
  {
    question: "هل الأسعار تشمل رسوم التوصيل؟",
    answer:
      "أسعار المنتجات لا تشمل رسوم التوصيل. يتم احتساب تكلفة الشحن حسب الولاية وشركة التوصيل وتُضاف إلى المبلغ الإجمالي عند تأكيد الطلب.",
  },
];

export default function FAQPage() {
  return (
    <section className="bg-gradient-to-b from-sky-50 via-sky-100/60 to-white px-4 py-16 sm:py-20">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            الأسئلة المتكررة
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            هنا تجد إجابات عن أكثر الأسئلة شيوعًا قبل إتمام طلبك.
          </p>
        </header>
        <FAQAccordion items={faqItems} />
      </div>
    </section>
  );
}
