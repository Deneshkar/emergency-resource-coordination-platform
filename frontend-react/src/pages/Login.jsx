import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoRoleLoading, setDemoRoleLoading] = useState(null);

  const from = location.state?.from?.pathname || "/incidents";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (roleName) => {
    setError("");
    setDemoRoleLoading(roleName);
    try {
      await demoLogin(roleName);
      navigate(from, { replace: true });
    } catch (err) {
      setError(`Failed to sign in as ${roleName}: ${err.message}`);
    } finally {
      setDemoRoleLoading(null);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand-badge">
            <span className="auth-beacon" />
            <span>ERCP OPS-AUTH</span>
          </div>
          <h1 className="auth-title">Emergency Resource Platform</h1>
          <p className="auth-subtitle">
            Sign in to access incident response coordination, AI planner tools, and responder workflows.
          </p>
        </div>

        {error && (
          <div className="auth-alert-error" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Demo Fast-Login Section */}
        <div className="demo-accounts-box">
          <div className="demo-accounts-header">
            <span className="demo-icon">⚡</span>
            <span className="demo-title">Quick Demo Sign-In</span>
          </div>
          <p className="demo-description">
            Select a verified role below to sign in instantly with pre-seeded assignment credentials:
          </p>
          <div className="demo-role-grid">
            <button
              type="button"
              className="demo-role-btn coordinator"
              disabled={Boolean(demoRoleLoading) || loading}
              onClick={() => handleDemoClick("Coordinator")}
            >
              <div className="role-chip">
                <span className="dot dot-coord" />
                <strong>Coordinator</strong>
              </div>
              <span className="role-tagline">AI Plan Approval & Dispatches</span>
              {demoRoleLoading === "Coordinator" && <span className="btn-spinner" />}
            </button>

            <button
              type="button"
              className="demo-role-btn volunteer"
              disabled={Boolean(demoRoleLoading) || loading}
              onClick={() => handleDemoClick("Volunteer")}
            >
              <div className="role-chip">
                <span className="dot dot-vol" />
                <strong>Volunteer</strong>
              </div>
              <span className="role-tagline">Field Responder & Shifts</span>
              {demoRoleLoading === "Volunteer" && <span className="btn-spinner" />}
            </button>

            <button
              type="button"
              className="demo-role-btn citizen"
              disabled={Boolean(demoRoleLoading) || loading}
              onClick={() => handleDemoClick("Citizen")}
            >
              <div className="role-chip">
                <span className="dot dot-cit" />
                <strong>Citizen</strong>
              </div>
              <span className="role-tagline">Report Incidents & Tracking</span>
              {demoRoleLoading === "Citizen" && <span className="btn-spinner" />}
            </button>

            <button
              type="button"
              className="demo-role-btn admin"
              disabled={Boolean(demoRoleLoading) || loading}
              onClick={() => handleDemoClick("Admin")}
            >
              <div className="role-chip">
                <span className="dot dot-admin" />
                <strong>Administrator</strong>
              </div>
              <span className="role-tagline">Full System Control</span>
              {demoRoleLoading === "Admin" && <span className="btn-spinner" />}
            </button>
          </div>
        </div>

        <div className="auth-divider">
          <span>OR SIGN IN WITH CREDENTIALS</span>
        </div>

        {/* Traditional Credentials Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              placeholder="e.g. coordinator@ercp.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || Boolean(demoRoleLoading)}
          >
            {loading ? "Authenticating..." : "Sign In to Operations"}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: "1rem" }}>
          <Link to="/forgot-password" style={{ color: "var(--text-muted)", fontSize: "0.85rem", textDecoration: "none", marginBottom: "0.5rem", display: "inline-block" }}>
            Forgot Password?
          </Link>
          <br />
          <span>Don't have an account?</span>{" "}
          <Link to="/register" className="auth-link">
            Register as Citizen or Volunteer
          </Link>
        </div>
      </div>
    </div>
  );
}
