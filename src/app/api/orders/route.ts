import { NextRequest, NextResponse } from "next/server";
import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type Query,
} from "firebase-admin/firestore";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

import type { NewOrder, Order, OrderStatus, ShippingInfo } from "@/types/order";
import { getAdminResources, isAdmin } from "@/lib/firebaseAdmin";
import { sendOrderTelegramNotification } from "@/lib/telegram";
import { dateKeyInTZ, weekKeyInTZ } from "@/lib/dateKeys";
import { normalizeProductStock } from "@/lib/stock";
import { isValidAlgeriaPhone } from "@/lib/algeriaPhone";
import {
  checkRateLimit,
  getOptionalTrimmedString,
  getTrimmedString,
  hasHoneypotValue,
  isPlainObject,
  isValidEmail,
} from "@/lib/apiProtection";

const ADMIN_STATS_DOC = "adminStats/summary";
const ORDER_RATE_LIMIT = {
  keyPrefix: "orders-post",
  limit: 10,
  windowMs: 60 * 60 * 1000,
};

function parseBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!authHeader) return null;
  const [scheme, value] = authHeader.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !value) return null;
  return value.trim();
}

async function requireAuth(
  request: NextRequest,
  auth: ReturnType<typeof getAuth>,
): Promise<NextResponse<{ error: string }> | DecodedIdToken> {
  const bearerToken = parseBearerToken(request);
  if (!bearerToken) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const decoded = await auth.verifyIdToken(bearerToken);
    return decoded;
  } catch (error) {
    console.error("[api/orders] Token verification failed", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

const ALLOWED_SHIPPING_MODES = ["home", "desk"] as const;

function isPositiveSafeNumber(value: unknown, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max;
}

function isPositiveInteger(value: unknown, max: number): value is number {
  return Number.isInteger(value) && typeof value === "number" && value > 0 && value <= max;
}

/**
 * Validate NewOrder payload and normalize customer-controlled strings.
 */
function normalizeOrderPayload(data: unknown): NewOrder | null {
  if (!isPlainObject(data)) return null;

  const itemsPayload = data.items;
  if (!Array.isArray(itemsPayload) || itemsPayload.length === 0 || itemsPayload.length > 25) return null;

  const items = itemsPayload.map((item) => {
    if (!isPlainObject(item)) return null;

    const id = getTrimmedString(item, "id", 80);
    const slug = getTrimmedString(item, "slug", 120);
    const name = getTrimmedString(item, "name", 160);
    const currency = getTrimmedString(item, "currency", 10);
    const image = getTrimmedString(item, "image", 500);
    const colorName = getTrimmedString(item, "colorName", 80);
    const colorCode = getTrimmedString(item, "colorCode", 80);
    const size = getTrimmedString(item, "size", 30);
    const variantKey = getTrimmedString(item, "variantKey", 220);
    const category = getOptionalTrimmedString(item, "category", 80);
    const design = getOptionalTrimmedString(item, "design", 80);

    if (
      !id ||
      !slug ||
      !name ||
      !currency ||
      !image ||
      !colorName ||
      !colorCode ||
      !size ||
      !variantKey ||
      category === null ||
      design === null ||
      !isPositiveSafeNumber(item.price, 1_000_000) ||
      item.price <= 0 ||
      !isPositiveInteger(item.quantity, 20)
    ) {
      return null;
    }

    return {
      id,
      slug,
      name,
      ...(category ? { category } : {}),
      ...(design ? { design } : {}),
      price: item.price,
      currency,
      image,
      colorName,
      colorCode,
      size,
      quantity: item.quantity,
      variantKey,
    };
  });

  if (items.some((item) => item === null)) return null;

  const shippingPayload = data.shipping;
  if (!isPlainObject(shippingPayload)) return null;

  const customerName = getTrimmedString(shippingPayload, "customerName", 100);
  const phone = getTrimmedString(shippingPayload, "phone", 40);
  const wilaya = getTrimmedString(shippingPayload, "wilaya", 80);
  const address = getTrimmedString(shippingPayload, "address", 300);
  const mode = getTrimmedString(shippingPayload, "mode", 10);

  if (
    !customerName ||
    !phone ||
    !wilaya ||
    !address ||
    !mode ||
    !isValidAlgeriaPhone(phone) ||
    !ALLOWED_SHIPPING_MODES.includes(mode as (typeof ALLOWED_SHIPPING_MODES)[number]) ||
    !isPositiveSafeNumber(shippingPayload.price, 100_000)
  ) {
    return null;
  }

  if (
    !isPositiveSafeNumber(data.subtotal, 20_000_000) ||
    !isPositiveSafeNumber(data.shippingCost, 100_000) ||
    !isPositiveSafeNumber(data.total, 20_100_000)
  ) {
    return null;
  }

  if (data.paymentMethod !== "COD") return null;
  if (data.status !== "pending") return null;

  const customerEmail = getOptionalTrimmedString(data, "customerEmail", 254);
  if (customerEmail === null || (customerEmail && !isValidEmail(customerEmail))) return null;

  const userId = getOptionalTrimmedString(data, "userId", 128);
  if (userId === null) return null;

  const notes = getOptionalTrimmedString(data, "notes", 500);
  if (notes === null) return null;

  return {
    ...(userId ? { userId } : {}),
    ...(customerEmail ? { customerEmail } : {}),
    items: items as NewOrder["items"],
    shipping: {
      customerName,
      phone,
      wilaya,
      address,
      mode: mode as ShippingInfo["mode"],
      price: shippingPayload.price,
    },
    ...(notes ? { notes } : {}),
    subtotal: data.subtotal,
    shippingCost: data.shippingCost,
    total: data.total,
    paymentMethod: "COD",
    status: data.status as OrderStatus,
  };
}

function normalizeCostPrice(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
}

function hasInvalidOrderPhone(data: unknown): boolean {
  if (!isPlainObject(data) || !isPlainObject(data.shipping)) return false;
  const phone = data.shipping.phone;
  return typeof phone === "string" && phone.trim().length > 0 && !isValidAlgeriaPhone(phone.trim());
}

function resolveStockState(data: DocumentData): { stockMode: "unlimited" | "limited"; stockQty: number | null } {
  const stockState = normalizeProductStock({
    stockMode: data.stockMode,
    stockQty: typeof data.stockQty === "number" ? data.stockQty : undefined,
    stockQuantity: typeof data.stockQuantity === "number" ? data.stockQuantity : undefined,
    stock: typeof data.stock === "number" ? data.stock : undefined,
    inStock: typeof data.inStock === "boolean" ? data.inStock : undefined,
  });
  return {
    stockMode: stockState.stockMode,
    stockQty: stockState.stockMode === "limited" ? stockState.stockQty : null,
  };
}

/**
 * POST /api/orders
 * Create a new order in Firestore
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, ORDER_RATE_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const rawBody = (await request.json().catch(() => null)) as unknown;
    if (!isPlainObject(rawBody)) {
      return NextResponse.json({ error: "Invalid order data. Please check all required fields." }, { status: 400 });
    }

    if (hasHoneypotValue(rawBody)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const {
      userId: _ignoredUserId,
      createdAt: _ignoredCreatedAt,
      updatedAt: _ignoredUpdatedAt,
      cancelledAt: _ignoredCancelledAt,
      totalBeforeDiscount: _ignoredTotalBeforeDiscount,
      discountType: _ignoredDiscountType,
      discountPercent: _ignoredDiscountPercent,
      discountAmount: _ignoredDiscountAmount,
      customerEmail: _ignoredCustomerEmail,
      website: _ignoredWebsite,
      company: _ignoredCompany,
      ...rest
    } = rawBody;
    void _ignoredUserId;
    void _ignoredCreatedAt;
    void _ignoredUpdatedAt;
    void _ignoredCancelledAt;
    void _ignoredTotalBeforeDiscount;
    void _ignoredDiscountType;
    void _ignoredDiscountPercent;
    void _ignoredDiscountAmount;
    void _ignoredCustomerEmail;
    void _ignoredWebsite;
    void _ignoredCompany;

    const normalizedOrder = normalizeOrderPayload(rest);
    if (!normalizedOrder) {
      if (hasInvalidOrderPhone(rest)) {
        return NextResponse.json(
          { error: "Please enter a valid Algerian phone number." },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { error: "Invalid order data. Please check all required fields." },
        { status: 400 },
      );
    }

    const adminResources = getAdminResources();
    if (!adminResources) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured. Please add your Firebase environment variables." },
        { status: 503 },
      );
    }
    const { db, auth } = adminResources;

    const bearerToken = parseBearerToken(request);
    let decoded: DecodedIdToken | null = null;
    if (bearerToken) {
      try {
        decoded = await auth.verifyIdToken(bearerToken);
      } catch (error) {
        console.warn("[api/orders] Invalid auth token provided, proceeding as guest.", error);
      }
    }

    const orderData = normalizedOrder;

    const authenticatedCustomerEmail = typeof decoded?.email === "string" ? decoded.email.trim() : "";

    const orderToSave: NewOrder = {
      ...orderData,
      customerEmail: authenticatedCustomerEmail || undefined,
      userId: typeof decoded?.uid === "string" && decoded.uid.trim() ? decoded.uid : undefined,
      status: "pending",
    };

    const cleanedOrder = Object.fromEntries(
      Object.entries(orderToSave).filter(([, v]) => v !== undefined),
    ) as NewOrder;

    let orderDataForFirestore = {
      ...cleanedOrder,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    const todayKey = dateKeyInTZ(new Date(), "Africa/Algiers");
    const weekKey = weekKeyInTZ(new Date(), "Africa/Algiers");
    const orderSubtotal = typeof orderToSave.subtotal === "number" ? orderToSave.subtotal : 0;
    const orderShippingCost =
      typeof orderToSave.shippingCost === "number" ? orderToSave.shippingCost : 0;
    const orderTotalBeforeDiscount = orderSubtotal + orderShippingCost;
    const defaultLoyaltyPercent = 8;
    let loyaltyDiscountPercent = 0;
    let loyaltyDiscountAmount = 0;
    let loyaltyApplied = false;
    let orderTotal = 0;
    const fallbackProductRevenue = orderToSave.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const productRevenue =
      typeof orderToSave.subtotal === "number" ? orderToSave.subtotal : fallbackProductRevenue;

    console.log("[api/orders] Order payload prepared", {
      hasUser: Boolean(orderToSave.userId),
      items: orderToSave.items.length,
    });

    const ordersCollection = db.collection("orders");
    const productsCollection = db.collection("products");

    const aggregatedQuantities = orderToSave.items.reduce<Record<string, number>>((acc, item) => {
      acc[item.id] = (acc[item.id] ?? 0) + item.quantity;
      return acc;
    }, {});

    let createdOrderId: string | null = null;
    let savedOrder: Order | null = null;
    const productSnapshots = new Map<string, DocumentData>();

    await db.runTransaction(async (transaction) => {
      const summaryRef = db.doc(ADMIN_STATS_DOC);
      const summarySnapshot = await transaction.get(summaryRef);
      const summaryData = summarySnapshot.data() ?? {};
      const previousTodayKey =
        typeof summaryData.todayKey === "string" ? summaryData.todayKey : null;
      const previousWeekKey =
        typeof summaryData.weekKey === "string" ? summaryData.weekKey : null;
      const baseOrdersToday =
        previousTodayKey === todayKey ? Number(summaryData.ordersToday ?? 0) : 0;
      const baseRevenueToday =
        previousTodayKey === todayKey ? Number(summaryData.revenueToday ?? 0) : 0;
      const baseOrdersWeek =
        previousWeekKey === weekKey ? Number(summaryData.ordersThisWeek ?? 0) : 0;
      const baseRevenueWeek =
        previousWeekKey === weekKey ? Number(summaryData.revenueThisWeek ?? 0) : 0;
      const dailyRef = db.collection("adminStatsDaily").doc(todayKey);
      const dailySnapshot = await transaction.get(dailyRef);
      const dailyData = dailySnapshot.data() ?? {};
      const userRef = orderToSave.userId
        ? db.collection("users").doc(orderToSave.userId)
        : null;
      const userSnapshot = userRef ? await transaction.get(userRef) : null;
      const userData = userSnapshot?.data();

      for (const [productId, requestedQty] of Object.entries(aggregatedQuantities)) {
        const productRef = productsCollection.doc(productId);
        const snapshot = await transaction.get(productRef);
        if (!snapshot.exists) {
          throw new Error(`Product not found: ${productId}`);
        }
        const data = snapshot.data();
        if (!data) {
          throw new Error(`Product data missing: ${productId}`);
        }

        productSnapshots.set(productId, data);
        const stockState = resolveStockState(data);
        if (stockState.stockMode === "limited") {
          const availableStock = stockState.stockQty ?? 0;
          if (requestedQty > availableStock) {
            const name = typeof data.name === "string" ? data.name : productId;
            throw new Error(`Insufficient stock for ${name}`);
          }
        }
      }

      if (userData) {
        const rewardAvailable = Boolean(userData.loyaltyRewardAvailable);
        const rewardPercent =
          typeof userData.loyaltyRewardPercent === "number"
            ? userData.loyaltyRewardPercent
            : defaultLoyaltyPercent;
        if (rewardAvailable && rewardPercent > 0) {
          loyaltyDiscountPercent = rewardPercent;
          loyaltyDiscountAmount = Math.round((orderSubtotal * rewardPercent) / 100);
          loyaltyApplied = loyaltyDiscountAmount > 0;
        }
      }

      orderTotal = Math.max(0, orderSubtotal + orderShippingCost - loyaltyDiscountAmount);

      for (const [productId, requestedQty] of Object.entries(aggregatedQuantities)) {
        const productRef = productsCollection.doc(productId);
        const data = productSnapshots.get(productId);
        if (!data) continue;
        const stockState = resolveStockState(data);
        if (stockState.stockMode === "limited") {
          const currentStock = stockState.stockQty ?? 0;
          const nextStock = Math.max(currentStock - requestedQty, 0);
          transaction.update(productRef, {
            stockMode: "limited",
            stockQty: nextStock,
            stock: nextStock,
            inStock: nextStock > 0,
          });
        }
      }
      if (loyaltyApplied && userRef) {
        transaction.set(
          userRef,
          {
            loyaltyRewardAvailable: false,
            loyaltyRedeemedCount: FieldValue.increment(1),
          },
          { merge: true }
        );
      }

      const existingCategoryTotals =
        typeof dailyData.topCategories === "object" && dailyData.topCategories
          ? (dailyData.topCategories as Record<string, number>)
          : {};
      const existingDesignTotals =
        typeof dailyData.topDesignThemes === "object" && dailyData.topDesignThemes
          ? (dailyData.topDesignThemes as Record<string, number>)
          : {};
      const existingProductTotals =
        typeof dailyData.topProducts === "object" && dailyData.topProducts
          ? (dailyData.topProducts as Record<string, { name: string; qty: number; revenue: number }>)
          : {};
      const nextCategoryTotals = { ...existingCategoryTotals };
      const nextDesignTotals = { ...existingDesignTotals };
      const nextProductTotals = { ...existingProductTotals };

      // Snapshot admin-only cost/profit plus category/design to avoid extra reads during exports.
      const itemsWithMetadata = orderToSave.items.map((item) => {
        const productData = productSnapshots.get(item.id);
        const categoryFromCart = typeof item.category === "string" ? item.category.trim() : "";
        const designFromCart = typeof item.design === "string" ? item.design.trim() : "";
        const category =
          categoryFromCart ||
          (typeof productData?.category === "string" && productData.category.trim()
            ? productData.category
            : "");
        const design =
          designFromCart ||
          (typeof productData?.designTheme === "string" && productData.designTheme.trim()
            ? productData.designTheme
            : "");
        const itemCostPrice = normalizeCostPrice(productData?.costPrice ?? productData?.purchasePrice);
        const itemProfit = item.price - itemCostPrice;
        const itemProfitTotal = itemProfit * item.quantity;
        return { ...item, category, design, itemCostPrice, itemProfit, itemProfitTotal };
      });
      const costOfGoodsSold = itemsWithMetadata.reduce(
        (sum, item) => sum + item.itemCostPrice * item.quantity,
        0,
      );
      const netProfit = itemsWithMetadata.reduce((sum, item) => sum + item.itemProfitTotal, 0);

      for (const item of itemsWithMetadata) {
        const productData = productSnapshots.get(item.id);
        const category =
          typeof productData?.category === "string" && productData.category.trim()
            ? productData.category
            : "uncategorized";
        const design =
          typeof item.design === "string" && item.design.trim() ? item.design.trim() : "Unknown";
        const revenue = item.price * item.quantity;
        nextCategoryTotals[category] = (nextCategoryTotals[category] ?? 0) + revenue;
        nextDesignTotals[design] = (nextDesignTotals[design] ?? 0) + revenue;
        const existingProduct = nextProductTotals[item.id] ?? {
          name: item.name,
          qty: 0,
          revenue: 0,
        };
        nextProductTotals[item.id] = {
          name: existingProduct.name || item.name,
          qty: existingProduct.qty + item.quantity,
          revenue: existingProduct.revenue + revenue,
        };
      }

      const orderRef = ordersCollection.doc();
      createdOrderId = orderRef.id;
      orderDataForFirestore = {
        ...orderDataForFirestore,
        items: itemsWithMetadata,
        totalBeforeDiscount: orderTotalBeforeDiscount,
        total: orderTotal,
        costOfGoodsSold,
        netProfit,
        profitSnapshotComplete: true,
      };
      if (loyaltyApplied) {
        orderDataForFirestore = {
          ...orderDataForFirestore,
          discountType: "LOYALTY",
          discountPercent: loyaltyDiscountPercent,
          discountAmount: loyaltyDiscountAmount,
        };
      }
      transaction.set(orderRef, orderDataForFirestore);

      transaction.set(
        summaryRef,
        {
          totalOrders: Number(summaryData.totalOrders ?? 0) + 1,
          totalRevenue: Number(summaryData.totalRevenue ?? 0) + productRevenue,
          pendingOrders: Number(summaryData.pendingOrders ?? 0) + 1,
          ordersToday: baseOrdersToday + 1,
          revenueToday: baseRevenueToday + productRevenue,
          ordersThisWeek: baseOrdersWeek + 1,
          revenueThisWeek: baseRevenueWeek + productRevenue,
          updatedAt: FieldValue.serverTimestamp(),
          todayKey,
          weekKey,
        },
        { merge: true }
      );

      transaction.set(
        dailyRef,
        {
          orders: Number(dailyData.orders ?? 0) + 1,
          revenue: Number(dailyData.revenue ?? 0) + productRevenue,
          topCategories: nextCategoryTotals,
          topDesignThemes: nextDesignTotals,
          topProducts: nextProductTotals,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    if (!createdOrderId) {
      throw new Error("Order ID missing after transaction commit");
    }

    if (createdOrderId) {
      const orderDoc = db.collection("orders").doc(createdOrderId);
      const snapshot = await orderDoc.get();
      const createdData = snapshot.data();
      console.log("[api/orders] Order created", {
        orderId: createdOrderId,
        createdAtType: createdData?.createdAt
          ? createdData.createdAt.constructor?.name ?? typeof createdData.createdAt
          : "missing",
      });
      if (createdData) {
        savedOrder = firestoreDocToOrder(orderDoc.id, createdData);
      }
    }

    if (savedOrder) {
      console.log(`[Orders API] Order ${savedOrder.id} created successfully`);
      console.log(`[Orders API] Sending Telegram notification for ${savedOrder.id}`);
      try {
        await sendOrderTelegramNotification(savedOrder);
      } catch (error) {
        console.error("[Telegram] Notification error (non-fatal)", error);
        // Do NOT throw – order creation must still succeed even if Telegram is down.
      }
    }

    return NextResponse.json(
      {
        orderId: createdOrderId,
        totals: {
          subtotal: orderSubtotal,
          shippingCost: orderShippingCost,
          discountPercent: loyaltyApplied ? loyaltyDiscountPercent : 0,
          discountAmount: loyaltyApplied ? loyaltyDiscountAmount : 0,
          totalBeforeDiscount: orderTotalBeforeDiscount,
          total: orderTotal,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[api/orders] POST error", error);

    if (error instanceof Error) {
      const isStockError =
        error.message.toLowerCase().includes("insufficient stock") ||
        error.message.toLowerCase().includes("product not found");

      return NextResponse.json(
        {
          error: isStockError
            ? "Some items are no longer available. Please review your cart."
            : `Failed to create order: ${error.message}`,
        },
        { status: isStockError ? 400 : 500 },
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function timestampToISO(timestamp: unknown): string {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp && typeof timestamp === "object" && "toDate" in timestamp) {
    return (timestamp as Timestamp).toDate().toISOString();
  }
  if (
    typeof timestamp === "object" &&
    timestamp &&
    ("_seconds" in timestamp || "seconds" in timestamp) &&
    ("_nanoseconds" in timestamp || "nanoseconds" in timestamp)
  ) {
    const seconds =
      (timestamp as { _seconds?: number; seconds?: number })._seconds ??
      (timestamp as { _seconds?: number; seconds?: number }).seconds ??
      0;
    const nanos =
      (timestamp as { _nanoseconds?: number; nanoseconds?: number })._nanoseconds ??
      (timestamp as { _nanoseconds?: number; nanoseconds?: number }).nanoseconds ??
      0;
    const date = new Date(seconds * 1000 + Math.floor(nanos / 1_000_000));
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }
  if (typeof timestamp === "string") {
    return timestamp;
  }
  return new Date().toISOString();
}

function firestoreDocToOrder(docId: string, data: DocumentData, includeAdminFinancials = false): Order {
  return {
    id: docId,
    userId: typeof data.userId === "string" ? data.userId : undefined,
    customerEmail: typeof data.customerEmail === "string" ? data.customerEmail : undefined,
    items: Array.isArray(data.items)
      ? data.items.map((item: unknown) => {
          if (includeAdminFinancials || !item || typeof item !== "object") return item;
          const { itemCostPrice, itemProfit, itemProfitTotal, ...publicItem } = item as Record<string, unknown>;
          void itemCostPrice;
          void itemProfit;
          void itemProfitTotal;
          return publicItem;
        }) as Order["items"]
      : [],
    shipping: data.shipping,
    notes: data.notes,
    subtotal: data.subtotal,
    shippingCost: data.shippingCost,
    totalBeforeDiscount: data.totalBeforeDiscount,
    discountType: data.discountType,
    discountPercent: data.discountPercent,
    discountAmount: data.discountAmount,
    total: data.total,
    paymentMethod: data.paymentMethod || "COD",
    status: (data.status || "pending") as OrderStatus,
    createdAt: timestampToISO(data.createdAt),
    updatedAt: timestampToISO(data.updatedAt),
    cancelledAt: data.cancelledAt ? timestampToISO(data.cancelledAt) : undefined,
    ...(includeAdminFinancials
      ? {
          costOfGoodsSold: typeof data.costOfGoodsSold === "number" ? data.costOfGoodsSold : undefined,
          netProfit: typeof data.netProfit === "number" ? data.netProfit : undefined,
          profitSnapshotComplete:
            typeof data.profitSnapshotComplete === "boolean" ? data.profitSnapshotComplete : undefined,
          returnCost: typeof data.returnCost === "number" ? data.returnCost : undefined,
        }
      : {}),
  };
}

/**
 * GET /api/orders
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const userId = searchParams.get("userId");

    const adminResources = getAdminResources();
    if (!adminResources) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured. Please add your Firebase environment variables." },
        { status: 503 },
      );
    }
    const { db, auth } = adminResources;
    const ordersCollection = db.collection("orders");

    const bearerToken = parseBearerToken(request);
    const requiresAuth = Boolean(orderId || userId || (!orderId && !userId));
    if (requiresAuth && !bearerToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    let decoded: DecodedIdToken | null = null;
    if (bearerToken) {
      try {
        decoded = await auth.verifyIdToken(bearerToken);
      } catch (error) {
        console.error("[api/orders] Token verification failed", error);
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
    }

    if (orderId) {
      const orderDoc = ordersCollection.doc(orderId);
      const orderSnapshot = await orderDoc.get();

      if (!orderSnapshot.exists) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const data = orderSnapshot.data();
      if (!data) {
        return NextResponse.json({ error: "Order data missing" }, { status: 500 });
      }

      const ownerId = typeof data.userId === "string" ? data.userId : undefined;
      const authorized = isAdmin(decoded) || (!!decoded?.uid && ownerId === decoded.uid);
      if (!authorized) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const orderData = firestoreDocToOrder(orderSnapshot.id, data, isAdmin(decoded));
      return NextResponse.json(orderData);
    }

    const orders: Order[] = [];

    if (userId && userId.trim()) {
      const authorized = isAdmin(decoded) || (!!decoded?.uid && decoded.uid === userId);
      if (!authorized) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const userOrdersQuery = ordersCollection
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc") as Query<DocumentData>;
      const userOrdersSnapshot = await userOrdersQuery.get();

      userOrdersSnapshot.forEach((snapshotDoc) => {
        const orderData = snapshotDoc.data();
        if (orderData) {
          orders.push(firestoreDocToOrder(snapshotDoc.id, orderData as DocumentData, isAdmin(decoded)));
        }
      });

      return NextResponse.json(orders);
    }

    if (!isAdmin(decoded)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ordersQuery = ordersCollection.orderBy("createdAt", "desc") as Query<DocumentData>;
    const ordersSnapshot = await ordersQuery.get();

    ordersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data) {
        orders.push(firestoreDocToOrder(doc.id, data as DocumentData, true));
      }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("[api/orders] GET error", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch orders";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * PATCH /api/orders (cancel)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { orderId, action } = body as { orderId?: string; action?: string };

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "orderId is required and must be a string" }, { status: 400 });
    }

    if (action !== "cancel") {
      return NextResponse.json({ error: 'Only "cancel" action is supported' }, { status: 400 });
    }

    const adminResources = getAdminResources();
    if (!adminResources) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured. Please add your Firebase environment variables." },
        { status: 503 },
      );
    }
    const { db, auth } = adminResources;

    const decoded = await requireAuth(request, auth);
    if (decoded instanceof NextResponse) {
      return decoded;
    }

    const ordersCollection = db.collection("orders");
    const orderDoc = ordersCollection.doc(orderId);
    const orderSnapshot = await orderDoc.get();

    if (!orderSnapshot.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = orderSnapshot.data();
    if (!orderData) {
      return NextResponse.json({ error: "Order data missing" }, { status: 500 });
    }

    const isOwner = typeof orderData.userId === "string" ? orderData.userId === decoded.uid : false;
    if (!isOwner && !isAdmin(decoded)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const currentStatus = orderData.status as OrderStatus;
    if (currentStatus !== "pending") {
      return NextResponse.json(
        { error: `Cannot cancel order with status "${currentStatus}". Only pending orders can be cancelled.` },
        { status: 400 },
      );
    }

    await orderDoc.update({
      status: "cancelled",
      updatedAt: FieldValue.serverTimestamp(),
    });

    const updatedSnapshot = await orderDoc.get();
    const updatedData = updatedSnapshot.data();

    if (!updatedData) {
      return NextResponse.json({ error: "Updated order data not found" }, { status: 500 });
    }

    const updatedOrderData = firestoreDocToOrder(updatedSnapshot.id, updatedData);
    return NextResponse.json(updatedOrderData);
  } catch (error) {
    console.error("[api/orders] PATCH error", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update order";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
