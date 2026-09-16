import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { incidentService } from "../services/incidentService";
import { useAuth } from "../context/AuthContext";

function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const isCoordinator = hasRole(["Coordinator", "Admin"]);
  const isVolunteer = user?.role === "Volunteer";
  const isCitizen = user?.role === "Citizen";

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // AI Plan Generation state
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [customDirectives, setCustomDirectives] = useState("");
  const [focusPhase, setFocusPhase] = useState("");
  const [showAiControls, setShowAiControls] = useState(true);

  // Status & Priority edit state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newPriority, setNewPriority] = useState("");
  const [newAssignedCoordinator, setNewAssignedCoordinator] = useState("");
  const [newNote, setNewNote] = useState("");

  // Timeline note state
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDesc, setNoteDesc] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    loadIncident();
  }, [id]);

  const loadIncident = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await incidentService.getIncident(id);
      setIncident(data);
      setNewStatus(data.status);
      setNewPriority(data.priority);
      setNewAssignedCoordinator(data.assignedCoordinator || "");
    } catch (err) {
      console.error(err);
      setError(`Failed to load incident #${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    try {
      setGeneratingPlan(true);
      await incidentService.generatePlan(id, customDirectives, focusPhase);
      setCustomDirectives("");
      setFocusPhase("");
      await loadIncident();
    } catch (err) {
      alert("Error generating plan: " + err.message);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      setUpdatingStatus(true);
      await incidentService.updateIncident(id, {
        status: newStatus,
        priority: newPriority,
        assignedCoordinator: newAssignedCoordinator,
        note: newNote,
      });
      setNewNote("");
      await loadIncident();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePlanStatusChange = async (planId, status) => {
    try {
      await incidentService.updatePlanStatus(planId, status, "Command Coordinator");
      await loadIncident();
    } catch (err) {
      alert("Failed to update plan status: " + err.message);
    }
  };

  const handleDeleteIncident = async () => {
    if (!window.confirm("Are you sure you want to delete this incident?")) return;
    try {
      await incidentService.deleteIncident(id);
      navigate("/incidents");
    } catch (err) {
      alert("Failed to delete incident: " + err.message);
    }
  };

  const handleAddTimelineNote = async (e) => {
    e.preventDefault();
    if (!noteTitle || !noteDesc) return;
    try {
      setAddingNote(true);
      await incidentService.addTimelineEvent(id, noteTitle, noteDesc, "DispatcherNote", "Dispatcher");
      setNoteTitle("");
      setNoteDesc("");
      await loadIncident();
    } catch (err) {
      alert("Failed to add note: " + err.message);
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Analyzing Incident Telemetry & AI Agent Data...</p>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="incident-hub-container">
        <div className="alert alert-error">{error || "Incident not found"}</div>
        <Link to="/incidents" className="btn btn-secondary">
          ← Back to Incident Command Center
        </Link>
      </div>
    );
  }

  return (
    <div className="incident-detail-container">
      {/* Top Nav Breadcrumb */}
      <div className="detail-top-bar">
        <Link to="/incidents" className="btn btn-ghost">
          ← Back to Incident Hub
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="detail-incident-id">Incident #{incident.id}</span>
          {isCoordinator && (
            <button
              className="btn btn-ghost-danger"
              onClick={handleDeleteIncident}
              title="Permanently remove this incident from command database"
            >
              Delete Incident
            </button>
          )}
        </div>
      </div>

      {/* Main Banner */}
      <div className="incident-detail-banner">
        <div>
          <div className="badges-group" style={{ marginBottom: "10px" }}>
            <span className={`badge badge-${incident.priority?.toLowerCase()}`}>
              {incident.priority} Priority
            </span>
            <span className="badge badge-category">{incident.category}</span>
            <span className="badge badge-info">{incident.status}</span>
          </div>
          <h1 className="detail-title">{incident.title}</h1>
          <p className="detail-location">📍 Location: {incident.location}</p>
        </div>

        {isCoordinator ? (
          <button
            className="btn btn-accent shadow-glow"
            onClick={() => setShowAiControls(!showAiControls)}
          >
            🤖 {showAiControls ? "Hide AI Coordinator Panel" : "Open AI Coordinator Workbench"}
          </button>
        ) : isVolunteer ? (
          <div className="badge badge-accent" style={{ fontSize: "13px", padding: "8px 14px", alignSelf: "center" }}>
            🦺 Tactical Field Responder View
          </div>
        ) : (
          <div className="badge badge-info" style={{ fontSize: "13px", padding: "8px 14px", alignSelf: "center" }}>
            🛡️ Citizen Report Tracking
          </div>
        )}
      </div>

      {/* AI Coordinator Workbench / Plan Generator Drawer (Coordinators Only) */}
      {isCoordinator && showAiControls && (
        <div className="ai-workbench-card">
          <div className="ai-card-header">
            <h3>🤖 AI Coordinator / Planner Agent Workbench</h3>
            <span className="badge badge-ai">Autonomous Agent Ready</span>
          </div>
          <p className="ai-workbench-desc">
            The AI Coordinator Agent synthesizes incident category, impact scope, location, and priority to generate actionable 4-phase response plans.
          </p>

          <form onSubmit={handleGeneratePlan} className="ai-form-grid">
            <div>
              <label className="form-label">Custom Operational Directives (Optional):</label>
              <input
                type="text"
                placeholder="e.g. Prioritize medical evacuation over structural assessment..."
                value={customDirectives}
                onChange={(e) => setCustomDirectives(e.target.value)}
                className="form-control"
              />
            </div>

            <div>
              <label className="form-label">Target Staging Phase (Optional):</label>
              <select
                value={focusPhase}
                onChange={(e) => setFocusPhase(e.target.value)}
                className="form-select"
              >
                <option value="">Auto-Determine Staging Phase</option>
                <option value="Immediate Containment">Immediate Containment & Life Safety</option>
                <option value="Resource Mobilization">Resource Mobilization & Staging</option>
                <option value="Public Safety & Evacuation">Public Safety & Evacuation</option>
                <option value="Recovery & Monitoring">Recovery & Post-Incident Monitoring</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                type="submit"
                className="btn btn-accent btn-block"
                disabled={generatingPlan}
              >
                {generatingPlan ? "⚡ Agent Generating Plan..." : "⚡ Generate AI Action Plan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid Layout: Left Column (Incident Info & Controls) | Right Column (AI Plans & Timeline) */}
      <div className="detail-main-grid">
        {/* Left Column: Info & Status Update */}
        <div className="detail-sidebar">
          {/* Incident Overview Card */}
          <div className="glass-card">
            <h3>Incident Overview</h3>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Category:</span>
                <span className="info-val">{incident.category}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className="info-val">{incident.status}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Priority:</span>
                <span className="info-val">{incident.priority}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Affected People:</span>
                <span className="info-val">👥 {incident.affectedCount} individuals</span>
              </div>
              <div className="info-item">
                <span className="info-label">Reporter Contact:</span>
                <span className="info-val">{incident.reporterContact || "Anonymous Citizen"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Assigned Coordinator:</span>
                <span className="info-val">🤖 {incident.assignedCoordinator}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Reported At:</span>
                <span className="info-val">{new Date(incident.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <h4 style={{ marginTop: "16px", marginBottom: "8px" }}>Full Description</h4>
            <p className="desc-box">{incident.description}</p>
          </div>

          {/* Role-Gated Incident Control Panel */}
          {isCoordinator ? (
            <div className="glass-card">
              <h3>Update Incident Controls</h3>
              <form onSubmit={handleStatusUpdate}>
                <div className="form-group">
                  <label className="form-label">Update Status:</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="form-select"
                  >
                    <option value="Reported">Reported</option>
                    <option value="Active Planning">Active Planning</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Update Priority:</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="form-select"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Coordinator:</label>
                  <input
                    type="text"
                    placeholder="e.g. Command Coordinator"
                    value={newAssignedCoordinator}
                    onChange={(e) => setNewAssignedCoordinator(e.target.value)}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Audit Log Note:</label>
                  <textarea
                    rows="2"
                    placeholder="Optional rationale for status/priority change..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="form-control"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-secondary btn-block"
                  disabled={updatingStatus}
                >
                  {updatingStatus ? "Saving..." : "Save Control Updates"}
                </button>
              </form>
            </div>
          ) : isVolunteer ? (
            <div className="glass-card">
              <h3>Field Status Update</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "12px" }}>
                Update on-ground status as you deploy and carry out tactical assignments.
              </p>
              <form onSubmit={handleStatusUpdate}>
                <div className="form-group">
                  <label className="form-label">Operational Status:</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="form-select"
                  >
                    <option value="Reported">Reported</option>
                    <option value="Active Planning">Active Planning</option>
                    <option value="Dispatched">Dispatched / En Route</option>
                    <option value="Resolved">Resolved / Complete</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Field Progress Note:</label>
                  <textarea
                    rows="3"
                    placeholder="Describe scene conditions or actions taken..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="form-control"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={updatingStatus}
                >
                  {updatingStatus ? "Updating..." : "Update Field Progress"}
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-card citizen-tracker-card">
              <h3>🛡️ Citizen Response Tracker</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                Live tracking of emergency response units assigned to this incident report.
              </p>

              {/* Visual 4-Stage Stepper */}
              <div className="citizen-stepper">
                <div className="stepper-step completed">
                  <div className="stepper-dot">✓</div>
                  <div className="stepper-info">
                    <div className="stepper-title">Report Received</div>
                    <div className="stepper-sub">Logged in National Emergency Grid</div>
                  </div>
                </div>

                <div className={`stepper-step ${incident.status !== "Reported" ? "completed" : "active"}`}>
                  <div className="stepper-dot">{incident.status !== "Reported" ? "✓" : "2"}</div>
                  <div className="stepper-info">
                    <div className="stepper-title">Triage & Planning</div>
                    <div className="stepper-sub">
                      {incident.status === "Reported" ? "Under coordinator review" : "Assessed & verified"}
                    </div>
                  </div>
                </div>

                <div className={`stepper-step ${["Dispatched", "Resolved", "Closed"].includes(incident.status) ? "completed" : incident.status === "Active Planning" ? "active" : ""}`}>
                  <div className="stepper-dot">
                    {["Dispatched", "Resolved", "Closed"].includes(incident.status) ? "✓" : "3"}
                  </div>
                  <div className="stepper-info">
                    <div className="stepper-title">Units Dispatched</div>
                    <div className="stepper-sub">
                      {["Dispatched", "Resolved", "Closed"].includes(incident.status)
                        ? "Responders deployed to location"
                        : "Preparing tactical mobilization"}
                    </div>
                  </div>
                </div>

                <div className={`stepper-step ${["Resolved", "Closed"].includes(incident.status) ? "completed" : ""}`}>
                  <div className="stepper-dot">
                    {["Resolved", "Closed"].includes(incident.status) ? "✓" : "4"}
                  </div>
                  <div className="stepper-info">
                    <div className="stepper-title">Hazard Resolved</div>
                    <div className="stepper-sub">
                      {["Resolved", "Closed"].includes(incident.status)
                        ? "Site confirmed secure & safe"
                        : "Awaiting final clearance"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Notice Box */}
              <div className="citizen-safety-box" style={{ marginTop: "16px" }}>
                <div style={{ fontWeight: "700", color: "#fbbf24", fontSize: "0.85rem", marginBottom: "4px" }}>
                  ⚠️ Safety Advisory
                </div>
                <div style={{ fontSize: "0.82rem", color: "#e2e8f0", lineHeight: "1.4" }}>
                  Please keep your contact phone active. If water levels rise or immediate life threat escalates, call emergency hotline <strong>119</strong> / <strong>1990</strong> immediately.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Plans & Timeline */}
        <div className="detail-content-area">
          {/* AI Response Plans Section */}
          <div className="section-block">
            <h2 className="section-title">
              📋 AI Response Plans ({incident.plans?.length || 0})
            </h2>

            {incident.plans?.length === 0 ? (
              <div className="empty-state">
                <p>
                  {isCoordinator
                    ? "No response plans have been generated yet for this incident."
                    : "Operational response plans are currently being formulated by command dispatch."}
                </p>
                {isCoordinator && (
                  <button
                    className="btn btn-accent"
                    style={{ marginTop: "10px" }}
                    onClick={handleGeneratePlan}
                    disabled={generatingPlan}
                  >
                    ⚡ Generate Initial Response Plan
                  </button>
                )}
              </div>
            ) : (
              incident.plans.map((plan) => (
                <div key={plan.id} className="plan-card">
                  <div className="plan-header">
                    <div>
                      <div className="badges-group" style={{ marginBottom: "4px" }}>
                        <span className={`badge badge-plan-${plan.status?.toLowerCase()}`}>
                          Status: {plan.status}
                        </span>
                        <span className="badge badge-category">Phase: {plan.phase}</span>
                      </div>
                      <h3 className="plan-title">{plan.planTitle}</h3>
                      <p className="plan-date">
                        Generated by AI Coordinator on {new Date(plan.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {isCoordinator ? (
                      <div className="plan-actions">
                        {plan.status !== "Approved" && plan.status !== "InExecution" && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handlePlanStatusChange(plan.id, "Approved")}
                          >
                            ✓ Approve Plan
                          </button>
                        )}

                        {plan.status === "Approved" && (
                          <button
                            className="btn btn-sm btn-accent"
                            onClick={() => handlePlanStatusChange(plan.id, "InExecution")}
                          >
                            🚀 Execute & Dispatch
                          </button>
                        )}

                        {plan.status === "InExecution" && (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handlePlanStatusChange(plan.id, "Completed")}
                          >
                            🏁 Mark Completed
                          </button>
                        )}

                        {plan.status !== "Rejected" && (
                          <button
                            className="btn btn-sm btn-ghost-danger"
                            onClick={() => handlePlanStatusChange(plan.id, "Rejected")}
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="plan-actions">
                        <span className="badge badge-outline" style={{ padding: "6px 12px", fontSize: "12px" }}>
                          {plan.status === "Approved" ? "✓ Authorized by Command" : plan.status === "InExecution" ? "🚀 Active Field Deployment" : `Status: ${plan.status}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="plan-desc">{plan.planDescription}</p>

                  {/* Threat Risk Assessment Banner */}
                  {plan.riskAssessment && (
                    <div className="risk-banner">
                      <div className="risk-title">⚠️ Threat Risk Assessment</div>
                      <p className="risk-content">{plan.riskAssessment}</p>
                    </div>
                  )}

                  {/* Tactical Action Steps Checklist */}
                  {plan.actionSteps && plan.actionSteps.length > 0 && (
                    <div className="plan-section">
                      <h4>Tactical Action Steps ({plan.actionSteps.length})</h4>
                      <div className="action-steps-list">
                        {plan.actionSteps.map((step) => (
                          <div key={step.stepNumber} className="action-step-item">
                            <div className="step-num">{step.stepNumber}</div>
                            <div className="step-content">
                              <div className="step-task">{step.task}</div>
                              <div className="step-meta">
                                <span>Team: <strong>{step.responsibleTeam}</strong></span>
                                <span>Priority: <strong>{step.priority}</strong></span>
                                <span>Est. Duration: <strong>{step.estimatedMinutes} mins</strong></span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Estimated Resources Requirement (Coordinators & Volunteers) */}
                  {!isCitizen && plan.estimatedResources && plan.estimatedResources.length > 0 && (
                    <div className="plan-section">
                      <h4>Estimated Required Resources</h4>
                      <div className="resources-grid">
                        {plan.estimatedResources.map((res, i) => (
                          <div key={i} className="resource-pill">
                            <span className="res-type">{res.resourceType}</span>
                            <span className="res-qty">{res.quantity} {res.unit}</span>
                            <span className="res-desc">{res.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Timeline / Activity Audit Trail Section */}
          <div className="section-block">
            <h2 className="section-title">⏱️ Incident Timeline & Activity Log</h2>

            {/* Add Timeline Note Form (Coordinators & Volunteers only) */}
            {(isCoordinator || isVolunteer) && (
              <form onSubmit={handleAddTimelineNote} className="glass-card" style={{ marginBottom: "20px" }}>
                <h4>Add {isVolunteer ? "Field Responder Update" : "Dispatcher Note / Event Log"}</h4>
                <div className="form-grid-2">
                  <input
                    type="text"
                    placeholder="Note Title (e.g., On-Scene Arrival)"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="form-control"
                    required
                  />
                  <button type="submit" className="btn btn-secondary" disabled={addingNote}>
                    + Log Event
                  </button>
                </div>
                <textarea
                  rows="2"
                  placeholder="Log details..."
                  value={noteDesc}
                  onChange={(e) => setNoteDesc(e.target.value)}
                  className="form-control"
                  style={{ marginTop: "10px" }}
                  required
                />
              </form>
            )}

            {/* Timeline Stream (Visible to all roles) */}
            <div className="timeline-stream">
              {incident.timelineEvents && incident.timelineEvents.length > 0 ? (
                incident.timelineEvents.map((evt) => (
                  <div key={evt.id} className="timeline-item">
                    <div className="timeline-icon">📌</div>
                    <div className="timeline-body">
                      <div className="timeline-header">
                        <strong className="timeline-title">{evt.title}</strong>
                        <span className="timeline-time">
                          {new Date(evt.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="timeline-desc">{evt.description}</p>
                      <div className="timeline-author">Log by: {evt.createdBy}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: "1.5rem" }}>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No timeline events recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IncidentDetail;
