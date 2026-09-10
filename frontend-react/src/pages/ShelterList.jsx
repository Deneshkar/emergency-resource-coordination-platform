import React, { useEffect, useState } from "react";
import { getShelters, createShelter, updateShelterOccupancy } from "../services/resourceService";

export default function ShelterList() {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newShelter, setNewShelter] = useState({ name: "", location: "", address: "", totalCapacity: 100, contactNumber: "" });

  const fetchShelters = async () => {
    try {
      setLoading(true);
      const data = await getShelters();
      setShelters(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelters();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newShelter.name) return;
    await createShelter(newShelter);
    setNewShelter({ name: "", location: "", address: "", totalCapacity: 100, contactNumber: "" });
    fetchShelters();
  };

  const handleOccupancyUpdate = async (id, occupancy) => {
    await updateShelterOccupancy(id, parseInt(occupancy) || 0);
    fetchShelters();
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>🏠 Evacuation Shelter Management</h2>
      <p style={{ color: "#666" }}>Monitor shelter capacities, occupancies, and availability status.</p>

      <form onSubmit={handleCreate} style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", background: "#f5f5f5", padding: "15px", borderRadius: "8px" }}>
        <input
          type="text"
          placeholder="Shelter Name"
          value={newShelter.name}
          onChange={(e) => setNewShelter({ ...newShelter, name: e.target.value })}
          style={{ flex: 1, padding: "8px" }}
          required
        />
        <input
          type="text"
          placeholder="Location"
          value={newShelter.location}
          onChange={(e) => setNewShelter({ ...newShelter, location: e.target.value })}
          style={{ padding: "8px" }}
        />
        <input
          type="number"
          placeholder="Capacity"
          value={newShelter.totalCapacity}
          onChange={(e) => setNewShelter({ ...newShelter, totalCapacity: parseInt(e.target.value) || 0 })}
          style={{ width: "90px", padding: "8px" }}
        />
        <input
          type="text"
          placeholder="Contact No"
          value={newShelter.contactNumber}
          onChange={(e) => setNewShelter({ ...newShelter, contactNumber: e.target.value })}
          style={{ padding: "8px" }}
        />
        <button type="submit" style={{ padding: "8px 16px", background: "#28a745", color: "#fff", border: "none", borderRadius: "4px" }}>
          Add Shelter
        </button>
      </form>

      {loading ? (
        <p>Loading shelters...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {shelters.map((s) => {
            const occupancyPct = Math.round((s.currentOccupancy / s.totalCapacity) * 100) || 0;
            return (
              <div key={s.id} style={{ border: "1px solid #ccc", padding: "16px", borderRadius: "8px", background: "#fff" }}>
                <h3>{s.name}</h3>
                <p style={{ margin: "4px 0", color: "#555" }}>📍 {s.location || s.address || "Location N/A"}</p>
                <p style={{ margin: "4px 0", color: "#555" }}>📞 {s.contactNumber || "No Contact"}</p>

                <div style={{ margin: "12px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "4px" }}>
                    <span>Occupancy: {s.currentOccupancy} / {s.totalCapacity}</span>
                    <span style={{ fontWeight: "bold" }}>{occupancyPct}%</span>
                  </div>
                  <div style={{ width: "100%", height: "10px", background: "#e0e0e0", borderRadius: "5px", overflow: "hidden" }}>
                    <div style={{ width: `${occupancyPct}%`, height: "100%", background: occupancyPct >= 100 ? "#dc3545" : occupancyPct >= 80 ? "#ffc107" : "#28a745" }} />
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px" }}>
                  <span style={{ fontSize: "12px" }}>Update Occupancy:</span>
                  <input
                    type="number"
                    defaultValue={s.currentOccupancy}
                    onBlur={(e) => handleOccupancyUpdate(s.id, e.target.value)}
                    style={{ width: "70px", padding: "4px" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
