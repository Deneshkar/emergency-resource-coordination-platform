import { useState, useEffect } from "react";
import StatusBadge from "../components/StatusBadge";
import Modal, { FormField } from "../components/Modal";
import ValidationPanel from "../components/ValidationPanel";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import {
  getDispatches,
  createDispatch,
  updateDispatchStatus,
  createDispatchTask,
  updateDispatchTask,
  deleteDispatchTask,
  proposeAllocation,
} from "../services/dispatchService";
import { getIncidents } from "../services/incidentService";
import { incidentService } from "../services/incidentService";
import { getVolunteers } from "../services/volunteerService";
import { getResources } from "../services/resourceService";
import { validateDispatch, getValidationHistory, canApprove, approvalBlockReason } from "../services/validationService";

export default function DispatchList() {
  const { hasRole } = useAuth();
  const isCoordinator = hasRole(["Coordinator", "Admin"]);
  const [dispatches, setDispatches] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showTask, setShowTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [allocationLoadingById, setAllocationLoadingById] = useState({});
  const [form, setForm] = useState({ incidentId: "", priority: "Medium" });
  const [taskForm, setTaskForm] = useState({ volunteerId: "", resourceId: "", taskType: "" });
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
      const [d, i, v, r] = await Promise.all([
        getDispatches().catch(() => []),
        getIncidents().catch(() => []),
        getVolunteers("", null, 1, 100).catch(() => []),
        getResources().catch(() => []),
      ]);
      setDispatches(d);
      setIncidents(i);
      setVolunteers(v);
      setResources(r);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createDispatch({ incidentId: parseInt(form.incidentId), priority: form.priority });
      setForm({ incidentId: "", priority: "Medium" });
      setShowCreate(false);
      toast.success("Dispatch created successfully");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create dispatch.");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateDispatchStatus(id, status);
      toast.success(`Dispatch status updated to ${status}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update dispatch status.");
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const taskData = {
        volunteerId: taskForm.volunteerId,
        resourceId: taskForm.resourceId ? Number(taskForm.resourceId) : null,
        taskType: taskForm.taskType,
      };
      if (editingTask) {
        await updateDispatchTask(showTask.id, editingTask.id, taskData);
      } else {
        await createDispatchTask(showTask.id, taskData);
      }
      setValidationById((prev) => ({ ...prev, [showTask.id]: { result: null, loading: false, error: null } }));
      setTaskForm({ volunteerId: "", resourceId: "", taskType: "" });
      setShowTask(null);
      setEditingTask(null);
      toast.success(editingTask ? "Task assignment updated" : "Task assigned successfully");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save task assignment.");
    }
  };

  const handleRequestAllocation = async (dispatch) => {
    setAllocationLoadingById((prev) => ({ ...prev, [dispatch.id]: true }));
    try {
      const plan = await incidentService.generatePlan(
        dispatch.incidentId,
        `Prepare an allocation proposal for dispatch #${dispatch.id} at ${dispatch.priority} priority.`
      );
      await proposeAllocation(dispatch.id, plan.id);
      setValidationById((prev) => ({ ...prev, [dispatch.id]: { result: null, loading: false, error: null } }));
      toast.success("Allocation proposal generated");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to request an allocation proposal.");
    } finally {
      setAllocationLoadingById((prev) => ({ ...prev, [dispatch.id]: false }));
    }
  };

  const handleDeleteTask = async (dispatchId, taskId) => {
    try {
      await deleteDispatchTask(dispatchId, taskId);
      setValidationById((prev) => ({ ...prev, [dispatchId]: { result: null, loading: false, error: null } }));
      toast.success("Task removed from proposal");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to remove task.");
    }
  };

  const openTaskForm = (dispatch, task = null) => {
    setShowTask(dispatch);
    setEditingTask(task);
    setTaskForm({
      volunteerId: task?.volunteerId ?? "",
      resourceId: task?.resourceId == null ? "" : String(task.resourceId),
      taskType: task?.taskType ?? "",
    });
  };

  const closeTaskForm = () => {
    setShowTask(null);
    setEditingTask(null);
    setTaskForm({ volunteerId: "", resourceId: "", taskType: "" });
  };

  const statusFlow = ["Approved", "Assigned", "InProgress", "Completed"];

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
            const validation = validationById[d.id];
            const gateBlocked = !canApprove(validation?.result);
            const blockReason = approvalBlockReason(validation?.result);
            const canEditTasks = isCoordinator && ["Proposed", "PendingApproval"].includes(d.status);
            const proposal = d.allocationProposal;
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
                    {isCoordinator && ["Proposed", "PendingApproval"].includes(d.status) && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleRequestAllocation(d)}
                        disabled={allocationLoadingById[d.id]}
                        title="Generate and attach an allocation proposal to this dispatch"
                      >
                        {allocationLoadingById[d.id]
                          ? "Requesting…"
                          : proposal ? "↻ Re-run Allocation" : "Request Allocation"}
                      </button>
                    )}
                    {isCoordinator && d.status === "PendingApproval" && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleValidate(d.id)}
                        disabled={validation?.loading}
                        title="Run the deterministic Validation/Safety Agent before approval"
                      >
                        {validation?.loading ? "Checking…" : validation?.result ? "Re-run Safety Check" : "Run Safety Check"}
                      </button>
                    )}
                    {isCoordinator && d.status === "PendingApproval" && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleStatusChange(d.id, "Approved")}
                        disabled={gateBlocked}
                        title={gateBlocked ? blockReason : "Approve this allocation proposal"}
                      >
                        Approve Proposal
                      </button>
                    )}
                    {nextStatus && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleStatusChange(d.id, nextStatus)}
                        title={`Move to ${nextStatus}`}
                      >
                        Move to {nextStatus}
                      </button>
                    )}
                    {isCoordinator && d.status !== "Completed" && d.status !== "Rejected" && (
                      <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleStatusChange(d.id, "Rejected")}>
                        Reject
                      </button>
                    )}
                    {canEditTasks && (
                      <button className="btn btn-ghost btn-sm" onClick={() => openTaskForm(d)}>
                        + Assign Task
                      </button>
                    )}
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

                {proposal && (
                  <section
                    aria-label="Allocation proposal"
                    data-testid={`allocation-proposal-${d.id}`}
                    style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)" }}
                  >
                    <div className="card-title" style={{ fontSize: "14px", marginBottom: "4px" }}>
                      {proposal.planTitle || "Allocation proposal"}
                    </div>
                    <div className="text-dim" style={{ fontSize: "12px", marginBottom: "10px" }}>
                      {proposal.phase} · Generated {new Date(proposal.createdAt).toLocaleString()}
                    </div>
                    {proposal.planDescription && <p style={{ fontSize: "13px", marginBottom: "10px" }}>{proposal.planDescription}</p>}
                    {proposal.dispatchPlan?.length > 0 && (
                      <div style={{ marginBottom: "10px" }}>
                        <div className="text-dim" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: "6px" }}>Proposed actions</div>
                        {proposal.dispatchPlan.map((step, index) => (
                          <div key={`${step.action}-${index}`} className="glass-card" style={{ padding: "8px 10px", marginBottom: "5px", fontSize: "12px" }}>
                            <strong>{step.action}</strong> · {step.resource} · {step.location}
                            {step.reason && <div className="text-dim" style={{ marginTop: "3px" }}>{step.reason}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                    {proposal.suggestedAssignments?.length > 0 && (
                      <div style={{ marginBottom: "10px" }}>
                        <div className="text-dim" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: "6px" }}>Suggested assignments</div>
                        {proposal.suggestedAssignments.map((assignment, index) => (
                          <div key={`${assignment.entityName}-${index}`} style={{ fontSize: "12px", marginBottom: "4px" }}>
                            <strong>{assignment.role}</strong> · {assignment.entityName} <span className="text-dim">{assignment.reason}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {(proposal.constraints?.length > 0 || proposal.risks?.length > 0 || proposal.riskAssessment) && (
                      <div style={{ fontSize: "12px" }}>
                        {proposal.riskAssessment && <div><strong>Risk:</strong> {proposal.riskAssessment}</div>}
                        {proposal.constraints?.map((item, index) => <div key={`constraint-${index}`} className="text-danger">Constraint: {item}</div>)}
                        {proposal.risks?.map((item, index) => <div key={`risk-${index}`} style={{ color: "var(--amber)" }}>Risk: {item}</div>)}
                      </div>
                    )}
                    {canEditTasks && (
                      <div className="text-dim" style={{ fontSize: "11px", marginTop: "10px" }}>
                        Review the proposal, then assign or adjust tasks below before running the safety check.
                      </div>
                    )}
                  </section>
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
                              {t.resourceId != null && (
                                <span className="text-dim" style={{ marginLeft: "8px" }}>
                                  · {resources.find((resource) => resource.id === t.resourceId)?.name || `Resource #${t.resourceId}`}
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <StatusBadge status={t.status} size="sm" />
                              {canEditTasks && (
                                <>
                                  <button className="btn btn-ghost btn-sm" title="Edit assignment" onClick={() => openTaskForm(d, t)}>Edit</button>
                                  <button className="btn btn-ghost btn-sm text-danger" title="Remove assignment" onClick={() => handleDeleteTask(d.id, t.id)}>Remove</button>
                                </>
                              )}
                            </div>
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

      <Modal isOpen={!!showTask} onClose={closeTaskForm} title={`${editingTask ? "Edit" : "Assign"} Task${showTask ? ` · Dispatch #${showTask.id}` : ""}`} subtitle="Assign a volunteer and optional resource">
        <form onSubmit={handleCreateTask}>
          <FormField label="Volunteer" required>
            <select className="form-select" value={taskForm.volunteerId} onChange={(e) => setTaskForm({ ...taskForm, volunteerId: e.target.value })} required>
              <option value="">Select a volunteer...</option>
              {volunteers.filter(v => v.isAvailable).map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.skills || "General"})</option>
              ))}
            </select>
          </FormField>
          <FormField label="Resource">
            <select className="form-select" value={taskForm.resourceId} onChange={(e) => setTaskForm({ ...taskForm, resourceId: e.target.value })}>
              <option value="">No resource assigned</option>
              {resources.filter((resource) => resource.status === "Available" || resource.id === Number(taskForm.resourceId)).map((resource) => (
                <option key={resource.id} value={resource.id}>{resource.name} · {resource.resourceType}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Task Type" required>
            <input className="form-control" placeholder="e.g. Medical Response, Transport" value={taskForm.taskType} onChange={(e) => setTaskForm({ ...taskForm, taskType: e.target.value })} required />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <button type="button" className="btn btn-ghost" onClick={closeTaskForm}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingTask ? "Save Assignment" : "Assign Task"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
