import React, { useEffect, useState } from "react";
import {
  getResources,
  createResource,
  updateResourceStatus,
  getShelters,
  createShelter,
  updateShelterOccupancy,
  getInventory,
  createInventoryItem,
  adjustStock,
  assessSituation,
} from "../services/resourceService";

export default function ResourceInventoryHub() {
  const [activeTab, setActiveTab] = useState("overview");

  // Data states
  const [resources, setResources] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newResource, setNewResource] = useState({ name: "", resourceType: "Vehicle", capacity: 1, location: "" });
  const [newShelter, setNewShelter] = useState({ name: "", location: "", address: "", totalCapacity: 100, contactNumber: "" });
  const [newItem, setNewItem] = useState({ itemName: "", category: "Medical", quantity: 50, unitOfMeasure: "Kits", minimumThreshold: 10, location: "" });

  // AI Agent states
  const [incidentId, setIncidentId] = useState("1");
  const [assessment, setAssessment] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [resData, shelterData, invData] = await Promise.all([
        getResources(),
        getShelters(),
        getInventory(),
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

  useEffect(() => {
    fetchAllData();
  }, []);

  // Resource handlers
  const handleCreateResource = async (e) => {
    e.preventDefault();
    if (!newResource.name) return;
    await createResource(newResource);
    setNewResource({ name: "", resourceType: "Vehicle", capacity: 1, location: "" });
    fetchAllData();
  };

  const handleStatusChange = async (id, status) => {
    await updateResourceStatus(id, status);
    fetchAllData();
  };

  // Shelter handlers
  const handleCreateShelter = async (e) => {
    e.preventDefault();
    if (!newShelter.name) return;
    await createShelter(newShelter);
    setNewShelter({ name: "", location: "", address: "", totalCapacity: 100, contactNumber: "" });
    fetchAllData();
  };

  const handleOccupancyUpdate = async (id, occupancy) => {
    await updateShelterOccupancy(id, parseInt(occupancy) || 0);
    fetchAllData();
  };

  // Inventory handlers
  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!newItem.itemName) return;
    await createInventoryItem(newItem);
    setNewItem({ itemName: "", category: "Medical", quantity: 50, unitOfMeasure: "Kits", minimumThreshold: 10, location: "" });
    fetchAllData();
  };

  const handleAdjustStock = async (id, delta) => {
    await adjustStock(id, delta);
    fetchAllData();
  };

  // AI Agent handler
  const handleRunAiAssessment = async (e) => {
    e.preventDefault();
    if (!incidentId) return;
    try {
      setAiLoading(true);
      setAiError("");
      const result = await assessSituation(incidentId);
      setAssessment(result);
    } catch (err) {
      setAiError(err.response?.data?.message || "Failed to execute Situation Analysis Agent.");
    } finally {
      setAiLoading(false);
    }
  };

  // Stats calculation
  const totalAvailableVehicles = resources.filter((r) => r.status === "Available").length;
  const lowStockCount = inventory.filter((i) => i.status === "LowStock" || i.status === "OutOfStock").length;
  const totalCapacitySum = shelters.reduce((sum, s) => sum + s.totalCapacity, 0);
  const totalOccupancySum = shelters.reduce((sum, s) => sum + s.currentOccupancy, 0);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#0f172a", maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px" }}>
      
      {/* Light Theme Command Suite Header */}
      <div style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)",
        color: "#0f172a",
        borderRadius: "16px",
        padding: "28px 32px",
        marginBottom: "24px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>
              <span>🛡️ Student 2 Command Suite</span>
            </div>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px", color: "#0f172a" }}>
              Resource, Shelter & Inventory Management Hub
            </h1>
            <p style={{ margin: "6px 0 0 0", color: "#475569", fontSize: "14px" }}>
              Real-time resource tracking, shelter capacity control, inventory monitoring & AI Situation Analysis.
            </p>
          </div>

          <button
            onClick={fetchAllData}
            style={{
              background: "#ffffff",
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              padding: "10px 18px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              transition: "all 0.2s",
            }}
          >
            🔄 Refresh Data
          </button>
        </div>

        {/* Light Theme Executive Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginTop: "24px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>Available Vehicles & Assets</span>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0284c7", marginTop: "4px" }}>
              {totalAvailableVehicles} <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "500" }}>/ {resources.length} total</span>
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>Shelter Occupancy Rate</span>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#16a34a", marginTop: "4px" }}>
              {totalCapacitySum > 0 ? Math.round((totalOccupancySum / totalCapacitySum) * 100) : 0}%
              <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "500" }}> ({totalOccupancySum}/{totalCapacitySum})</span>
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>Low Stock Alerts</span>
            <div style={{ fontSize: "28px", fontWeight: "800", color: lowStockCount > 0 ? "#dc2626" : "#16a34a", marginTop: "4px" }}>
              {lowStockCount} <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "500" }}>items need restock</span>
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>AI Agent Status</span>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#7c3aed", marginTop: "6px" }}>
              🤖 Situation Assessor
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Tab Navigation */}
      <div style={{ display: "flex", gap: "8px", background: "#f1f5f9", padding: "6px", borderRadius: "12px", marginBottom: "24px", overflowX: "auto", border: "1px solid #e2e8f0" }}>
        {[
          { id: "overview", label: "📊 Overview Hub", color: "#2563eb" },
          { id: "inventory", label: "📦 Inventory Supplies", color: "#0891b2" },
          { id: "resources", label: "🚛 Vehicle & Resource Fleet", color: "#0284c7" },
          { id: "shelters", label: "🏠 Shelter Monitoring", color: "#16a34a" },
          { id: "situation_ai", label: "🤖 Situation Analysis Agent", color: "#9333ea" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "12px 18px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: isActive ? "700" : "500",
                fontSize: "14px",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
                background: isActive ? "#ffffff" : "transparent",
                color: isActive ? tab.color : "#64748b",
                boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW HUB */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
          {/* Quick Inventory Summary */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>📦 Inventory Quick View</h3>
              <button onClick={() => setActiveTab("inventory")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}>Manage →</button>
            </div>
            {inventory.slice(0, 4).map((i) => (
              <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "14px" }}>{i.itemName}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>{i.category}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: "700", fontSize: "14px" }}>{i.quantity} {i.unitOfMeasure}</div>
                  <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "10px", color: "#fff", background: i.status === "InStock" ? "#16a34a" : i.status === "LowStock" ? "#d97706" : "#dc2626" }}>
                    {i.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Resource Summary */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>🚛 Resource Fleet Readiness</h3>
              <button onClick={() => setActiveTab("resources")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}>Manage →</button>
            </div>
            {resources.slice(0, 4).map((r) => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "14px" }}>{r.name}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>{r.resourceType} • {r.location || "Central Base"}</div>
                </div>
                <span style={{ fontSize: "12px", fontWeight: "600", padding: "4px 10px", borderRadius: "12px", color: "#fff", background: r.status === "Available" ? "#16a34a" : r.status === "Dispatched" ? "#d97706" : "#475569" }}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Shelter Summary */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>🏠 Shelter Capacity Overview</h3>
              <button onClick={() => setActiveTab("shelters")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}>Manage →</button>
            </div>
            {shelters.slice(0, 3).map((s) => {
              const pct = Math.round((s.currentOccupancy / s.totalCapacity) * 100) || 0;
              return (
                <div key={s.id} style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                    <span>{s.name}</span>
                    <span>{s.currentOccupancy}/{s.totalCapacity} ({pct}%)</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? "#dc2626" : pct >= 80 ? "#d97706" : "#16a34a" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY SUPPLIES */}
      {activeTab === "inventory" && (
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <h2 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "700" }}>📦 Inventory & Medical Supplies Management</h2>
          <p style={{ margin: "0 0 20px 0", color: "#64748b", fontSize: "14px" }}>Track medical kits, rations, threshold safety buffers, and trigger stock alerts.</p>

          <form onSubmit={handleCreateItem} style={{ display: "flex", gap: "10px", flexWrap: "wrap", background: "#f8fafc", padding: "16px", borderRadius: "10px", marginBottom: "20px", border: "1px solid #e2e8f0" }}>
            <input
              type="text"
              placeholder="Item Name (e.g. Trauma Dressing)"
              value={newItem.itemName}
              onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
              style={{ flex: "2 min(200px)", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
              required
            />
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              style={{ padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
            >
              <option value="Medical">Medical</option>
              <option value="Food">Food</option>
              <option value="Water">Water</option>
              <option value="ShelterSupplies">Shelter Supplies</option>
              <option value="Power">Power & Fuel</option>
            </select>
            <input
              type="number"
              placeholder="Quantity"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
              style={{ width: "90px", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
            />
            <input
              type="text"
              placeholder="Unit (e.g. Kits)"
              value={newItem.unitOfMeasure}
              onChange={(e) => setNewItem({ ...newItem, unitOfMeasure: e.target.value })}
              style={{ width: "110px", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
            />
            <input
              type="number"
              placeholder="Min Threshold"
              value={newItem.minimumThreshold}
              onChange={(e) => setNewItem({ ...newItem, minimumThreshold: parseInt(e.target.value) || 0 })}
              style={{ width: "110px", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
            />
            <button type="submit" style={{ padding: "10px 20px", background: "#0891b2", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
              + Add Item
            </button>
          </form>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "12px" }}>ID</th>
                <th style={{ padding: "12px" }}>Item Name</th>
                <th style={{ padding: "12px" }}>Category</th>
                <th style={{ padding: "12px" }}>Stock Quantity</th>
                <th style={{ padding: "12px" }}>Threshold</th>
                <th style={{ padding: "12px" }}>Status</th>
                <th style={{ padding: "12px" }}>Quick Stock Adjust</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", color: "#64748b" }}>#{item.id}</td>
                  <td style={{ padding: "12px", fontWeight: "600" }}>{item.itemName}</td>
                  <td style={{ padding: "12px" }}>{item.category}</td>
                  <td style={{ padding: "12px", fontWeight: "700" }}>{item.quantity} {item.unitOfMeasure}</td>
                  <td style={{ padding: "12px", color: "#64748b" }}>{item.minimumThreshold} {item.unitOfMeasure}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", color: "#fff",
                      background: item.status === "InStock" ? "#16a34a" : item.status === "LowStock" ? "#d97706" : "#dc2626"
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <button onClick={() => handleAdjustStock(item.id, 10)} style={{ marginRight: "6px", padding: "6px 12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "600", cursor: "pointer" }}>+10</button>
                    <button onClick={() => handleAdjustStock(item.id, -10)} style={{ padding: "6px 12px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "600", cursor: "pointer" }}>-10</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: VEHICLE & RESOURCE FLEET */}
      {activeTab === "resources" && (
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <h2 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "700" }}>🚛 Resource & Vehicle Fleet Management</h2>
          <p style={{ margin: "0 0 20px 0", color: "#64748b", fontSize: "14px" }}>Manage transport units, ambulances, rescue rigs, and operational readiness.</p>

          <form onSubmit={handleCreateResource} style={{ display: "flex", gap: "10px", flexWrap: "wrap", background: "#f8fafc", padding: "16px", borderRadius: "10px", marginBottom: "20px", border: "1px solid #e2e8f0" }}>
            <input
              type="text"
              placeholder="Resource Name (e.g. Ambulance Unit 2)"
              value={newResource.name}
              onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
              style={{ flex: "2 min(200px)", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
              required
            />
            <select
              value={newResource.resourceType}
              onChange={(e) => setNewResource({ ...newResource, resourceType: e.target.value })}
              style={{ padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
            >
              <option value="Vehicle">Vehicle</option>
              <option value="MedicalEquipment">Medical Equipment</option>
              <option value="Generator">Generator</option>
              <option value="FoodSupply">Food Supply</option>
            </select>
            <input
              type="number"
              placeholder="Capacity"
              value={newResource.capacity}
              onChange={(e) => setNewResource({ ...newResource, capacity: parseInt(e.target.value) || 1 })}
              style={{ width: "90px", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
            />
            <input
              type="text"
              placeholder="Base Location"
              value={newResource.location}
              onChange={(e) => setNewResource({ ...newResource, location: e.target.value })}
              style={{ flex: "1 min(150px)", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
            />
            <button type="submit" style={{ padding: "10px 20px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
              + Add Resource
            </button>
          </form>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "12px" }}>ID</th>
                <th style={{ padding: "12px" }}>Name</th>
                <th style={{ padding: "12px" }}>Type</th>
                <th style={{ padding: "12px" }}>Status</th>
                <th style={{ padding: "12px" }}>Capacity</th>
                <th style={{ padding: "12px" }}>Location</th>
                <th style={{ padding: "12px" }}>Toggle Readiness</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", color: "#64748b" }}>#{r.id}</td>
                  <td style={{ padding: "12px", fontWeight: "600" }}>{r.name}</td>
                  <td style={{ padding: "12px" }}>{r.resourceType}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", color: "#fff",
                      background: r.status === "Available" ? "#16a34a" : r.status === "Dispatched" ? "#d97706" : "#dc2626"
                    }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>{r.capacity}</td>
                  <td style={{ padding: "12px", color: "#64748b" }}>{r.location || "N/A"}</td>
                  <td style={{ padding: "12px" }}>
                    <select
                      value={r.status}
                      onChange={(e) => handleStatusChange(r.id, e.target.value)}
                      style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    >
                      <option value="Available">Available</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Reserved">Reserved</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: SHELTER MONITORING */}
      {activeTab === "shelters" && (
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <h2 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "700" }}>🏠 Evacuation Shelter & Capacity Control</h2>
          <p style={{ margin: "0 0 20px 0", color: "#64748b", fontSize: "14px" }}>Monitor active shelter occupancies, available slots, and update real-time headcount.</p>

          <form onSubmit={handleCreateShelter} style={{ display: "flex", gap: "10px", flexWrap: "wrap", background: "#f8fafc", padding: "16px", borderRadius: "10px", marginBottom: "24px", border: "1px solid #e2e8f0" }}>
            <input
              type="text"
              placeholder="Shelter Name"
              value={newShelter.name}
              onChange={(e) => setNewShelter({ ...newShelter, name: e.target.value })}
              style={{ flex: "2 min(200px)", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
              required
            />
            <input
              type="text"
              placeholder="Location District"
              value={newShelter.location}
              onChange={(e) => setNewShelter({ ...newShelter, location: e.target.value })}
              style={{ flex: "1 min(150px)", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
            />
            <input
              type="number"
              placeholder="Max Capacity"
              value={newShelter.totalCapacity}
              onChange={(e) => setNewShelter({ ...newShelter, totalCapacity: parseInt(e.target.value) || 0 })}
              style={{ width: "120px", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
            />
            <input
              type="text"
              placeholder="Hotline / Contact"
              value={newShelter.contactNumber}
              onChange={(e) => setNewShelter({ ...newShelter, contactNumber: e.target.value })}
              style={{ width: "140px", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
            />
            <button type="submit" style={{ padding: "10px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
              + Add Shelter
            </button>
          </form>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {shelters.map((s) => {
              const occupancyPct = Math.round((s.currentOccupancy / s.totalCapacity) * 100) || 0;
              return (
                <div key={s.id} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", background: "#ffffff", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>{s.name}</h3>
                    <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 8px", borderRadius: "10px", color: "#fff", background: s.status === "Active" ? "#16a34a" : "#dc2626" }}>
                      {s.status}
                    </span>
                  </div>

                  <p style={{ margin: "4px 0", fontSize: "13px", color: "#64748b" }}>📍 Location: {s.location || "N/A"}</p>
                  <p style={{ margin: "4px 0", fontSize: "13px", color: "#64748b" }}>📞 Contact: {s.contactNumber || "N/A"}</p>

                  <div style={{ margin: "16px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                      <span>Occupancy Headcount</span>
                      <span>{s.currentOccupancy} / {s.totalCapacity} ({occupancyPct}%)</span>
                    </div>
                    <div style={{ width: "100%", height: "10px", background: "#f1f5f9", borderRadius: "5px", overflow: "hidden" }}>
                      <div style={{ width: `${occupancyPct}%`, height: "100%", background: occupancyPct >= 100 ? "#dc2626" : occupancyPct >= 80 ? "#d97706" : "#16a34a", transition: "width 0.3s" }} />
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Set Headcount:</span>
                    <input
                      type="number"
                      defaultValue={s.currentOccupancy}
                      onBlur={(e) => handleOccupancyUpdate(s.id, e.target.value)}
                      style={{ width: "80px", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "4px" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: SITUATION ANALYSIS AGENT */}
      {activeTab === "situation_ai" && (
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <div style={{ background: "#f3e8ff", color: "#9333ea", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🤖</div>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>Situation Analysis Agent</h2>
              <span style={{ fontSize: "13px", color: "#64748b" }}>Distinct AI Agent (Student 2) • Urgency Scoring & Inventory Gap Analysis</span>
            </div>
          </div>

          <form onSubmit={handleRunAiAssessment} style={{ display: "flex", gap: "12px", background: "#faf5ff", padding: "18px", borderRadius: "12px", border: "1px solid #e9d5ff", marginBottom: "24px" }}>
            <input
              type="number"
              placeholder="Incident ID (e.g. 1)"
              value={incidentId}
              onChange={(e) => setIncidentId(e.target.value)}
              style={{ width: "160px", padding: "10px", border: "1px solid #c084fc", borderRadius: "6px" }}
              required
            />
            <button type="submit" style={{ padding: "10px 24px", background: "#9333ea", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer" }}>
              {aiLoading ? "Evaluating Situation..." : "Execute AI Agent Assessment"}
            </button>
          </form>

          {aiError && <div style={{ color: "#dc2626", background: "#fef2f2", padding: "12px", borderRadius: "8px", marginBottom: "20px" }}>{aiError}</div>}

          {assessment && (
            <div style={{ border: "2px solid #c084fc", borderRadius: "12px", padding: "24px", background: "#faf5ff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, color: "#6b21a8" }}>Assessment Output #{assessment.id} — Incident #{assessment.incidentId}</h3>
                <span style={{ padding: "6px 14px", borderRadius: "20px", color: "#fff", fontWeight: "700", fontSize: "14px", background: assessment.urgencyLevel === "Critical" ? "#dc2626" : assessment.urgencyLevel === "High" ? "#ea580c" : "#16a34a" }}>
                  Urgency: {assessment.urgencyLevel} ({assessment.urgencyScore}/100)
                </span>
              </div>

              <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #9333ea", marginBottom: "20px" }}>
                <strong style={{ color: "#6b21a8" }}>Agent Summary:</strong> {assessment.analysisSummary}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e9d5ff" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>RECOMMENDED ASSETS</span>
                  <div style={{ fontWeight: "700", color: "#0284c7", fontSize: "16px", marginTop: "4px" }}>{assessment.recommendedResourceTypes}</div>
                </div>
                <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e9d5ff" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>NEAREST SHELTER MATCH</span>
                  <div style={{ fontWeight: "700", color: "#16a34a", fontSize: "16px", marginTop: "4px" }}>
                    {assessment.nearestShelterName || "No active shelter"} (Avail: {assessment.availableShelterCapacity})
                  </div>
                </div>
              </div>

              <h4 style={{ margin: "0 0 12px 0", color: "#6b21a8" }}>Resource Deficiency Breakdown</h4>
              <table style={{ width: "100%", borderCollapse: "collapse", background: "#ffffff", borderRadius: "8px", overflow: "hidden" }}>
                <thead>
                  <tr style={{ background: "#f3e8ff", textAlign: "left" }}>
                    <th style={{ padding: "10px" }}>Category</th>
                    <th style={{ padding: "10px" }}>Available</th>
                    <th style={{ padding: "10px" }}>Recommended</th>
                    <th style={{ padding: "10px" }}>Deficiency Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assessment.resourceDeficiencies?.map((d, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f3e8ff" }}>
                      <td style={{ padding: "10px", fontWeight: "600" }}>{d.category}</td>
                      <td style={{ padding: "10px" }}>{d.available}</td>
                      <td style={{ padding: "10px" }}>{d.recommended}</td>
                      <td style={{ padding: "10px" }}>
                        <span style={{ color: d.isDeficit ? "#dc2626" : "#16a34a", fontWeight: "700" }}>
                          {d.isDeficit ? "⚠️ DEFICIT DETECTED" : "✅ ADEQUATE"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
