<<<<<<< HEAD
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { useState } from "react";
import IncidentDashboard from "./pages/IncidentDashboard";
import IncidentDetail from "./pages/IncidentDetail";
import ReportIncident from "./pages/ReportIncident";
import CitizenDashboard from "./pages/CitizenDashboard";
=======
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import IncidentList from "./pages/IncidentList";
import DispatchList from "./pages/DispatchList";
>>>>>>> origin/main
import VolunteerList from "./pages/VolunteerList";
import VolunteerDetail from "./pages/VolunteerDetail";
import AddVolunteer from "./pages/AddVolunteer";
import ResourceInventoryHub from "./pages/ResourceInventoryHub";
import ResourceList from "./pages/ResourceList";
import ShelterList from "./pages/ShelterList";
import InventoryList from "./pages/InventoryList";
import SituationAnalysisView from "./pages/SituationAnalysisView";

<<<<<<< HEAD
function App() {
  const [role, setRole] = useState("Admin");
=======
import { getIncidents } from "./services/incidentService";

function App() {
  const [incidentCount, setIncidentCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const inc = await getIncidents();
        setIncidentCount(inc.filter(i => i.status !== "Resolved" && i.status !== "Closed").length);
      } catch (e) {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);
>>>>>>> origin/main

  return (
    <BrowserRouter>
      <div className="app-layout">
<<<<<<< HEAD
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
=======
        <Sidebar incidentCount={incidentCount} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/incidents" element={<IncidentList />} />
            <Route path="/dispatches" element={<DispatchList />} />
            <Route path="/volunteers" element={<VolunteerList />} />
            <Route path="/volunteers/:id" element={<VolunteerDetail />} />
            <Route path="/volunteers/new" element={<AddVolunteer />} />
            <Route path="/inventory-hub" element={<ResourceInventoryHub />} />
            <Route path="/resources" element={<ResourceList />} />
            <Route path="/shelters" element={<ShelterList />} />
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/situation-analysis" element={<SituationAnalysisView />} />
>>>>>>> origin/main
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
