import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

const DEMO_ROLES = [
  { key: "Coordinator", label: "Coordinator", icon: "🛡️", tone: "amber", hint: "AI plan approval & dispatches" },
  { key: "Volunteer", label: "Volunteer", icon: "🦺", tone: "green", hint: "Field responder & shifts" },
  { key: "Citizen", label: "Citizen", icon: "👤", tone: "blue", hint: "Report incidents & tracking" },
  { key: "Admin", label: "Admin", icon: "⚙️", tone: "purple", hint: "Full system control" },
];

export default function Login() {
  const { login, demoLogin, googleLogin, githubLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
            text: "continue_with",
            shape: "pill",
            logo_alignment: "center",
            width: 200,
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

  const busy = loading || Boolean(demoRoleLoading);

  return (
    <div className="lg-page">
      {/* Top bar */}
      <header className="lg-topbar">
        <Link to="/home" className="lg-brand">
          <span className="lg-brand-logo">🚨</span>
          <span>
            <strong>ERCP Platform</strong>
            <small>Emergency Resource Coordination</small>
          </span>
        </Link>
        <Link to="/home" className="lg-back">← Back to Home</Link>
      </header>

      <main className="lg-main">
        {/* Visual panel */}
        <section className="lg-visual" aria-hidden="true">
          <img src="/assets/images/shelter_relief.png" alt="" className="lg-visual-img" />
          <div className="lg-visual-shade" />
          <div className="lg-visual-content">
            <span className="lg-live-pill"><span className="lg-live-dot" /> Live operations network</span>
            <h2>Coordinate every response, from report to relief.</h2>
            <div className="lg-stat-row">
              <div><strong>24/7</strong><span>AI triage</span></div>
              <div><strong>4</strong><span>Role portals</span></div>
              <div><strong>&lt;2 min</strong><span>Dispatch time</span></div>
            </div>
          </div>
        </section>

        {/* Form card */}
        <section className="lg-card">
          <div className="lg-card-head">
            <h1>Welcome back</h1>
            <p>Sign in to access incident coordination and responder tools.</p>
          </div>

          {error && (
            <div className="lg-error" role="alert">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="lg-form">
            <label className="lg-field">
              <span>Email address</span>
              <input
                id="auth-email"
                type="email"
                placeholder="you@ercp.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label className="lg-field">
              <span className="lg-field-row">
                Password
                <Link to="/forgot-password" className="lg-forgot">Forgot?</Link>
              </span>
              <div className="lg-pass-wrap">
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="lg-eye"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <button type="submit" className="lg-submit" disabled={busy}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Compact demo access */}
          <div className="lg-demo">
            <span className="lg-demo-label">⚡ Quick demo</span>
            <div className="lg-demo-chips">
              {DEMO_ROLES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  className={`lg-chip lg-chip-${r.tone}`}
                  title={r.hint}
                  disabled={busy}
                  onClick={() => handleDemoClick(r.key)}
                >
                  {demoRoleLoading === r.key ? <span className="lg-spin" /> : <span>{r.icon}</span>}
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Social sign-in at the bottom */}
          <div className="lg-divider"><span>or continue with</span></div>

          <div className="lg-social">
            <div className="lg-google-slot">
              <div ref={googleBtnRef} />
              {!googleReady && <span className="lg-google-wait">Loading Google…</span>}
            </div>
            <button
              type="button"
              className="lg-github"
              onClick={handleGithubLogin}
              disabled={busy || githubLoading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              {githubLoading ? "Connecting…" : "GitHub"}
            </button>
          </div>

          <p className="lg-register">
            New here? <Link to="/register">Create a Citizen or Volunteer account</Link>
          </p>
        </section>
      </main>

      <footer className="lg-footer">© 2026 ERCP • Emergency hotline 119 / 1990 / 117</footer>
    </div>
  );
}
