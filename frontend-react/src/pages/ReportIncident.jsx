import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { incidentService } from "../services/incidentService";

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const created = await incidentService.createIncident({
        title,
        description,
        location,
        category,
        priority,
        affectedCount: parseInt(affectedCount) || 0,
        reporterContact,
        autoGeneratePlan,
      });

      setMessage(`Emergency Incident reported successfully! Redirecting to AI Workbench...`);
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
    <div className="incident-hub-container" style={{ maxWidth: "800px" }}>
      <div className="detail-top-bar">
        <Link to="/incidents" className="btn btn-ghost">
          ← Back to Incident Hub
        </Link>
      </div>

      <div className="command-header">
        <div>
          <div className="subtitle-tag">🚨 EMERGENCY REPORTING PORTAL</div>
          <h1 className="header-title">Report Emergency Incident</h1>
          <p className="header-desc">
            Submit critical emergency reports to trigger instant threat classification and AI Coordinator Response Planning.
          </p>
        </div>
      </div>

      <div className="glass-card">
        {message && (
          <div className={`alert ${isError ? "alert-error" : "alert-success"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-group">
            <label className="form-label">Incident Title *</label>
            <input
              type="text"
              placeholder="e.g. Major Structural Fire in Residential Complex"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Incident Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-select"
                required
              >
                <option value="Fire">Fire / Explosion</option>
                <option value="Flood">Flood / Flash Water</option>
                <option value="Medical">Medical Emergency / Mass Casualty</option>
                <option value="Earthquake">Earthquake / Structural Collapse</option>
                <option value="Infrastructure">Infrastructure Failure / Power Outage</option>
                <option value="Chemical">Chemical Spill / HazMat</option>
                <option value="General Emergency">General Emergency</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Threat Priority Level *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="form-select"
                required
              >
                <option value="Critical">Critical (Immediate Life Danger)</option>
                <option value="High">High (Severe Disruption / Injury Risk)</option>
                <option value="Medium">Medium (Moderate Threat / Staging Needed)</option>
                <option value="Low">Low (Minor Threat / Area Monitoring)</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Specific Location / Address *</label>
              <input
                type="text"
                placeholder="e.g. 742 Evergreen Terrace, Sector 4"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estimated People Affected / Victims</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 15"
                value={affectedCount}
                onChange={(e) => setAffectedCount(e.target.value)}
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reporter Contact Info / Agency</label>
            <input
              type="text"
              placeholder="e.g. Dispatch Officer Jane Doe / Phone: +1 555-0199"
              value={reporterContact}
              onChange={(e) => setReporterContact(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Incident Summary *</label>
            <textarea
              rows="4"
              placeholder="Provide situational details, visible hazards, structural risks, weather conditions, or specialized response needs..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="ai-checkbox-card">
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={autoGeneratePlan}
                onChange={(e) => setAutoGeneratePlan(e.target.checked)}
                style={{ width: "18px", height: "18px" }}
              />
              <div>
                <strong>🤖 Trigger AI Coordinator Agent Automatically</strong>
                <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.8 }}>
                  Instantly synthesize emergency response plan & resource estimates upon submission.
                </p>
              </div>
            </label>
          </div>

          <div style={{ marginTop: "20px" }}>
            <button
              type="submit"
              className="btn btn-primary btn-block shadow-glow"
              disabled={loading}
            >
              {loading ? "Submitting & Triggering AI Agent..." : "🚨 Dispatch Incident & AI Planner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportIncident;