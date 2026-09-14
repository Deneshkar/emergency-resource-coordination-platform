import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { useState } from "react";
import IncidentDashboard from "./pages/IncidentDashboard";
import IncidentDetail from "./pages/IncidentDetail";
import ReportIncident from "./pages/ReportIncident";
import CitizenDashboard from "./pages/CitizenDashboard";
import VolunteerList from "./pages/VolunteerList";
import VolunteerDetail from "./pages/VolunteerDetail";
import AddVolunteer from "./pages/AddVolunteer";

function App() {
  const [role, setRole] = useState("Admin");

  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Navigation Bar */}
        <header className="app-nav shadow-glow">
          <div className="nav-brand">
            <span className="brand-logo">🚨 ERCP</span>
            <span className="brand-name">Emergency Resource Coordination Platform</span>
          </div>

          <nav className="nav-links">
            <Link to="/incidents" className="nav-item highlight-nav">
              ⚡ Incident Hub & AI Planner
            </Link>
            <Link to="/incidents/new" className="nav-item">
              + Report Incident
            </Link>

            {(role === "Volunteer" || role === "Admin") && (
              <Link to="/volunteers" className="nav-item">
                👥 Volunteers
              </Link>
            )}

            {role === "Citizen" && (
              <Link to="/citizen" className="nav-item">
                🏠 Citizen Dashboard
              </Link>
            )}
          </nav>

          <div className="role-badge-picker">
            <span className="role-label">Role:</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="role-select"
            >
              <option value="Admin">Admin / Dispatcher</option>
              <option value="Citizen">Citizen</option>
              <option value="Volunteer">Volunteer</option>
            </select>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="app-main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/incidents" replace />} />
            
            {/* Incident Intelligence & AI Coordinator Routes */}
            <Route path="/incidents" element={<IncidentDashboard />} />
            <Route path="/incidents/new" element={<ReportIncident />} />
            <Route path="/incidents/:id" element={<IncidentDetail />} />

            {/* Volunteer & Citizen Routes */}
            <Route path="/volunteers" element={<VolunteerList />} />
            <Route path="/volunteers/:id" element={<VolunteerDetail />} />
            <Route path="/volunteers/new" element={<AddVolunteer />} />
            <Route path="/citizen" element={<CitizenDashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;