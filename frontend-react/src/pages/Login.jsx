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
    <div className="login-light-container">
      <div className="login-light-wrapper">
        {/* LEFT SIDE HERO PANEL (LIGHT THEME) */}
        <div className="login-light-hero">
          <div className="hero-light-bg">
            <img 
              src="/assets/images/hero_emergency.png" 
              alt="Emergency Command Operations" 
              className="hero-light-img" 
            />
            <div className="hero-light-mask"></div>
          </div>

          <div className="hero-light-content">
            <div className="hero-badge-light-pill">
              <span className="pulse-dot-red"></span>
              <span>24/7 AI EMERGENCY RESPONSE NETWORK</span>
            </div>

            <h2 className="hero-light-title">
              Unified Emergency & <span className="gradient-text-light">Resource Command</span>
            </h2>

            <p className="hero-light-desc">
              Connecting citizens, medical teams, field volunteers, and emergency coordinators in real time with satellite telemetry and AI drone dispatches.
            </p>

            <ul className="hero-light-features">
              <li>
                <span className="feat-light-icon">🛰️</span>
                <div>
                  <strong>Satellite Situation Analytics</strong>
                  <p>Live threat tracking & GIS mapping</p>
                </div>
              </li>
              <li>
                <span className="feat-light-icon">⚡</span>
                <div>
                  <strong>AI Automated Dispatch Engine</strong>
                  <p>Fastest route calculation & responder triage</p>
                </div>
              </li>
              <li>
                <span className="feat-light-icon">🛡️</span>
                <div>
                  <strong>Multi-Role Access Control</strong>
                  <p>Secure portals for citizens, volunteers & coordinators</p>
                </div>
              </li>
            </ul>

            <div className="hero-light-footer">
              <span className="status-live-dot">🟢</span>
              <span>All Systems Operational • 99.9% Uptime</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE AUTH FORM CARD (LIGHT THEME) */}
        <div className="login-light-form-panel">
          <div className="login-card-light">
            <div className="login-card-header">
              <Link to="/home" className="back-home-link-light">← Back to Home Page</Link>
              
              <div className="brand-badge-light">
                <span className="logo-icon-light">🚨</span>
                <span className="brand-title-text">ERCP OPERATIONS</span>
              </div>

              <h1 className="login-title-light">Sign In to Platform</h1>
              <p className="login-subtitle-light">
                Enter your credentials or choose a quick demo role to access the command hub.
              </p>
            </div>

            {error && (
              <div className="login-alert-error" role="alert">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* COMPACT TOP DEMO ROLE STRIP (Compact & space-saving) */}
            <div className="compact-demo-strip">
              <div className="compact-demo-label">
                <span>⚡ Instant Demo Access:</span>
              </div>
              <div className="compact-role-pills">
                <button
                  type="button"
                  className="role-pill coord"
                  title="Sign in as Emergency Coordinator"
                  disabled={Boolean(demoRoleLoading) || loading}
                  onClick={() => handleDemoClick("Coordinator")}
                >
                  <span className="pill-dot coord"></span>
                  <span>Coordinator</span>
                  {demoRoleLoading === "Coordinator" && <span className="pill-spinner" />}
                </button>

                <button
                  type="button"
                  className="role-pill vol"
                  title="Sign in as Field Responder / Volunteer"
                  disabled={Boolean(demoRoleLoading) || loading}
                  onClick={() => handleDemoClick("Volunteer")}
                >
                  <span className="pill-dot vol"></span>
                  <span>Volunteer</span>
                  {demoRoleLoading === "Volunteer" && <span className="pill-spinner" />}
                </button>

                <button
                  type="button"
                  className="role-pill cit"
                  title="Sign in as Citizen"
                  disabled={Boolean(demoRoleLoading) || loading}
                  onClick={() => handleDemoClick("Citizen")}
                >
                  <span className="pill-dot cit"></span>
                  <span>Citizen</span>
                  {demoRoleLoading === "Citizen" && <span className="pill-spinner" />}
                </button>

                <button
                  type="button"
                  className="role-pill admin"
                  title="Sign in as System Administrator"
                  disabled={Boolean(demoRoleLoading) || loading}
                  onClick={() => handleDemoClick("Admin")}
                >
                  <span className="pill-dot admin"></span>
                  <span>Admin</span>
                  {demoRoleLoading === "Admin" && <span className="pill-spinner" />}
                </button>
              </div>
            </div>

            {/* TRADITIONAL CREDENTIALS FORM */}
            <form onSubmit={handleSubmit} className="login-form-light">
              <div className="form-group-light">
                <label htmlFor="auth-email">Email Address</label>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="e.g. coordinator@ercp.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-light"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group-light">
                <div className="password-label-row">
                  <label htmlFor="auth-password">Password</label>
                  <Link to="/forgot-password" className="forgot-pass-link">Forgot Password?</Link>
                </div>
                <input
                  id="auth-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-light"
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-submit-light"
                disabled={loading || Boolean(demoRoleLoading)}
              >
                {loading ? "Authenticating..." : "Sign In to Operations"}
              </button>
            </form>

            {/* SOCIAL SIGN-IN AT THE BOTTOM */}
            <div className="social-divider-light">
              <span>OR CONNECT WITH SOCIAL ACCOUNT</span>
            </div>

            <div className="social-auth-bottom">
              {/* Google Button */}
              <div ref={googleBtnRef} className="google-btn-wrapper" />
              {!googleReady && (
                <div className="social-init-text">
                  Initializing Google Sign-In...
                </div>
              )}

              {/* GitHub Button */}
              <button
                type="button"
                className="github-btn-light"
                onClick={handleGithubLogin}
                disabled={loading || githubLoading || Boolean(demoRoleLoading)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>{githubLoading ? "Connecting to GitHub..." : "Continue with GitHub"}</span>
              </button>
            </div>

            <div className="login-footer-light">
              <span>Don't have an account?</span>{" "}
              <Link to="/register" className="register-link-light">
                Register as Citizen or Volunteer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
