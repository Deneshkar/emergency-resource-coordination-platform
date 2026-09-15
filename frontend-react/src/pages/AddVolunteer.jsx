import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createVolunteer } from "../services/volunteerService";

function AddVolunteer() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", skills: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createVolunteer(form);
      navigate("/volunteers", { state: { successMessage: "Volunteer registered successfully!" } });
    } catch (err) {
      setError("Failed to register volunteer. Please check the details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: "20px" }}>
        <Link to="/volunteers" style={{ fontSize: "13px", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          ← Back to Volunteers
        </Link>
      </div>

      <div className="page-header">
        <div className="page-header-left">
          <h1>Register Volunteer</h1>
          <p>Add a new responder to the coordination pool</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: "560px" }}>
        {error && (
          <div style={{
            padding: "10px 14px",
            background: "var(--red-glow)",
            border: "1px solid var(--red)",
            borderRadius: "var(--radius-sm)",
            color: "var(--red)",
            fontSize: "13px",
            fontWeight: "600",
            marginBottom: "16px",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>
              Full Name <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input name="name" className="form-control" placeholder="e.g. Amara Perera" value={form.name} onChange={handleChange} required />
          </div>

          <div className="form-row-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>
                Email <span style={{ color: "var(--red)" }}>*</span>
              </label>
              <input name="email" className="form-control" type="email" placeholder="amara@email.com" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>
                Phone <span style={{ color: "var(--red)" }}>*</span>
              </label>
              <input name="phone" className="form-control" placeholder="+94 77 123 4567" value={form.phone} onChange={handleChange} required />
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>
              Skills <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input name="skills" className="form-control" placeholder="e.g. medical, driving, rescue" value={form.skills} onChange={handleChange} required />
            <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "4px" }}>Comma-separated list of skills</div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <Link to="/volunteers" className="btn btn-ghost">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Registering..." : "Register Volunteer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddVolunteer;
