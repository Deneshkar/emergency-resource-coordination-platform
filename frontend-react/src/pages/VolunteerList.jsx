import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getVolunteers, updateAvailability } from "../services/volunteerService";
import StatusBadge from "../components/StatusBadge";

function VolunteerList() {
  const location = useLocation();
  const [volunteers, setVolunteers] = useState([]);
  const [search, setSearch] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchVolunteers = async () => {
    setLoading(true);
    setError(null);
    try {
      const isAvailable =
        availabilityFilter === "available" ? true :
        availabilityFilter === "unavailable" ? false : null;
      const data = await getVolunteers(search, isAvailable, page, pageSize + 1);
      setHasNextPage(data.length > pageSize);
      setVolunteers(data.slice(0, pageSize));
    } catch (err) {
      setError("Failed to load volunteers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVolunteers(); }, [page, availabilityFilter]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchVolunteers();
  };

  const handleToggleAvailability = async (id, currentStatus) => {
    await updateAvailability(id, !currentStatus);
    setSuccessMessage("Availability updated.");
    fetchVolunteers();
  };

  const hasPrevPage = page > 1;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Volunteers</h1>
          <p>Manage responder profiles, skills &amp; availability</p>
        </div>
        <Link to="/volunteers/new" className="btn btn-primary">+ Register Volunteer</Link>
      </div>

      {successMessage && (
        <div style={{
          padding: "10px 16px",
          background: "var(--green-glow)",
          border: "1px solid var(--green)",
          borderRadius: "var(--radius-sm)",
          color: "var(--green)",
          fontSize: "13px",
          fontWeight: "600",
          marginBottom: "20px",
        }}>
          {successMessage}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px", flex: 1, minWidth: "280px" }}>
          <input
            type="text"
            placeholder="Search by name or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
        <div className="tab-bar" style={{ marginBottom: 0, flex: "0 0 auto" }}>
          {["all", "available", "unavailable"].map((f) => (
            <button
              key={f}
              className={`tab-btn${availabilityFilter === f ? " active" : ""}`}
              onClick={() => { setAvailabilityFilter(f); setPage(1); }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading volunteers...</div>
      ) : error ? (
        <div className="card" style={{ color: "var(--red)", textAlign: "center", padding: "40px" }}>{error}</div>
      ) : volunteers.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <div className="empty-state-text">No volunteers found</div>
            <div className="empty-state-sub">Register a new volunteer or adjust your filters</div>
          </div>
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Skills</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <Link to={`/volunteers/${v.id}`} style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                          {v.name}
                        </Link>
                      </td>
                      <td style={{ fontSize: "12px" }}>{v.email}</td>
                      <td style={{ fontSize: "12px" }}>{v.phone}</td>
                      <td>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {(v.skills || "").split(",").filter(Boolean).map((skill, i) => (
                            <span key={i} style={{
                              padding: "2px 8px",
                              background: "var(--bg-base)",
                              border: "1px solid var(--border-subtle)",
                              borderRadius: "12px",
                              fontSize: "11px",
                              color: "var(--text-secondary)",
                              whiteSpace: "nowrap",
                            }}>
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                        {v.rating > 0 ? `★ ${v.rating.toFixed(1)}` : "—"}
                      </td>
                      <td>
                        <StatusBadge status={v.isAvailable ? "Available" : "Maintenance"} />
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${v.isAvailable ? "btn-ghost" : "btn-success"}`}
                          onClick={() => handleToggleAvailability(v.id, v.isAvailable)}
                        >
                          {v.isAvailable ? "Mark Unavailable" : "Mark Available"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Showing {volunteers.length > 0 ? (page - 1) * pageSize + 1 : 0}–{(page - 1) * pageSize + volunteers.length} volunteers
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                className="btn btn-ghost btn-sm"
                disabled={!hasPrevPage}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Previous
              </button>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", padding: "0 8px" }}>
                Page {page}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                disabled={!hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default VolunteerList;
