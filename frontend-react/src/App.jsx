import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
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

  return (
    <BrowserRouter>
      <div className="app-layout">
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
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
