import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";

import { getAdminResources, isAdmin, verifyIdTokenFromRequest } from "@/lib/firebaseAdmin";

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

type ExportItem = {
  name: string;
  quantity: number;
  price: number;
  category: string;
  design: string;
};

type ExportOrder = {
  orderId: string;
  createdAt: string;
  date: string;
  month: string;
  status: string;
  customerName: string;
  phone: string;
  wilaya: string;
  address: string;
  deliveryMode: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  items: ExportItem[];
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

export async function GET(request: NextRequest) {
  let decoded;
  try {
    decoded = await verifyIdTokenFromRequest(request);
  } catch (error) {
    return NextResponse.json(
      {
        error: "unauthorized",
        message: error instanceof Error ? error.message : "Unable to verify token.",
      },
      { status: 401 },
    );
  }

  if (!isAdmin(decoded)) {
    return NextResponse.json({ error: "unauthorized", message: "Admin access required." }, { status: 401 });
  }

  const since = request.nextUrl.searchParams.get("since");
  if (!since) {
    return NextResponse.json({ error: "bad_request", message: "since is required." }, { status: 400 });
  }

  const sinceDate = new Date(since);
  if (Number.isNaN(sinceDate.getTime())) {
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
    const snapshot = await db
      .collection("orders")
      .where("createdAt", ">", Timestamp.fromDate(sinceDate))
      .orderBy("createdAt", "asc")
      .limit(limit)
      .get();

    let nextSince = sinceDate.toISOString();

    const orders: ExportOrder[] = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const shipping = (data.shipping as Record<string, unknown> | undefined) ?? {};
      const createdAtIso = toIsoString(data.createdAt);
      const { date, month } = getDateParts(createdAtIso);
      const subtotal = typeof data.subtotal === "number" ? data.subtotal : 0;
      const shippingFee = typeof data.shippingCost === "number" ? data.shippingCost : 0;
      const total = typeof data.total === "number" ? data.total : 0;
      const discount = Math.max(0, subtotal + shippingFee - total);
      const itemsRaw = Array.isArray(data.items) ? data.items : [];

      if (createdAtIso) {
        nextSince = createdAtIso;
      }

      const items: ExportItem[] = itemsRaw.map((item) => {
        const itemData = item as Record<string, unknown>;
        return {
          name: typeof itemData.name === "string" ? itemData.name : "",
          quantity: typeof itemData.quantity === "number" ? itemData.quantity : 0,
          price: typeof itemData.price === "number" ? itemData.price : 0,
          category: typeof itemData.category === "string" ? itemData.category : "",
          design: typeof itemData.design === "string" ? itemData.design : "",
        };
      });

      return {
        orderId: doc.id,
        createdAt: createdAtIso,
        date,
        month,
        status: typeof data.status === "string" ? data.status : "",
        customerName: typeof shipping.customerName === "string" ? shipping.customerName : "",
        phone: typeof shipping.phone === "string" ? shipping.phone : "",
        wilaya: typeof shipping.wilaya === "string" ? shipping.wilaya : "",
        address: typeof shipping.address === "string" ? shipping.address : "",
        deliveryMode: resolveDeliveryMode(shipping.mode),
        subtotal,
        shippingFee,
        discount,
        total,
        paymentMethod: typeof data.paymentMethod === "string" ? data.paymentMethod : "",
        items,
      };
    });

    return NextResponse.json({
      orders,
      nextSince,
      hasMore: snapshot.size === limit,
    });
  } catch (error) {
    console.error("[api/admin/orders-export] GET error", error);
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    return NextResponse.json({ error: "server_error", message }, { status: 500 });
  }
}
