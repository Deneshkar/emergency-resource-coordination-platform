import { useState, useEffect } from "react";
import StatusBadge from "../components/StatusBadge";
import Modal, { FormField } from "../components/Modal";
import ValidationPanel from "../components/ValidationPanel";
import { useAuth } from "../context/AuthContext";
import { getDispatches, createDispatch, updateDispatchStatus } from "../services/dispatchService";
import { getIncidents } from "../services/incidentService";
import { getVolunteers } from "../services/volunteerService";
import { createDispatchTask } from "../services/dispatchService";
import { validateDispatch, getValidationHistory } from "../services/validationService";

export default function DispatchList() {
  const { hasRole } = useAuth();
  const isCoordinator = hasRole(["Coordinator", "Admin"]);
  const [dispatches, setDispatches] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showTask, setShowTask] = useState(null);
  const [form, setForm] = useState({ incidentId: "", priority: "Medium" });
  const [taskForm, setTaskForm] = useState({ volunteerId: "", taskType: "" });
  // Student 4 — Validation/Safety gate state per dispatch: { [id]: { result, loading, error } }
  const [validationById, setValidationById] = useState({});
  const [historyById, setHistoryById] = useState({});

  const handleValidate = async (id) => {
    setValidationById((prev) => ({ ...prev, [id]: { result: prev[id]?.result ?? null, loading: true, error: null } }));
    try {
      const result = await validateDispatch(id);
      setValidationById((prev) => ({ ...prev, [id]: { result, loading: false, error: null } }));
      try {
        const history = await getValidationHistory(id).catch(() => []);
        setHistoryById((prev) => ({ ...prev, [id]: Array.isArray(history) ? history : [] }));
      } catch {
        // history is best-effort; main result already shown
      }
    } catch (err) {
      const message = err?.message || "Validation request failed.";
      setValidationById((prev) => ({ ...prev, [id]: { result: null, loading: false, error: message } }));
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [d, i, v] = await Promise.all([
        getDispatches().catch(() => []),
        getIncidents().catch(() => []),
        getVolunteers("", null, 1, 100).catch(() => []),
      ]);
      setDispatches(d);
      setIncidents(i);
      setVolunteers(v);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await createDispatch({ incidentId: parseInt(form.incidentId), priority: form.priority });
    setForm({ incidentId: "", priority: "Medium" });
    setShowCreate(false);
    fetchData();
  };

  const handleStatusChange = async (id, status) => {
    await updateDispatchStatus(id, status);
    fetchData();
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    await createDispatchTask(showTask.id, {
      volunteerId: taskForm.volunteerId,
      taskType: taskForm.taskType,
    });
    setTaskForm({ volunteerId: "", taskType: "" });
    setShowTask(null);
    fetchData();
  };

  const statusFlow = ["Proposed", "PendingApproval", "Approved", "Assigned", "InProgress", "Completed"];

  const getNextStatus = (current) => {
    const idx = statusFlow.indexOf(current);
    if (idx >= 0 && idx < statusFlow.length - 1) return statusFlow[idx + 1];
    return null;
  };

  if (loading) return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      Loading dispatches...
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="page-header anim-slide-up">
        <div className="page-header-left">
          <h1>Dispatches</h1>
          <p>Resource allocation &amp; task assignment &mdash; {dispatches.length} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Create Dispatch
        </button>
      </div>

      <div className="grid-stats anim-stagger">
        <div className="card stat-card active-border anim-slide-up">
          <div className="stat-label">Pending Approval</div>
          <div className="stat-value" style={{ color: "var(--amber)" }}>{dispatches.filter(d => d.status === "PendingApproval").length}</div>
        </div>
        <div className="card stat-card ai-border anim-slide-up">
          <div className="stat-label">Assigned</div>
          <div className="stat-value" style={{ color: "var(--blue)" }}>{dispatches.filter(d => d.status === "Assigned").length}</div>
        </div>
        <div className="card stat-card anim-slide-up">
          <div className="stat-label">In Progress</div>
          <div className="stat-value" style={{ color: "var(--cyan)" }}>{dispatches.filter(d => d.status === "InProgress").length}</div>
        </div>
        <div className="card stat-card anim-slide-up">
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ color: "var(--green)" }}>{dispatches.filter(d => d.status === "Completed").length}</div>
        </div>
      </div>

      {dispatches.length === 0 ? (
        <div className="card anim-fade-in">
          <div className="empty-state">
            <div className="empty-state-icon">🚛</div>
            <div className="empty-state-text">No dispatches created</div>
            <div className="empty-state-sub">Create a dispatch to allocate resources to an incident</div>
          </div>
        </div>
      ) : (
        <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {dispatches.map((d) => {
            const nextStatus = getNextStatus(d.status);
            const inc = incidents.find((i) => i.id === d.incidentId);
            // Student 4 soft-gate: high-impact move to Approved requires a fresh
            // APPROVE/REVISE validation. REJECT or no check blocks Approve (Reject stays allowed).
            const validation = validationById[d.id];
            const needsGate = nextStatus === "Approved";
            const gatePassed =
              validation?.result?.recommendation === "APPROVE" ||
              validation?.result?.recommendation === "REVISE";
            const gateBlocked = needsGate && !gatePassed;
            return (
              <div
                key={d.id}
                className="card anim-slide-up"
                style={{
                  borderLeft: `3px solid ${
                    d.status === "Completed" ? "var(--green)" :
                    d.status === "InProgress" ? "var(--cyan)" :
                    d.status === "Rejected" ? "var(--red)" :
                    "var(--blue)"
                  }`,
                }}
              >
                <div className="card-header">
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span className="card-title">Dispatch #{d.id}</span>
                      <StatusBadge status={d.status} size="md" />
                    </div>
                    <div className="text-muted" style={{ fontSize: "13px", marginBottom: "4px" }}>
                      {inc ? inc.title : `Incident #${d.incidentId}`} &middot; Priority: {d.priority}
                    </div>
                    <div className="text-dim font-mono" style={{ fontSize: "12px" }}>
                      Created: {new Date(d.createdAt).toLocaleString()}
                      {d.approvedAt && ` \u00b7 Approved: ${new Date(d.approvedAt).toLocaleString()}`}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
                    {isCoordinator && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleValidate(d.id)}
                        disabled={validation?.loading}
                        title="Run the deterministic Validation/Safety Agent before approval"
                      >
                        {validation?.loading ? "Checking…" : validation?.result ? "🛡️ Re-check" : "🛡️ Run Safety Check"}
                      </button>
                    )}
                    {nextStatus && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleStatusChange(d.id, nextStatus)}
                        disabled={isCoordinator && gateBlocked}
                        title={
                          isCoordinator && gateBlocked
                            ? validation?.result?.recommendation === "REJECT"
                              ? "Blocked: safety gate returned REJECT — fix blockers and re-run the check"
                              : "Run the safety check first — approval requires APPROVE or REVISE"
                            : `Move to ${nextStatus}`
                        }
                      >
                        Move to {nextStatus}
                      </button>
                    )}
                    {d.status !== "Completed" && d.status !== "Rejected" && (
                      <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleStatusChange(d.id, "Rejected")}>
                        Reject
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowTask(d)}>
                      + Add Task
                    </button>
                  </div>
                </div>

                {isCoordinator && (
                  <ValidationPanel
                    result={validation?.result ?? null}
                    loading={validation?.loading ?? false}
                    error={validation?.error ?? null}
                    history={historyById[d.id] ?? []}
                    onRerun={() => handleValidate(d.id)}
                  />
                )}

                {d.tasks && d.tasks.length > 0 && (
                  <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)" }}>
                    <div className="text-dim" style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px" }}>
                      Tasks ({d.tasks.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {d.tasks.map((t) => {
                        const vol = volunteers.find((v) => v.id === t.volunteerId);
                        return (
                          <div
                            key={t.id}
                            className="glass-card"
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 12px",
                              fontSize: "12px",
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{t.taskType}</span>
                              <span className="text-dim" style={{ marginLeft: "8px" }}>
                                {vol ? vol.name : t.volunteerId?.slice(0, 8)}
                              </span>
                            </div>
                            <StatusBadge status={t.status} size="sm" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Dispatch" subtitle="Allocate resources to respond to an incident">
        <form onSubmit={handleCreate}>
          <FormField label="Incident" required>
            <select className="form-select" value={form.incidentId} onChange={(e) => setForm({ ...form, incidentId: e.target.value })} required>
              <option value="">Select an incident...</option>
              {incidents.map((i) => (
                <option key={i.id} value={i.id}>#{i.id} - {i.title}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Priority">
            <select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Dispatch</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showTask} onClose={() => setShowTask(null)} title={`Add Task to Dispatch #${showTask?.id}`} subtitle="Assign a volunteer to this dispatch">
        <form onSubmit={handleCreateTask}>
          <FormField label="Volunteer" required>
            <select className="form-select" value={taskForm.volunteerId} onChange={(e) => setTaskForm({ ...taskForm, volunteerId: e.target.value })} required>
              <option value="">Select a volunteer...</option>
              {volunteers.filter(v => v.isAvailable).map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.skills || "General"})</option>
              ))}
            </select>
          </FormField>
          <FormField label="Task Type" required>
            <input className="form-control" placeholder="e.g. Medical Response, Transport" value={taskForm.taskType} onChange={(e) => setTaskForm({ ...taskForm, taskType: e.target.value })} required />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowTask(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Assign Task</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
