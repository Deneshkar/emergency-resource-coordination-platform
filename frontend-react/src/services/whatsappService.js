/**
 * WhatsApp Direct Service — Calls Meta Cloud API directly from browser.
 * No backend required. Uses VITE_ env vars for credentials.
 */

const WA_TOKEN   = import.meta.env.VITE_WA_TOKEN;
const WA_PHONE_ID = import.meta.env.VITE_WA_PHONE_ID;
const WA_RECIPIENT = import.meta.env.VITE_WA_RECIPIENT || "94711759718";
const META_URL = `https://graph.facebook.com/v20.0/${WA_PHONE_ID}/messages`;

async function sendWA(to, text) {
  try {
    const res = await fetch(META_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WA_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/\D/g, ""),
        type: "text",
        text: { body: text },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("[WhatsApp] API error:", data);
      return { success: false, error: data?.error?.message || "Meta API error" };
    }
    return { success: true, messageId: data?.messages?.[0]?.id, recipient: to };
  } catch (err) {
    console.error("[WhatsApp] Network error:", err);
    return { success: false, error: err.message };
  }
}

function ts() {
  return new Date().toLocaleString("en-LK", { timeZone: "Asia/Colombo" });
}

// ── Alert Senders ────────────────────────────────────────────────────

export async function waLowStock(itemName, quantity, minimumThreshold, location, unit = "", to = WA_RECIPIENT) {
  const msg =
`⚠️ *[ERCP] LOW STOCK ALERT*
━━━━━━━━━━━━━━━━━━━━━
📦 *Item:* ${itemName}
📉 *Current Stock:* ${quantity} ${unit}
⚡ *Min Threshold:* ${minimumThreshold} ${unit}
📍 *Location:* ${location || "N/A"}
🚨 *Status:* LOW STOCK

⚠️ *Action Required:* Urgent replenishment needed.

🕒 ${ts()} (Sri Lanka)
_ERCP Inventory Alert System_`;
  return sendWA(to, msg);
}

export async function waOutOfStock(itemName, location, unit = "", to = WA_RECIPIENT) {
  const msg =
`🚨 *[ERCP] OUT OF STOCK — CRITICAL*
━━━━━━━━━━━━━━━━━━━━━
📦 *Item:* ${itemName}
❌ *Stock Level:* 0 ${unit}
📍 *Location:* ${location || "N/A"}
🔴 *Status:* COMPLETELY OUT OF STOCK

🆘 *IMMEDIATE ACTION REQUIRED!*
All emergency reserves depleted. Restock urgently.

🕒 ${ts()} (Sri Lanka)
_ERCP Emergency Logistics System_`;
  return sendWA(to, msg);
}

export async function waStockRestored(itemName, newQuantity, unit = "", to = WA_RECIPIENT) {
  const msg =
`✅ *[ERCP] STOCK RESTOCKED*
━━━━━━━━━━━━━━━━━━━━━
📦 *Item:* ${itemName}
📈 *New Stock Level:* ${newQuantity} ${unit}
🟢 *Status:* IN STOCK

Stock has been replenished successfully.

🕒 ${ts()} (Sri Lanka)
_ERCP Inventory Alert System_`;
  return sendWA(to, msg);
}

export async function waManualAlert(itemName, quantity, unit, minimumThreshold, location, status, to = WA_RECIPIENT) {
  const isOOS = quantity === 0 || status === "OutOfStock";
  const msg =
`${isOOS ? "🚨" : "⚠️"} *[ERCP] INVENTORY ALERT*
━━━━━━━━━━━━━━━━━━━━━
📦 *Item:* ${itemName}
📊 *Current Stock:* ${quantity} ${unit}
⚡ *Min Threshold:* ${minimumThreshold} ${unit}
📍 *Location:* ${location || "N/A"}
🔖 *Status:* ${isOOS ? "❌ OUT OF STOCK" : "⚠️ LOW STOCK"}

${isOOS ? "🆘 *IMMEDIATE RESTOCK REQUIRED!*" : "⚠️ *Replenishment recommended soon.*"}

🕒 ${ts()} (Sri Lanka)
_ERCP Inventory Alert System_`;
  return sendWA(to, msg);
}

export async function waTest(to = WA_RECIPIENT) {
  const msg =
`🔔 *[ERCP] WhatsApp Alert — Verification Test*

✅ Connection Active!
📱 Target: +${to}
🕒 ${ts()} (Sri Lanka)

_Emergency Resource Coordination Platform_`;
  return sendWA(to, msg);
}
