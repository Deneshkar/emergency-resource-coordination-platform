import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import Modal, { FormField, FormRow } from "../components/Modal";
import { getIncidents, createIncident, updateIncident, deleteIncident } from "../services/incidentService";
import { useAuth } from "../context/AuthContext";

export default function IncidentList() {
  const { hasRole } = useAuth();
  const canManage = hasRole(["Coordinator", "Admin"]);

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showUpdate, setShowUpdate] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", location: "", priority: "Medium" });
  const [updateForm, setUpdateForm] = useState({ status: "", priority: "" });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getIncidents();
      setIncidents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await createIncident(form);
    setForm({ title: "", description: "", location: "", priority: "Medium" });
    setShowCreate(false);
    fetchData();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateIncident(showUpdate.id, updateForm);
    setShowUpdate(null);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this incident?")) {
      await deleteIncident(id);
      fetchData();
    }
  };

  const openUpdate = (inc) => {
    setUpdateForm({ status: inc.status, priority: inc.priority });
    setShowUpdate(inc);
  };

  if (loading) return <div className="loading-spinner">Loading incidents...</div>;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Incidents</h1>
          <p>Track and manage reported emergencies &mdash; {incidents.length} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Report Incident
        </button>
      </div>

      {/* Stats */}
      <div className="grid-stats" style={{ marginBottom: "24px" }}>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>Reported</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--amber)", marginTop: "2px" }}>{incidents.filter(i => i.status === "Reported").length}</div>
        </div>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>Critical</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--red)", marginTop: "2px" }}>{incidents.filter(i => i.priority === "Critical").length}</div>
        </div>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>High Priority</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#f97316", marginTop: "2px" }}>{incidents.filter(i => i.priority === "High").length}</div>
        </div>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>Resolved</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--green)", marginTop: "2px" }}>{incidents.filter(i => i.status === "Resolved" || i.status === "Closed").length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Location</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <div className="empty-state-icon">⚠️</div>
                      <div className="empty-state-text">No incidents reported</div>
                      <div className="empty-state-sub">Click "Report Incident" to create one</div>
                    </div>
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr key={inc.id}>
                    <td>#{inc.id}</td>
                    <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{inc.title}</td>
                    <td>{inc.location || "—"}</td>
                    <td><StatusBadge status={inc.priority} /></td>
                    <td><StatusBadge status={inc.status} /></td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                      {new Date(inc.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <Link to={`/incidents/${inc.id}`} className="btn btn-ghost btn-sm">
                          View
                        </Link>
                        {canManage && (
                          <>
                            <button className="btn btn-ghost btn-sm" onClick={() => openUpdate(inc)}>Edit</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }} onClick={() => handleDelete(inc.id)}>Delete</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Report New Incident" subtitle="Log a new emergency incident into the system" width="560px">
        <form onSubmit={handleCreate}>
          <FormField label="Title" required>
            <input className="form-control" placeholder="e.g. Flash Flood in District 7" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </FormField>
          <FormField label="Description">
            <textarea className="form-control" rows={4} placeholder="Details about the incident, visible hazards, people affected…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </FormField>
          <FormRow>
            <FormField label="Location">
              <input className="form-control" placeholder="e.g. Colombo, Sri Lanka" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </FormField>
            <FormField label="Priority">
              <select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </FormField>
          </FormRow>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Report Incident</button>
          </div>
        </form>
      </Modal>

      {/* Update Modal */}
      <Modal isOpen={!!showUpdate} onClose={() => setShowUpdate(null)} title={`Edit Incident #${showUpdate?.id}`} subtitle={showUpdate?.title}>
        <form onSubmit={handleUpdate}>
          <FormRow>
            <FormField label="Status">
              <select className="form-select" value={updateForm.status} onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}>
                <option value="Reported">Reported</option>
                <option value="Investigating">Investigating</option>
                <option value="InProgress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </FormField>
            <FormField label="Priority">
              <select className="form-select" value={updateForm.priority} onChange={(e) => setUpdateForm({ ...updateForm, priority: e.target.value })}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </FormField>
          </FormRow>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowUpdate(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Update Incident</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
