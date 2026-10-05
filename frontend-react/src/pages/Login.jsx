import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, demoLogin, googleLogin, githubLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoRoleLoading, setDemoRoleLoading] = useState(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  const googleBtnRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "592887901751-0iuldqhhkfs9cq5g5r2tana3urtgs9s5.apps.googleusercontent.com";
  const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID || "Ov23liWTjFyFPOxBL4Xe";

  const from = location.state?.from?.pathname || "/incidents";

  // Handle GitHub OAuth Redirect Callback (?code=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setGithubLoading(true);
      setLoading(true);
      setError("");

      const redirectUri = window.location.origin + "/login";
      githubLogin(code, redirectUri)
        .then(() => {
          navigate(from, { replace: true });
        })
        .catch((err) => {
          console.error("GitHub sign-in error:", err);
          setError(err.message || "Failed to sign in with GitHub.");
        })
        .finally(() => {
          setGithubLoading(false);
          setLoading(false);
        });
    }
  }, [githubLogin, navigate, from]);

  const handleGithubLogin = () => {
    setError("");
    setGithubLoading(true);
    const redirectUri = window.location.origin + "/login";
    const scope = "read:user user:email";
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
    window.location.href = authUrl;
  };

  const handleGoogleCredentialResponse = useCallback(async (response) => {
    if (!response || !response.credential) {
      setError("No Google credential received. Please try again.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const base64Url = response.credential.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const payload = JSON.parse(jsonPayload);

      await googleLogin({
        idToken: response.credential,
        email: payload.email,
        name: payload.name || payload.email.split("@")[0],
      });

      navigate(from, { replace: true });
    } catch (err) {
      console.error("Google login failed:", err);
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  }, [googleLogin, navigate, from]);

  useEffect(() => {
    let interval = null;
    let attempts = 0;
    const maxAttempts = 20;

    const setupGoogle = () => {
      attempts++;
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
          });

          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: 320,
          });
          setGoogleReady(true);
          if (interval) clearInterval(interval);
        } catch (e) {
          console.warn("Failed to render Google button:", e);
        }
      } else if (attempts >= maxAttempts) {
        if (interval) clearInterval(interval);
      }
    };

    setupGoogle();
    if (!window.google?.accounts?.id || !googleBtnRef.current) {
      interval = setInterval(setupGoogle, 300);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [googleClientId, handleGoogleCredentialResponse]);

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
    <div className="auth-split-wrapper">
      {/* LEFT SIDE HERO IMAGE PANEL */}
      <div className="auth-hero-panel">
        <div className="hero-bg-overlay">
          <img 
            src="/assets/images/hero_emergency.png" 
            alt="Emergency Command Center" 
            className="hero-side-img" 
          />
          <div className="hero-gradient-mask"></div>
        </div>

        <div className="hero-panel-content">
          <div className="hero-brand-tag">
            <span className="pulse-beacon"></span>
            <span>ERCP OPERATIONS GATEWAY</span>
          </div>

          <h2 className="hero-panel-title">
            Unified AI Emergency & Resource Command
          </h2>

          <p className="hero-panel-desc">
            Connecting emergency command centers, field responders, and citizens with real-time satellite telemetry and automated drone dispatching.
          </p>

          <ul className="hero-feature-list">
            <li>
              <span className="feat-icon">🛰️</span>
              <div>
                <strong>Satellite Situation Analysis</strong>
                <p>Real-time threat evaluation & GIS mapping</p>
              </div>
            </li>
            <li>
              <span className="feat-icon">⚡</span>
              <div>
                <strong>AI Automated Dispatch Engine</strong>
                <p>Fastest route calculation & responder matching</p>
              </div>
            </li>
            <li>
              <span className="feat-icon">🛡️</span>
              <div>
                <strong>Multi-Role Role Access Control</strong>
                <p>Protected gateways for citizens, volunteers & admins</p>
              </div>
            </li>
          </ul>

          <div className="hero-panel-footer">
            <span className="status-live-dot">🟢</span>
            <span>All System Operations Online • 24/7 Security Active</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE AUTH FORM CARD */}
      <div className="auth-form-panel">
        <div className="auth-card-redesigned">
          <div className="auth-header">
            <Link to="/home" className="auth-home-back-link">← Back to Home Page</Link>
            <div className="auth-brand-badge">
              <span className="auth-beacon" />
              <span>ERCP OPS-AUTH</span>
            </div>
            <h1 className="auth-title">Sign In to Operations</h1>
            <p className="auth-subtitle">
              Enter your credentials or select a fast demo profile to access response tools.
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

          {/* Social Sign-In Section */}
          <div className="auth-divider">
            <span>OR CONTINUE WITH SOCIAL</span>
          </div>

          <div className="social-auth-container" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center", justifyContent: "center", margin: "1.25rem 0" }}>
            <div ref={googleBtnRef} style={{ minHeight: "44px", display: "flex", justifyContent: "center", width: "100%", maxWidth: "320px" }} />
            {!googleReady && (
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim, #64748b)" }}>
                Initializing Google Sign-In...
              </div>
            )}

            <button
              type="button"
              className="github-auth-btn"
              onClick={handleGithubLogin}
              disabled={loading || githubLoading || Boolean(demoRoleLoading)}
              style={{
                width: "100%",
                maxWidth: "320px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                backgroundColor: "#24292e",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: 500,
                fontFamily: "Inter, sans-serif",
                cursor: (loading || githubLoading) ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>{githubLoading ? "Connecting to GitHub..." : "Continue with GitHub"}</span>
            </button>
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
    </div>
  );
}
