import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { DecodedIdToken } from "firebase-admin/auth";
import { isFirebaseConfigured } from "@/lib/firebaseConfig";
import type { Order, OrderItem, OrderStatus, ShippingInfo } from "@/types/order";
import { getAdminResources, isAdminConfigured } from "@/lib/firebaseAdmin";

const ADMIN_EMAILS = ["fishyourstyle.supp@gmail.com"] as const;

function parseBearerToken(request: NextRequest): string | null {
  const authHeader =
    request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!authHeader) return null;
  const [scheme, value] = authHeader.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !value) return null;
  return value.trim();
}

function isAdminUser(decoded: DecodedIdToken | null): boolean {
  if (!decoded?.email) return false;
  return ADMIN_EMAILS.includes(decoded.email.toLowerCase() as (typeof ADMIN_EMAILS)[number]);
}

function isPendingStatus(status: string | null | undefined): boolean {
  return (status ?? "").toLowerCase() === "pending";
}

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

function firestoreDataToOrder(orderId: string, data: Record<string, unknown>): Order {
  const status = (data.status ?? "pending") as OrderStatus;

  return {
    id: orderId,
    userId: typeof data.userId === "string" ? data.userId : undefined,
    customerEmail: typeof data.customerEmail === "string" ? data.customerEmail : undefined,
    items: Array.isArray(data.items) ? (data.items as Order["items"]) : [],
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
  const { orderId } = await params;

  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  const rawBody = await request.text();
  const hasBody = rawBody.trim().length > 0;
  let payload: PatchPayload | null = null;

  if (hasBody) {
    try {
      payload = JSON.parse(rawBody) as PatchPayload;
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
    const { db, auth } = adminResources;

    const orderRef = db.collection("orders").doc(orderId);
    const snapshot = await orderRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const data = snapshot.data();
    const order = firestoreDataToOrder(snapshot.id, data as Record<string, unknown>);

    const wantsStatusUpdate = typeof payload?.status === "string";

    if (wantsStatusUpdate) {
      if (!ALLOWED_STATUSES.includes(payload.status!)) {
        return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
      }

      const bearerToken = parseBearerToken(request);
      if (!bearerToken) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      let decoded: DecodedIdToken | null = null;
      try {
        decoded = await auth.verifyIdToken(bearerToken);
      } catch (error) {
        console.error("[api/orders/[orderId]] Token verification failed", error);
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }

      if (!isAdminUser(decoded)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const nextStatus = payload.status!;

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

        if (nextStatus === "cancelled") {
          orderUpdate.cancelledAt = FieldValue.serverTimestamp();
        }

        transaction.update(orderRef, orderUpdate);

        if (pendingDelta !== 0) {
          const summaryRef = db.doc("adminStats/summary");
          const summarySnapshot = await transaction.get(summaryRef);
          const summaryData = summarySnapshot.data() ?? {};
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
        updatedData as Record<string, unknown>
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

      const updatedShipping: ShippingInfo = payload?.shipping
        ? {
            ...order.shipping,
            ...payload.shipping,
          }
        : order.shipping;

      const updatedItems: OrderItem[] = payload?.items ? [...payload.items] : order.items;
      const updatedNotes = payload?.notes !== undefined ? payload.notes : order.notes;
      const subtotal = calculateSubtotal(updatedItems);
      const shippingCost =
        typeof updatedShipping.price === "number" ? updatedShipping.price : order.shippingCost;
      const total = subtotal + shippingCost;

      const updateData: Record<string, unknown> = {
        shipping: updatedShipping,
        items: updatedItems,
        notes: updatedNotes ?? null,
        subtotal,
        shippingCost,
        total,
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
