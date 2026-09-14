import React, { useEffect, useState } from "react";
import {
  getResources, createResource, updateResourceStatus, deleteResource,
  getShelters, createShelter, updateShelterOccupancy,
  getInventory, createInventoryItem, adjustStock,
  assessSituation,
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
  const [showShelterModal, setShowShelterModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);

  const [newResource, setNewResource] = useState({ name: "", resourceType: "Vehicle", capacity: 1, location: "" });
  const [newShelter, setNewShelter] = useState({ name: "", location: "", address: "", totalCapacity: 100, contactNumber: "" });
  const [newItem, setNewItem] = useState({ itemName: "", category: "Medical", quantity: 50, unitOfMeasure: "Kits", minimumThreshold: 10, location: "" });

  const [incidentId, setIncidentId] = useState("1");
  const [assessment, setAssessment] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

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

  const handleCreateShelter = async (e) => {
    e.preventDefault();
    await createShelter(newShelter);
    setNewShelter({ name: "", location: "", address: "", totalCapacity: 100, contactNumber: "" });
    setShowShelterModal(false);
    fetchAllData();
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    await createInventoryItem(newItem);
    setNewItem({ itemName: "", category: "Medical", quantity: 50, unitOfMeasure: "Kits", minimumThreshold: 10, location: "" });
    setShowInventoryModal(false);
    fetchAllData();
  };

  const handleStatusChange = async (id, status) => {
    await updateResourceStatus(id, status);
    fetchAllData();
  };

  const handleDeleteResource = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await deleteResource(id);
    fetchAllData();
  };

  const handleOccupancyUpdate = async (id, occupancy) => {
    await updateShelterOccupancy(id, parseInt(occupancy) || 0);
    fetchAllData();
  };

  const handleAdjustStock = async (id, delta) => {
    await adjustStock(id, delta);
    fetchAllData();
  };

  const handleRunAiAssessment = async (e) => {
    e.preventDefault();
    if (!incidentId) return;
    try {
      setAiLoading(true);
      setAiError("");
      const result = await assessSituation(incidentId);
      setAssessment(result);
    } catch (err) {
      setAiError(err.response?.data?.message || "Failed to run AI assessment.");
    } finally {
      setAiLoading(false);
    }
  };

  const totalAvailableVehicles = resources.filter((r) => r.status === "Available").length;
  const lowStockCount = inventory.filter((i) => i.status === "LowStock" || i.status === "OutOfStock").length;
  const totalCapacitySum = shelters.reduce((sum, s) => sum + s.totalCapacity, 0);
  const totalOccupancySum = shelters.reduce((sum, s) => sum + s.currentOccupancy, 0);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "resources", label: "Resources" },
    { id: "shelters", label: "Shelters" },
    { id: "inventory", label: "Inventory" },
    { id: "situation_ai", label: "AI Analysis" },
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Resource & Inventory Hub</h1>
          <p>Resource tracking, shelter monitoring, inventory control & AI analysis</p>
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
                <StatCard icon="🧠" label="AI Agent" value="Ready" sub="Situation Analysis" color="purple" />
              </div>

              <div className="grid-3 anim-stagger">
                {/* Inventory Quick View */}
                <div className="card anim-slide-up">
                  <div className="card-header">
                    <span className="card-title">📋 Inventory Summary</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab("inventory")}>Manage →</button>
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
                    <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab("shelters")}>Manage →</button>
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

          {/* SHELTERS TAB */}
          {activeTab === "shelters" && (
            <>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                <button className="btn btn-primary" onClick={() => setShowShelterModal(true)}>+ Add Shelter</button>
              </div>
              <div className="grid-3 anim-stagger">
                {shelters.map((s) => {
                  const occupancyPct = Math.round((s.currentOccupancy / s.totalCapacity) * 100) || 0;
                  return (
                    <div key={s.id} className="card anim-slide-up" style={{ borderLeft: `3px solid ${s.status === "Full" ? "var(--red)" : s.status === "Active" ? "var(--green)" : "var(--text-dim)"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <div style={{ fontWeight: "700", fontSize: "15px" }}>{s.name}</div>
                        <StatusBadge status={s.status} size="sm" />
                      </div>
                      <div className="text-muted" style={{ fontSize: "12px", marginBottom: "4px" }}>📍 {s.location || "—"}</div>
                      <div className="text-muted" style={{ fontSize: "12px", marginBottom: "14px" }}>📞 {s.contactNumber || "—"}</div>
                      <div style={{ marginBottom: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                          <span className="text-muted">Occupancy</span>
                          <span className="font-mono" style={{ fontWeight: "700" }}>{s.currentOccupancy} / {s.totalCapacity} ({occupancyPct}%)</span>
                        </div>
                        <div className="progress-bar" style={{ height: "8px" }}>
                          <div className={`progress-fill ${occupancyPct >= 90 ? "red" : occupancyPct >= 70 ? "amber" : "green"}`} style={{ width: `${Math.min(occupancyPct, 100)}%` }} />
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "10px", borderTop: "1px solid var(--border-subtle)" }}>
                        <span className="text-dim" style={{ fontSize: "11px" }}>Headcount:</span>
                        <input
                          type="number"
                          defaultValue={s.currentOccupancy}
                          onBlur={(e) => handleOccupancyUpdate(s.id, e.target.value)}
                          className="form-control"
                          style={{ width: "70px", padding: "5px 8px", fontSize: "12px" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* INVENTORY TAB */}
          {activeTab === "inventory" && (
            <div className="card anim-slide-up" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "15px" }}>Inventory & Medical Supplies</div>
                  <div className="text-dim" style={{ fontSize: "12px" }}>Track stock levels, thresholds & low-stock alerts</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowInventoryModal(true)}>+ Add Item</button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Threshold</th>
                      <th>Status</th>
                      <th>Adjust</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => (
                      <tr key={item.id}>
                        <td>#{item.id}</td>
                        <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{item.itemName}</td>
                        <td>{item.category}</td>
                        <td className="font-mono" style={{ fontWeight: "700" }}>{item.quantity} {item.unitOfMeasure}</td>
                        <td className="font-mono text-dim">{item.minimumThreshold} {item.unitOfMeasure}</td>
                        <td><StatusBadge status={item.status} /></td>
                        <td>
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button className="btn btn-success btn-sm" onClick={() => handleAdjustStock(item.id, 10)}>+10</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleAdjustStock(item.id, -10)}>-10</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SITUATION ANALYSIS TAB */}
          {activeTab === "situation_ai" && (
            <div className="card anim-slide-up">
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "var(--radius-md)", background: "var(--purple-glow)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>🧠</div>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "17px" }}>Situation Analysis Agent</div>
                  <div className="text-dim" style={{ fontSize: "12px" }}>AI-powered urgency scoring & resource gap analysis</div>
                </div>
              </div>

              <form onSubmit={handleRunAiAssessment} style={{ display: "flex", gap: "10px", padding: "16px", background: "var(--bg-base)", borderRadius: "var(--radius-md)", border: "1px solid var(--purple-dim)", marginBottom: "24px" }}>
                <input
                  type="number"
                  placeholder="Incident ID"
                  value={incidentId}
                  onChange={(e) => setIncidentId(e.target.value)}
                  className="form-control"
                  style={{ width: "140px" }}
                  required
                />
                <button type="submit" className="btn btn-purple" disabled={aiLoading}>
                  {aiLoading ? "Analyzing..." : "Run Analysis"}
                </button>
              </form>

              {aiError && (
                <div className="alert alert-error" style={{ marginBottom: "20px" }}>
                  {aiError}
                </div>
              )}

              {assessment && (
                <div className="anim-slide-up" style={{ border: "1px solid var(--purple-dim)", borderRadius: "var(--radius-lg)", padding: "24px", background: "var(--bg-base)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ fontWeight: "700", fontSize: "16px" }}>
                      Assessment #{assessment.id} — Incident #{assessment.incidentId}
                    </div>
                    <StatusBadge status={assessment.urgencyLevel} size="lg" />
                  </div>

                  <div style={{ padding: "14px", background: "var(--bg-surface)", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--purple)", marginBottom: "20px", fontSize: "13px", lineHeight: "1.6" }}>
                    <strong className="text-accent">Analysis Summary: </strong>
                    <span className="text-muted">{assessment.analysisSummary}</span>
                  </div>

                  <div className="grid-2 anim-stagger" style={{ marginBottom: "20px" }}>
                    <div className="card" style={{ padding: "14px" }}>
                      <div className="text-dim" style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>Recommended Assets</div>
                      <div style={{ fontWeight: "700", color: "var(--cyan)", fontSize: "15px" }}>{assessment.recommendedResourceTypes}</div>
                    </div>
                    <div className="card" style={{ padding: "14px" }}>
                      <div className="text-dim" style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>Nearest Shelter Match</div>
                      <div style={{ fontWeight: "700", color: "var(--green)", fontSize: "15px" }}>
                        {assessment.nearestShelterName || "None"} (Cap: {assessment.availableShelterCapacity})
                      </div>
                    </div>
                  </div>

                  <div className="text-accent" style={{ fontWeight: "700", fontSize: "14px", marginBottom: "10px" }}>Resource Deficiency Breakdown</div>
                  <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Available</th>
                          <th>Recommended</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assessment.resourceDeficiencies?.map((d, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{d.category}</td>
                            <td className="font-mono">{d.available}</td>
                            <td className="font-mono">{d.recommended}</td>
                            <td>
                              <span style={{ fontWeight: "700", color: d.isDeficit ? "var(--red)" : "var(--green)", fontSize: "12px" }}>
                                {d.isDeficit ? "DEFICIT" : "ADEQUATE"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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

      <Modal isOpen={showShelterModal} onClose={() => setShowShelterModal(false)} title="Add Shelter" subtitle="Register a new evacuation shelter">
        <form onSubmit={handleCreateShelter}>
          <FormField label="Shelter Name" required>
            <input className="form-control" placeholder="e.g. Central School Shelter" value={newShelter.name} onChange={(e) => setNewShelter({ ...newShelter, name: e.target.value })} required />
          </FormField>
          <FormRow>
            <FormField label="Location">
              <input className="form-control" placeholder="District" value={newShelter.location} onChange={(e) => setNewShelter({ ...newShelter, location: e.target.value })} />
            </FormField>
            <FormField label="Max Capacity">
              <input className="form-control" type="number" value={newShelter.totalCapacity} onChange={(e) => setNewShelter({ ...newShelter, totalCapacity: parseInt(e.target.value) || 0 })} />
            </FormField>
          </FormRow>
          <FormField label="Contact Number">
            <input className="form-control" placeholder="Hotline" value={newShelter.contactNumber} onChange={(e) => setNewShelter({ ...newShelter, contactNumber: e.target.value })} />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowShelterModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-success">Add Shelter</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showInventoryModal} onClose={() => setShowInventoryModal(false)} title="Add Inventory Item" subtitle="Register a new supply item">
        <form onSubmit={handleCreateItem}>
          <FormField label="Item Name" required>
            <input className="form-control" placeholder="e.g. Trauma Dressing" value={newItem.itemName} onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })} required />
          </FormField>
          <FormRow>
            <FormField label="Category">
              <select className="form-select" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>
                <option value="Medical">Medical</option>
                <option value="Food">Food</option>
                <option value="Water">Water</option>
                <option value="ShelterSupplies">Shelter Supplies</option>
                <option value="Power">Power & Fuel</option>
              </select>
            </FormField>
            <FormField label="Quantity">
              <input className="form-control" type="number" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })} />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Unit">
              <input className="form-control" placeholder="e.g. Kits" value={newItem.unitOfMeasure} onChange={(e) => setNewItem({ ...newItem, unitOfMeasure: e.target.value })} />
            </FormField>
            <FormField label="Min Threshold">
              <input className="form-control" type="number" value={newItem.minimumThreshold} onChange={(e) => setNewItem({ ...newItem, minimumThreshold: parseInt(e.target.value) || 0 })} />
            </FormField>
          </FormRow>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowInventoryModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Item</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
