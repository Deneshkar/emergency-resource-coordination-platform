import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { incidentService } from "../services/incidentService";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";

function IncidentDashboard() {
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const { user, hasRole } = useAuth();

  const isCitizen = user?.role === "Citizen";
  const isVolunteer = user?.role === "Volunteer";
  const isCoordinatorOrAdmin = hasRole(["Coordinator", "Admin"]);

  // Scope filter: Citizen defaults to their own reported incidents ("my")
  const [scopeFilter, setScopeFilter] = useState(() => (isCitizen ? "my" : "all"));

  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");

  const hasFilters = Boolean(search || category || priority || status);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const isMyOnly = isCitizen ? scopeFilter === "my" : scopeFilter === "my";

      const [incidentList, summaryStats] = await Promise.all([
        incidentService.getIncidents({ search, category, priority, status, myOnly: isMyOnly }),
        incidentService.getSummaryStats({ myOnly: isMyOnly }),
      ]);
      setIncidents(incidentList);
      setStats(summaryStats);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load incidents. Please verify connection and credentials.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, priority, status, scopeFilter]);

  // Press "/" anywhere to jump to search (matches topbar hint)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "SELECT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setPriority("");
    setStatus("");
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove Incident #${id}?`)) return;
    try {
      await incidentService.deleteIncident(id);
      loadData();
    } catch (err) {
      alert("Failed to delete incident: " + err.message);
    }
  };

  const openIncident = (id) => navigate(`/incidents/${id}`);

  const getPriorityBadgeClass = (p) => {
    switch (p?.toLowerCase()) {
      case "critical": return "badge badge-critical";
      case "high": return "badge badge-high";
      case "medium": return "badge badge-medium";
      default: return "badge badge-low";
    }
  };

  const getStatusBadgeClass = (s) => {
    switch (s?.toLowerCase()) {
      case "dispatched": case "in execution": return "badge badge-success";
      case "active planning": return "badge badge-info";
      case "reported": return "badge badge-warning";
      case "resolved": case "closed": return "badge badge-neutral";
      default: return "badge badge-neutral";
    }
  };

  return (
    <div className="incident-hub-container page-wrapper">
      {/* Header with Role-Specific Title and Scope Switcher */}
      <div className="command-header">
        <div>
          <div className="subtitle-tag">
            {isCitizen
              ? "🚨 CITIZEN EMERGENCY PORTAL"
              : isVolunteer
              ? "🚑 FIELD RESPONDER HUB"
              : "🤖 AGENTIC AI SUBSYSTEM"}
          </div>
          <h1 className="header-title">
            {isCitizen
              ? scopeFilter === "my"
                ? "My Reported Incidents & Response Status"
                : "Community Emergency Incidents"
              : isVolunteer
              ? "Active Emergencies & Responder Feeds"
              : "Incident Intelligence & Command Center"}
          </h1>
          <p className="header-desc">
            {isCitizen
              ? scopeFilter === "my"
                ? "Track response plans, dispatch status, and updates on your reported emergencies."
                : "View community emergency alerts and situation updates in your sector."
              : isVolunteer
              ? "Monitor regional emergency incidents and triage resource responses."
              : "Real-time emergency monitoring, threat assessment, and AI Coordinator response planning."}
          </p>
        </div>

        <div className="hub-toolbar">
          {/* Toggle for Citizen: My Reports vs All Community Alerts */}
          {isCitizen && (
            <div
              className="scope-toggle-tabs"
              style={{
                display: "inline-flex",
                background: "rgba(255, 255, 255, 0.06)",
                borderRadius: "8px",
                padding: "3px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <button
                type="button"
                className={`btn btn-sm ${scopeFilter === "my" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setScopeFilter("my")}
                style={{ padding: "5px 12px", fontSize: "12px", borderRadius: "6px" }}
              >
                📋 My Reports
              </button>
              <button
                type="button"
                className={`btn btn-sm ${scopeFilter === "all" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setScopeFilter("all")}
                style={{ padding: "5px 12px", fontSize: "12px", borderRadius: "6px" }}
              >
                🌍 Community Alerts
              </button>
            </div>
          )}

          <button type="button" className="btn btn-secondary" onClick={loadData} title="Refresh incident feed">
            ⟳ Refresh
          </button>
          <Link to="/incidents/new" className="btn btn-primary shadow-glow">
            + Report Emergency Incident
          </Link>
        </div>
      </div>

      {/* Summary analytics */}
      {stats && (
        <div className="stats-grid anim-stagger">
          <StatCard
            icon="📋"
            label={isCitizen && scopeFilter === "my" ? "My Reports" : "Total Incidents"}
            value={stats.totalIncidents ?? 0}
            sub={isCitizen && scopeFilter === "my" ? "Submitted by your account" : "Registered emergency events"}
            color="blue"
          />
          <StatCard
            icon="⚠️"
            label="Active Emergencies"
            value={stats.activeIncidents ?? 0}
            sub="Requiring active coordination"
            color="amber"
            glow={stats.activeIncidents > 0}
          />
          <StatCard
            icon="🚨"
            label="Critical Priority"
            value={stats.criticalIncidents ?? 0}
            sub="Immediate life-safety threats"
            color="red"
            glow={stats.criticalIncidents > 0}
          />
          <StatCard
            icon="🤖"
            label={isCitizen ? "Actioned / Planned" : "AI Action Plans"}
            value={stats.generatedPlansCount ?? 0}
            sub={isCitizen ? "Response strategies generated" : "Coordinator response strategies"}
            color="purple"
          />
        </div>
      )}

      {/* Filters */}
      <div className="filter-card">
        <form onSubmit={handleSearchSubmit} className="filter-row">
          <div className="search-input-group">
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by title, location, description…  ( press / )"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              aria-label="Search incidents"
            />
            {search && (
              <button type="button" className="search-clear" onClick={() => setSearch("")} aria-label="Clear search">
                ✕
              </button>
            )}
            <button type="submit" className="btn btn-secondary">Search</button>
          </div>

          <div className="filter-selectors">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-select" aria-label="Filter by category">
              <option value="">All Categories</option>
              <option value="Fire">Fire</option>
              <option value="Flood">Flood</option>
              <option value="Medical">Medical Emergency</option>
              <option value="Earthquake">Earthquake</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Chemical">Chemical / HazMat</option>
            </select>

            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="form-select" aria-label="Filter by priority">
              <option value="">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-select" aria-label="Filter by status">
              <option value="">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Active Planning">Active Planning</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            {hasFilters && (
              <button type="button" className="btn btn-ghost" onClick={resetFilters}>
                Reset Filters
              </button>
            )}
            <span className="hub-result-count" role="status">
              {!loading && `${incidents.length} result${incidents.length === 1 ? "" : "s"}`}
            </span>
          </div>
        </form>
      </div>

      {/* Content */}
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
          <div style={{ marginTop: "10px" }}>
            <button className="btn btn-sm btn-secondary" onClick={loadData}>Try Again</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="incidents-grid" aria-label="Loading incidents">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔍</div>
          <h3>
            {isCitizen && scopeFilter === "my"
              ? "You Haven't Reported Any Incidents Yet"
              : hasFilters
              ? "No Incidents Match Your Filters"
              : "No Incidents Found"}
          </h3>
          <p>
            {isCitizen && scopeFilter === "my"
              ? "If you are experiencing an emergency situation, submit a report to trigger response coordination."
              : hasFilters
              ? "Try widening your search or resetting the filters."
              : "No emergency incidents have been reported yet."}
          </p>
          <div className="hub-toolbar" style={{ justifyContent: "center", marginTop: "14px" }}>
            {hasFilters && (
              <button className="btn btn-secondary" onClick={resetFilters}>Reset Filters</button>
            )}
            <Link to="/incidents/new" className="btn btn-primary">
              Report Emergency Incident
            </Link>
          </div>
        </div>
      ) : (
        <div className="incidents-grid">
          {incidents.map((inc) => (
            <article
              key={inc.id}
              className="incident-card"
              onClick={() => openIncident(inc.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openIncident(inc.id);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Open incident ${inc.id}: ${inc.title}`}
            >
              <div className="incident-card-header">
                <div className="badge-group">
                  <span className={getPriorityBadgeClass(inc.priority)}>
                    {inc.priority} Priority
                  </span>
                  <span className="badge badge-category">{inc.category}</span>
                  <span className={getStatusBadgeClass(inc.status)}>{inc.status}</span>
                </div>
                <span className="incident-id">#{inc.id}</span>
              </div>

              <h2 className="incident-title">{inc.title}</h2>
              <p className="incident-desc">{inc.description}</p>

              <div className="incident-meta-grid">
                <div>
                  <span className="meta-label">Location</span>
                  <span className="meta-value">📍 {inc.location}</span>
                </div>
                <div>
                  <span className="meta-label">Impact</span>
                  <span className="meta-value">👥 ~{inc.affectedCount ?? 0} affected</span>
                </div>
                <div>
                  <span className="meta-label">AI Plans</span>
                  <span className="meta-value">📋 {inc.planCount ?? 0} generated</span>
                </div>
                <div>
                  <span className="meta-label">Reported</span>
                  <span className="meta-value">
                    ⏱️ {inc.createdAt ? new Date(inc.createdAt).toLocaleString() : "—"}
                  </span>
                </div>
              </div>

              <div className="incident-card-footer">
                {isCoordinatorOrAdmin ? (
                  <>
                    <button
                      className="btn btn-sm btn-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        openIncident(inc.id);
                      }}
                    >
                      ⚡ Open AI Planner
                    </button>
                    <button
                      className="btn btn-sm btn-ghost-danger"
                      onClick={(e) => handleDelete(inc.id, e)}
                      aria-label={`Delete incident ${inc.id}`}
                    >
                      Delete
                    </button>
                  </>
                ) : isVolunteer ? (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      openIncident(inc.id);
                    }}
                  >
                    📍 View Field Details
                  </button>
                ) : (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      openIncident(inc.id);
                    }}
                  >
                    🔍 Track Response Status
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default IncidentDashboard;
