import React, { useEffect, useState } from "react";
import { getShelters, createShelter, updateShelterOccupancy } from "../services/resourceService";
import StatusBadge from "../components/StatusBadge";
import Modal, { FormField, FormRow } from "../components/Modal";

export default function ShelterList() {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", address: "", totalCapacity: 100, contactNumber: "" });

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

  useEffect(() => { fetchShelters(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await createShelter(form);
    setForm({ name: "", location: "", address: "", totalCapacity: 100, contactNumber: "" });
    setShowModal(false);
    fetchShelters();
  };

  const handleOccupancyUpdate = async (id, occupancy) => {
    await updateShelterOccupancy(id, parseInt(occupancy) || 0);
    fetchShelters();
  };

  const totalCap = shelters.reduce((s, sh) => s + sh.totalCapacity, 0);
  const totalOcc = shelters.reduce((s, sh) => s + sh.currentOccupancy, 0);

  if (loading) return <div className="loading-spinner">Loading shelters...</div>;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Shelters</h1>
          <p>Evacuation shelter monitoring &amp; capacity control &mdash; {shelters.length} registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Shelter</button>
      </div>

      <div className="grid-stats" style={{ marginBottom: "24px" }}>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>Total Capacity</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--blue)", marginTop: "2px", fontFamily: "var(--font-mono)" }}>{totalCap}</div>
        </div>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>Currently Occupied</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--amber)", marginTop: "2px", fontFamily: "var(--font-mono)" }}>{totalOcc}</div>
        </div>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>Available Slots</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--green)", marginTop: "2px", fontFamily: "var(--font-mono)" }}>{totalCap - totalOcc}</div>
        </div>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>Full Shelters</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--red)", marginTop: "2px", fontFamily: "var(--font-mono)" }}>{shelters.filter(s => s.status === "Full").length}</div>
        </div>
      </div>

      <div className="grid-3">
        {shelters.length === 0 ? (
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="empty-state">
              <div className="empty-state-icon">🏠</div>
              <div className="empty-state-text">No shelters registered</div>
              <div className="empty-state-sub">Add a shelter to begin tracking capacity</div>
            </div>
          </div>
        ) : (
          shelters.map((s) => {
            const pct = Math.round((s.currentOccupancy / s.totalCapacity) * 100) || 0;
            return (
              <div key={s.id} className="card" style={{ borderLeft: `3px solid ${s.status === "Full" ? "var(--red)" : s.status === "Active" ? "var(--green)" : "var(--text-dim)"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{ fontWeight: "700", fontSize: "15px" }}>{s.name}</div>
                  <StatusBadge status={s.status} size="sm" />
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "3px" }}>📍 {s.location || "—"}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>📞 {s.contactNumber || "—"}</div>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Occupancy</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: "700" }}>{s.currentOccupancy} / {s.totalCapacity} ({pct}%)</span>
                  </div>
                  <div className="progress-bar" style={{ height: "8px" }}>
                    <div className={`progress-fill ${pct >= 90 ? "red" : pct >= 70 ? "amber" : "green"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "10px", borderTop: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Headcount:</span>
                  <input
                    type="number"
                    defaultValue={s.currentOccupancy}
                    onBlur={(e) => handleOccupancyUpdate(s.id, e.target.value)}
                    style={{ width: "70px", padding: "5px 8px", fontSize: "12px" }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Shelter" subtitle="Register a new evacuation shelter">
        <form onSubmit={handleCreate}>
          <FormField label="Shelter Name" required>
            <input placeholder="e.g. Central School Shelter" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </FormField>
          <FormRow>
            <FormField label="Location">
              <input placeholder="District" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </FormField>
            <FormField label="Max Capacity">
              <input type="number" value={form.totalCapacity} onChange={(e) => setForm({ ...form, totalCapacity: parseInt(e.target.value) || 0 })} />
            </FormField>
          </FormRow>
          <FormField label="Contact Number">
            <input placeholder="Hotline" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-success">Add Shelter</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
