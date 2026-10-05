import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Register() {
  const { register, googleLogin, githubLogin } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("Citizen");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [skills, setSkills] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  const googleBtnRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "592887901751-0iuldqhhkfs9cq5g5r2tana3urtgs9s5.apps.googleusercontent.com";
  const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID || "Ov23liWTjFyFPOxBL4Xe";

  // Handle GitHub OAuth Redirect Callback (?code=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setGithubLoading(true);
      setLoading(true);
      setError("");

      const redirectUri = window.location.origin + "/register";
      githubLogin(code, redirectUri)
        .then(() => {
          navigate("/incidents", { replace: true });
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
  }, [githubLogin, navigate]);

  const handleGithubLogin = () => {
    setError("");
    setGithubLoading(true);
    const redirectUri = window.location.origin + "/register";
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

      navigate("/incidents", { replace: true });
    } catch (err) {
      console.error("Google login failed:", err);
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  }, [googleLogin, navigate]);

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
            text: "signup_with",
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
    if (!fullName || !email || !password) {
      setError("Please complete all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await register({
        fullName,
        email,
        password,
        role,
        phoneNumber: phoneNumber || null,
        skills: role === "Volunteer" ? skills : null,
      });
      navigate("/incidents", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg-page">
      {/* Top bar */}
      <header className="lg-topbar">
        <Link to="/home" className="lg-brand">
          <img src="/assets/images/logo.png" alt="ERCP" style={{ width: 36, height: 36, objectFit: "contain" }} />
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
          <img src="/assets/images/hero_emergency.png" alt="" className="lg-visual-img" />
          <div className="lg-visual-shade" />
          <div className="lg-visual-content">
            <span className="lg-live-pill"><span className="lg-live-dot" /> Operations Enrollment</span>
            <h2>Join the response network — as a Citizen or Volunteer.</h2>
            <div className="lg-stat-row">
              <div><strong>24/7</strong><span>AI Triage</span></div>
              <div><strong>Verified</strong><span>Role Access</span></div>
              <div><strong>&lt;2 min</strong><span>Dispatch Time</span></div>
            </div>
          </div>
        </section>

        {/* Form card */}
        <section className="lg-card">
          <div className="lg-card-head">
            <h1>Create Account</h1>
            <p>Enroll as a Citizen or Responder to start reporting & coordinating.</p>
          </div>

          {error && (
            <div className="lg-error" role="alert">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="lg-form">
            <label className="lg-field">
              <span>Full Name *</span>
              <input
                id="reg-name"
                type="text"
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </label>

            <label className="lg-field">
              <span>Email address *</span>
              <input
                id="reg-email"
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <label className="lg-field">
                <span>Password *</span>
                <div className="lg-pass-wrap">
                  <input
                    id="reg-pass"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="lg-eye"
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <label className="lg-field">
                <span>Confirm *</span>
                <input
                  id="reg-cpass"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat pass"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </label>
            </div>

            <label className="lg-field">
              <span>Platform Role</span>
              <select
                id="reg-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.8rem 1rem",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "12px",
                  fontSize: "0.95rem",
                  color: "#0f172a",
                  outline: "none",
                }}
              >
                <option value="Citizen">👤 Citizen / Reporter (Community member)</option>
                <option value="Volunteer">🦺 Volunteer / Field Responder (Task execution)</option>
              </select>
            </label>

            <label className="lg-field">
              <span>Phone Number (Optional)</span>
              <input
                id="reg-phone"
                type="tel"
                placeholder="+1-555-0123"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </label>

            {role === "Volunteer" && (
              <label className="lg-field">
                <span>Specialized Skills / Certifications</span>
                <input
                  id="reg-skills"
                  type="text"
                  placeholder="e.g. First Aid EMT, Search and Rescue"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </label>
            )}

            <button type="submit" className="lg-submit" disabled={loading}>
              {loading ? "Creating Account…" : "Complete Registration"}
            </button>
          </form>

          {/* Social sign-in at the bottom */}
          <div className="lg-divider"><span>or register with</span></div>

          <div className="lg-social">
            <div className="lg-google-slot">
              <div ref={googleBtnRef} />
              {!googleReady && <span className="lg-google-wait">Loading Google…</span>}
            </div>
            <button
              type="button"
              className="lg-github"
              onClick={handleGithubLogin}
              disabled={loading || githubLoading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              {githubLoading ? "Connecting…" : "GitHub"}
            </button>
          </div>

          <p className="lg-register">
            Already registered? <Link to="/login">Sign in with existing account</Link>
          </p>
        </section>
      </main>

      <footer className="lg-footer">© 2026 ERCP • Emergency hotline 119 / 1990 / 117</footer>
    </div>
  );
}
