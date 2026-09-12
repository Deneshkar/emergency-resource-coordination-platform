import { NavLink } from "react-router-dom";

const navItems = [
  { section: "Overview" },
  { to: "/", icon: "📊", label: "Dashboard" },
  { section: "Operations" },
  { to: "/incidents", icon: "⚠️", label: "Incidents" },
  { to: "/dispatches", icon: "🚛", label: "Dispatches" },
  { section: "Resources" },
  { to: "/volunteers", icon: "👤", label: "Volunteers" },
  { to: "/resources", icon: "📦", label: "Resource Fleet" },
  { to: "/shelters", icon: "🏠", label: "Shelters" },
  { to: "/inventory", icon: "📋", label: "Inventory" },
  { section: "Intelligence" },
  { to: "/situation-analysis", icon: "🧠", label: "AI Analysis" },
];

export default function Sidebar({ incidentCount }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo">🚨</div>
          <div>
            <div className="sidebar-title">ERCP</div>
            <div className="sidebar-subtitle">Command Center</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, i) => {
          if (item.section) {
            return (
              <div key={i} className="sidebar-section-label">
                {item.section}
              </div>
            );
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `sidebar-link${isActive ? " active" : ""}`
              }
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
              {item.to === "/incidents" && incidentCount > 0 && (
                <span className="sidebar-link-badge">{incidentCount}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-status">
        <span className="status-dot" />
        <span className="sidebar-status-text">System Operational</span>
      </div>
    </aside>
  );
}
