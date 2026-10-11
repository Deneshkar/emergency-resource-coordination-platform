import { useEffect, useState } from "react";
import { getResources, createResource, updateResourceStatus, deleteResource } from "../services/resourceService";
import { useNotification } from "../context/NotificationContext";
import { sendResourceDispatchedEmail, sendResourceMaintenanceEmail, sendResourceAddedEmail } from "../services/emailNotificationService";
import StatusBadge from "../components/StatusBadge";
import Modal, { FormField, FormRow } from "../components/Modal";

export default function ResourceList() {
  const { notify } = useNotification();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", resourceType: "Vehicle", capacity: 1, location: "" });

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await getResources();
      setResources(data);
    } catch (err) {
      console.error(err);
      notify.error("Failed to load resource data.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchResources(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await createResource(form);
    notify.success(`✅ Resource "${form.name}" added to the fleet!`);
    sendResourceAddedEmail(form.name, form.resourceType, form.location);
    setForm({ name: "", resourceType: "Vehicle", capacity: 1, location: "" });
    setShowModal(false);
    fetchResources();
  };

  const handleStatusChange = async (id, newStatus) => {
    const resource = resources.find((r) => r.id === id);
    const oldStatus = resource?.status;
    await updateResourceStatus(id, newStatus);

    if (newStatus === "Dispatched") {
      notify.error(`🚛 DISPATCHED: "${resource?.name}" sent to field — No longer available!`, 7000);
      sendResourceDispatchedEmail(resource?.name, resource?.resourceType, resource?.location);
    } else if (newStatus === "Maintenance") {
      notify.warning(`🔧 MAINTENANCE: "${resource?.name}" taken offline for maintenance.`);
      sendResourceMaintenanceEmail(resource?.name, resource?.resourceType);
    } else if (newStatus === "Available" && oldStatus !== "Available") {
      notify.success(`✅ "${resource?.name}" is now Available again!`);
    } else if (newStatus === "Reserved") {
      notify.info(`🔒 "${resource?.name}" has been Reserved.`);
    }

    fetchResources();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await deleteResource(id);
    notify.info(`🗑️ Resource "${name}" removed from fleet.`);
    fetchResources();
  };

  if (loading) return <div className="loading-spinner">Loading resources...</div>;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Resource Fleet</h1>
          <p>Manage vehicles, equipment & operational assets &mdash; {resources.length} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Resource</button>
      </div>

      <div className="grid-stats" style={{ marginBottom: "24px" }}>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>Available</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--green)", marginTop: "2px" }}>{resources.filter(r => r.status === "Available").length}</div>
        </div>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>Dispatched</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--amber)", marginTop: "2px" }}>{resources.filter(r => r.status === "Dispatched").length}</div>
        </div>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>Maintenance</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-muted)", marginTop: "2px" }}>{resources.filter(r => r.status === "Maintenance").length}</div>
        </div>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>Reserved</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--purple)", marginTop: "2px" }}>{resources.filter(r => r.status === "Reserved").length}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Capacity</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <div className="empty-state-icon">📦</div>
                      <div className="empty-state-text">No resources registered</div>
                      <div className="empty-state-sub">Add resources to begin tracking</div>
                    </div>
                  </td>
                </tr>
              ) : (
                resources.map((r) => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{r.name}</td>
                    <td>{r.resourceType}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{r.capacity}</td>
                    <td>{r.location || "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <select
                          value={r.status}
                          onChange={(e) => handleStatusChange(r.id, e.target.value)}
                          style={{ padding: "5px 8px", fontSize: "12px", width: "auto" }}
                        >
                          <option value="Available">Available</option>
                          <option value="Dispatched">Dispatched</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Reserved">Reserved</option>
                        </select>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id, r.name)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Resource" subtitle="Register a new resource or vehicle">
        <form onSubmit={handleCreate}>
          <FormField label="Resource Name" required>
            <input placeholder="e.g. Ambulance Unit 2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </FormField>
          <FormRow>
            <FormField label="Type">
              <select value={form.resourceType} onChange={(e) => setForm({ ...form, resourceType: e.target.value })}>
                <option value="Vehicle">Vehicle</option>
                <option value="MedicalEquipment">Medical Equipment</option>
                <option value="Generator">Generator</option>
                <option value="FoodSupply">Food Supply</option>
                <option value="ShelterSupply">Shelter Supply</option>
              </select>
            </FormField>
            <FormField label="Capacity">
              <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })} />
            </FormField>
          </FormRow>
          <FormField label="Location">
            <input placeholder="e.g. Central Depot" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Resource</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
