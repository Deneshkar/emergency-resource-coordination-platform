import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getVolunteerShifts } from "../services/volunteerService";
import StatusBadge from "../components/StatusBadge";

function VolunteerDetail() {
  const { id } = useParams();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShifts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getVolunteerShifts(id);
        setShifts(data);
      } catch (err) {
        setError("Failed to load shift history.");
      } finally {
        setLoading(false);
      }
    };
    fetchShifts();
  }, [id]);

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: "20px" }}>
        <Link to="/volunteers" style={{ fontSize: "13px", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          ← Back to Volunteers
        </Link>
      </div>

      <div className="page-header">
        <div className="page-header-left">
          <h1>Volunteer Shift History</h1>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-dim)" }}>
            ID: {id}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading shifts...</div>
      ) : error ? (
        <div className="card" style={{ color: "var(--red)", textAlign: "center", padding: "40px" }}>{error}</div>
      ) : shifts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-text">No shifts recorded</div>
            <div className="empty-state-sub">This volunteer hasn't been assigned any shifts yet</div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Shift ID</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((s) => (
                  <tr key={s.id}>
                    <td>#{s.id}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                      {new Date(s.startTime).toLocaleString()}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                      {new Date(s.endTime).toLocaleString()}
                    </td>
                    <td><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default VolunteerDetail;
