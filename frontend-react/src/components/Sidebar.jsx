import { NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const Icon = ({ d }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const ICONS = {
  dashboard: <Icon d={<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>} />,
  incident: <Icon d={<><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></>} />,
  list: <Icon d={<><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></>} />,
  dispatch: <Icon d={<><path d="M1 8h14v9H1zM15 11h4l4 4v2h-8z" /><circle cx="5.5" cy="18.5" r="1.8" /><circle cx="18.5" cy="18.5" r="1.8" /></>} />,
  volunteers: <Icon d={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>} />,
  resources: <Icon d={<><path d="m21 8-9-5-9 5v8l9 5 9-5V8Z" /><path d="m3.3 8.5 8.7 4.9 8.7-4.9M12 22V13" /></>} />,
  shelter: <Icon d={<><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V10Z" /></>} />,
  inventory: <Icon d={<><path d="M9 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" /><path d="M14 2v6h6M9 13h6M9 17h6" /></>} />,
  ai: <Icon d={<><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" /><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></>} />,
  citizen: <Icon d={<><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0 1 16 0v1" /></>} />,
  login: <Icon d={<><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></>} />,
};

const NAV = [
  { section: "Overview" },
  { to: "/dashboard", label: "Dashboard", icon: ICONS.dashboard },
  { to: "/incidents", label: "Incident Hub", icon: ICONS.incident, badgeKey: "active" },
  { section: "Operations" },
  { to: "/incident-list", label: "All Incidents", icon: ICONS.list, roles: ["Coordinator", "Admin"] },
  { to: "/dispatches", label: "Dispatches", icon: ICONS.dispatch, roles: ["Coordinator", "Admin", "Volunteer"] },
  { section: "Resources" },
  { to: "/volunteers", label: "Volunteers", icon: ICONS.volunteers, roles: ["Coordinator", "Admin", "Volunteer"] },
  { to: "/inventory-hub", label: "Resources & Inventory", icon: ICONS.resources, roles: ["Coordinator", "Admin"] },
  { to: "/shelters", label: "Shelters", icon: ICONS.shelter },
  { to: "/inventory", label: "Inventory", icon: ICONS.inventory, roles: ["Coordinator", "Admin"] },
  { section: "Intelligence" },
  { to: "/situation-analysis", label: "AI Analysis", icon: ICONS.ai, roles: ["Coordinator", "Admin"] },
  { to: "/citizen", label: "Citizen View", icon: ICONS.citizen },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onClose, activeCount }) {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const showText = !collapsed || mobileOpen;
  const userRole = user?.role;

  useEffect(() => {
    if (mobileOpen) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && mobileOpen) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onClose]);

  // Filter navigation items by active user role
  const visibleNav = NAV.filter((item) => {
    if (item.section) return true;
    if (!item.roles) return true;
    if (!isAuthenticated) return false;
    return item.roles.includes(userRole);
  });

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}

      <aside className={`sidebar${collapsed ? " collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`} aria-label="Primary navigation">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo" aria-hidden="true">🚨</div>
            {showText && (
              <div className="sidebar-brand-text">
                <div className="sidebar-title">ERCP</div>
                <div className="sidebar-subtitle">Command Center</div>
              </div>
            )}
          </div>
          <button
            className="sidebar-toggle"
            onClick={onToggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              {collapsed ? (
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>

        <div className="sidebar-cta">
          <NavLink to="/incidents/new" className="sidebar-cta-btn" title="Report a new emergency incident">
            <span aria-hidden="true">＋</span>
            {showText && <span className="cta-text">Report Incident</span>}
          </NavLink>
        </div>

        <nav className="sidebar-nav">
          {visibleNav.map((item, i) => {
            if (item.section) {
              return showText ? (
                <div key={`s-${i}`} className="sidebar-section-label">{item.section}</div>
              ) : (
                <div key={`s-${i}`} className="sidebar-section-divider" />
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/dashboard"}
                className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {showText && <span className="sidebar-link-text">{item.label}</span>}
                {showText && item.badgeKey === "active" && activeCount > 0 && (
                  <span className="sidebar-count-badge" title={`${activeCount} active incidents`}>
                    {activeCount}
                  </span>
                )}
              </NavLink>
            );
          })}

          {isAuthenticated && (
            <NavLink
              to="/profile"
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
              style={{ marginTop: "0.5rem" }}
              title="My Account Profile"
            >
              <span className="sidebar-link-icon">👤</span>
              {showText && <span className="sidebar-link-text">My Profile</span>}
            </NavLink>
          )}

          {!isAuthenticated && (
            <NavLink
              to="/login"
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
              style={{ marginTop: "1rem", color: "var(--accent)" }}
            >
              <span className="sidebar-link-icon">{ICONS.login}</span>
              {showText && <span className="sidebar-link-text">Operator Login</span>}
            </NavLink>
          )}
        </nav>

        {showText ? (
          <div className="sidebar-footer">
            <div className="sidebar-status">
              <span className="status-dot" />
              <span>{isAuthenticated ? `${userRole} Session` : "Public Access"}</span>
            </div>
            <div className="sidebar-version">ERCP v1.0.0</div>
          </div>
        ) : (
          <div className="sidebar-footer-collapsed">
            <span className="status-dot" title="System Operational" />
          </div>
        )}
      </aside>
    </>
  );
}
