import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Citizen");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [skills, setSkills] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="auth-page-container">
      <div className="auth-card" style={{ maxWidth: "540px" }}>
        <div className="auth-header">
          <div className="auth-brand-badge">
            <span className="auth-beacon" />
            <span>OPERATIONS ENROLLMENT</span>
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">
            Join the Emergency Resource Coordination Platform as a Community Citizen or Responder Volunteer.
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

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="reg-name">Full Name *</label>
            <input
              id="reg-name"
              type="text"
              placeholder="e.g. John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="auth-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email Address *</label>
            <input
              id="reg-email"
              type="email"
              placeholder="e.g. john@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              required
            />
          </div>

          <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label htmlFor="reg-pass">Password *</label>
              <input
                id="reg-pass"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-cpass">Confirm Password *</label>
              <input
                id="reg-cpass"
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-role">Platform Role</label>
            <select
              id="reg-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="auth-input"
            >
              <option value="Citizen">Citizen / Reporter (Community member)</option>
              <option value="Volunteer">Field Volunteer / Responder (Task execution)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="reg-phone">Phone Number (Optional)</label>
            <input
              id="reg-phone"
              type="tel"
              placeholder="+1-555-0123"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="auth-input"
            />
          </div>

          {role === "Volunteer" && (
            <div className="form-group">
              <label htmlFor="reg-skills">Specialized Skills / Certifications</label>
              <input
                id="reg-skills"
                type="text"
                placeholder="e.g. First Aid EMT, Search and Rescue, Water Rescue"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="auth-input"
              />
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Complete Registration"}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already registered?</span>{" "}
          <Link to="/login" className="auth-link">
            Sign In with existing account
          </Link>
        </div>
      </div>
    </div>
  );
}
