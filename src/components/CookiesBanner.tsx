"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const CONSENT_KEY = "fishyourstyle_cookie_consent_v1";
const CONSENT_EVENT = "fishyourstyle:cookie-consent-accepted";

export default function CookiesBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const storedConsent = window.localStorage.getItem(CONSENT_KEY);
    if (!storedConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    window.localStorage.setItem(CONSENT_KEY, "accepted");
    window.dispatchEvent(new Event(CONSENT_EVENT));
    setIsLeaving(true);
    window.setTimeout(() => {
      setIsVisible(false);
      setIsLeaving(false);
    }, 220);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`cookie-banner fixed bottom-4 right-4 z-50 w-full max-w-xs rounded-2xl border border-slate-200/80 bg-white/95 p-3 text-slate-800 shadow-lg shadow-slate-900/10 backdrop-blur ${
        isLeaving ? "cookie-banner-exit" : "cookie-banner-enter"
      }`}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
          <Image
            src="/cookie.png"
            alt="Cookie mascot"
            width={60}
            height={60}
            className="h-12 w-12"
            priority
          />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-slate-900">We use cookies</p>
          <p className="text-xs text-slate-600">
            They help us remember your preferences and improve your experience.
          </p>
          <a
            href="/privacy-policy"
            className="text-[11px] font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
          >
            Learn more
          </a>
        </div>
        <button
          type="button"
          onClick={handleAccept}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          Got it
        </button>
      </div>
      <style jsx>{`
        .cookie-banner-enter {
          animation: cookie-banner-in 200ms ease-out;
        }
        .cookie-banner-exit {
          animation: cookie-banner-out 200ms ease-in forwards;
        }
        @keyframes cookie-banner-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes cookie-banner-out {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(8px);
          }
        }
      `}</style>
    </div>
  );
}
