import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="auth-loading-screen" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="loading-spinner" style={{ width: 40, height: 40, margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Verifying security credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="access-denied-container" style={{ padding: "3rem 1.5rem", maxWidth: 640, margin: "2rem auto", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🔒</div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Access Restricted</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
          Your current role (<strong style={{ color: "var(--accent)" }}>{user?.role}</strong>) does not have sufficient permissions to view this operations area.
          Required role(s): {allowedRoles.map((r) => <code key={r} style={{ margin: "0 4px", padding: "2px 6px", background: "rgba(255,255,255,0.08)", borderRadius: 4 }}>{r}</code>)}
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <Link to="/incidents" className="btn btn-primary">Go to Incidents</Link>
          <Link to="/login" className="btn btn-secondary">Switch Role</Link>
        </div>
      </div>
    );
  }

  return children;
}
