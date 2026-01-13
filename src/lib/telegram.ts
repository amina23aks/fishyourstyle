import type { Order } from "@/types/order";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_NOTIFICATIONS_ENABLED = process.env.TELEGRAM_NOTIFICATIONS_ENABLED;

export async function sendOrderTelegramNotification(order: Order): Promise<void> {
  // Feature-flag: only send when explicitly enabled
  if (TELEGRAM_NOTIFICATIONS_ENABLED !== "true") {
    return;
  }

  // Must have token + chat id
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    // Keep only errors if you want; here we keep it silent to avoid noise
    return;
  }

  try {
    const orderShortId = order.id.slice(-6);
    const customerEmail = order.customerEmail?.trim() || "guest (no email)";
    const customerLine = `${order.shipping.customerName} – ${order.shipping.mode}`;
    const itemsLines = order.items
      .map((item) => `• ${item.quantity}x ${item.name} – ${item.colorName} / ${item.size}`)
      .join("\n");

    const message = [
      `🛒 New order #${orderShortId} – ${order.total} DZD`,
      customerLine,
      itemsLines ? `Items:\n${itemsLines}` : "Items: none",
      `Status: ${order.status}`,
      `From: ${customerEmail}`,
    ].join("\n");

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      }),
    });

    // Optional: only log errors (server-side) if Telegram API fails
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[Telegram] sendMessage failed", {
        status: res.status,
        statusText: res.statusText,
        response: text,
      });
    }
  } catch (error) {
    // Never throw, keep non-blocking
    console.error("[Telegram] Failed to send order notification", error);
  }
}
