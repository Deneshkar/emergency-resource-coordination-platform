import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { incidentService } from "../services/incidentService";

const CATEGORIES = [
  { value: "Fire", label: "Fire / Explosion", icon: "🔥" },
  { value: "Flood", label: "Flood / Water", icon: "🌊" },
  { value: "Medical", label: "Medical / Mass Casualty", icon: "🚑" },
  { value: "Earthquake", label: "Earthquake / Collapse", icon: "🏚️" },
  { value: "Infrastructure", label: "Infrastructure / Power", icon: "⚡" },
  { value: "Chemical", label: "Chemical / HazMat", icon: "☣️" },
  { value: "General Emergency", label: "General Emergency", icon: "🚨" },
];

const PRIORITIES = [
  { value: "Critical", label: "Critical", hint: "Immediate life danger", dot: "#ef4444" },
  { value: "High", label: "High", hint: "Severe disruption / injury risk", dot: "#f59e0b" },
  { value: "Medium", label: "Medium", hint: "Moderate threat / staging", dot: "#3b82f6" },
  { value: "Low", label: "Low", hint: "Minor threat / monitoring", dot: "#10b981" },
];

function ReportIncident() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Fire");
  const [priority, setPriority] = useState("High");
  const [affectedCount, setAffectedCount] = useState(5);
  const [reporterContact, setReporterContact] = useState("");
  const [autoGeneratePlan, setAutoGeneratePlan] = useState(true);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [touched, setTouched] = useState(false);

  const errors = {
    title: title.trim().length < 5 ? "Give the incident a clear title (min 5 characters)." : "",
    location: location.trim().length < 3 ? "A specific location or address is required." : "",
    description:
      description.trim().length < 20
        ? `Add more situational detail (${description.trim().length}/20 min characters).`
        : "",
  };
  const isValid = !errors.title && !errors.location && !errors.description;

  const activeCategory = CATEGORIES.find((c) => c.value === category) ?? CATEGORIES[0];
  const activePriority = PRIORITIES.find((p) => p.value === priority) ?? PRIORITIES[1];

  const stepCount = (e, delta) => {
    e.preventDefault();
    setAffectedCount((v) => Math.max(0, (parseInt(v) || 0) + delta));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setMessage("");
    setIsError(false);
    if (!isValid) {
      setIsError(true);
      setMessage("Please fix the highlighted fields before dispatching.");
      return;
    }
    setLoading(true);
    try {
      const created = await incidentService.createIncident({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        category,
        priority,
        affectedCount: parseInt(affectedCount) || 0,
        reporterContact: reporterContact.trim(),
        autoGeneratePlan,
      });

      setMessage(`Incident reported successfully! Opening the AI Workbench…`);
      setTimeout(() => {
        navigate(`/incidents/${created.id}`);
      }, 1500);
    } catch (error) {
      console.error(error);
      setIsError(true);
      setMessage("Failed to submit incident report. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper report-page">
      <Link to="/incidents" className="btn btn-ghost btn-sm report-back">
        ← Back to Incident Hub
      </Link>

      <div className="page-header">
        <div className="page-header-left">
          <div className="subtitle-tag">🚨 EMERGENCY REPORTING PORTAL</div>
          <h1>Report Emergency Incident</h1>
          <p>Submit a critical report to trigger threat classification and AI Coordinator response planning.</p>
        </div>
      </div>

      {message && (
        <div className={`alert ${isError && touched && !isValid ? "alert-error" : isError ? "alert-error" : "alert-success"} report-alert`} role="alert">
          {message}
        </div>
      )}

      <div className="report-layout">
        {/* ── Main form ─────────────────────────────── */}
        <form onSubmit={handleSubmit} className="glass-card report-card" noValidate>
          {/* Section 1 */}
          <section className="report-section">
            <div className="report-section-head">
              <span className="report-step">1</span>
              <div>
                <h2>What is happening?</h2>
                <p>Title and category help dispatchers triage in seconds.</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ri-title">
                Incident Title <span className="req">*</span>
              </label>
              <input
                id="ri-title"
                type="text"
                placeholder="e.g. Major structural fire in residential complex"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`form-control ${touched && errors.title ? "input-error" : ""}`}
              />
              {touched && errors.title && <span className="field-error">{errors.title}</span>}
            </div>

            <div className="form-group">
              <span className="form-label">Incident Category <span className="req">*</span></span>
              <div className="chip-grid" role="radiogroup" aria-label="Incident category">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    role="radio"
                    aria-checked={category === c.value}
                    className={`chip${category === c.value ? " chip-active" : ""}`}
                    onClick={() => setCategory(c.value)}
                  >
                    <span aria-hidden="true">{c.icon}</span> {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <span className="form-label">Threat Priority Level <span className="req">*</span></span>
              <div className="priority-grid" role="radiogroup" aria-label="Threat priority">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    role="radio"
                    aria-checked={priority === p.value}
                    className={`priority-card${priority === p.value ? " priority-active" : ""}`}
                    onClick={() => setPriority(p.value)}
                    style={priority === p.value ? { borderColor: p.dot, boxShadow: `0 0 0 1px ${p.dot}, 0 6px 18px ${p.dot}33` } : undefined}
                  >
                    <span className="priority-dot" style={{ background: p.dot, boxShadow: `0 0 8px ${p.dot}` }} />
                    <span className="priority-name">{p.label}</span>
                    <span className="priority-hint">{p.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="report-section">
            <div className="report-section-head">
              <span className="report-step">2</span>
              <div>
                <h2>Where & who is affected?</h2>
                <p>Precise location and impact size drive resource estimates.</p>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="ri-location">
                  Specific Location / Address <span className="req">*</span>
                </label>
                <input
                  id="ri-location"
                  type="text"
                  placeholder="e.g. 742 Evergreen Terrace, Sector 4"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`form-control ${touched && errors.location ? "input-error" : ""}`}
                />
                {touched && errors.location && <span className="field-error">{errors.location}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ri-affected">People Affected (est.)</label>
                <div className="stepper">
                  <button className="stepper-btn" onClick={(e) => stepCount(e, -1)} aria-label="Decrease affected count">−</button>
                  <input
                    id="ri-affected"
                    type="number"
                    min="0"
                    value={affectedCount}
                    onChange={(e) => setAffectedCount(e.target.value)}
                    className="form-control stepper-input"
                  />
                  <button className="stepper-btn" onClick={(e) => stepCount(e, 1)} aria-label="Increase affected count">＋</button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ri-reporter">Reporter Contact / Agency</label>
              <input
                id="ri-reporter"
                type="text"
                placeholder="e.g. Dispatch Officer Jane Doe · +1 555-0199"
                value={reporterContact}
                onChange={(e) => setReporterContact(e.target.value)}
                className="form-control"
              />
            </div>
          </section>

          {/* Section 3 */}
          <section className="report-section">
            <div className="report-section-head">
              <span className="report-step">3</span>
              <div>
                <h2>Situation details</h2>
                <p>Hazards, structural risks, weather, access constraints, special needs.</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ri-desc">
                Detailed Incident Summary <span className="req">*</span>
              </label>
              <textarea
                id="ri-desc"
                placeholder="What do responders see on arrival? Visible hazards, trapped occupants, road access, weather, utilities down…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`form-control report-textarea ${touched && errors.description ? "input-error" : ""}`}
              />
              <div className="textarea-meta">
                {touched && errors.description ? (
                  <span className="field-error">{errors.description}</span>
                ) : (
                  <span className="textarea-tip">Tip: include hazards, access routes and utilities status.</span>
                )}
                <span className="char-count">{description.trim().length} chars</span>
              </div>
            </div>

            <button
              type="button"
              className={`ai-toggle${autoGeneratePlan ? " ai-toggle-on" : ""}`}
              onClick={() => setAutoGeneratePlan((v) => !v)}
              aria-pressed={autoGeneratePlan}
            >
              <span className="ai-switch" aria-hidden="true">
                <span className="ai-knob" />
              </span>
              <span className="ai-toggle-text">
                <strong>🤖 Trigger AI Coordinator Agent automatically</strong>
                <span>Instantly synthesize an emergency response plan & resource estimates upon submission.</span>
              </span>
            </button>
          </section>

          <div className="report-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/incidents")} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary shadow-glow report-submit" disabled={loading}>
              {loading ? (
                <><span className="btn-spinner" aria-hidden="true" /> Submitting & triggering AI…</>
              ) : (
                "🚨 Dispatch Incident & AI Planner"
              )}
            </button>
          </div>
        </form>

        {/* ── Side summary ──────────────────────────── */}
        <aside className="report-side">
          <div className="glass-card report-summary">
            <h3>Live Summary</h3>
            <div className="summary-row">
              <span>Title</span>
              <strong>{title.trim() || "—"}</strong>
            </div>
            <div className="summary-row">
              <span>Category</span>
              <strong>{activeCategory.icon} {activeCategory.label}</strong>
            </div>
            <div className="summary-row">
              <span>Priority</span>
              <strong>
                <span className="priority-dot inline" style={{ background: activePriority.dot }} />
                {activePriority.label}
              </strong>
            </div>
            <div className="summary-row">
              <span>Location</span>
              <strong>{location.trim() || "—"}</strong>
            </div>
            <div className="summary-row">
              <span>Affected</span>
              <strong>~{parseInt(affectedCount) || 0} people</strong>
            </div>
            <div className="summary-row">
              <span>AI Plan</span>
              <strong>{autoGeneratePlan ? "Auto-generate 🤖" : "Manual later"}</strong>
            </div>
          </div>

          <div className="glass-card report-next">
            <h3>What happens next?</h3>
            <ol>
              <li><strong>Incident is logged</strong> and classified by threat level.</li>
              <li><strong>AI Coordinator drafts</strong> action steps & resource needs.</li>
              <li><strong>Dispatcher reviews</strong> the plan in the AI Workbench.</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ReportIncident;
