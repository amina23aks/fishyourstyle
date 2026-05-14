import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { isFirebaseConfigured } from "@/lib/firebaseConfig";
import type { Order, OrderItem, OrderStatus, ShippingInfo } from "@/types/order";
import { AdminAuthError, getAdminResources, isAdminConfigured, requireAdmin } from "@/lib/firebaseAdmin";
import { isValidAlgeriaPhone } from "@/lib/algeriaPhone";
import {
  checkRateLimit,
  getOptionalTrimmedString,
  hasHoneypotValue,
  isPlainObject,
} from "@/lib/apiProtection";

function isPendingStatus(status: string | null | undefined): boolean {
  return (status ?? "").toLowerCase() === "pending";
}

const ORDER_UPDATE_RATE_LIMIT = {
  keyPrefix: "orders-update",
  limit: 20,
  windowMs: 60 * 60 * 1000,
};

const ALLOWED_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

function timestampToISO(timestamp: unknown): string {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp && typeof timestamp === "object" && "toDate" in timestamp) {
    return (timestamp as Timestamp).toDate().toISOString();
  }
  if (typeof timestamp === "string") {
    return timestamp;
  }
  return new Date().toISOString();
}

function firestoreDataToOrder(orderId: string, data: Record<string, unknown>, includeAdminFinancials = false): Order {
  const status = (data.status ?? "pending") as OrderStatus;

  return {
    id: orderId,
    userId: typeof data.userId === "string" ? data.userId : undefined,
    customerEmail: typeof data.customerEmail === "string" ? data.customerEmail : undefined,
    items: Array.isArray(data.items)
      ? data.items.map((item) => {
          if (includeAdminFinancials || !item || typeof item !== "object") return item;
          const { itemCostPrice, itemProfit, itemProfitTotal, ...publicItem } = item as Record<string, unknown>;
          void itemCostPrice;
          void itemProfit;
          void itemProfitTotal;
          return publicItem;
        }) as Order["items"]
      : [],
    shipping: (data.shipping as Order["shipping"]) ?? {
      customerName: "",
      phone: "",
      wilaya: "",
      address: "",
      mode: "home",
      price: 0,
    },
    notes: typeof data.notes === "string" ? data.notes : undefined,
    subtotal: Number(data.subtotal ?? 0),
    shippingCost: Number(data.shippingCost ?? 0),
    total: Number(data.total ?? 0),
    paymentMethod: (data.paymentMethod as Order["paymentMethod"]) ?? "COD",
    status,
    createdAt: timestampToISO(data.createdAt),
    updatedAt: timestampToISO(data.updatedAt),
    cancelledAt: data.cancelledAt ? timestampToISO(data.cancelledAt) : undefined,
    ...(includeAdminFinancials
      ? {
          costOfGoodsSold: typeof data.costOfGoodsSold === "number" ? data.costOfGoodsSold : undefined,
          netProfit: typeof data.netProfit === "number" ? data.netProfit : undefined,
          profitSnapshotComplete:
            typeof data.profitSnapshotComplete === "boolean" ? data.profitSnapshotComplete : undefined,
        }
      : {}),
  };
}

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

type PartialShipping = Partial<
  Pick<ShippingInfo, "customerName" | "phone" | "wilaya" | "address" | "mode" | "price">
>;

type PatchPayload = {
  shipping?: PartialShipping;
  notes?: string;
  items?: OrderItem[];
  status?: OrderStatus;
};

function isSafeNumber(value: unknown, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max;
}

function normalizeShippingPatch(shipping: unknown): PartialShipping | undefined | null {
  if (shipping === undefined) return undefined;
  if (!isPlainObject(shipping)) return null;

  const customerName = getOptionalTrimmedString(shipping, "customerName", 100);
  const phone = getOptionalTrimmedString(shipping, "phone", 40);
  const wilaya = getOptionalTrimmedString(shipping, "wilaya", 80);
  const address = getOptionalTrimmedString(shipping, "address", 300);
  const mode = getOptionalTrimmedString(shipping, "mode", 10);
  const price = shipping.price;

  if (
    customerName === null ||
    phone === null ||
    (phone !== undefined && !isValidAlgeriaPhone(phone)) ||
    wilaya === null ||
    address === null ||
    mode === null ||
    (mode !== undefined && mode !== "home" && mode !== "desk") ||
    (price !== undefined && !isSafeNumber(price, 100_000))
  ) {
    return null;
  }

  return {
    ...(customerName ? { customerName } : {}),
    ...(phone ? { phone } : {}),
    ...(wilaya ? { wilaya } : {}),
    ...(address ? { address } : {}),
    ...(mode ? { mode: mode as ShippingInfo["mode"] } : {}),
    ...(typeof price === "number" ? { price } : {}),
  };
}

function isValidOrderItems(items: unknown): items is OrderItem[] {
  if (!Array.isArray(items)) return false;

  return items.every((item) =>
    typeof item === "object" &&
    item !== null &&
    typeof (item as OrderItem).id === "string" &&
    typeof (item as OrderItem).slug === "string" &&
    typeof (item as OrderItem).name === "string" &&
    typeof (item as OrderItem).price === "number" &&
    typeof (item as OrderItem).currency === "string" &&
    typeof (item as OrderItem).image === "string" &&
    typeof (item as OrderItem).colorName === "string" &&
    typeof (item as OrderItem).colorCode === "string" &&
    typeof (item as OrderItem).size === "string" &&
    typeof (item as OrderItem).quantity === "number" &&
    (item as OrderItem).quantity > 0 &&
    typeof (item as OrderItem).variantKey === "string"
  );
}

function calculateSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const rateLimitResponse = checkRateLimit(request, ORDER_UPDATE_RATE_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const { orderId } = await params;

  if (!orderId || orderId.length > 128) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  const rawBody = await request.text();
  const hasBody = rawBody.trim().length > 0;
  let payload: PatchPayload | null = null;

  if (hasBody) {
    try {
      const parsedPayload = JSON.parse(rawBody) as unknown;
      if (!isPlainObject(parsedPayload)) {
        return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
      }
      if (hasHoneypotValue(parsedPayload)) {
        return NextResponse.json({ error: "Invalid request." }, { status: 400 });
      }
      payload = parsedPayload as PatchPayload;
    } catch (error) {
      console.error("[api/orders/[orderId]] PATCH PARSE ERROR:", error);
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
  }

  try {
    if (!isFirebaseConfigured() || !isAdminConfigured()) {
      return NextResponse.json(
        { error: "Firebase is not configured. Please add your Firebase environment variables." },
        { status: 503 },
      );
    }

    const adminResources = getAdminResources();
    if (!adminResources) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured. Please check your credentials." },
        { status: 503 },
      );
    }
    const { db } = adminResources;

    const orderRef = db.collection("orders").doc(orderId);
    const snapshot = await orderRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const data = snapshot.data();
    const order = firestoreDataToOrder(snapshot.id, data as Record<string, unknown>, true);

    const wantsStatusUpdate = typeof payload?.status === "string";

    if (wantsStatusUpdate) {
      if (!payload) {
        return NextResponse.json({ error: "Missing request body" }, { status: 400 });
      }

      const nextStatus = payload?.status;
      if (typeof nextStatus !== "string") {
        return NextResponse.json({ error: "Missing order status" }, { status: 400 });
      }

      if (!ALLOWED_STATUSES.includes(nextStatus)) {
        return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
      }

      try {
        await requireAdmin(request);
      } catch (error) {
        const status = error instanceof AdminAuthError ? error.status : 401;
        const message = error instanceof Error ? error.message : "Unable to verify admin access.";
        return NextResponse.json({ error: status === 403 ? "Forbidden" : "Authentication required", message }, { status });
      }

      if (nextStatus === order.status) {
        return NextResponse.json(order);
      }

      await db.runTransaction(async (transaction) => {
        const orderSnapshot = await transaction.get(orderRef);
        if (!orderSnapshot.exists) {
          throw new Error("Order not found");
        }

        const orderData = orderSnapshot.data() ?? {};
        const previousStatus = typeof orderData.status === "string" ? orderData.status : "pending";
        const normalizedNextStatus = nextStatus.toLowerCase();
        const normalizedPreviousStatus = previousStatus.toLowerCase();
        const orderUserId =
          typeof orderData.userId === "string" ? orderData.userId : null;
        const alreadyCounted = Boolean(orderData.loyaltyCounted);

        console.log("[orders][loyalty] status update", {
          orderId,
          newStatus: nextStatus,
          orderUserId,
          loyaltyCounted: alreadyCounted,
        });

        const summaryRef = db.doc("adminStats/summary");
        const summarySnapshot = await transaction.get(summaryRef);
        const summaryData = summarySnapshot.data() ?? {};

        const pendingDelta =
          isPendingStatus(previousStatus) && !isPendingStatus(nextStatus)
            ? -1
            : !isPendingStatus(previousStatus) && isPendingStatus(nextStatus)
              ? 1
              : 0;

        const orderUpdate: Record<string, unknown> = {
          status: nextStatus,
          updatedAt: FieldValue.serverTimestamp(),
        };

        const shouldCountLoyalty =
          normalizedNextStatus === "delivered" &&
          normalizedPreviousStatus !== "delivered" &&
          !alreadyCounted &&
          Boolean(orderUserId);

        if (shouldCountLoyalty) {
          const userRef = db.collection("users").doc(orderUserId ?? "");
          console.log("[orders][loyalty] incrementing user orderCount", {
            userDocPath: `users/${orderUserId}`,
          });
          const userSnapshot = await transaction.get(userRef);
          const userData = userSnapshot.data() ?? {};
          if (!userSnapshot.exists) {
            transaction.set(
              userRef,
              {
                orderCount: 0,
                loyaltyRewardAvailable: false,
                loyaltyRewardPercent: 8,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
          const currentOrderCount = Number(userData.orderCount ?? 0);
          const shouldResetCycle = currentOrderCount > 0 && currentOrderCount % 5 === 0;
          const nextOrderCount = shouldResetCycle ? 1 : currentOrderCount + 1;
          const loyaltyRewardAvailable = Boolean(userData.loyaltyRewardAvailable);
          const shouldUnlockReward = nextOrderCount % 5 === 0 && !loyaltyRewardAvailable;
          const userUpdate: Record<string, unknown> = {
            orderCount: nextOrderCount,
          };
          if (shouldUnlockReward) {
            userUpdate.loyaltyRewardAvailable = true;
            userUpdate.loyaltyRewardPercent = 8;
            userUpdate.loyaltyCycleSize = 5;
          } else if (shouldResetCycle) {
            userUpdate.loyaltyRewardAvailable = false;
          }
          transaction.set(userRef, userUpdate, { merge: true });
          orderUpdate.loyaltyCounted = true;
        } else if (!orderUserId && normalizedNextStatus === "delivered") {
          console.log("[orders][loyalty] missing userId, skipping increment", {
            orderId,
          });
        }

        if (nextStatus === "cancelled") {
          orderUpdate.cancelledAt = FieldValue.serverTimestamp();
        }

        transaction.update(orderRef, orderUpdate);

        if (pendingDelta !== 0) {
          const currentPending = Number(summaryData.pendingOrders ?? 0);
          const nextPending = Math.max(0, currentPending + pendingDelta);

          transaction.set(
            summaryRef,
            {
              pendingOrders: nextPending,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
      });

      const updatedSnapshot = await orderRef.get();
      const updatedData = updatedSnapshot.data();

      if (!updatedData) {
        return NextResponse.json(
          { error: "Failed to read updated order" },
          { status: 500 }
        );
      }

      const updatedOrder = firestoreDataToOrder(
        updatedSnapshot.id,
        updatedData as Record<string, unknown>,
        true
      );

      return NextResponse.json(updatedOrder);
    }

    const isCancelAction = !hasBody || payload?.status === "cancelled";

    if (isCancelAction) {
      if (order.status !== "pending") {
        return NextResponse.json(
          { error: "Only pending orders can be cancelled." },
          { status: 400 }
        );
      }

      await orderRef.update({
        status: "cancelled",
        updatedAt: FieldValue.serverTimestamp(),
        cancelledAt: FieldValue.serverTimestamp(),
      });
    } else {
      if (order.status !== "pending") {
        return NextResponse.json(
          { error: "Only pending orders can be edited." },
          { status: 400 }
        );
      }

      if (payload?.items && !isValidOrderItems(payload.items)) {
        return NextResponse.json(
          { error: "Invalid items payload" },
          { status: 400 }
        );
      }

      const normalizedShippingPatch = normalizeShippingPatch(payload?.shipping);
      if (normalizedShippingPatch === null) {
        return NextResponse.json(
          { error: "Invalid shipping payload" },
          { status: 400 }
        );
      }

      const updatedShipping: ShippingInfo = normalizedShippingPatch
        ? {
            ...order.shipping,
            ...normalizedShippingPatch,
          }
        : order.shipping;

      const updatedItems: OrderItem[] = payload?.items ? [...payload.items] : order.items;
      const updatedNotes = payload?.notes !== undefined
        ? getOptionalTrimmedString(payload as Record<string, unknown>, "notes", 500)
        : order.notes;

      if (updatedNotes === null) {
        return NextResponse.json(
          { error: "Invalid notes payload" },
          { status: 400 }
        );
      }
      const subtotal = calculateSubtotal(updatedItems);
      const shippingCost =
        typeof updatedShipping.price === "number" ? updatedShipping.price : order.shippingCost;
      const total = subtotal + shippingCost;
      const previousCostByVariant = new Map(
        order.items.map((item) => [item.variantKey, typeof item.itemCostPrice === "number" ? item.itemCostPrice : 0]),
      );
      const itemsWithProfit = updatedItems.map((item) => {
        const itemCostPrice = previousCostByVariant.get(item.variantKey) ?? 0;
        const itemProfit = item.price - itemCostPrice;
        const itemProfitTotal = itemProfit * item.quantity;
        return { ...item, itemCostPrice, itemProfit, itemProfitTotal };
      });
      const costOfGoodsSold = itemsWithProfit.reduce((sum, item) => sum + item.itemCostPrice * item.quantity, 0);
      const netProfit = itemsWithProfit.reduce((sum, item) => sum + item.itemProfitTotal, 0);

      const updateData: Record<string, unknown> = {
        shipping: updatedShipping,
        items: itemsWithProfit,
        notes: updatedNotes ?? null,
        subtotal,
        shippingCost,
        total,
        costOfGoodsSold,
        netProfit,
        profitSnapshotComplete: order.profitSnapshotComplete === true,
        updatedAt: FieldValue.serverTimestamp(),
      };

      await orderRef.update(updateData);
    }

    const updatedSnapshot = await orderRef.get();
    const updatedData = updatedSnapshot.data();

    if (!updatedData) {
      return NextResponse.json(
        { error: "Failed to read updated order" },
        { status: 500 }
      );
    }

    const updatedOrder = firestoreDataToOrder(
      updatedSnapshot.id,
      updatedData as Record<string, unknown>
    );

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("[api/orders/[orderId]] PATCH ERROR:", error);

    const message = error instanceof Error ? error.message : "Failed to cancel order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
