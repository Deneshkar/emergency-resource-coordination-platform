import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getVolunteers, updateAvailability } from "../services/volunteerService";

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

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [duty, setDuty] = useState(null);
  const [dutyId, setDutyId] = useState(null);
  const [dutyMsg, setDutyMsg] = useState(null);

  useEffect(() => {
    if (user?.role !== "Volunteer" || !user?.email) return;
    (async () => {
      try {
        const all = await getVolunteers("", null, 1, 50);
        const me = all.find(
          (v) => v.email?.trim().toLowerCase() === user.email.trim().toLowerCase()
        );
        if (me) {
          setDuty(me.isAvailable);
          setDutyId(me.id);
        }
      } catch {
        // duty toggle unavailable offline
      }
    })();
  }, [user]);

  const toggleDuty = async () => {
    if (dutyId == null) return;
    try {
      await updateAvailability(dutyId, !duty);
      setDuty(!duty);
      setDutyMsg(!duty ? "You are now ON-DUTY (Available)" : "You are now OFF-DUTY");
    } catch (err) {
      setDutyMsg(err?.response?.data?.message || "Failed to update duty status.");
    }
  };

  if (!user) {
    return (
      <div className="page-wrapper">
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <h2>No Active Session</h2>
          <p style={{ color: "var(--text-muted)", marginTop: "8px", marginBottom: "20px" }}>
            Please sign in to view your profile credentials.
          </p>
          <Link to="/login" className="btn btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  const role = user.role || "Citizen";
  const theme = ROLE_THEMES[role] || ROLE_THEMES.Citizen;
  const initial = user.fullName ? user.fullName.charAt(0).toUpperCase() : "U";

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="page-wrapper anim-fade-in" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div className="page-header-left">
          <div className="badge badge-info" style={{ width: "fit-content", marginBottom: "6px" }}>
            User Identity & Access Management
          </div>
          <h1>Account Profile</h1>
          <p>View your personal profile details, verified credentials, and active system permissions.</p>
        </div>
        <button className="btn btn-ghost-danger btn-sm" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>

      {/* Main Profile Card */}
      <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
        {/* Banner with Avatar */}
        <div
          style={{
            background: theme.bg,
            border: `1px solid ${theme.border}`,
            borderRadius: "16px",
            padding: "24px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: theme.color,
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: 800,
              boxShadow: `0 0 24px ${theme.color}40`,
              flexShrink: 0,
            }}
          >
            {initial}
          </div>

          <div style={{ flex: 1, minWidth: "240px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", margin: 0 }}>
                {user.fullName || "Authenticated User"}
              </h2>
              <span className={`badge ${theme.badge}`} style={{ fontSize: "12px", padding: "4px 10px" }}>
                {theme.icon} {role}
              </span>
            </div>
            <div style={{ fontSize: "0.95rem", color: "var(--text-muted)", wordBreak: "break-all" }}>
              ✉️ {user.email}
            </div>
          </div>
        </div>

        {/* Credentials Grid */}
        <h3 style={{ fontSize: "1.05rem", color: "#fff", marginBottom: "14px" }}>Account Details</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <div className="profile-detail-card">
            <span className="detail-card-label">User ID</span>
            <span className="detail-card-value">#{user.id}</span>
          </div>

          <div className="profile-detail-card">
            <span className="detail-card-label">Account Status</span>
            <span className="detail-card-value" style={{ color: "#10b981", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
              Active & Verified
            </span>
          </div>

          <div className="profile-detail-card">
            <span className="detail-card-label">Phone Number</span>
            <span className="detail-card-value">{user.phoneNumber || "None provided"}</span>
          </div>

          <div className="profile-detail-card">
            <span className="detail-card-label">Registered Since</span>
            <span className="detail-card-value">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Current Session"}
            </span>
          </div>
        </div>

        {/* Role Privileges Description */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "16px 20px",
            marginBottom: "24px",
          }}
        >
          <div style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.6px", color: theme.color, fontWeight: 700, marginBottom: "6px" }}>
            {theme.tag} &mdash; Access Scope
          </div>
          <p style={{ fontSize: "0.9rem", color: "#cbd5e1", lineHeight: "1.5", margin: 0 }}>
            {theme.description}
          </p>
        </div>

        {/* Quick Operations */}
        <h3 style={{ fontSize: "1.05rem", color: "#fff", marginBottom: "14px" }}>Quick Platform Access</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {role === "Citizen" && (
            <>
              <Link to="/incidents" className="btn btn-primary">
                📋 View My Reported Incidents
              </Link>
              <Link to="/incidents/new" className="btn btn-danger">
                🚨 Report New Incident
              </Link>
              <Link to="/shelters" className="btn btn-secondary">
                🏠 Find Shelters
              </Link>
            </>
          )}

          {role === "Volunteer" && (
            <>
              <Link to="/dispatches" className="btn btn-primary">
                🚛 View Dispatches
              </Link>
              <Link to="/incidents" className="btn btn-secondary">
                📍 Incident Hub
              </Link>
              {dutyId != null && (
                <button
                  className={`btn ${duty ? "btn-ghost" : "btn-success"}`}
                  onClick={toggleDuty}
                >
                  {duty ? "Go Off-Duty" : "Go On-Duty"}
                </button>
              )}
              {dutyMsg && (
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{dutyMsg}</span>
              )}
            </>
          )}

          {(role === "Coordinator" || role === "Admin") && (
            <>
              <Link to="/incidents" className="btn btn-accent">
                ⚡ Incident Command & AI Hub
              </Link>
              <Link to="/situation-analysis" className="btn btn-secondary">
                🤖 AI Situation Analysis
              </Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        .profile-detail-card {
          background: rgba(15, 23, 42, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .detail-card-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.6px;
          font-weight: 600;
        }
        .detail-card-value {
          font-size: 0.95rem;
          color: #fff;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
