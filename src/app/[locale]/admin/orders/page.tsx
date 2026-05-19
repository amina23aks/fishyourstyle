"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

import { OrderStatusSelect } from "./components/OrderStatusSelect";
import { StatusBadge } from "./components/StatusBadge";
import { STATUS_FILTER_OPTIONS, statusStyles } from "./statusConfig";
import { fetchRecentOrders, fetchRecentOrdersPage, updateOrderStatus } from "@/lib/admin-orders";
import type { Order, OrderStatus } from "@/types/order";
import { useLocale } from "@/i18n/I18nProvider";
import { localizePathname } from "@/i18n/paths";

function formatDateTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeAccountingAmount(value: number) {
  return Math.round(value) === 0 ? 0 : value;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(normalizeAccountingAmount(value));
}

function getAccountingNetProfit(order: Order) {
  if (order.status === "returned") return -(order.returnCost ?? 0);
  if (order.status !== "delivered") return null;
  const cogs = typeof order.costOfGoodsSold === "number" ? order.costOfGoodsSold : 0;
  return order.subtotal - cogs;
}

type Toast = { id: number; type: "success" | "error"; message: string };

const ADMIN_ORDERS_PAGE_SIZE = 10;

const ORDER_EXPORT_HEADERS = [
  "orderId",
  "createdAt",
  "month",
  "date",
  "status",
  "customerName",
  "customerEmail",
  "phone",
  "wilaya",
  "address",
  "deliveryMode",
  "itemsCount",
  "itemsSummary",
  "subtotal",
  "shippingFee",
  "discount",
  "total",
  "paymentMethod",
  "productRevenue",
  "returnCost",
  "accountingRevenue",
  "accountingCOGS",
  "accountingNetProfit",
];

const ORDER_ITEM_EXPORT_HEADERS = [
  "rowKey",
  "orderId",
  "createdAt",
  "date",
  "status",
  "wilaya",
  "deliveryMode",
  "itemName",
  "itemQty",
  "itemUnitPrice",
  "itemTotal",
  "paymentMethod",
  "category",
  "design",
];

function escapeCsvValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  const stringValue = String(value).replace(/[\r\n\t]+/g, " ").trim();
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
}

function getDateParts(iso: string) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return { month: "", day: "" };
  }
  const day = parsed.toISOString().slice(0, 10);
  const month = day.slice(0, 7);
  return { month, day };
}

function resolveWilaya(order: Order) {
  if (order.shipping?.wilaya) return order.shipping.wilaya;
  const address = order.shipping?.address ?? "";
  if (!address) return "";
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : "";
}

function resolveDeliveryMode(order: Order) {
  const mode = order.shipping?.mode;
  if (mode === "home") return "domicile";
  if (mode === "desk") return "desktop";
  return "";
}

function buildOrdersCsv(orders: Order[]) {
  const s = (value: unknown) => (value === null || value === undefined ? "" : String(value));
  const n = (value: unknown) => String(typeof value === "number" ? value : Number(value ?? 0));
  const rows = [ORDER_EXPORT_HEADERS];
  orders.forEach((order) => {
    const discountValue = Math.max(0, order.subtotal + order.shippingCost - order.total);
    const { month, day } = getDateParts(order.createdAt);
    const wilaya = resolveWilaya(order);
    const deliveryMode = resolveDeliveryMode(order);
    const itemsCount = (order.items ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0);
    const itemsSummary = (order.items ?? []).map((item) => `${item.name} x${item.quantity}`).join(" | ");
    const returnCost = order.returnCost ?? 0;
    const accountingRevenue = order.status === "delivered" ? order.subtotal : 0;
    const accountingCOGS = order.status === "delivered" ? order.costOfGoodsSold ?? 0 : 0;
    const accountingNetProfit =
      order.status === "delivered" ? accountingRevenue - accountingCOGS : order.status === "returned" ? -returnCost : 0;
    rows.push([
      s(order.id),
      s(order.createdAt),
      s(month),
      s(day),
      s(order.status),
      s(order.shipping?.customerName),
      s(order.customerEmail),
      s(order.shipping?.phone),
      s(wilaya),
      s(order.shipping?.address),
      s(deliveryMode),
      n(itemsCount),
      s(itemsSummary),
      n(order.subtotal),
      n(order.shippingCost),
      n(discountValue),
      n(order.total),
      s(order.paymentMethod),
      n(order.subtotal),
      n(returnCost),
      n(accountingRevenue),
      n(accountingCOGS),
      n(accountingNetProfit),
    ]);
  });

  return rows.map((row) => row.map(escapeCsvValue).join(";")).join("\n");
}

function buildOrderItemsCsv(orders: Order[]) {
  const s = (value: unknown) => (value === null || value === undefined ? "" : String(value));
  const n = (value: unknown) => String(typeof value === "number" ? value : Number(value ?? 0));
  const rows = [ORDER_ITEM_EXPORT_HEADERS];
  orders.forEach((order) => {
    const items = order.items.length > 0 ? order.items : [];
    const wilaya = resolveWilaya(order);
    const deliveryMode = resolveDeliveryMode(order);
    items.forEach((item, index) => {
      const itemIndex = Number.isFinite(index) ? index : null;
      const rowKey =
        itemIndex !== null
          ? `${order.id}_${itemIndex}`
          : `${order.id}_${item?.name ?? ""}_${item?.quantity ?? 0}`;
      const category = (item as { category?: unknown })?.category;
      const design = (item as { design?: unknown })?.design;
      rows.push([
        s(rowKey),
        s(order.id),
        s(order.createdAt),
        s(getDateParts(order.createdAt).day),
        s(order.status),
        s(wilaya),
        s(deliveryMode),
        s(item?.name),
        n(item?.quantity ?? 0),
        n(item?.price ?? 0),
        n(item ? item.price * item.quantity : 0),
        s(order.paymentMethod),
        s(category),
        s(design),
      ]);
    });
  });

  return rows.map((row) => row.map(escapeCsvValue).join(";")).join("\n");
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersCursor, setOrdersCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  const [loadingMoreOrders, setLoadingMoreOrders] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTER_OPTIONS)[number]>("all");
  const [search, setSearch] = useState("");
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const ordersInfiniteScrollRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const locale = useLocale();

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchRecentOrdersPage(ADMIN_ORDERS_PAGE_SIZE);
      setOrders(page.orders);
      setOrdersCursor(page.nextCursor);
      setHasMoreOrders(Boolean(page.nextCursor));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch orders";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoreOrders = useCallback(async () => {
    if (!ordersCursor || loadingMoreOrders || !hasMoreOrders) return;
    setLoadingMoreOrders(true);
    setError(null);
    try {
      const page = await fetchRecentOrdersPage(ADMIN_ORDERS_PAGE_SIZE, ordersCursor);
      setOrders((prev) => [...prev, ...page.orders]);
      setOrdersCursor(page.nextCursor);
      setHasMoreOrders(Boolean(page.nextCursor));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch more orders";
      setError(message);
    } finally {
      setLoadingMoreOrders(false);
    }
  }, [hasMoreOrders, loadingMoreOrders, ordersCursor]);

  useEffect(() => {
    const sentinel = ordersInfiniteScrollRef.current;
    if (!sentinel || loading || loadingMoreOrders || !hasMoreOrders) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMoreOrders();
        }
      },
      { rootMargin: "300px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreOrders, loadMoreOrders, loading, loadingMoreOrders]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" ? true : order.status === statusFilter;
      const matchesSearch = trimmed
        ? order.id.toLowerCase().includes(trimmed) || (order.customerEmail ?? "").toLowerCase().includes(trimmed)
        : true;
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const handleStatusChange = useCallback(
    async (orderId: string, nextStatus: OrderStatus) => {
      const currentOrder = orders.find((order) => order.id === orderId);
      if (!currentOrder || currentOrder.status === nextStatus) return;

      const previousStatus = currentOrder.status;
      const previousUpdatedAt = currentOrder.updatedAt;
      const updatedAt = new Date().toISOString();

      setStatusUpdating(orderId);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: nextStatus, updatedAt } : order
        )
      );
      try {
        await updateOrderStatus(orderId, nextStatus);
        pushToast({ type: "success", message: "Order status updated" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update status";
        pushToast({ type: "error", message });
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? { ...order, status: previousStatus, updatedAt: previousUpdatedAt }
              : order
          )
        );
      } finally {
        setStatusUpdating(null);
      }
    },
    [orders, pushToast]
  );

  const isEmpty = !loading && !error && filteredOrders.length === 0;

  const exportOrdersData = useCallback(async () => {
    return orders.length > 0 ? filteredOrders : await fetchRecentOrders(200);
  }, [filteredOrders, orders.length]);

  const triggerCsvDownload = useCallback((csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const handleExportOrdersCsv = useCallback(async () => {
    try {
      const exportOrders = await exportOrdersData();
      const csvContent = buildOrdersCsv(exportOrders);
      triggerCsvDownload(csvContent, `orders-${new Date().toISOString().slice(0, 10)}.csv`);
      pushToast({ type: "success", message: "CSV downloaded" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to export CSV";
      pushToast({ type: "error", message });
    }
  }, [exportOrdersData, pushToast, triggerCsvDownload]);

  const handleExportOrderItemsCsv = useCallback(async () => {
    try {
      const exportOrders = await exportOrdersData();
      const csvContent = buildOrderItemsCsv(exportOrders);
      triggerCsvDownload(csvContent, `order-items-${new Date().toISOString().slice(0, 10)}.csv`);
      pushToast({ type: "success", message: "CSV downloaded" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to export CSV";
      pushToast({ type: "error", message });
    }
  }, [exportOrdersData, pushToast, triggerCsvDownload]);

  return (
    <div className="relative space-y-5">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Orders</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Orders</h1>
        <p className="max-w-2xl text-sm text-sky-100/85 sm:text-base">
          Review recent checkouts, monitor statuses, and keep an eye on fulfilment. Quickly adjust order states from the
          list or open full details when needed.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTER_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-900/40 ${
                statusFilter === status
                  ? "bg-white/20 text-white ring-1 ring-white/50 shadow shadow-sky-900/40"
                  : "bg-white/10 text-sky-100 hover:bg-white/15"
              }`}
            >
              {status === "all" ? "All" : statusStyles[status].label}
            </button>
          ))}
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3 lg:w-auto">
          <div className="w-full max-w-sm sm:w-auto sm:min-w-[220px]">
            <label className="relative block">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order ID or email"
                className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-sky-100/60 shadow-inner shadow-sky-900/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sky-100/70">⌕</span>
            </label>
          </div>
          <button
            type="button"
            onClick={loadOrders}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExportOrdersCsv}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            Orders CSV
          </button>
          <button
            type="button"
            onClick={handleExportOrderItemsCsv}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            Order Items CSV
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl shadow-sky-900/50 backdrop-blur">
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between text-sm text-sky-100/80">
            <span>
              Showing {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-sky-100/80">
              Recent {orders.length}
            </span>
          </div>
        </div>

        {error ? (
          <div className="px-6 py-10 text-center text-sky-100/85">
            <p className="text-lg font-semibold text-white">Unable to load orders</p>
            <p className="mt-2 text-sm">{error}</p>
            <button
              type="button"
              onClick={loadOrders}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow shadow-sky-900/40 transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <OrderTableSkeleton />
        ) : isEmpty ? (
          <div className="px-6 py-12 text-center text-sky-100/85">
            <p className="text-lg font-semibold text-white">No orders yet</p>
            <p className="mt-2 text-sm">
              Once customers complete checkout, their orders will appear here for review and future management.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full table-fixed text-left text-sm text-sky-100/85">
                <thead className="sticky top-0 z-10 bg-slate-950/70 backdrop-blur">
                  <tr>
                    <th className="w-[16%] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200 lg:px-4">Order</th>
                    <th className="w-[18%] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200 lg:px-4">Date</th>
                    <th className="w-[25%] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200 lg:px-4">Customer</th>
                    <th className="w-[12%] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200 lg:px-4">Wilaya</th>
                    <th className="w-[17%] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200 lg:px-4">Status</th>
                    <th className="w-[12%] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-sky-200 lg:px-4">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="cursor-pointer transition hover:bg-white/5"
                      onClick={() => router.push(localizePathname(locale, `/admin/orders/${order.id}`))}
                    >
                      <td className="px-3 py-4 align-top font-semibold text-white lg:px-4">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-sky-100/80">Order</span>
                          <span className="font-mono text-xs lg:text-sm">{order.id.slice(0, 8)}…</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 align-top text-xs text-sky-100/80 lg:px-4 lg:text-sm">{formatDateTime(order.createdAt)}</td>
                      <td className="px-3 py-4 align-top text-sky-100/90 lg:px-4">
                        <div className="font-semibold text-white">{order.shipping.customerName || "Unknown"}</div>
                        <div className="break-words text-xs text-sky-100/70">{order.customerEmail || "Guest checkout"}</div>
                      </td>
                      <td className="px-3 py-4 align-top text-xs text-sky-100/80 lg:px-4 lg:text-sm">{order.shipping.wilaya || "—"}</td>
                      <td className="px-3 py-4 align-top lg:px-4">
                        <OrderStatusSelect
                          value={order.status}
                          onChange={(status) => handleStatusChange(order.id, status)}
                          disabled={statusUpdating === order.id}
                        />
                      </td>
                      <td className="px-3 py-4 align-top text-right font-semibold text-white lg:px-4">
                        {formatCurrency(order.total)}
                        {getAccountingNetProfit(order) !== null ? (
                          <div className="text-[11px] font-normal text-cyan-100/75">
                            Accounting profit {formatCurrency(getAccountingNetProfit(order) ?? 0)}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 px-4 pb-6 md:hidden">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(localizePathname(locale, `/admin/orders/${order.id}`))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(localizePathname(locale, `/admin/orders/${order.id}`));
                    }
                  }}
                  className="space-y-3 rounded-2xl border border-white/10 bg-white/10 p-4 text-sky-50 shadow-inner shadow-sky-900/40 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-sky-100/70">
                        <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white">Order</span>
                        <span className="font-mono">{order.id.slice(0, 8)}…</span>
                      </div>
                      <div className="text-sm text-sky-100/80">{formatDateTime(order.createdAt)}</div>
                      <div className="text-base font-semibold text-white">
                        {order.shipping.customerName || "Unknown"}
                      </div>
                      <div className="text-xs text-sky-100/70">{order.customerEmail || "Guest checkout"}</div>
                    </div>
                    <div className="text-right font-semibold text-white">
                      {formatCurrency(order.total)}
                      {getAccountingNetProfit(order) !== null ? (
                        <div className="text-[11px] font-normal text-cyan-100/75">
                          Accounting profit {formatCurrency(getAccountingNetProfit(order) ?? 0)}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-sky-100/80">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Wilaya</p>
                      <p className="font-semibold text-white">{order.shipping.wilaya || "—"}</p>
                    </div>
                    <OrderStatusSelect
                      value={order.status}
                      onChange={(status) => handleStatusChange(order.id, status)}
                      disabled={statusUpdating === order.id}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
            </>
        )}
      </div>

      <div ref={ordersInfiniteScrollRef} className="h-4" aria-hidden="true" />
      {loadingMoreOrders ? (
        <p className="text-center text-sm text-sky-100/70">Loading more orders...</p>
      ) : null}

      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl px-4 py-3 text-sm font-semibold shadow-xl shadow-sky-900/40 backdrop-blur ${
              toast.type === "success"
                ? "bg-emerald-500/15 text-emerald-50 ring-1 ring-emerald-300/40"
                : "bg-rose-500/15 text-rose-50 ring-1 ring-rose-300/40"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderTableSkeleton() {
  return (
      <div className="divide-y divide-white/5">
        <div className="grid grid-cols-6 gap-4 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">
          <span>Order</span>
          <span>Date</span>
          <span>Customer</span>
          <span>Wilaya</span>
          <span>Status</span>
          <span className="text-right">Total</span>
        </div>
        {[...Array(6)].map((_, index) => (
          <div key={index} className="grid grid-cols-6 gap-4 px-6 py-4">
            {[...Array(6)].map((__, colIndex) => (
              <span
                key={colIndex}
                className="h-4 rounded-full bg-white/10 animate-pulse"
              />
            ))}
          </div>
        ))}
      </div>
  );
}
