import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";

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
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import IncidentList from "./pages/IncidentList";
import DispatchList from "./pages/DispatchList";
import { incidentService } from "./services/incidentService";

function App() {
  const [role, setRole] = useState("Admin");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeCount, setActiveCount] = useState(0);

  // Live badge count for the sidebar (non-blocking, fails silently)
  useEffect(() => {
    let alive = true;
    incidentService
      .getSummaryStats()
      .then((s) => {
        if (alive && s) setActiveCount(s.activeIncidents ?? 0);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <BrowserRouter>
      <div className={`app-layout${collapsed ? " sidebar-collapsed" : ""}`}>
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          mobileOpen={mobileOpen}
          onClose={closeMobile}
          activeCount={activeCount}
        />

        <div className="main-col">
          <Topbar
            role={role}
            onRoleChange={setRole}
            onMenu={() => setMobileOpen(true)}
            onToggle={() => setCollapsed((c) => !c)}
            collapsed={collapsed}
          />

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
      </div>
    </BrowserRouter>
  );
}

export default App;
