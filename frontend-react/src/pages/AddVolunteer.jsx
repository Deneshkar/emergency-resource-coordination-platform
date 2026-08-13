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
      navigate("/", { state: { successMessage: "Volunteer registered successfully!" } });
    } catch (err) {
      setError("Failed to register volunteer. Please check the details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Link to="/">← Back to Volunteers</Link>
      <h1>Register Volunteer</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", maxWidth: "300px", gap: "0.5rem" }}>
        <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required />
        <input name="skills" placeholder="Skills (comma separated)" value={form.skills} onChange={handleChange} required />
        <button type="submit" disabled={submitting}>
          {submitting ? "Registering..." : "Register Volunteer"}
        </button>
      </form>
    </div>
  );
}

export default AddVolunteer;