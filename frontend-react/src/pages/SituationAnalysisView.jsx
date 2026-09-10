import React, { useState } from "react";
import { assessSituation } from "../services/resourceService";

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
      console.error(err);
      setError(err.response?.data?.message || "Failed to run Situation Analysis Agent assessment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>🤖 Situation Analysis Agent Dashboard</h2>
      <p style={{ color: "#666" }}>
        AI Agent owned by Student 2: Pulls incident and inventory data, assesses urgency scores, resource gaps, and nearest shelter capacity.
      </p>

      <form onSubmit={handleRunAssessment} style={{ display: "flex", gap: "10px", marginBottom: "20px", background: "#eef2f7", padding: "15px", borderRadius: "8px" }}>
        <input
          type="number"
          placeholder="Incident ID (e.g. 1)"
          value={incidentId}
          onChange={(e) => setIncidentId(e.target.value)}
          style={{ padding: "8px", width: "150px" }}
          required
        />
        <button type="submit" style={{ padding: "8px 20px", background: "#6f42c1", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
          {loading ? "Running AI Analysis..." : "Run Situation Analysis Agent"}
        </button>
      </form>

      {error && <div style={{ color: "#dc3545", padding: "10px", background: "#f8d7da", borderRadius: "4px", marginBottom: "20px" }}>{error}</div>}

      {assessment && (
        <div style={{ border: "2px solid #6f42c1", borderRadius: "8px", padding: "20px", background: "#faf8ff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, color: "#4a269c" }}>Assessment #{assessment.id} - {assessment.incidentTitle || `Incident #${assessment.incidentId}`}</h3>
            <span style={{
              padding: "6px 12px", borderRadius: "12px", color: "#fff", fontWeight: "bold", fontSize: "14px",
              background: assessment.urgencyLevel === "Critical" ? "#dc3545" : assessment.urgencyLevel === "High" ? "#fd7e14" : "#28a745"
            }}>
              Urgency: {assessment.urgencyLevel} ({assessment.urgencyScore}/100)
            </span>
          </div>

          <p style={{ background: "#fff", padding: "12px", borderRadius: "6px", borderLeft: "4px solid #6f42c1", marginTop: "12px" }}>
            <strong>Analysis Summary:</strong> {assessment.analysisSummary}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
            <div style={{ background: "#fff", padding: "14px", borderRadius: "6px", border: "1px solid #ddd" }}>
              <h4>Recommended Resources</h4>
              <p style={{ fontWeight: "bold", color: "#007bff" }}>{assessment.recommendedResourceTypes}</p>
            </div>
            <div style={{ background: "#fff", padding: "14px", borderRadius: "6px", border: "1px solid #ddd" }}>
              <h4>Nearest Shelter Match</h4>
              <p style={{ fontWeight: "bold", color: "#28a745" }}>
                {assessment.nearestShelterName || "None Available"} (Capacity: {assessment.availableShelterCapacity})
              </p>
            </div>
          </div>

          <h4 style={{ marginTop: "20px" }}>Resource Deficiency Breakdown</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", marginTop: "8px" }}>
            <thead>
              <tr style={{ background: "#eee", textAlign: "left" }}>
                <th style={{ padding: "8px" }}>Category</th>
                <th style={{ padding: "8px" }}>Available</th>
                <th style={{ padding: "8px" }}>Recommended</th>
                <th style={{ padding: "8px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {assessment.resourceDeficiencies?.map((d, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px" }}>{d.category}</td>
                  <td style={{ padding: "8px" }}>{d.available}</td>
                  <td style={{ padding: "8px" }}>{d.recommended}</td>
                  <td style={{ padding: "8px" }}>
                    <span style={{ color: d.isDeficit ? "#dc3545" : "#28a745", fontWeight: "bold" }}>
                      {d.isDeficit ? "⚠️ DEFICIT" : "✅ ADEQUATE"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
