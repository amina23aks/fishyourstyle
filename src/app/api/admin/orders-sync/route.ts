import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";

import { AdminAuthError, getAdminResources, requireAdminOrExportToken } from "@/lib/firebaseAdmin";

const PAGE_LIMIT = 100;

type ExportItem = {
  name: string;
  slug: string;
  quantity: number;
  price: number;
};

type ExportOrder = {
  orderId: string;
  createdAt: string;
  status: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  address: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  items: ExportItem[];
};

function parseSinceDate(request: NextRequest): { sinceDate: Date } | { error: string } {
  const { searchParams } = request.nextUrl;
  const sinceMsParam = searchParams.get("sinceMs");
  const sinceParam = searchParams.get("since");

  if (sinceMsParam) {
    const sinceMs = Number(sinceMsParam);
    if (!Number.isFinite(sinceMs)) {
      return { error: "sinceMs must be a valid number" };
    }
    return { sinceDate: new Date(sinceMs) };
  }

  if (sinceParam) {
    const sinceDate = new Date(sinceParam);
    if (Number.isNaN(sinceDate.getTime())) {
      return { error: "since must be a valid ISO date string" };
    }
    return { sinceDate };
  }

  return { error: "since or sinceMs query parameter is required" };
}

function toMillis(value: unknown): number | null {
  if (value instanceof Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function toIsoString(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "number") return new Date(value).toISOString();
  return new Date(0).toISOString();
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminOrExportToken(request);
  } catch (error) {
    const status = error instanceof AdminAuthError ? error.status : 401;
    const code = status === 403 ? "forbidden" : "unauthorized";
    return NextResponse.json(
      {
        error: code,
        message: error instanceof Error ? error.message : "Unable to verify admin access.",
      },
      { status },
    );
  }

  const parsedSince = parseSinceDate(request);
  if ("error" in parsedSince) {
    return NextResponse.json({ error: "bad_request", message: parsedSince.error }, { status: 400 });
  }

  const adminResources = getAdminResources();
  if (!adminResources) {
    return NextResponse.json(
      { error: "Firebase Admin is not configured. Please add your Firebase environment variables." },
      { status: 503 },
    );
  }

  try {
    const { db } = adminResources;
    const sinceTimestamp = Timestamp.fromDate(parsedSince.sinceDate);
    const snapshot = await db
      .collection("orders")
      .where("createdAt", ">", sinceTimestamp)
      .orderBy("createdAt", "asc")
      .limit(PAGE_LIMIT)
      .get();

    let nextCursor: number | null = null;

    const orders: ExportOrder[] = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const shipping = (data.shipping as Record<string, unknown> | undefined) ?? {};
      const itemsRaw = Array.isArray(data.items) ? data.items : [];
      const subtotal = typeof data.subtotal === "number" ? data.subtotal : 0;
      const shippingFee = typeof data.shippingCost === "number" ? data.shippingCost : 0;
      const total = typeof data.total === "number" ? data.total : 0;
      const discount = Math.max(0, subtotal + shippingFee - total);
      const createdAtValue = data.createdAt ?? null;
      const createdAtMs = toMillis(createdAtValue);

      if (createdAtMs !== null) {
        nextCursor = createdAtMs;
      }

      const items: ExportItem[] = itemsRaw.map((item) => {
        const itemData = item as Record<string, unknown>;
        return {
          name: typeof itemData.name === "string" ? itemData.name : "",
          slug: typeof itemData.slug === "string" ? itemData.slug : "",
          quantity: typeof itemData.quantity === "number" ? itemData.quantity : 0,
          price: typeof itemData.price === "number" ? itemData.price : 0,
        };
      });

      return {
        orderId: doc.id,
        createdAt: toIsoString(createdAtValue),
        status: typeof data.status === "string" ? data.status : "",
        customerName: typeof shipping.customerName === "string" ? shipping.customerName : "",
        customerEmail: typeof data.customerEmail === "string" ? data.customerEmail : "",
        phone: typeof shipping.phone === "string" ? shipping.phone : "",
        address: typeof shipping.address === "string" ? shipping.address : "",
        subtotal,
        shippingFee,
        discount,
        total,
        paymentMethod: typeof data.paymentMethod === "string" ? data.paymentMethod : "",
        items,
      };
    });

    return NextResponse.json({ orders, nextCursor });
  } catch (error) {
    console.error("[api/admin/orders-sync] GET error", error);
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    return NextResponse.json({ error: "server_error", message }, { status: 500 });
  }
}
