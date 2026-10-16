/**
 * Email Notification Service — Calls ERCP Backend SMTP Email API
 * Backend uses Gmail SMTP with app password credentials.
 * No browser-side secrets needed.
 */

import { getStoredToken } from "./api";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:5009"}/api/Notifications`;

async function postAlert(endpoint, body) {
  const token = getStoredToken();
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.warn("[EmailService] Alert API responded:", res.status, data);
    }
    return data;
  } catch (err) {
    console.error("[EmailService] Failed to call notification API:", err);
    return { success: false };
  }
}

// ── Pre-built alert senders ─────────────────────────────────────────

export async function sendLowStockEmail(itemName, quantity, minimumThreshold, location, unit = "") {
  return postAlert("/inventory/low-stock", { itemName, quantity, minimumThreshold, unit, location });
}

export async function sendOutOfStockEmail(itemName, location, unit = "") {
  return postAlert("/inventory/out-of-stock", { itemName, quantity: 0, minimumThreshold: 0, unit, location });
}

export async function sendStockRestoredEmail(itemName, newQuantity, unit = "") {
  return postAlert("/email", {
    alertType: "✅ Stock Restocked",
    subject: `[ERCP] Stock Restored: ${itemName}`,
    body:
      `INFO: Inventory item "${itemName}" has been restocked.\n\n` +
      `New Quantity : ${newQuantity} ${unit}\n\n` +
      `Stock level is now adequate.`,
    priority: "Info",
  });
}

export async function sendResourceDispatchedEmail(resourceName, resourceType, location) {
  return postAlert("/resource/status", {
    resourceName,
    resourceType: resourceType || "Unknown",
    newStatus: "Dispatched",
    location,
  });
}

export async function sendResourceMaintenanceEmail(resourceName, resourceType) {
  return postAlert("/resource/status", {
    resourceName,
    resourceType: resourceType || "Unknown",
    newStatus: "Maintenance",
    location: null,
  });
}

export async function sendResourceAddedEmail(resourceName, resourceType, location) {
  return postAlert("/email", {
    alertType: "➕ New Resource Registered",
    subject: `[ERCP] New Resource Added: ${resourceName}`,
    body:
      `INFO: A new resource has been registered in the system.\n\n` +
      `Name     : ${resourceName}\n` +
      `Type     : ${resourceType}\n` +
      `Location : ${location || "N/A"}\n\n` +
      `The resource is now available for dispatch.`,
    priority: "Info",
  });
}

// ── WhatsApp Alert Senders ──────────────────────────────────────────

export async function sendWhatsAppTest(recipient = null, message = null) {
  return postAlert("/whatsapp/test", { recipient, message });
}

export async function sendWhatsAppCustomAlert(title, message, priority = "High", recipient = null, alertType = "Alert") {
  return postAlert("/whatsapp", { title, message, priority, recipient, alertType });
}

export async function sendEmergencyAlert(title, category, priority, location, description, reporterContact = null, recipient = null) {
  return postAlert("/emergency", { title, category, priority, location, description, reporterContact, recipient });
}

export async function sendDisasterWarning(title, area, severity = "Critical", advisory = null, recipient = null) {
  return postAlert("/disaster-warning", { title, area, severity, advisory, recipient });
}
