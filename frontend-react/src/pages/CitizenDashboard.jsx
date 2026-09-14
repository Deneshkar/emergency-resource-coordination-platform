import { Link } from "react-router-dom";

function CitizenDashboard() {
  return (
    <div>
      <h2>Citizen Dashboard</h2>

      <p>Welcome to the Citizen Dashboard.</p>

      <div style={{ display: "flex", gap: "15px" }}>
        <Link to="/incidents/new">Report an Incident</Link>
        <Link to="/my-incidents">My Incidents</Link>
      </div>
    </div>
  );
}

export default CitizenDashboard;