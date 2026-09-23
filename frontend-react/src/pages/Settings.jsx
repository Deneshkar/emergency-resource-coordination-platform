import { useState, useEffect } from "react";
import { toast } from "sonner";
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
  const [currentTheme, setCurrentTheme] = useState(
    localStorage.getItem("ercp_theme") || "dark"
  );
  const [notifications, setNotifications] = useState(
    localStorage.getItem("ercp_notifications") === "true"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem("ercp_theme", currentTheme);
  }, [currentTheme]);

  const handleNotificationToggle = (e) => {
    const isChecked = e.target.checked;
    setNotifications(isChecked);
    if (isChecked) {
      toast.success("System notifications enabled", {
        description: "You will now receive critical alerts and AI updates."
      });
    }
  };

  useEffect(() => {
    localStorage.setItem("ercp_notifications", notifications);
  }, [notifications]);

  return (
    <div className="incident-hub-container settings-page">
      <div className="command-header">
        <div>
          <div className="subtitle-tag">PREFERENCES</div>
          <h1 className="header-title">System Settings</h1>
          <p className="header-desc">Customize your interface and notification preferences.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="stat-card">
          <div className="settings-section">
            <h3 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>Display Modes</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              Choose a global display mode for the application interface.
            </p>
            <div className="theme-options">
              {DISPLAY_MODES.map((mode) => (
                <button
                  key={mode.value}
                  className={`theme-btn ${currentTheme === mode.value ? "active" : ""}`}
                  onClick={() => setCurrentTheme(mode.value)}
                  style={{ "--theme-color": mode.hex }}
                  title={mode.name}
                >
                  <span className="theme-name">{mode.icon} {mode.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="settings-section">
            <h3 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>Notifications</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              Enable or disable system push notifications and alerts.
            </p>
            <div className="toggle-wrapper">
              <label className="toggle-label">
                <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>System Notifications</span>
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
                {notifications ? "Notifications are currently enabled." : "Notifications are currently disabled."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
