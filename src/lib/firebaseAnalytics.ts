"use client";

import { getFirebaseApp } from "./firebaseClient";
import { getAnalytics, logEvent, isSupported } from "firebase/analytics";

let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;

export async function getAnalyticsInstance() {
  if (typeof window === "undefined") return null;

  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  if (!analyticsInstance) {
    analyticsInstance = getAnalytics(firebaseApp);
  }

  return analyticsInstance;
}

export async function logPageView(page: string) {
  const analytics = await getAnalyticsInstance();
  if (!analytics) return;
  logEvent(analytics, "page_view", { page });
}

export async function logCustomEvent(
  name: string,
  params?: Record<string, unknown>
) {
  const analytics = await getAnalyticsInstance();
  if (!analytics) return;
  logEvent(analytics, name, params);
}
