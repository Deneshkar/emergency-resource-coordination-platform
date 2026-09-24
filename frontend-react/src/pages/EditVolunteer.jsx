import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getVolunteerById, updateVolunteer } from "../services/volunteerService";

function EditVolunteer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", skills: "" });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const v = await getVolunteerById(id);
        setForm({ name: v.name || "", phone: v.phone || "", skills: v.skills || "" });
        setEmail(v.email || "");
      } catch {
        setError("Failed to load volunteer.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const validate = () => {
    if (!form.name.trim() || form.name.trim().length < 3)
      return "Full name must be at least 3 characters.";
    if (!/^[0-9]{7,15}$/.test(form.phone.trim().replace(/[\s\-()+]/g, "")))
      return "Phone must be 7-15 digits.";
    if (!form.skills.trim()) return "Enter at least one skill.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateVolunteer(id, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        skills: form.skills.trim(),
      });
      navigate("/volunteers", { state: { successMessage: "Volunteer updated successfully!" } });
    } catch (err) {
      const status = err?.response?.status;
      const backendMsg = err?.response?.data?.message;
      if (status === 405 || status === 404) {
        setError(
          `Backend has no edit endpoint (HTTP ${status}). Restart the API to pick up PUT /api/volunteers/:id.`
        );
      } else {
        setError(backendMsg || `Failed to update volunteer.${status ? ` (HTTP ${status})` : ""}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-spinner">Loading volunteer...</div>;

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: "20px" }}>
        <Link to="/volunteers" style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          ← Back to Volunteers
        </Link>
      </div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Edit Volunteer</h1>
          <p>{email} (email cannot be changed)</p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: "560px" }}>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
              Full Name *
            </label>
            <input
              name="name"
              className="form-control"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
              Phone *
            </label>
            <input
              name="phone"
              className="form-control"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
              Skills *
            </label>
            <input
              name="skills"
              className="form-control"
              placeholder="medical, driving"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              required
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <Link to="/volunteers" className="btn btn-ghost">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditVolunteer;
