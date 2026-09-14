import { NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";

const navItems = [
  { section: "Overview" },
  { to: "/dashboard", icon: "📊", label: "Dashboard" },
  { section: "Operations" },
  { to: "/incidents", icon: "⚠️", label: "Incidents", badge: true },
  { to: "/dispatches", icon: "🚛", label: "Dispatches" },
  { section: "Resources" },
  { to: "/volunteers", icon: "👥", label: "Volunteers" },
  { to: "/inventory-hub", icon: "📦", label: "Resources & Inventory" },
  { to: "/shelters", icon: "🏠", label: "Shelters" },
  { section: "Intelligence" },
  { to: "/situation-analysis", icon: "🧠", label: "AI Analysis" },
  { to: "/incidents/new", icon: "🚨", label: "Report Incident" },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileToggle }) {
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    if (mobileOpen) onMobileToggle();
  }, [location.pathname]);

  // Close mobile menu on ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && mobileOpen) onMobileToggle();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [mobileOpen]);

  return (
    <aside
      className={`sidebar${collapsed ? " collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`}
    >
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <span>🚨</span>
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="sidebar-brand-text">
              <div className="sidebar-title">ERCP</div>
              <div className="sidebar-subtitle">Command Center</div>
            </div>
          )}
        </div>
        <button className="sidebar-toggle" onClick={onToggle} title={collapsed ? "Expand" : "Collapse"}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            {collapsed ? (
              <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile hamburger */}
      <button className="sidebar-hamburger" onClick={onMobileToggle}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item, i) => {
          if (item.section) {
            return (!collapsed || mobileOpen) ? (
              <div key={i} className="sidebar-section-label">
                {item.section}
              </div>
            ) : (
              <div key={i} className="sidebar-section-divider" />
            );
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                `sidebar-link${isActive ? " active" : ""}`
              }
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {(!collapsed || mobileOpen) && (
                <span className="sidebar-link-text">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Status */}
      {(!collapsed || mobileOpen) && (
        <div className="sidebar-footer">
          <div className="sidebar-status">
            <span className="status-dot" />
            <span className="sidebar-status-text">System Operational</span>
          </div>
          <div className="sidebar-version">v1.0.0</div>
        </div>
      )}

      {/* Collapsed footer icon */}
      {collapsed && !mobileOpen && (
        <div className="sidebar-footer-collapsed">
          <span className="status-dot" title="System Operational" />
        </div>
      )}
    </aside>
  );
}
