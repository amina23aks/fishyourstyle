import type { Order } from "@/types/order";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendOrderTelegramNotification(order: Order): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("[Telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return;
  }

  try {
    const orderShortId = order.id.slice(-6);
    const customerEmail = order.customerEmail?.trim() || "guest (no email)";
    const customerLine = `${order.shipping.customerName} – ${order.shipping.wilaya} – ${order.shipping.mode}`;
    const itemsLines = order.items
      .map(
        (item) =>
          `• ${item.quantity}x ${item.name} – ${item.colorName} / ${item.size}`,
      )
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
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      }),
    });
  } catch (error) {
    console.error("[Telegram] Failed to send order notification", error);
  }
}
