import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getVolunteerShifts, createShift } from "../services/volunteerService";
import { useAuth } from "../context/AuthContext";
import Modal, { FormField } from "../components/Modal";
import StatusBadge from "../components/StatusBadge";

const SHIFT_STATUSES = ["Scheduled", "Active", "Completed", "Cancelled"];

function VolunteerDetail() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const isCoordinator = hasRole(["Coordinator", "Admin"]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Student 4 — Assign Shift modal state (Coordinator/Admin only)
  const [showAssign, setShowAssign] = useState(false);
  const [shiftForm, setShiftForm] = useState({ start: "", end: "", status: "Scheduled" });
  const [assignError, setAssignError] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVolunteerShifts(id);
      setShifts(data);
    } catch {
      setError("Failed to load shift history.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const handleAssignShift = async (e) => {
    e.preventDefault();
    setAssignError(null);
    const start = new Date(shiftForm.start);
    const end = new Date(shiftForm.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setAssignError("Please choose both a start and an end time.");
      return;
    }
    // Client-side mirror of the API rule (server remains source of truth).
    if (end <= start) {
      setAssignError("Shift end time must be after start time.");
      return;
    }
    try {
      setAssigning(true);
      await createShift(id, {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        status: shiftForm.status,
      });
      setShiftForm({ start: "", end: "", status: "Scheduled" });
      setShowAssign(false);
      await fetchShifts();
    } catch (err) {
      setAssignError(err.response?.data?.message || err.message || "Failed to assign shift.");
    } finally {
      setAssigning(false);
    }
  };

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
        {isCoordinator && (
          <button className="btn btn-primary" onClick={() => { setAssignError(null); setShowAssign(true); }}>
            + Assign Shift
          </button>
        )}
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

      <Modal isOpen={showAssign} onClose={() => setShowAssign(false)} title="Assign Shift" subtitle={`Schedule a shift for volunteer ${id.slice(0, 8)}…`}>
        <form onSubmit={handleAssignShift}>
          <FormField label="Start Time" required>
            <input
              type="datetime-local"
              className="form-control"
              value={shiftForm.start}
              onChange={(e) => setShiftForm({ ...shiftForm, start: e.target.value })}
              required
            />
          </FormField>
          <FormField label="End Time" required>
            <input
              type="datetime-local"
              className="form-control"
              value={shiftForm.end}
              onChange={(e) => setShiftForm({ ...shiftForm, end: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Status">
            <select
              className="form-select"
              value={shiftForm.status}
              onChange={(e) => setShiftForm({ ...shiftForm, status: e.target.value })}
            >
              {SHIFT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </FormField>
          {assignError && (
            <div className="text-danger" style={{ fontSize: "13px", marginTop: "4px" }}>
              {assignError}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAssign(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={assigning}>
              {assigning ? "Assigning…" : "Assign Shift"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default VolunteerDetail;
