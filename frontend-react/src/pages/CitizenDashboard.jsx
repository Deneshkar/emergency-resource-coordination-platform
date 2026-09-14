import { Link } from "react-router-dom";

function CitizenDashboard() {
  return (
    <div className="page-wrapper">
      <div className="card anim-slide-up" style={{
        background: "linear-gradient(135deg, rgba(30, 27, 75, 0.7), rgba(15, 23, 42, 0.9))",
        border: "1px solid rgba(168, 85, 247, 0.3)",
        padding: "2.5rem",
        marginBottom: "32px",
        boxShadow: "0 8px 32px rgba(168, 85, 247, 0.12)",
      }}>
        <div className="subtitle-tag" style={{ marginBottom: "8px" }}>WELCOME</div>
        <h1 style={{
          fontSize: "1.8rem",
          fontWeight: "800",
          color: "#fff",
          marginBottom: "8px",
          letterSpacing: "-0.5px",
          background: "linear-gradient(135deg, #f1f5f9, #a855f7)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Citizen Dashboard
        </h1>
        <p className="text-muted" style={{ fontSize: "0.95rem", maxWidth: "500px", lineHeight: "1.6" }}>
          Stay informed during emergencies. Report incidents, track volunteer responses, and access critical resources in real time.
        </p>
      </div>

      <h2 style={{
        fontSize: "1.1rem",
        fontWeight: "700",
        color: "var(--text-primary)",
        marginBottom: "16px",
      }}>
        Quick Actions
      </h2>

      <div className="grid-3 anim-stagger">
        <Link to="/incidents/new" className="card anim-slide-up" style={{ cursor: "pointer", textDecoration: "none" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "var(--radius-md)",
            background: "var(--red-glow)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.3rem",
            marginBottom: "14px",
          }}>
            🚨
          </div>
          <div className="card-title" style={{ marginBottom: "6px" }}>Report Incident</div>
          <p className="text-muted" style={{ fontSize: "0.82rem", lineHeight: "1.5" }}>
            Report an emergency or hazardous event for rapid response.
          </p>
        </Link>

        <Link to="/volunteers" className="card anim-slide-up" style={{ cursor: "pointer", textDecoration: "none", animationDelay: "50ms" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "var(--radius-md)",
            background: "var(--green-glow)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.3rem",
            marginBottom: "14px",
          }}>
            🙋
          </div>
          <div className="card-title" style={{ marginBottom: "6px" }}>Volunteers</div>
          <p className="text-muted" style={{ fontSize: "0.82rem", lineHeight: "1.5" }}>
            View active volunteers and their availability status.
          </p>
        </Link>

        <Link to="/inventory-hub" className="card anim-slide-up" style={{ cursor: "pointer", textDecoration: "none", animationDelay: "100ms" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "var(--radius-md)",
            background: "var(--blue-glow)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.3rem",
            marginBottom: "14px",
          }}>
            📦
          </div>
          <div className="card-title" style={{ marginBottom: "6px" }}>Resources</div>
          <p className="text-muted" style={{ fontSize: "0.82rem", lineHeight: "1.5" }}>
            Browse shelter inventory and available emergency resources.
          </p>
        </Link>

        <Link to="/situation-analysis" className="card anim-slide-up" style={{ cursor: "pointer", textDecoration: "none", animationDelay: "150ms" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "var(--radius-md)",
            background: "rgba(168, 85, 247, 0.12)",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.3rem",
            marginBottom: "14px",
          }}>
            🤖
          </div>
          <div className="card-title" style={{ marginBottom: "6px" }}>AI Analysis</div>
          <p className="text-muted" style={{ fontSize: "0.82rem", lineHeight: "1.5" }}>
            Get AI-powered situation analysis and resource recommendations.
          </p>
        </Link>
      </div>

      <div className="card anim-slide-up" style={{ marginTop: "32px", animationDelay: "200ms" }}>
        <div className="card-header">
          <div className="card-title">📋 My Activity</div>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">No activity yet</div>
          <div className="empty-state-sub">Report an incident or browse resources to get started</div>
        </div>
      </div>
    </div>
  );
}

export default CitizenDashboard;
