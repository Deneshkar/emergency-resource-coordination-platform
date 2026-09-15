import { useLocation } from "react-router-dom";

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
];

function resolveTitle(pathname) {
  const hit = TITLES.filter((t) => pathname.startsWith(t.match)).sort(
    (a, b) => b.match.length - a.match.length
  )[0];
  return hit ?? { crumb: "Overview", title: "Command Center" };
}

export default function Topbar({ role, onRoleChange, onMenu, onToggle, collapsed }) {
  const { pathname } = useLocation();
  const { crumb, title } = resolveTitle(pathname);

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

      <div className="role-badge-picker">
        <span className="role-label">Role</span>
        <select
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          className="role-select"
          aria-label="Select user role"
        >
          <option value="Admin">Admin / Dispatcher</option>
          <option value="Citizen">Citizen</option>
          <option value="Volunteer">Volunteer</option>
        </select>
      </div>

      <div className="topbar-status" title="All systems operational">
        <span className="status-dot" />
        <span className="status-text">Operational</span>
      </div>
    </header>
  );
}
