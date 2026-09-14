import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { incidentService } from "../services/incidentService";

function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
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
        <span className="detail-incident-id">Incident #{incident.id}</span>
      </div>

      {/* Main Banner */}
      <div className="incident-detail-banner anim-slide-up">
        <div>
          <div className="badges-group">
            <span className={`badge badge-${incident.priority?.toLowerCase()}`}>
              {incident.priority} Priority
            </span>
            <span className="badge badge-category">{incident.category}</span>
            <span className="badge badge-info">{incident.status}</span>
          </div>
          <h1 className="detail-title">{incident.title}</h1>
          <p className="detail-location">📍 Location: {incident.location}</p>
        </div>

        <button
          className="btn btn-accent shadow-glow"
          onClick={() => setShowAiControls(!showAiControls)}
        >
          🤖 {showAiControls ? "Hide AI Coordinator Panel" : "Open AI Coordinator Workbench"}
        </button>
      </div>

      {/* AI Coordinator Workbench / Plan Generator Drawer */}
      {showAiControls && (
        <div className="ai-workbench-card anim-slide-up">
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

            <div className="form-group">
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
      <div className="detail-main-grid anim-fade-in">
        {/* Left Column: Info & Status Update */}
        <div className="detail-sidebar anim-stagger">
          {/* Incident Overview Card */}
          <div className="glass-card anim-slide-up">
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

          {/* Incident Control Panel */}
          <div className="glass-card anim-slide-up">
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
                <p>No response plans have been generated yet for this incident.</p>
                <button
                  className="btn btn-accent"
                  style={{ marginTop: "10px" }}
                  onClick={handleGeneratePlan}
                  disabled={generatingPlan}
                >
                  ⚡ Generate Initial Response Plan
                </button>
              </div>
            ) : (
              <div className="anim-stagger">
                {incident.plans.map((plan) => (
                  <div key={plan.id} className="plan-card anim-slide-up">
                    <div className="plan-header">
                      <div>
                        <div className="badges-group">
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

                    {/* Estimated Resources Requirement */}
                    {plan.estimatedResources && plan.estimatedResources.length > 0 && (
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
                ))}
              </div>
            )}
          </div>

          {/* Timeline / Activity Audit Trail Section */}
          <div className="section-block">
            <h2 className="section-title">⏱️ Incident Timeline & Activity Log</h2>

            {/* Add Timeline Note Form */}
            <form onSubmit={handleAddTimelineNote} className="glass-card" style={{ marginBottom: "20px" }}>
              <h4>Add Dispatcher Note / Event Log</h4>
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
              <div className="form-group" style={{ marginTop: "10px" }}>
                <textarea
                  rows="2"
                  placeholder="Log details..."
                  value={noteDesc}
                  onChange={(e) => setNoteDesc(e.target.value)}
                  className="form-control"
                  required
                />
              </div>
            </form>

            {/* Timeline Stream */}
            <div className="timeline-stream anim-stagger">
              {incident.timelineEvents?.map((evt) => (
                <div key={evt.id} className="timeline-item anim-slide-up">
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IncidentDetail;
