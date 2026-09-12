import { useState, useEffect } from "react";
import StatusBadge from "../components/StatusBadge";
import Modal, { FormField, FormRow } from "../components/Modal";
import { getDispatches, createDispatch, updateDispatchStatus } from "../services/dispatchService";
import { getIncidents } from "../services/incidentService";
import { getVolunteers } from "../services/volunteerService";
import { createDispatchTask } from "../services/dispatchService";

export default function DispatchList() {
  const [dispatches, setDispatches] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showTask, setShowTask] = useState(null);
  const [form, setForm] = useState({ incidentId: "", priority: "Medium" });
  const [taskForm, setTaskForm] = useState({ volunteerId: "", taskType: "" });

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

  if (loading) return <div className="loading-spinner">Loading dispatches...</div>;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dispatches</h1>
          <p>Resource allocation &amp; task assignment &mdash; {dispatches.length} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Create Dispatch
        </button>
      </div>

      {/* Stats */}
      <div className="grid-stats" style={{ marginBottom: "24px" }}>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>Pending Approval</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--amber)", marginTop: "2px" }}>{dispatches.filter(d => d.status === "PendingApproval").length}</div>
        </div>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>Assigned</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--blue)", marginTop: "2px" }}>{dispatches.filter(d => d.status === "Assigned").length}</div>
        </div>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>In Progress</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--cyan)", marginTop: "2px" }}>{dispatches.filter(d => d.status === "InProgress").length}</div>
        </div>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>Completed</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--green)", marginTop: "2px" }}>{dispatches.filter(d => d.status === "Completed").length}</div>
        </div>
      </div>

      {/* Dispatch Cards */}
      {dispatches.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🚛</div>
            <div className="empty-state-text">No dispatches created</div>
            <div className="empty-state-sub">Create a dispatch to allocate resources to an incident</div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {dispatches.map((d) => {
            const nextStatus = getNextStatus(d.status);
            const inc = incidents.find((i) => i.id === d.incidentId);
            return (
              <div
                key={d.id}
                className="card"
                style={{
                  borderLeft: `3px solid ${
                    d.status === "Completed" ? "var(--green)" :
                    d.status === "InProgress" ? "var(--cyan)" :
                    d.status === "Rejected" ? "var(--red)" :
                    "var(--blue)"
                  }`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span style={{ fontWeight: "800", fontSize: "15px", color: "var(--text-primary)" }}>Dispatch #{d.id}</span>
                      <StatusBadge status={d.status} size="md" />
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
                      {inc ? inc.title : `Incident #${d.incidentId}`} &middot; Priority: {d.priority}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                      Created: {new Date(d.createdAt).toLocaleString()}
                      {d.approvedAt && ` \u00b7 Approved: ${new Date(d.approvedAt).toLocaleString()}`}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                    {nextStatus && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(d.id, nextStatus)}>
                        Move to {nextStatus}
                      </button>
                    )}
                    {d.status !== "Completed" && d.status !== "Rejected" && (
                      <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }} onClick={() => handleStatusChange(d.id, "Rejected")}>
                        Reject
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowTask(d)}>
                      + Add Task
                    </button>
                  </div>
                </div>

                {/* Tasks */}
                {d.tasks && d.tasks.length > 0 && (
                  <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-dim)", marginBottom: "8px" }}>
                      Tasks ({d.tasks.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {d.tasks.map((t) => {
                        const vol = volunteers.find((v) => v.id === t.volunteerId);
                        return (
                          <div
                            key={t.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 12px",
                              background: "var(--bg-base)",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--border-subtle)",
                              fontSize: "12px",
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{t.taskType}</span>
                              <span style={{ color: "var(--text-dim)", marginLeft: "8px" }}>
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

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Dispatch" subtitle="Allocate resources to respond to an incident">
        <form onSubmit={handleCreate}>
          <FormField label="Incident" required>
            <select value={form.incidentId} onChange={(e) => setForm({ ...form, incidentId: e.target.value })} required>
              <option value="">Select an incident...</option>
              {incidents.map((i) => (
                <option key={i.id} value={i.id}>#{i.id} - {i.title}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Priority">
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
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

      {/* Add Task Modal */}
      <Modal isOpen={!!showTask} onClose={() => setShowTask(null)} title={`Add Task to Dispatch #${showTask?.id}`} subtitle="Assign a volunteer to this dispatch">
        <form onSubmit={handleCreateTask}>
          <FormField label="Volunteer" required>
            <select value={taskForm.volunteerId} onChange={(e) => setTaskForm({ ...taskForm, volunteerId: e.target.value })} required>
              <option value="">Select a volunteer...</option>
              {volunteers.filter(v => v.isAvailable).map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.skills || "General"})</option>
              ))}
            </select>
          </FormField>
          <FormField label="Task Type" required>
            <input placeholder="e.g. Medical Response, Transport" value={taskForm.taskType} onChange={(e) => setTaskForm({ ...taskForm, taskType: e.target.value })} required />
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
