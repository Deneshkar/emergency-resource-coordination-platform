import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import IncidentDashboard from "./pages/IncidentDashboard";
import IncidentDetail from "./pages/IncidentDetail";
import ReportIncident from "./pages/ReportIncident";
import CitizenDashboard from "./pages/CitizenDashboard";

import VolunteerList from "./pages/VolunteerList";
import VolunteerDetail from "./pages/VolunteerDetail";
import AddVolunteer from "./pages/AddVolunteer";

import ResourceInventoryHub from "./pages/ResourceInventoryHub";
import ResourceList from "./pages/ResourceList";
import ShelterList from "./pages/ShelterList";
import InventoryList from "./pages/InventoryList";
import SituationAnalysisView from "./pages/SituationAnalysisView";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import IncidentList from "./pages/IncidentList";
import DispatchList from "./pages/DispatchList";

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
            <Link to="/volunteers" className="nav-item">
              👥 Volunteers
            </Link>
            <Link to="/inventory-hub" className="nav-item">
              📦 Resources & Inventory
            </Link>
            <Link to="/situation-analysis" className="nav-item">
              📡 Situation Analysis
            </Link>
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

            {/* Teammates' Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/incident-list" element={<IncidentList />} />
            <Route path="/dispatches" element={<DispatchList />} />
            <Route path="/volunteers" element={<VolunteerList />} />
            <Route path="/volunteers/:id" element={<VolunteerDetail />} />
            <Route path="/volunteers/new" element={<AddVolunteer />} />
            <Route path="/citizen" element={<CitizenDashboard />} />

            {/* Resource & Situation Analysis Routes */}
            <Route path="/inventory-hub" element={<ResourceInventoryHub />} />
            <Route path="/resources" element={<ResourceList />} />
            <Route path="/shelters" element={<ShelterList />} />
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/situation-analysis" element={<SituationAnalysisView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
