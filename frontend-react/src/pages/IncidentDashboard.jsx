import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { incidentService } from "../services/incidentService";

function IncidentDashboard() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadData();
  }, [category, priority, status]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [incidentList, summaryStats] = await Promise.all([
        incidentService.getIncidents({ search, category, priority, status }),
        incidentService.getSummaryStats(),
      ]);
      setIncidents(incidentList);
      setStats(summaryStats);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the Incident Intelligence Backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
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
      default: return "badge badge-secondary";
    }
  };

  return (
    <div className="incident-hub-container">
      {/* Header Banner */}
      <div className="command-header">
        <div>
          <div className="subtitle-tag">🤖 AGENTIC AI SUBSYSTEM</div>
          <h1 className="header-title">Incident Intelligence & Command Center</h1>
          <p className="header-desc">
            Real-time emergency monitoring, threat assessment, and AI Coordinator response planning.
          </p>
        </div>
        <Link to="/incidents/new" className="btn btn-primary shadow-glow">
          + Report Emergency Incident
        </Link>
      </div>

      {/* Summary Analytics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Incidents</div>
            <div className="stat-value">{stats.totalIncidents}</div>
            <div className="stat-foot">Registered emergency events</div>
          </div>

          <div className="stat-card active-border">
            <div className="stat-label">Active Emergencies</div>
            <div className="stat-value text-warning">{stats.activeIncidents}</div>
            <div className="stat-foot">Currently requiring active coordination</div>
          </div>

          <div className="stat-card critical-border">
            <div className="stat-label">Critical Priority</div>
            <div className="stat-value text-danger">{stats.criticalIncidents}</div>
            <div className="stat-foot">Immediate life-safety threats</div>
          </div>

          <div className="stat-card ai-border">
            <div className="stat-label">AI Action Plans</div>
            <div className="stat-value text-accent">{stats.generatedPlansCount}</div>
            <div className="stat-foot">Coordinator Agent response strategies</div>
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="filter-card">
        <form onSubmit={handleSearchSubmit} className="filter-row">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search by title, location, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
            />
            <button type="submit" className="btn btn-secondary">Search</button>
          </div>

          <div className="filter-selectors">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-select"
            >
              <option value="">All Categories</option>
              <option value="Fire">Fire</option>
              <option value="Flood">Flood</option>
              <option value="Medical">Medical Emergency</option>
              <option value="Earthquake">Earthquake</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Chemical">Chemical / HazMat</option>
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="form-select"
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="form-select"
            >
              <option value="">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Active Planning">Active Planning</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            {(search || category || priority || status) && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setPriority("");
                  setStatus("");
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Main Content Area */}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Incident Intelligence Feeds...</p>
        </div>
      ) : incidents.length === 0 ? (
        <div className="empty-state">
          <h3>No Incidents Found</h3>
          <p>No emergency incidents match your search or filter parameters.</p>
          <Link to="/incidents/new" className="btn btn-primary" style={{ marginTop: "12px" }}>
            Report New Incident
          </Link>
        </div>
      ) : (
        <div className="incidents-grid">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="incident-card"
              onClick={() => navigate(`/incidents/${inc.id}`)}
            >
              <div className="incident-card-header">
                <div className="badges-group">
                  <span className={getPriorityBadgeClass(inc.priority)}>
                    {inc.priority} Priority
                  </span>
                  <span className="badge badge-category">{inc.category || "General"}</span>
                  <span className={getStatusBadgeClass(inc.status)}>{inc.status}</span>
                </div>
                <span className="incident-id">#{inc.id}</span>
              </div>

              <h3 className="incident-title">{inc.title}</h3>
              <p className="incident-description">{inc.description}</p>

              <div className="incident-meta-grid">
                <div>
                  <span className="meta-label">Location:</span>
                  <span className="meta-value">📍 {inc.location}</span>
                </div>
                <div>
                  <span className="meta-label">Impact:</span>
                  <span className="meta-value">👥 ~{inc.affectedCount} affected</span>
                </div>
                <div>
                  <span className="meta-label">AI Plans:</span>
                  <span className="meta-value">📋 {inc.planCount} generated</span>
                </div>
                <div>
                  <span className="meta-label">Reported:</span>
                  <span className="meta-value">
                    ⏱️ {new Date(inc.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="incident-card-footer">
                <button
                  className="btn btn-sm btn-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/incidents/${inc.id}`);
                  }}
                >
                  ⚡ Open AI Planner Workbench
                </button>
                <button
                  className="btn btn-sm btn-ghost-danger"
                  onClick={(e) => handleDelete(inc.id, e)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default IncidentDashboard;
