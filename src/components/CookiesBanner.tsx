"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const CONSENT_KEY = "cookie-consent";

export default function CookiesBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const storedConsent = window.localStorage.getItem(CONSENT_KEY);
    if (!storedConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    window.localStorage.setItem(CONSENT_KEY, "accepted");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white/95 p-4 text-slate-800 shadow-lg shadow-slate-900/10 backdrop-blur">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
          <Image
            src="/cookie.png"
            alt=""
            width={44}
            height={44}
            className="h-11 w-11"
            priority
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">We use cookies</p>
          <p className="text-sm text-slate-600">
            They help us remember your preferences and improve your experience.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAccept}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
