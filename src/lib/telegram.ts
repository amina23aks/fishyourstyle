import type { Order } from "@/types/order";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_NOTIFICATIONS_ENABLED = process.env.TELEGRAM_NOTIFICATIONS_ENABLED;

export async function sendOrderTelegramNotification(order: Order): Promise<void> {
  if (TELEGRAM_NOTIFICATIONS_ENABLED !== "true") {
    console.log("[Telegram] Notifications disabled by TELEGRAM_NOTIFICATIONS_ENABLED");
    return;
  }

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("[Telegram] Missing TELEGRAM env at runtime", {
      hasToken: !!TELEGRAM_BOT_TOKEN,
      hasChatId: !!TELEGRAM_CHAT_ID,
    });
    return;
  }

  console.log("[Telegram] Sending message to chat", TELEGRAM_CHAT_ID);

  try {
    const orderShortId = order.id.slice(-6);
    const customerEmail = order.customerEmail?.trim() || "guest (no email)";
    const customerLine = `${order.shipping.customerName} – ${order.shipping.wilaya} – ${order.shipping.mode}`;
    const itemsLines = order.items
      .map((item) => `• ${item.quantity}x ${item.name} – ${item.colorName} / ${item.size}`)
      .join("\n");

    const messageParts = [
      `🛒 New order #${orderShortId} – ${order.total} DZD`,
      customerLine,
      itemsLines ? `Items:\n${itemsLines}` : "Items: none",
      `Status: ${order.status}`,
      `From: ${customerEmail}`,
    ];

    const message = messageParts.join("\n");

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      }),
    });

    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // ignore JSON parse errors
    }

    if (!res.ok || (body && typeof body === "object" && (body as { ok?: boolean }).ok === false)) {
      console.error("[Telegram] API error", {
        status: res.status,
        statusText: res.statusText,
        body,
      });
    } else {
      console.log("[Telegram] Message sent successfully", {
        status: res.status,
        body,
      });
    }
  } catch (error) {
    console.error("[Telegram] Failed to send order notification", error);
  }
}
