import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Modal from "./Modal";

const ROLE_THEMES = {
  Citizen: {
    badge: "badge-info",
    tag: "Verified Citizen Account",
    color: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.12)",
    border: "rgba(56, 189, 248, 0.3)",
    icon: "🛡️",
    summary: "Public Emergency Reporter & Citizen Tracking",
    description: "Submit real-time incident reports, monitor emergency response unit dispatches, and access regional evacuation shelters.",
  },
  Volunteer: {
    badge: "badge-success",
    tag: "Field Responder Taskforce",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.3)",
    icon: "🦺",
    summary: "Tactical First Responder",
    description: "Accept field task assignments, update on-scene operational status, and coordinate tactical response activities.",
  },
  Coordinator: {
    badge: "badge-warning",
    tag: "Operations Commander",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.3)",
    icon: "⚡",
    summary: "Emergency Operations Coordinator",
    description: "Oversee multi-incident coordination, review & approve autonomous AI response plans, and allocate critical resources.",
  },
  Admin: {
    badge: "badge-category",
    tag: "System Administrator",
    color: "#a855f7",
    bg: "rgba(168, 85, 247, 0.12)",
    border: "rgba(168, 85, 247, 0.3)",
    icon: "👑",
    summary: "Full System Administrator",
    description: "Complete operational oversight, system configuration, audit compliance, and user account management.",
  },
};

export default function UserProfileModal({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const role = user.role || "Citizen";
  const theme = ROLE_THEMES[role] || ROLE_THEMES.Citizen;
  const initial = user.fullName ? user.fullName.charAt(0).toUpperCase() : "U";

  const handleActionClick = (path) => {
    onClose();
    navigate(path);
  };

  const handleSignOut = () => {
    onClose();
    logout();
    navigate("/login");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Account Profile"
      subtitle="Identity, assigned role privileges & security credentials"
      width="540px"
    >
      <div className="profile-modal-content">
        {/* Hero Card */}
        <div
          className="profile-hero-card"
          style={{
            background: theme.bg,
            border: `1px solid ${theme.border}`,
            borderRadius: "14px",
            padding: "18px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: theme.color,
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: 800,
              boxShadow: `0 0 16px ${theme.color}40`,
              flexShrink: 0,
            }}
          >
            {initial}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", margin: 0 }}>
                {user.fullName || "Authenticated User"}
              </h3>
              <span className={`badge ${theme.badge}`} style={{ fontSize: "11px" }}>
                {theme.icon} {role}
              </span>
            </div>
            <div style={{ fontSize: "0.88rem", color: "var(--text-muted)", wordBreak: "break-all" }}>
              ✉️ {user.email}
            </div>
          </div>
        </div>

        {/* Profile Attributes Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div className="profile-field-box">
            <span className="profile-field-label">Account ID</span>
            <span className="profile-field-val">#{user.id}</span>
          </div>

          <div className="profile-field-box">
            <span className="profile-field-label">Account Status</span>
            <span className="profile-field-val" style={{ color: "#10b981", display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981" }} />
              Active & Verified
            </span>
          </div>

          <div className="profile-field-box">
            <span className="profile-field-label">Contact Phone</span>
            <span className="profile-field-val">{user.phoneNumber || "Not provided"}</span>
          </div>

          <div className="profile-field-box">
            <span className="profile-field-label">Member Since</span>
            <span className="profile-field-val">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Active Session"}
            </span>
          </div>
        </div>

        {/* Role Privileges Description */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.07)",
            borderRadius: "12px",
            padding: "14px 16px",
            marginBottom: "20px",
          }}
        >
          <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px", color: theme.color, fontWeight: 700, marginBottom: "4px" }}>
            {theme.tag}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#e2e8f0", lineHeight: "1.45" }}>
            {theme.description}
          </div>
        </div>

        {/* Quick Contextual Actions */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "8px" }}>
            Quick Operations
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {role === "Citizen" && (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => handleActionClick("/incidents")}
                >
                  📋 View My Reported Incidents
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => handleActionClick("/incidents/new")}
                >
                  🚨 Report New Emergency
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleActionClick("/shelters")}
                >
                  🏠 Emergency Shelters
                </button>
              </>
            )}

            {role === "Volunteer" && (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => handleActionClick("/dispatches")}
                >
                  🚛 View Dispatches
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleActionClick("/incidents")}
                >
                  📍 Incident Command Hub
                </button>
              </>
            )}

            {(role === "Coordinator" || role === "Admin") && (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-accent"
                  onClick={() => handleActionClick("/incidents")}
                >
                  ⚡ Incident Command & AI Hub
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleActionClick("/situation-analysis")}
                >
                  🤖 AI Situation Analysis
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer with Sign Out */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "14px" }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="btn btn-ghost-danger"
            onClick={handleSignOut}
          >
            Sign Out of Account
          </button>
        </div>
      </div>

      <style>{`
        .profile-field-box {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 10px 12px;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .profile-field-label {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        .profile-field-val {
          font-size: 0.9rem;
          color: #fff;
          font-weight: 600;
        }
      `}</style>
    </Modal>
  );
}
