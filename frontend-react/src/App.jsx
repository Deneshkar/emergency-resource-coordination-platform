import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { LanguageProvider } from "./context/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ToastContainer from "./components/ToastContainer";
import { Toaster } from "sonner";

import IncidentDashboard from "./pages/IncidentDashboard";
import IncidentDetail from "./pages/IncidentDetail";
import ReportIncident from "./pages/ReportIncident";
import CitizenDashboard from "./pages/CitizenDashboard";

import VolunteerList from "./pages/VolunteerList";
import VolunteerDetail from "./pages/VolunteerDetail";
import AddVolunteer from "./pages/AddVolunteer";
import EditVolunteer from "./pages/EditVolunteer";

import ResourceInventoryHub from "./pages/ResourceInventoryHub";
import ResourceList from "./pages/ResourceList";
import ShelterList from "./pages/ShelterList";
import InventoryList from "./pages/InventoryList";
import SituationAnalysisView from "./pages/SituationAnalysisView";
import Settings from "./pages/Settings";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import IncidentList from "./pages/IncidentList";
import DispatchList from "./pages/DispatchList";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";
import { incidentService } from "./services/incidentService";

function AuthLayout({ children }) {
  return (
    <div className="auth-standalone-layout">
      <header className="auth-standalone-topbar">
        <Link to="/" className="auth-standalone-brand">
          <span className="auth-standalone-logo" aria-hidden="true">🚨</span>
          <div>
            <div className="auth-standalone-brand-title">Emergency Resource Platform</div>
            <div className="auth-standalone-brand-sub">Unified Full-Stack & Agentic Operations</div>
          </div>
        </Link>
        <div className="auth-standalone-status">
          <span className="status-dot" />
          <span>Operations Gateway Online</span>
        </div>
      </header>

      <div className="auth-standalone-content">
        {children}
      </div>

      <footer className="auth-standalone-footer">
        SE3090 Integrated Full-Stack and Agentic AI Application • Multi-Role Access Control
      </footer>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/auth/github/callback";

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeCount, setActiveCount] = useState(0);

  // Live badge count for the sidebar (non-blocking, fails silently)
  useEffect(() => {
    if (isAuthPage) return;
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
  }, [isAuthPage]);

  // Load global theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("ercp_theme");
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Standalone full-screen layout without Sidebar or Topbar for authentication pages
  if (isAuthPage) {
    return (
      <AuthLayout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/github/callback" element={<Login />} />
        </Routes>
      </AuthLayout>
    );
  }

  // Main application layout with Sidebar and Topbar
  return (
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
          onMenu={() => setMobileOpen(true)}
          onToggle={() => setCollapsed((c) => !c)}
          collapsed={collapsed}
        />

        <main className="app-main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/incidents" replace />} />

            {/* Incident Intelligence & AI Coordinator Routes */}
            <Route
              path="/incidents"
              element={
                <ProtectedRoute allowedRoles={["Coordinator", "Admin", "Citizen", "Volunteer"]}>
                  <IncidentDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/incidents/new" element={<ReportIncident />} />
            <Route
              path="/incidents/:id"
              element={
                <ProtectedRoute allowedRoles={["Coordinator", "Admin", "Citizen", "Volunteer"]}>
                  <IncidentDetail />
                </ProtectedRoute>
              }
            />

            {/* Teammates' Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/incident-list"
              element={
                <ProtectedRoute allowedRoles={["Coordinator", "Admin"]}>
                  <IncidentList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dispatches"
              element={
                <ProtectedRoute allowedRoles={["Coordinator", "Admin", "Volunteer"]}>
                  <DispatchList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteers"
              element={
                <ProtectedRoute allowedRoles={["Coordinator", "Admin", "Volunteer"]}>
                  <VolunteerList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteers/new"
              element={
                <ProtectedRoute allowedRoles={["Coordinator", "Admin"]}>
                  <AddVolunteer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteers/:id"
              element={
                <ProtectedRoute allowedRoles={["Coordinator", "Admin", "Volunteer"]}>
                  <VolunteerDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteers/:id/edit"
              element={
                <ProtectedRoute allowedRoles={["Coordinator", "Admin", "Volunteer"]}>
                  <EditVolunteer />
                </ProtectedRoute>
              }
            />
            <Route path="/citizen" element={<CitizenDashboard />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={["Coordinator", "Admin", "Citizen", "Volunteer"]}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Resource & Situation Analysis Routes */}
            <Route path="/inventory-hub" element={<ResourceInventoryHub />} />
            <Route path="/resources" element={<ResourceList />} />
            <Route path="/shelters" element={<ShelterList />} />
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/situation-analysis" element={<SituationAnalysisView />} />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={["Coordinator", "Admin", "Citizen", "Volunteer"]}>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/incidents" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <NotificationProvider>
          <Toaster richColors position="top-right" />
          <ToastContainer />
          <AuthProvider>
            <AppShell />
          </AuthProvider>
        </NotificationProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
