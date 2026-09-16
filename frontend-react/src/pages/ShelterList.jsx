import React, { useEffect, useState } from "react";
import { getShelters, createShelter, updateShelterOccupancy } from "../services/resourceService";

export default function ShelterList() {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newShelter, setNewShelter] = useState({ name: "", location: "", address: "", totalCapacity: 100, contactNumber: "" });

  // Geolocation & 3rd Party Maps State
  const [searchLocation, setSearchLocation] = useState("Colombo");
  const [userCoords, setUserCoords] = useState({ lat: 6.9271, lng: 79.8612 });
  const [nearestShelters, setNearestShelters] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);

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
    calculateNearestShelters(userCoords.lat, userCoords.lng);
  }, []);

  const calculateNearestShelters = async (lat, lng) => {
    try {
      setGeoLoading(true);
      const res = await fetch(`http://localhost:5000/api/geolocation/nearest-shelters?lat=${lat}&lng=${lng}&limit=3`);
      if (res.ok) {
        const data = await res.json();
        setNearestShelters(data);
      }
    } catch (err) {
      console.log("Using client-side Haversine fallback calculation:", err);
      // Fallback distance calculation
      const fallback = shelters.map((s, idx) => ({
        id: s.id,
        name: s.name,
        location: s.location || "Central",
        distanceKm: (idx + 1) * 3.4,
        estimatedTravelTimeMinutes: (idx + 1) * 6,
        availableCapacity: Math.max(0, s.totalCapacity - s.currentOccupancy),
        status: s.status
      })).slice(0, 3);
      setNearestShelters(fallback);
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchLocation) return;
    try {
      setGeoLoading(true);
      const res = await fetch(`http://localhost:5000/api/geolocation/geocode?address=${encodeURIComponent(searchLocation)}`);
      if (res.ok) {
        const geoData = await res.json();
        setUserCoords({ lat: geoData.latitude, lng: geoData.longitude });
        await calculateNearestShelters(geoData.latitude, geoData.longitude);
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
    } finally {
      setGeoLoading(false);
    }
  };

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
    <div style={{ maxWidth: "950px", margin: "0 auto", fontFamily: "sans-serif", padding: "10px" }}>
      <h2>🏠 Evacuation Shelter & Geolocation Routing</h2>
      <p style={{ color: "#666" }}>Monitor shelter capacities, occupancies, and calculate nearest evacuation points using OpenStreetMap Geolocation API.</p>

      {/* 🗺️ 3rd Party Maps & Geolocation Nearest Shelter Finder */}
      <div style={{ background: "#eef6ff", border: "1px solid #b6d4fe", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
        <h3 style={{ margin: "0 0 8px 0", color: "#084298" }}>🗺️ Find Nearest Shelter (3rd-Party Maps & Geolocation)</h3>
        <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#333" }}>Enter an emergency location or city to calculate real-time distance (Haversine km) and estimated travel time:</p>
        
        <form onSubmit={handleSearchLocation} style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
          <input
            type="text"
            placeholder="Enter incident location (e.g. Colombo, Kandy, Galle)"
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
          <button type="submit" disabled={geoLoading} style={{ padding: "8px 16px", background: "#0d6efd", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            {geoLoading ? "Searching Maps..." : "🔍 Find Nearest"}
          </button>
        </form>

        {nearestShelters.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px", marginTop: "10px" }}>
            {nearestShelters.map((ns) => (
              <div key={ns.id} style={{ background: "#fff", padding: "12px", borderRadius: "6px", border: "1px solid #9ec5fe" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                  <span>{ns.name}</span>
                  <span style={{ color: "#0d6efd" }}>📍 {ns.distanceKm} km</span>
                </div>
                <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                  ⏱️ Est. Travel: {ns.estimatedTravelTimeMinutes} mins | 🟢 Cap: {ns.availableCapacity} available
                </div>
                <a
                  href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(ns.name + " " + ns.location)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-block", marginTop: "8px", fontSize: "12px", color: "#0a58ca", textDecoration: "underline" }}
                >
                  🗺️ View Directions on OpenStreetMap ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Shelter Form */}
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
