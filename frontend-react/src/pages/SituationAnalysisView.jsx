import React, { useState } from "react";
import { assessSituation } from "../services/resourceService";
import StatusBadge from "../components/StatusBadge";

export default function SituationAnalysisView() {
  const [incidentId, setIncidentId] = useState("1");
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRunAssessment = async (e) => {
    e.preventDefault();
    if (!incidentId) return;
    try {
      setLoading(true);
      setError("");
      const result = await assessSituation(incidentId);
      setAssessment(result);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to run AI assessment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Situation Analysis</h1>
          <p>AI-powered urgency scoring, resource gap analysis & shelter matching</p>
        </div>
      </div>

      {/* Agent Card */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
          <div style={{
            width: "50px", height: "50px", borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, var(--purple) 0%, #6d28d9 100%)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px",
            boxShadow: "var(--shadow-glow-purple)",
          }}>🧠</div>
          <div>
            <div style={{ fontWeight: "800", fontSize: "18px" }}>Situation Analysis Agent</div>
            <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
              Evaluates incident urgency, checks inventory deficiencies & matches nearest shelter
            </div>
          </div>
        </div>

        <form onSubmit={handleRunAssessment} style={{
          display: "flex", gap: "10px", padding: "16px",
          background: "var(--bg-base)", borderRadius: "var(--radius-md)",
          border: "1px solid var(--purple-dim)", flexWrap: "wrap",
        }}>
          <div style={{ flex: "0 0 160px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--text-dim)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Incident ID
            </label>
            <input
              type="number"
              placeholder="e.g. 1"
              value={incidentId}
              onChange={(e) => setIncidentId(e.target.value)}
              required
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" className="btn btn-purple" disabled={loading} style={{ height: "38px" }}>
              {loading ? (
                <>
                  <span className="glow-pulse">Analyzing</span>...
                </>
              ) : "Run Analysis"}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div style={{
          padding: "12px 16px", background: "var(--red-glow)",
          border: "1px solid var(--red-dim)", borderRadius: "var(--radius-sm)",
          color: "var(--red)", fontSize: "13px", fontWeight: "600", marginBottom: "24px",
        }}>
          {error}
        </div>
      )}

      {assessment && (
        <div className="fade-in">
          {/* Urgency Score Header */}
          <div className="card" style={{
            marginBottom: "20px",
            borderLeft: `4px solid ${
              assessment.urgencyLevel === "Critical" ? "var(--red)" :
              assessment.urgencyLevel === "High" ? "#f97316" :
              assessment.urgencyLevel === "Medium" ? "var(--amber)" :
              "var(--green)"
            }`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "4px" }}>
                  Assessment #{assessment.id} — Incident #{assessment.incidentId}
                </div>
                <div style={{ fontWeight: "800", fontSize: "22px" }}>
                  Urgency Score: <span style={{
                    color: assessment.urgencyLevel === "Critical" ? "var(--red)" :
                    assessment.urgencyLevel === "High" ? "#f97316" :
                    assessment.urgencyLevel === "Medium" ? "var(--amber)" :
                    "var(--green)"
                  }}>{assessment.urgencyScore}/100</span>
                </div>
              </div>
              <StatusBadge status={assessment.urgencyLevel} size="lg" />
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="card" style={{ marginBottom: "20px", borderLeft: "4px solid var(--purple)" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--purple)", marginBottom: "8px" }}>
              Agent Analysis Summary
            </div>
            <div style={{ fontSize: "14px", lineHeight: "1.7", color: "var(--text-secondary)" }}>
              {assessment.analysisSummary}
            </div>
          </div>

          {/* Recommendations Grid */}
          <div className="grid-2" style={{ marginBottom: "20px" }}>
            <div className="card">
              <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-dim)", marginBottom: "8px" }}>
                Recommended Resources
              </div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--cyan)" }}>
                {assessment.recommendedResourceTypes}
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-dim)", marginBottom: "8px" }}>
                Nearest Shelter Match
              </div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--green)" }}>
                {assessment.nearestShelterName || "None Available"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                Available capacity: {assessment.availableShelterCapacity}
              </div>
            </div>
          </div>

          {/* Resource Deficiency Table */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ fontWeight: "700", fontSize: "15px", color: "var(--purple)" }}>Resource Deficiency Breakdown</div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Available</th>
                    <th>Recommended</th>
                    <th>Gap</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assessment.resourceDeficiencies?.map((d, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{d.category}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>{d.available}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>{d.recommended}</td>
                      <td style={{
                        fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: "700",
                        color: d.isDeficit ? "var(--red)" : "var(--green)",
                      }}>
                        {d.isDeficit ? `-${d.recommended - d.available}` : "0"}
                      </td>
                      <td>
                        <span style={{
                          fontWeight: "700", fontSize: "12px",
                          color: d.isDeficit ? "var(--red)" : "var(--green)",
                        }}>
                          {d.isDeficit ? "DEFICIT" : "ADEQUATE"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!assessment && !loading && !error && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🧠</div>
            <div className="empty-state-text">No assessment yet</div>
            <div className="empty-state-sub">Enter an incident ID and run the analysis to see results</div>
          </div>
        </div>
      )}
    </div>
  );
}
