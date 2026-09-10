import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import VolunteerList from "./pages/VolunteerList";
import VolunteerDetail from "./pages/VolunteerDetail";
import AddVolunteer from "./pages/AddVolunteer";

import ResourceInventoryHub from "./pages/ResourceInventoryHub";
import ResourceList from "./pages/ResourceList";
import ShelterList from "./pages/ShelterList";
import InventoryList from "./pages/InventoryList";
import SituationAnalysisView from "./pages/SituationAnalysisView";

function App() {
  return (
    <BrowserRouter>
      <div>
        <nav style={{ background: "#0f172a", padding: "1rem 2.5rem", display: "flex", gap: "24px", alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          <span style={{ color: "#fff", fontWeight: "800", fontSize: "1.25rem", letterSpacing: "-0.5px" }}>🚨 ERCP Platform</span>
          
          <Link to="/" style={{ color: "#cbd5e1", textDecoration: "none", fontWeight: "500" }}>Volunteers</Link>
          
          {/* Student 2 Primary Navbar Hub Button */}
          <Link 
            to="/inventory-hub" 
            style={{ 
              background: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)", 
              color: "#fff", 
              textDecoration: "none", 
              fontWeight: "700",
              padding: "8px 18px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)"
            }}
          >
            <span>📦</span> Resource & Inventory Hub
          </Link>
        </nav>

        <div style={{ padding: "2.5rem" }}>
          <Routes>
            {/* Student 4 Routes */}
            <Route path="/" element={<VolunteerList />} />
            <Route path="/volunteers/:id" element={<VolunteerDetail />} />
            <Route path="/volunteers/new" element={<AddVolunteer />} />

            {/* Student 2 Main Dashboard Route */}
            <Route path="/inventory-hub" element={<ResourceInventoryHub />} />

            {/* Student 2 Sub-routes */}
            <Route path="/resources" element={<ResourceList />} />
            <Route path="/shelters" element={<ShelterList />} />
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/situation-analysis" element={<SituationAnalysisView />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;