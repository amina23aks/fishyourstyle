"use client";

import { useState } from "react";

export type FAQItem = {
  question: string;
  answer: string;
};

type FAQAccordionProps = {
  items: FAQItem[];
};

export default function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div key={item.question} className="rounded-2xl bg-white/90 shadow">
            <button
              type="button"
              onClick={() => handleToggle(index)}
              className="flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-right text-sm font-semibold text-slate-900 sm:text-base"
              aria-expanded={isOpen}
            >
              <span>{item.question}</span>
              <span className="text-xl text-slate-600">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen ? (
              <div className="rounded-b-2xl border-t border-slate-100 bg-slate-50 px-4 pb-4 text-sm text-slate-700">
                {item.answer}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
