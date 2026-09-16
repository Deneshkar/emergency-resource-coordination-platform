import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UserProfileModal from "./UserProfileModal";

const TITLES = [
  { match: "/incidents/new", crumb: "Operations", title: "Report Incident" },
  { match: "/incidents/", crumb: "Operations", title: "Incident Details" },
  { match: "/incidents", crumb: "Operations", title: "Incident Intelligence Hub" },
  { match: "/dashboard", crumb: "Overview", title: "Command Dashboard" },
  { match: "/incident-list", crumb: "Operations", title: "Incident List" },
  { match: "/dispatches", crumb: "Operations", title: "Dispatches" },
  { match: "/volunteers/new", crumb: "Resources", title: "Add Volunteer" },
  { match: "/volunteers/", crumb: "Resources", title: "Volunteer Profile" },
  { match: "/volunteers", crumb: "Resources", title: "Volunteers" },
  { match: "/inventory-hub", crumb: "Resources", title: "Resource & Inventory Hub" },
  { match: "/resources", crumb: "Resources", title: "Resources" },
  { match: "/shelters", crumb: "Resources", title: "Shelters" },
  { match: "/inventory", crumb: "Resources", title: "Inventory" },
  { match: "/situation-analysis", crumb: "Intelligence", title: "Situation Analysis" },
  { match: "/citizen", crumb: "Intelligence", title: "Citizen View" },
  { match: "/login", crumb: "Security", title: "Operator Authentication" },
  { match: "/register", crumb: "Security", title: "Registration" },
];

function resolveTitle(pathname) {
  const hit = TITLES.filter((t) => pathname.startsWith(t.match)).sort(
    (a, b) => b.match.length - a.match.length
  )[0];
  return hit ?? { crumb: "Overview", title: "Command Center" };
}

const ROLE_COLORS = {
  Coordinator: { bg: "rgba(245, 158, 11, 0.15)", text: "#f59e0b", border: "rgba(245, 158, 11, 0.3)" },
  Admin: { bg: "rgba(168, 85, 247, 0.15)", text: "#a855f7", border: "rgba(168, 85, 247, 0.3)" },
  Volunteer: { bg: "rgba(16, 185, 129, 0.15)", text: "#10b981", border: "rgba(16, 185, 129, 0.3)" },
  Citizen: { bg: "rgba(14, 165, 233, 0.15)", text: "#0ea5e9", border: "rgba(14, 165, 233, 0.3)" },
};

export default function Topbar({ onMenu, onToggle, collapsed }) {
  const { pathname } = useLocation();
  const { user, isAuthenticated, demoLogin, logout } = useAuth();
  const navigate = useNavigate();
  const { crumb, title } = resolveTitle(pathname);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const activeRole = user?.role || "Guest";
  const colors = ROLE_COLORS[activeRole] || { bg: "rgba(255,255,255,0.08)", text: "#94a3b8", border: "rgba(255,255,255,0.15)" };

  const handleRoleChange = async (e) => {
    const newRole = e.target.value;
    if (newRole) {
      try {
        await demoLogin(newRole);
      } catch (err) {
        console.error("Failed to switch demo role:", err);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="topbar">
      <button
        className="topbar-icon-btn topbar-hamburger"
        onClick={onMenu}
        aria-label="Open navigation menu"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 4.5H16M2 9H16M2 13.5H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      <button
        className="topbar-icon-btn topbar-collapse-btn"
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      <div className="topbar-title-block">
        <div className="topbar-breadcrumb">{crumb}</div>
        <div className="topbar-title">{title}</div>
      </div>

      <div className="topbar-spacer" />

      {isAuthenticated ? (
        <div className="topbar-auth-section" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Quick Demo Role Switcher for Viva Examiners */}
          <div className="role-badge-picker" title="Switch demo role instantly">
            <span className="role-label">Active Role</span>
            <select
              value={activeRole}
              onChange={handleRoleChange}
              className="role-select"
              aria-label="Switch active demo role"
            >
              <option value="Coordinator">Coordinator (AI Planner)</option>
              <option value="Volunteer">Volunteer (Field Tasks)</option>
              <option value="Citizen">Citizen (Public Report)</option>
              <option value="Admin">Admin (System Full)</option>
            </select>
          </div>

          {/* User Profile Pill & Profile Modal Trigger */}
          <button
            type="button"
            className="user-profile-pill"
            onClick={() => setShowProfileModal(true)}
            title="Click to view full account profile & permissions"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 12px",
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: "20px",
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <span
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: colors.text,
                color: "#000",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "11px",
              }}
            >
              {user?.fullName?.charAt(0) || "U"}
            </span>
            <span style={{ fontWeight: 600, color: colors.text }}>
              {user?.fullName ? user.fullName.split(" ")[0] : activeRole}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "2px" }}>👤 Profile</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="topbar-icon-btn"
            title="Sign out of platform"
            style={{ color: "#ef4444" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Link to="/login" className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "13px" }}>
            Sign In
          </Link>
          <Link to="/register" className="btn btn-secondary" style={{ padding: "6px 14px", fontSize: "13px" }}>
            Register
          </Link>
        </div>
      )}

      <div className="topbar-status" title="Platform online & connected to ASP.NET Core API">
        <span className="status-dot" />
        <span className="status-text">Operational</span>
      </div>

      {/* Account Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </header>
  );
}
