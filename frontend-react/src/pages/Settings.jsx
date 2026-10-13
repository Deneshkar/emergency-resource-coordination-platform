import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import { sendWhatsAppTest } from "../services/emailNotificationService";
import "./Settings.css";

const DISPLAY_MODES = [
  { name: "Dark (Default)", value: "dark", icon: "🌙", hex: "#38bdf8" },
  { name: "Light Mode", value: "light", icon: "☀️", hex: "#3b82f6" },
  { name: "Midnight", value: "midnight", icon: "🌌", hex: "#6366f1" },
  { name: "Hacker", value: "hacker", icon: "💻", hex: "#22c55e" },
  { name: "Sunset", value: "sunset", icon: "🌅", hex: "#f59e0b" },
  { name: "Ocean", value: "ocean", icon: "🌊", hex: "#06b6d4" },
  { name: "OLED Black", value: "oled", icon: "⬛", hex: "#d4d4d4" },
  { name: "Purple Royal", value: "purple", icon: "🔮", hex: "#a855f7" },
];

export default function Settings() {
  const { language, setLanguage, languages, t } = useLanguage();

  const [currentTheme, setCurrentTheme] = useState(
    localStorage.getItem("ercp_theme") || "dark"
  );
  const [notifications, setNotifications] = useState(
    localStorage.getItem("ercp_notifications") === "true"
  );
  const [waRecipient, setWaRecipient] = useState("+94 0711759718");
  const [waTesting, setWaTesting] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem("ercp_theme", currentTheme);
  }, [currentTheme]);

  const handleLanguageChange = (code) => {
    if (code === language) return;
    setLanguage(code);
    const selectedLang = languages.find((l) => l.code === code);
    toast.success(
      code === "ta"
        ? "மொழி மாற்றப்பட்டது"
        : code === "si"
        ? "භාෂාව වෙනස් කරන ලදී"
        : "Language Updated",
      {
        description:
          code === "ta"
            ? `இடைமுக மொழி ${selectedLang?.nativeName}க்கு மாற்றப்பட்டது.`
            : code === "si"
            ? `පද්ධති භාෂාව ${selectedLang?.nativeName} බවට පත් කරන ලදී.`
            : `Interface language switched to ${selectedLang?.name}.`,
      }
    );
  };

  const handleNotificationToggle = (e) => {
    const isChecked = e.target.checked;
    setNotifications(isChecked);
    if (isChecked) {
      toast.success(t("notif_enabled_toast"), {
        description: t("notif_enabled_toast_desc"),
      });
    }
  };

  const handleSendWhatsAppTest = async () => {
    try {
      setWaTesting(true);
      const res = await sendWhatsAppTest(waRecipient);
      if (res && res.success) {
        toast.success("WhatsApp Alert Sent!", {
          description: `Message delivered to ${res.recipient || waRecipient} (ID: ${res.messageId || "OK"}).`,
        });
      } else {
        toast.error("WhatsApp Send Failed", {
          description: res?.error || "Could not deliver WhatsApp message. Check connection.",
        });
      }
    } catch (err) {
      toast.error("WhatsApp Send Error", {
        description: err.message || "Failed to trigger test.",
      });
    } finally {
      setWaTesting(false);
    }
  };

  useEffect(() => {
    localStorage.setItem("ercp_notifications", notifications);
  }, [notifications]);

  return (
    <div className="incident-hub-container settings-page">
      <div className="command-header">
        <div>
          <div className="subtitle-tag">{t("preferences")}</div>
          <h1 className="header-title">{t("system_settings")}</h1>
          <p className="header-desc">{t("settings_desc")}</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Language Selection Card */}
        <div className="stat-card">
          <div className="settings-section">
            <h3 style={{ marginBottom: "0.5rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🌐</span> {t("language_title")}
            </h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.25rem", fontSize: "0.9rem" }}>
              {t("language_desc")}
            </p>
            <div className="lang-options">
              {languages.map((lang) => {
                const isActive = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    className={`lang-btn ${isActive ? "active" : ""}`}
                    onClick={() => handleLanguageChange(lang.code)}
                    type="button"
                    title={`Switch to ${lang.nativeName} (${lang.name})`}
                  >
                    <div className="lang-header">
                      <span className="lang-flag">{lang.flag}</span>
                      <span className="lang-native">{lang.nativeName}</span>
                      {isActive && <span className="lang-badge">Active</span>}
                    </div>
                    <span className="lang-name">{lang.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Display Modes Card */}
        <div className="stat-card">
          <div className="settings-section">
            <h3 style={{ marginBottom: "0.5rem", color: "var(--text-primary)" }}>{t("display_modes")}</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.25rem", fontSize: "0.9rem" }}>
              {t("display_modes_desc")}
            </p>
            <div className="theme-options">
              {DISPLAY_MODES.map((mode) => (
                <button
                  key={mode.value}
                  className={`theme-btn ${currentTheme === mode.value ? "active" : ""}`}
                  onClick={() => setCurrentTheme(mode.value)}
                  style={{ "--theme-color": mode.hex }}
                  title={mode.name}
                  type="button"
                >
                  <span className="theme-name">{mode.icon} {mode.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="stat-card">
          <div className="settings-section">
            <h3 style={{ marginBottom: "0.5rem", color: "var(--text-primary)" }}>{t("notifications")}</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.25rem", fontSize: "0.9rem" }}>
              {t("notifications_desc")}
            </p>
            <div className="toggle-wrapper">
              <label className="toggle-label">
                <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{t("system_notifications")}</span>
                <div className={`toggle-switch ${notifications ? "on" : "off"}`}>
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={handleNotificationToggle}
                    style={{ display: "none" }}
                  />
                  <span className="slider"></span>
                </div>
              </label>
              <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "0.5rem" }}>
                {notifications ? t("notifications_enabled_desc") : t("notifications_disabled_desc")}
              </p>
            </div>
          </div>
        </div>

        {/* WhatsApp Emergency Alerts Card */}
        <div className="stat-card">
          <div className="settings-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <h3 style={{ margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>💬</span> WhatsApp Emergency Alerts
              </h3>
              <span style={{ fontSize: "0.75rem", background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", padding: "3px 8px", borderRadius: "12px", fontWeight: 600, border: "1px solid rgba(34, 197, 94, 0.3)" }}>
                ● Meta API Active
              </span>
            </div>
            <p style={{ color: "var(--text-muted)", marginBottom: "1rem", fontSize: "0.9rem" }}>
              Automated high-priority notifications delivered directly via WhatsApp Cloud API.
            </p>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-color, #334155)", borderRadius: "8px", padding: "12px", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
                Active Automated Alert Triggers:
              </div>
              <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                <li>🚨 <strong>Critical Emergencies:</strong> Instant dispatch alert on High/Critical incident creation</li>
                <li>⚠️ <strong>Inventory Low Stock:</strong> Immediate alert when supplies drop below safety threshold</li>
                <li>❌ <strong>Out of Stock:</strong> Critical alert when emergency resources hit zero</li>
                <li>🚛 <strong>Resource Dispatches:</strong> Real-time deployment alerts for ambulances & rescue units</li>
              </ul>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-primary)" }}>
                Alert Recipient Phone Number
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  value={waRecipient}
                  onChange={(e) => setWaRecipient(e.target.value)}
                  placeholder="+94 0711759718"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color, #334155)",
                    background: "var(--bg-secondary, #1e293b)",
                    color: "var(--text-primary, #fff)",
                    fontSize: "0.9rem",
                  }}
                />
                <button
                  type="button"
                  onClick={handleSendWhatsAppTest}
                  disabled={waTesting}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    background: "#22c55e",
                    color: "#fff",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: waTesting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {waTesting ? "Sending..." : "📲 Test Alert"}
                </button>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                Configured with Meta WhatsApp Cloud API (Phone ID: 1298668496670646)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
