import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getResources, createResource, updateResource, updateResourceStatus, deleteResource,
  getShelters,
  getInventory,
} from "../services/resourceService";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import Modal, { FormField, FormRow } from "../components/Modal";

export default function ResourceInventoryHub() {
  const [activeTab, setActiveTab] = useState("overview");

  const [resources, setResources] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: null, name: "", resourceType: "Vehicle", status: "Available", capacity: 1, location: "" });

  const [newResource, setNewResource] = useState({ name: "", resourceType: "Vehicle", capacity: 1, location: "" });

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [resData, shelterData, invData] = await Promise.all([
        getResources(), getShelters(), getInventory(),
      ]);
      setResources(resData || []);
      setShelters(shelterData || []);
      setInventory(invData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  const handleCreateResource = async (e) => {
    e.preventDefault();
    await createResource(newResource);
    setNewResource({ name: "", resourceType: "Vehicle", capacity: 1, location: "" });
    setShowResourceModal(false);
    fetchAllData();
  };

  const handleStatusChange = async (id, status) => {
    await updateResourceStatus(id, status);
    fetchAllData();
  };

  const openEditModal = (resource) => {
    setEditForm({
      id: resource.id,
      name: resource.name,
      resourceType: resource.resourceType,
      status: resource.status,
      capacity: resource.capacity,
      location: resource.location || "",
    });
    setShowEditModal(true);
  };

  const handleUpdateResource = async (e) => {
    e.preventDefault();
    await updateResource(editForm.id, {
      name: editForm.name,
      resourceType: editForm.resourceType,
      status: editForm.status,
      capacity: editForm.capacity,
      location: editForm.location,
      shelterId: null,
    });
    setShowEditModal(false);
    fetchAllData();
  };

  const handleDeleteResource = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await deleteResource(id);
    fetchAllData();
  };

  const totalAvailableVehicles = resources.filter((r) => r.status === "Available").length;
  const lowStockCount = inventory.filter((i) => i.status === "LowStock" || i.status === "OutOfStock").length;
  const totalCapacitySum = shelters.reduce((sum, s) => sum + s.totalCapacity, 0);
  const totalOccupancySum = shelters.reduce((sum, s) => sum + s.currentOccupancy, 0);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "resources", label: "Resources" },
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Resource & Inventory Hub</h1>
          <p>Fleet management with live shelter, inventory & AI status at a glance</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchAllData}>↻ Refresh</button>
      </div>

      <div className="tab-bar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? " active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner">Loading operational data...</div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <>
              <div className="grid-stats anim-stagger">
                <StatCard icon="📦" label="Available Resources" value={totalAvailableVehicles} sub={`of ${resources.length} total`} color="blue" />
                <StatCard icon="🏠" label="Shelter Occupancy" value={`${totalCapacitySum > 0 ? Math.round((totalOccupancySum / totalCapacitySum) * 100) : 0}%`} sub={`${totalOccupancySum} / ${totalCapacitySum}`} color="green" />
                <StatCard icon="⚠️" label="Low Stock Alerts" value={lowStockCount} sub="items need restock" color={lowStockCount > 0 ? "amber" : "green"} />
                <Link to="/situation-analysis" style={{ textDecoration: "none" }} title="Open Situation Analysis">
                  <StatCard icon="🧠" label="AI Agent" value="Ready" sub="Situation Analysis →" color="purple" />
                </Link>
              </div>

              <div className="grid-3 anim-stagger">
                {/* Inventory Quick View */}
                <div className="card anim-slide-up">
                  <div className="card-header">
                    <span className="card-title">📋 Inventory Summary</span>
                    <Link to="/inventory" className="btn btn-ghost btn-sm">Manage →</Link>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {inventory.slice(0, 4).map((i) => (
                      <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "var(--bg-base)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                        <div>
                          <div style={{ fontWeight: "600", fontSize: "13px" }}>{i.itemName}</div>
                          <div className="text-dim" style={{ fontSize: "11px" }}>{i.category}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div className="font-mono" style={{ fontWeight: "700", fontSize: "13px" }}>{i.quantity} {i.unitOfMeasure}</div>
                          <StatusBadge status={i.status} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resource Fleet */}
                <div className="card anim-slide-up">
                  <div className="card-header">
                    <span className="card-title">🚛 Resource Fleet</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab("resources")}>Manage →</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {resources.slice(0, 4).map((r) => (
                      <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "var(--bg-base)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                        <div>
                          <div style={{ fontWeight: "600", fontSize: "13px" }}>{r.name}</div>
                          <div className="text-dim" style={{ fontSize: "11px" }}>{r.resourceType}</div>
                        </div>
                        <StatusBadge status={r.status} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shelter Overview */}
                <div className="card anim-slide-up">
                  <div className="card-header">
                    <span className="card-title">🏠 Shelter Capacity</span>
                    <Link to="/shelters" className="btn btn-ghost btn-sm">Manage →</Link>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {shelters.slice(0, 4).map((s) => {
                      const pct = Math.round((s.currentOccupancy / s.totalCapacity) * 100) || 0;
                      return (
                        <div key={s.id}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span style={{ fontSize: "13px", fontWeight: "600" }}>{s.name}</span>
                            <span className="font-mono text-muted" style={{ fontSize: "12px" }}>{pct}%</span>
                          </div>
                          <div className="progress-bar">
                            <div className={`progress-fill ${pct >= 90 ? "red" : pct >= 70 ? "amber" : "green"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* RESOURCES TAB */}
          {activeTab === "resources" && (
            <div className="card anim-slide-up" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "15px" }}>Resource & Vehicle Fleet</div>
                  <div className="text-dim" style={{ fontSize: "12px" }}>Manage transport units, equipment & operational readiness</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowResourceModal(true)}>+ Add Resource</button>
              </div>
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
                    {resources.map((r) => (
                      <tr key={r.id}>
                        <td>#{r.id}</td>
                        <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{r.name}</td>
                        <td>{r.resourceType}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td className="font-mono">{r.capacity}</td>
                        <td>{r.location || "—"}</td>
                        <td>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <select
                              value={r.status}
                              onChange={(e) => handleStatusChange(r.id, e.target.value)}
                              className="form-select"
                              style={{ padding: "5px 8px", fontSize: "12px", width: "auto" }}
                            >
                              <option value="Available">Available</option>
                              <option value="Dispatched">Dispatched</option>
                              <option value="Maintenance">Maintenance</option>
                              <option value="Reserved">Reserved</option>
                            </select>
                            <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(r)}>
                              Edit
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteResource(r.id, r.name)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </>
      )}

      {/* Modals */}
      <Modal isOpen={showResourceModal} onClose={() => setShowResourceModal(false)} title="Add Resource" subtitle="Register a new resource or vehicle">
        <form onSubmit={handleCreateResource}>
          <FormField label="Resource Name" required>
            <input className="form-control" placeholder="e.g. Ambulance Unit 2" value={newResource.name} onChange={(e) => setNewResource({ ...newResource, name: e.target.value })} required />
          </FormField>
          <FormRow>
            <FormField label="Type">
              <select className="form-select" value={newResource.resourceType} onChange={(e) => setNewResource({ ...newResource, resourceType: e.target.value })}>
                <option value="Vehicle">Vehicle</option>
                <option value="MedicalEquipment">Medical Equipment</option>
                <option value="Generator">Generator</option>
                <option value="FoodSupply">Food Supply</option>
                <option value="ShelterSupply">Shelter Supply</option>
              </select>
            </FormField>
            <FormField label="Capacity">
              <input className="form-control" type="number" value={newResource.capacity} onChange={(e) => setNewResource({ ...newResource, capacity: parseInt(e.target.value) || 1 })} />
            </FormField>
          </FormRow>
          <FormField label="Location">
            <input className="form-control" placeholder="e.g. Central Depot" value={newResource.location} onChange={(e) => setNewResource({ ...newResource, location: e.target.value })} />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowResourceModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Resource</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Resource" subtitle={`Updating resource #${editForm.id}`}>
        <form onSubmit={handleUpdateResource}>
          <FormField label="Resource Name" required>
            <input className="form-control" placeholder="e.g. Ambulance Unit 2" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
          </FormField>
          <FormRow>
            <FormField label="Type">
              <select className="form-select" value={editForm.resourceType} onChange={(e) => setEditForm({ ...editForm, resourceType: e.target.value })}>
                <option value="Vehicle">Vehicle</option>
                <option value="MedicalEquipment">Medical Equipment</option>
                <option value="Generator">Generator</option>
                <option value="FoodSupply">Food Supply</option>
                <option value="ShelterSupply">Shelter Supply</option>
              </select>
            </FormField>
            <FormField label="Capacity">
              <input className="form-control" type="number" value={editForm.capacity} onChange={(e) => setEditForm({ ...editForm, capacity: parseInt(e.target.value) || 1 })} />
            </FormField>
          </FormRow>
          <FormField label="Location">
            <input className="form-control" placeholder="e.g. Central Depot" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
