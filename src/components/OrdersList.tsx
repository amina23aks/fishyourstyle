"use client";

import Image from "next/image";
import { getCloudinaryDeliveryUrl } from "@/lib/cloudinary";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import type { Order } from "@/types/order";
import { useAuth } from "@/context/auth";
import { useAuthModal } from "@/context/auth-modal";
import { getDb } from "@/lib/firebaseClient";
import { useLocale, useTranslations } from "@/i18n/I18nProvider";
import { localizePathname } from "@/i18n/paths";

function toDateSafe(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object" && value && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
    const d = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (
    typeof value === "object" &&
    value &&
    "seconds" in value &&
    "nanoseconds" in value &&
    typeof (value as { seconds: unknown }).seconds === "number" &&
    typeof (value as { nanoseconds: unknown }).nanoseconds === "number"
  ) {
    const { seconds, nanoseconds } = value as { seconds: number; nanoseconds: number };
    const d = new Date(seconds * 1000 + Math.floor(nanoseconds / 1_000_000));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export default function OrdersList() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openModal } = useAuthModal();
  const { user, loading: authLoading } = useAuth();

  const PAGE_SIZE = 5;

  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [emailOrders, setEmailOrders] = useState<Order[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const userCursorRef = useRef<QueryDocumentSnapshot | null>(null);
  const emailCursorRef = useRef<QueryDocumentSnapshot | null>(null);
  const requestIdRef = useRef(0);
  const isLoadingMoreRef = useRef(false);

  const successOrderId = searchParams.get("orderId");
  const statusParam = searchParams.get("status");
  const showSuccessBanner = statusParam === "success" && Boolean(successOrderId);

  const successBanner = useMemo(() => {
    if (!showSuccessBanner || !successOrderId) return null;

    return (
      <div className="rounded-2xl border border-emerald-200/60 bg-emerald-500/15 px-4 py-3 text-emerald-50 shadow-inner shadow-emerald-900/30">
        <p className="font-medium">{t("orders.successTitle")}</p>
        <p className="mt-1 text-sm">{t("orders.successSubtitle").replace("{id}", successOrderId)}</p>
      </div>
    );
  }, [showSuccessBanner, successOrderId, t]);

  const mapDocToOrder = useCallback((doc: { id: string; data: () => unknown }) => {
    const data = doc.data() as Record<string, unknown>;
    const createdAtValue = (data.createdAt as string | { toDate?: () => Date } | undefined) ?? "";

    return {
      id: doc.id,
      ...data,
      createdAt:
        typeof createdAtValue === "string"
          ? createdAtValue
          : createdAtValue?.toDate
            ? createdAtValue.toDate().toISOString()
            : "",
    } as Order;
  }, []);

  const mergedOrders = useMemo(() => {
    const merged = new Map<string, Order>();
    userOrders.forEach((order) => merged.set(order.id, order));
    emailOrders.forEach((order) => merged.set(order.id, order));
    return Array.from(merged.values()).sort((a, b) => {
      const aDate = toDateSafe(a.createdAt);
      const bDate = toDateSafe(b.createdAt);
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return bDate.getTime() - aDate.getTime();
    });
  }, [emailOrders, userOrders]);

  const streamWarning = useMemo(() => {
    if (!userError && !emailError) return null;
    if (userError && emailError) return `${t("orders.errorLoadingTitle")}: ${t("orders.retry")}`;
    return "Some order history could not be loaded yet. Please retry in a moment.";
  }, [emailError, t, userError]);

  const fullPageError = useMemo(() => {
    if (mergedOrders.length > 0) return null;
    if (userError && emailError) return userError;
    return null;
  }, [mergedOrders.length, userError, emailError]);

  const fetchOrderPage = useCallback(
    async (append: boolean) => {
      if (!user) return;
      if (append && isLoadingMoreRef.current) return;

      const reqId = requestIdRef.current + 1;
      requestIdRef.current = reqId;

      if (append) {
        isLoadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setLoadingInitial(true);
        setUserError(null);
        setEmailError(null);
      }

      try {
        const db = getDb();
        if (!db) throw new Error("Unable to connect to orders. Please try again.");

        const ordersRef = collection(db, "orders");

        const userConstraints: QueryConstraint[] = [
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          orderBy(documentId(), "desc"),
          ...(append && userCursorRef.current ? [startAfter(userCursorRef.current)] : []),
          limit(PAGE_SIZE),
        ];

        const emailConstraints: QueryConstraint[] = user.email
          ? [
              where("customerEmail", "==", user.email),
              orderBy("createdAt", "desc"),
              orderBy(documentId(), "desc"),
              ...(append && emailCursorRef.current ? [startAfter(emailCursorRef.current)] : []),
              limit(PAGE_SIZE),
            ]
          : [];

        const [userResult, emailResult] = await Promise.allSettled([
          getDocs(query(ordersRef, ...userConstraints)),
          user.email ? getDocs(query(ordersRef, ...emailConstraints)) : Promise.resolve(null),
        ]);

        if (reqId !== requestIdRef.current) return;

        const userSnapshot = userResult.status === "fulfilled" ? userResult.value : null;
        const emailSnapshot = emailResult.status === "fulfilled" ? emailResult.value : null;

        const nextUserError = userResult.status === "rejected"
          ? (userResult.reason instanceof Error ? userResult.reason.message : t("common.unexpectedError"))
          : null;
        const nextEmailError = emailResult.status === "rejected"
          ? (emailResult.reason instanceof Error ? emailResult.reason.message : t("common.unexpectedError"))
          : null;

        setUserError(nextUserError);
        setEmailError(nextEmailError);

        if (userSnapshot) {
          userCursorRef.current = userSnapshot.docs.at(-1) ?? (append ? userCursorRef.current : null);
          const mapped = userSnapshot.docs.map((doc) => mapDocToOrder(doc));
          setUserOrders((prev) => {
            const merged = new Map<string, Order>();
            (append ? prev : []).forEach((o) => merged.set(o.id, o));
            mapped.forEach((o) => merged.set(o.id, o));
            return Array.from(merged.values());
          });
        } else if (!append) {
          setUserOrders([]);
          userCursorRef.current = null;
        }

        if (emailSnapshot) {
          emailCursorRef.current = emailSnapshot.docs.at(-1) ?? (append ? emailCursorRef.current : null);
          const mapped = emailSnapshot.docs.map((doc) => mapDocToOrder(doc));
          setEmailOrders((prev) => {
            const merged = new Map<string, Order>();
            (append ? prev : []).forEach((o) => merged.set(o.id, o));
            mapped.forEach((o) => merged.set(o.id, o));
            return Array.from(merged.values());
          });
        } else if (!append && !user.email) {
          setEmailOrders([]);
          emailCursorRef.current = null;
        }

        const userHasMore = (userSnapshot?.size ?? 0) === PAGE_SIZE;
        const emailHasMore = Boolean(user.email) && (emailSnapshot?.size ?? 0) === PAGE_SIZE;
        setHasMoreOrders(userHasMore || emailHasMore);
      } finally {
        if (reqId === requestIdRef.current) {
          if (append) {
            isLoadingMoreRef.current = false;
            setLoadingMore(false);
          } else {
            setLoadingInitial(false);
          }
        }
      }
    },
    [mapDocToOrder, t, user],
  );

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setUserOrders([]);
      setEmailOrders([]);
      setLoadingInitial(false);
      setLoadingMore(false);
      setHasMoreOrders(false);
      setUserError(null);
      setEmailError(null);
      userCursorRef.current = null;
      emailCursorRef.current = null;
      return;
    }

    userCursorRef.current = null;
    emailCursorRef.current = null;
    await fetchOrderPage(false);
  }, [fetchOrderPage, user]);

  const loadMoreOrders = useCallback(async () => {
    if (!hasMoreOrders || loadingMore) return;
    await fetchOrderPage(true);
  }, [fetchOrderPage, hasMoreOrders, loadingMore]);

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      fetchOrders();
    } else {
      setUserOrders([]);
      setEmailOrders([]);
      setLoadingInitial(false);
      setUserError(null);
      setEmailError(null);
    }
  }, [authLoading, fetchOrders, user]);

  const handleCardClick = (orderId: string) => {
    router.push(localizePathname(locale, `/orders/${orderId}`));
  };

  const getItemsSummary = (order: Order): string => {
    if (order.items.length === 0) return t("orders.emptyOrder");
    if (order.items.length === 1) {
      const item = order.items[0];
      return `${item.name} (${item.size}) × ${item.quantity}`;
    }
    return t("orders.itemsCount").replace("{count}", String(order.items.length));
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-200 border-yellow-500/40";
      case "confirmed":
        return "bg-blue-500/20 text-blue-200 border-blue-500/40";
      case "shipped":
        return "bg-purple-500/20 text-purple-200 border-purple-500/40";
      case "delivered":
        return "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";
      case "cancelled":
        return "bg-rose-500/20 text-rose-200 border-rose-500/40";
      default:
        return "bg-sky-500/20 text-sky-200 border-sky-500/40";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "delivered":
        return t("orders.status.delivered");
      case "shipped":
        return t("orders.status.shipped");
      case "cancelled":
        return t("orders.status.cancelled");
      case "pending":
      case "confirmed":
        return t("orders.status.processing");
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const renderLoadingSkeleton = () => (
    <div className="grid gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-sm shadow-sky-900/30 backdrop-blur animate-pulse"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-white/10 rounded w-24"></div>
              <div className="h-6 bg-white/10 rounded w-48"></div>
              <div className="h-4 bg-white/10 rounded w-32"></div>
            </div>
            <div className="space-y-2 text-right">
              <div className="h-4 bg-white/10 rounded w-32 ml-auto"></div>
              <div className="h-5 bg-white/10 rounded w-24 ml-auto"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (authLoading) {
    return (
      <div className="space-y-4">
        {successBanner}
        {renderLoadingSkeleton()}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        {successBanner}
        <div className="mx-auto max-w-lg rounded-2xl border border-white/20 bg-white/10 px-6 py-10 text-center text-sm shadow-sm shadow-sky-900/30 backdrop-blur sm:text-base">
          <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/10">
            <Image src="/myorder.png" alt="My orders" width={96} height={96} className="object-contain" />
          </div>
          <p className="mb-2 font-medium text-white">{t("orders.guestPrompt")}</p>
          <p className="text-sm text-sky-100">{t("orders.guestCheckoutNote")}</p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => openModal({ returnTo: localizePathname(locale, "/orders") })}
              className="inline-flex items-center rounded-lg border border-sky-200/40 bg-sky-500/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
            >
              {t("orders.guestCta")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loadingInitial && mergedOrders.length === 0) {
    return (
      <div className="space-y-4">
        {successBanner}
        {renderLoadingSkeleton()}
      </div>
    );
  }

  if (fullPageError) {
    return (
      <div className="space-y-4">
        {successBanner}
        <div className="rounded-2xl border border-rose-200/60 bg-rose-500/15 p-6 text-rose-50 shadow-inner shadow-rose-900/30">
          <p className="font-medium mb-2">{t("orders.errorLoadingTitle")}</p>
          <p className="text-sm mb-4">{fullPageError}</p>
          <button
            onClick={fetchOrders}
            className="rounded-lg border border-rose-200/40 bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-50 transition hover:bg-rose-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
          >
            {t("orders.retry")}
          </button>
        </div>
      </div>
    );
  }

  if (mergedOrders.length === 0) {
    return (
      <div className="space-y-4">
        {successBanner}
        <div className="rounded-2xl border border-white/20 bg-white/10 p-6 text-center text-sky-50 shadow-sm shadow-sky-900/30 backdrop-blur">
          <p className="font-medium text-lg mb-2">{t("orders.emptyTitle")}</p>
          <p className="text-sm text-sky-100 mb-2">{t("orders.emptySubtitle")}</p>
          <Link
            href={localizePathname(locale, "/shop")}
            className="mt-4 inline-flex items-center rounded-lg border border-sky-200/40 bg-sky-500/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
          >
            {t("orders.emptyCta")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {successBanner}
      {streamWarning && (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-500/15 p-4 text-amber-50 shadow-inner shadow-amber-900/30">
          <p className="text-sm">{streamWarning}</p>
          <button
            type="button"
            onClick={fetchOrders}
            className="mt-3 rounded-lg border border-amber-200/40 bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-500/30"
          >
            {t("orders.retry")}
          </button>
        </div>
      )}
      <div className="grid gap-4">
        {mergedOrders.map((order) => {
          const firstItem = order.items[0];
          const canCancel = order.status === "pending";
          const canEdit = order.status === "pending";
          const createdAtDate = toDateSafe(order.createdAt);
          return (
            <article
              key={order.id}
              onClick={() => handleCardClick(order.id)}
              className={`rounded-2xl border border-white/20 bg-white/10 p-5 text-sky-50 shadow-sm shadow-sky-900/30 backdrop-blur cursor-pointer transition hover:border-white/30 hover:bg-white/15 relative ${order.status === "cancelled" ? "opacity-75" : ""}`}
              data-can-cancel={canCancel}
              data-can-edit={canEdit}
            >
              <div className="flex gap-4">
                {firstItem && (
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                    <Image src={getCloudinaryDeliveryUrl(firstItem.image, { width: 128 })} alt={firstItem.name} fill sizes="64px" className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm uppercase tracking-[0.18em] text-sky-200">
                        {t("orders.orderNumber").replace("{id}", order.id.slice(-8))}
                      </p>
                      <h3 className="text-lg font-semibold text-white mt-1">{getItemsSummary(order)}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                        {canEdit && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              router.push(localizePathname(locale, `/orders/${order.id}?edit=true`));
                            }}
                            className="inline-flex items-center rounded-full border border-violet-200/40 bg-violet-500/60 px-3 py-1 text-xs font-semibold text-white transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                          >
                            {t("orders.edit")}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sky-100 mt-2 md:mt-0">
                      <p className="text-sm">{createdAtDate ? createdAtDate.toLocaleString() : "—"}</p>
                      <p className="text-base font-semibold text-white mt-1">{new Intl.NumberFormat("en-US").format(order.total)} DZD</p>
                    </div>
                  </div>
                  <dl className="mt-4 grid gap-3 md:grid-cols-2 border-t border-white/10 pt-4">
                    <div>
                      <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">{t("orders.customerLabel")}</dt>
                      <dd className="text-sm font-medium text-white mt-1">{order.shipping.customerName}</dd>
                      {order.customerEmail && <dd className="text-sm text-sky-100 mt-0.5">{order.customerEmail}</dd>}
                      <dd className="text-sm text-sky-200 mt-0.5">{order.shipping.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">{t("orders.shippingLabel")}</dt>
                      <dd className="text-sm text-sky-100 mt-1">{order.shipping.wilaya}</dd>
                      <dd className="text-sm text-sky-200 mt-0.5">
                        {order.shipping.mode === "home" ? t("delivery.home") : t("delivery.desk")} - {new Intl.NumberFormat("en-US").format(order.shipping.price)} DZD
                      </dd>
                    </div>
                    {order.notes && (
                      <div className="md:col-span-2">
                        <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">{t("orders.notesLabel")}</dt>
                        <dd className="text-sm text-sky-100 mt-1">{order.notes}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {hasMoreOrders && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={loadMoreOrders}
            disabled={loadingMore}
            className="inline-flex items-center rounded-lg border border-sky-200/40 bg-sky-500/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500/60 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loadingMore ? t("orders.loading") : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
