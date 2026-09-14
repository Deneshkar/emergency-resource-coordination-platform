import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import IncidentDashboard from "./pages/IncidentDashboard";
import ReportIncident from "./pages/ReportIncident";
import IncidentDetail from "./pages/IncidentDetail";
import IncidentList from "./pages/IncidentList";
import DispatchList from "./pages/DispatchList";
import VolunteerList from "./pages/VolunteerList";
import VolunteerDetail from "./pages/VolunteerDetail";
import AddVolunteer from "./pages/AddVolunteer";
import ResourceInventoryHub from "./pages/ResourceInventoryHub";
import ResourceList from "./pages/ResourceList";
import ShelterList from "./pages/ShelterList";
import InventoryList from "./pages/InventoryList";
import SituationAnalysisView from "./pages/SituationAnalysisView";
import CitizenDashboard from "./pages/CitizenDashboard";

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className={`app-layout${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileMenuOpen}
          onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {mobileMenuOpen && (
          <div
            className="mobile-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <main className="main-content">
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
            <Route path="/inventory-hub" element={<ResourceInventoryHub />} />
            <Route path="/resources" element={<ResourceList />} />
            <Route path="/shelters" element={<ShelterList />} />
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/situation-analysis" element={<SituationAnalysisView />} />
            <Route path="/citizen" element={<CitizenDashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
