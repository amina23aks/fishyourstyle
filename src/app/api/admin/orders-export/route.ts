import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";

import { getAdminResources } from "@/lib/firebaseAdmin";

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

type ExportOrderRow = {
  rowKey: string;
  orderId: string;
  createdAt: string;
  month: string;
  date: string;
  status: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  wilaya: string;
  address: string;
  deliveryMode: string;
  itemsCount: number;
  itemsSummary: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
};

type ExportOrderItemRow = {
  rowKey: string;
  orderId: string;
  createdAt: string;
  date: string;
  status: string;
  wilaya: string;
  deliveryMode: string;
  itemName: string;
  itemQty: number;
  itemUnitPrice: number;
  itemTotal: number;
  paymentMethod: string;
  category: string;
  design: string;
};

function getDateParts(iso: string) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return { date: "", month: "" };
  }
  const date = parsed.toISOString().slice(0, 10);
  return { date, month: date.slice(0, 7) };
}

function resolveDeliveryMode(mode: unknown) {
  if (mode === "home") return "domicile";
  if (mode === "desk") return "desktop";
  return "";
}

function toIsoString(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "number") return new Date(value).toISOString();
  return new Date(0).toISOString();
}

function parseBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!authHeader) return null;
  const [scheme, value] = authHeader.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !value) return null;
  return value.trim();
}

export async function GET(request: NextRequest) {
  const expectedToken = process.env.ADMIN_EXPORT_TOKEN;
  const providedToken = parseBearerToken(request);
  if (!expectedToken || !providedToken || providedToken !== expectedToken) {
    return NextResponse.json(
      {
        error: "unauthorized",
        message: "Missing Authorization header.",
      },
      { status: 401 },
    );
  }

  const sinceParam = request.nextUrl.searchParams.get("since");
  const sinceDate = sinceParam ? new Date(sinceParam) : null;
  if (sinceDate && Number.isNaN(sinceDate.getTime())) {
    return NextResponse.json({ error: "bad_request", message: "since must be a valid ISO date." }, { status: 400 });
  }

  // Cap limit to keep reads bounded on the free plan.
  // Cap max to keep reads bounded on the free plan.
  const rawLimit = Number(request.nextUrl.searchParams.get("max") ?? DEFAULT_LIMIT);
  const requestedLimit = Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);

  const adminResources = getAdminResources();
  if (!adminResources) {
    return NextResponse.json(
      { error: "Firebase Admin is not configured. Please add your Firebase environment variables." },
      { status: 503 },
    );
  }

  try {
    const { db } = adminResources;
    let ordersQuery = db.collection("orders").orderBy("createdAt", "asc").limit(limit);
    if (sinceDate) {
      ordersQuery = ordersQuery.where("createdAt", ">", Timestamp.fromDate(sinceDate));
    }

    const snapshot = await ordersQuery.get();

    const orders: ExportOrderRow[] = [];
    const orderItems: ExportOrderItemRow[] = [];
    let newestCreatedAt = sinceDate?.toISOString() ?? "";

    snapshot.docs.forEach((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const shipping = (data.shipping as Record<string, unknown> | undefined) ?? {};
      const createdAtIso = toIsoString(data.createdAt);
      const { date, month } = getDateParts(createdAtIso);
      const subtotal = typeof data.subtotal === "number" ? data.subtotal : 0;
      const shippingFee = typeof data.shippingCost === "number" ? data.shippingCost : 0;
      const total = typeof data.total === "number" ? data.total : 0;
      const discount = Math.max(0, subtotal + shippingFee - total);
      const itemsRaw = Array.isArray(data.items) ? data.items : [];
      const itemsCount = itemsRaw.reduce((sum, item) => {
        const itemData = item as Record<string, unknown>;
        return sum + (typeof itemData.quantity === "number" ? itemData.quantity : 0);
      }, 0);
      const itemsSummary = itemsRaw
        .map((item) => {
          const itemData = item as Record<string, unknown>;
          const name = typeof itemData.name === "string" ? itemData.name : "";
          const qty = typeof itemData.quantity === "number" ? itemData.quantity : 0;
          return name ? `${name} x${qty}` : "";
        })
        .filter(Boolean)
        .join(" | ");

      if (createdAtIso) {
        newestCreatedAt = createdAtIso;
      }

      orders.push({
        rowKey: doc.id,
        orderId: doc.id,
        createdAt: createdAtIso,
        month,
        date,
        status: typeof data.status === "string" ? data.status : "",
        customerName: typeof shipping.customerName === "string" ? shipping.customerName : "",
        customerEmail: typeof data.customerEmail === "string" ? data.customerEmail : "",
        phone: typeof shipping.phone === "string" ? shipping.phone : "",
        wilaya: typeof shipping.wilaya === "string" ? shipping.wilaya : "",
        address: typeof shipping.address === "string" ? shipping.address : "",
        deliveryMode: resolveDeliveryMode(shipping.mode),
        itemsCount,
        itemsSummary,
        subtotal,
        shippingFee,
        discount,
        total,
        paymentMethod: typeof data.paymentMethod === "string" ? data.paymentMethod : "",
      });

      itemsRaw.forEach((item, index) => {
        const itemData = item as Record<string, unknown>;
        const itemQty = typeof itemData.quantity === "number" ? itemData.quantity : 0;
        const itemUnitPrice = typeof itemData.price === "number" ? itemData.price : 0;
        orderItems.push({
          rowKey: `${doc.id}_${index}`,
          orderId: doc.id,
          createdAt: createdAtIso,
          date,
          status: typeof data.status === "string" ? data.status : "",
          wilaya: typeof shipping.wilaya === "string" ? shipping.wilaya : "",
          deliveryMode: resolveDeliveryMode(shipping.mode),
          itemName: typeof itemData.name === "string" ? itemData.name : "",
          itemQty,
          itemUnitPrice,
          itemTotal: itemQty * itemUnitPrice,
          paymentMethod: typeof data.paymentMethod === "string" ? data.paymentMethod : "",
          category: typeof itemData.category === "string" ? itemData.category : "",
          design: typeof itemData.design === "string" ? itemData.design : "",
        });
      });
    });

    return NextResponse.json({
      nextSince: orders.length > 0 ? newestCreatedAt : sinceDate?.toISOString() ?? new Date().toISOString(),
      orders,
      orderItems,
    });
  } catch (error) {
    console.error("[api/admin/orders-export] GET error", error);
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    return NextResponse.json({ error: "server_error", message }, { status: 500 });
  }
}
