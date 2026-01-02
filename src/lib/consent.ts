const CONSENT_KEY = "fishyourstyle_cookie_consent_v1";
const CONSENT_EVENT = "fishyourstyle:cookie-consent-accepted";

export const hasAnalyticsConsent = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CONSENT_KEY) === "accepted";
};

export const onConsentGranted = (cb: () => void): (() => void) => {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(CONSENT_EVENT, handler);
  return () => {
    window.removeEventListener(CONSENT_EVENT, handler);
  };
};
