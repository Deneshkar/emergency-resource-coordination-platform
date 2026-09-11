import React, { useEffect, useState } from "react";
import { getResources, createResource, updateResourceStatus } from "../services/resourceService";

export default function ResourceList() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newResource, setNewResource] = useState({ name: "", resourceType: "Vehicle", capacity: 1, location: "" });

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await getResources();
      setResources(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newResource.name) return;
    await createResource(newResource);
    setNewResource({ name: "", resourceType: "Vehicle", capacity: 1, location: "" });
    fetchResources();
  };

  const handleStatusChange = async (id, status) => {
    await updateResourceStatus(id, status);
    fetchResources();
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>🚛 Resource & Vehicle Fleet Management</h2>
      <p style={{ color: "#666" }}>Track equipment, generators, vehicles, and operational readiness.</p>

      <form onSubmit={handleCreate} style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", background: "#f5f5f5", padding: "15px", borderRadius: "8px" }}>
        <input
          type="text"
          placeholder="Resource Name (e.g. Rescue Van 1)"
          value={newResource.name}
          onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
          style={{ flex: 1, padding: "8px" }}
          required
        />
        <select
          value={newResource.resourceType}
          onChange={(e) => setNewResource({ ...newResource, resourceType: e.target.value })}
          style={{ padding: "8px" }}
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
          style={{ width: "80px", padding: "8px" }}
        />
        <input
          type="text"
          placeholder="Location"
          value={newResource.location}
          onChange={(e) => setNewResource({ ...newResource, location: e.target.value })}
          style={{ padding: "8px" }}
        />
        <button type="submit" style={{ padding: "8px 16px", background: "#007bff", color: "#fff", border: "none", borderRadius: "4px" }}>
          Add Resource
        </button>
      </form>

      {loading ? (
        <p>Loading resources...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#e9ecef", textAlign: "left" }}>
              <th style={{ padding: "10px" }}>ID</th>
              <th style={{ padding: "10px" }}>Name</th>
              <th style={{ padding: "10px" }}>Type</th>
              <th style={{ padding: "10px" }}>Status</th>
              <th style={{ padding: "10px" }}>Capacity</th>
              <th style={{ padding: "10px" }}>Location</th>
              <th style={{ padding: "10px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "10px" }}>#{r.id}</td>
                <td style={{ padding: "10px", fontWeight: "bold" }}>{r.name}</td>
                <td style={{ padding: "10px" }}>{r.resourceType}</td>
                <td style={{ padding: "10px" }}>
                  <span style={{
                    padding: "4px 8px", borderRadius: "4px", fontSize: "12px", color: "#fff",
                    background: r.status === "Available" ? "#28a745" : r.status === "Dispatched" ? "#ffc107" : "#dc3545"
                  }}>
                    {r.status}
                  </span>
                </td>
                <td style={{ padding: "10px" }}>{r.capacity}</td>
                <td style={{ padding: "10px" }}>{r.location || "N/A"}</td>
                <td style={{ padding: "10px" }}>
                  <select
                    value={r.status}
                    onChange={(e) => handleStatusChange(r.id, e.target.value)}
                    style={{ padding: "4px" }}
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
      )}
    </div>
  );
}
