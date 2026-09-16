import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CitizenDashboard() {
  const { user } = useAuth();

  return (
    <div className="page-wrapper anim-fade-in">
      {/* Top Header & Emergency Callouts */}
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div className="page-header-left">
          <div className="badge badge-info" style={{ width: "fit-content", marginBottom: "6px" }}>
            🛡️ Public Safety & Citizen Portal
          </div>
          <h1>Citizen Emergency Hub</h1>
          <p>
            Welcome{user?.fullName ? `, ${user.fullName}` : ""}. Access rapid incident reporting, live response tracking, and verified regional emergency advisories.
          </p>
        </div>

        {/* Emergency Hotlines Strip */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <a
            href="tel:119"
            className="btn btn-sm btn-ghost-danger"
            style={{ fontWeight: "700", border: "1px solid var(--danger)", textDecoration: "none" }}
            title="Call National Police Emergency"
          >
            🚨 Police: 119
          </a>
          <a
            href="tel:1990"
            className="btn btn-sm btn-accent"
            style={{ fontWeight: "700", textDecoration: "none" }}
            title="Call Suwa Seriya Ambulance"
          >
            🚑 Ambulance: 1990
          </a>
          <a
            href="tel:117"
            className="btn btn-sm btn-secondary"
            style={{ fontWeight: "700", textDecoration: "none" }}
            title="Call Disaster Management Center"
          >
            🌊 DMC: 117
          </a>
          <Link
            to="/profile"
            className="btn btn-sm btn-primary"
            style={{ fontWeight: "700", textDecoration: "none" }}
            title="View my personal profile & credentials"
          >
            👤 My Account Profile
          </Link>
        </div>
      </div>

      {/* Main Action Hub Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.2rem",
          marginBottom: "2rem",
        }}
      >
        {/* Card 1: Report Incident */}
        <div className="glass-card" style={{ border: "1px solid rgba(239, 68, 68, 0.4)", background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(15, 23, 42, 0.8))" }}>
          <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🚨</div>
          <h3 style={{ fontSize: "1.2rem", color: "#fca5a5", marginBottom: "8px" }}>Report Emergency</h3>
          <p style={{ fontSize: "0.88rem", color: "#cbd5e1", marginBottom: "18px", lineHeight: "1.5" }}>
            Encountering flash floods, landslides, fallen trees, or trapped citizens? Submit a rapid report directly to command.
          </p>
          <Link to="/incidents/new" className="btn btn-danger btn-block" style={{ textDecoration: "none" }}>
            + Report Incident Now
          </Link>
        </div>

        {/* Card 2: Track My Reports */}
        <div className="glass-card" style={{ border: "1px solid rgba(56, 189, 248, 0.35)", background: "linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(15, 23, 42, 0.8))" }}>
          <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📋</div>
          <h3 style={{ fontSize: "1.2rem", color: "#7dd3fc", marginBottom: "8px" }}>My Incident Reports</h3>
          <p style={{ fontSize: "0.88rem", color: "#cbd5e1", marginBottom: "18px", lineHeight: "1.5" }}>
            Track the real-time status of your submissions, AI triage classifications, and responding unit dispatch progress.
          </p>
          <Link to="/incidents" className="btn btn-primary btn-block" style={{ textDecoration: "none" }}>
            View My Reports Status
          </Link>
        </div>

        {/* Card 3: Find Shelters */}
        <div className="glass-card" style={{ border: "1px solid rgba(16, 185, 129, 0.35)", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(15, 23, 42, 0.8))" }}>
          <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🏠</div>
          <h3 style={{ fontSize: "1.2rem", color: "#6ee7b7", marginBottom: "8px" }}>Emergency Shelters</h3>
          <p style={{ fontSize: "0.88rem", color: "#cbd5e1", marginBottom: "18px", lineHeight: "1.5" }}>
            Locate safe evacuation shelters in your district, verified capacity, facilities, and current occupancy levels.
          </p>
          <Link to="/shelters" className="btn btn-success btn-block" style={{ textDecoration: "none" }}>
            Find Safe Shelters
          </Link>
        </div>
      </div>

      {/* Safety & Preparedness Directives */}
      <div className="glass-card" style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.15rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>⚠️</span> Severe Weather & Emergency Safety Guidelines
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "14px",
            marginTop: "12px",
          }}
        >
          <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
            <div style={{ fontWeight: "700", color: "#38bdf8", marginBottom: "6px" }}>🌊 Flash Flood Precautions</div>
            <div style={{ fontSize: "0.84rem", color: "var(--text-muted)", lineHeight: "1.45" }}>
              Never drive or walk through moving water. 6 inches of fast-moving water can knock you down, and 12 inches can float a vehicle.
            </div>
          </div>

          <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
            <div style={{ fontWeight: "700", color: "#fbbf24", marginBottom: "6px" }}>⚡ Downed Electrical Lines</div>
            <div style={{ fontSize: "0.84rem", color: "var(--text-muted)", lineHeight: "1.45" }}>
              Assume all downed wires are energized. Maintain a minimum perimeter distance of 30 feet and report immediately.
            </div>
          </div>

          <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
            <div style={{ fontWeight: "700", color: "#a855f7", marginBottom: "6px" }}>🎒 Emergency Go-Bag</div>
            <div style={{ fontSize: "0.84rem", color: "var(--text-muted)", lineHeight: "1.45" }}>
              Prepare drinking water, non-perishable food, essential prescription medications, phone chargers, and national identity documents.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}