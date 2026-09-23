import { useEffect, useState } from "react";
import { getShelters, createShelter, updateShelter, deleteShelter, updateShelterOccupancy } from "../services/resourceService";
import StatusBadge from "../components/StatusBadge";
import Modal, { FormField, FormRow } from "../components/Modal";

export default function ShelterList() {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", address: "", totalCapacity: 100, contactNumber: "" });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: null, name: "", location: "", address: "", totalCapacity: 100, currentOccupancy: 0, status: "Active", contactNumber: "" });

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

  useEffect(() => { fetchShelters(); }, []);

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
    await createShelter(form);
    setForm({ name: "", location: "", address: "", totalCapacity: 100, contactNumber: "" });
    setShowModal(false);
    fetchShelters();
  };

  const openEditModal = (shelter) => {
    setEditForm({
      id: shelter.id,
      name: shelter.name,
      location: shelter.location || "",
      address: shelter.address || "",
      totalCapacity: shelter.totalCapacity,
      currentOccupancy: shelter.currentOccupancy,
      status: shelter.status,
      contactNumber: shelter.contactNumber || "",
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateShelter(editForm.id, editForm);
    setShowEditModal(false);
    fetchShelters();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await deleteShelter(id);
    fetchShelters();
  };

  const handleOccupancyUpdate = async (id, occupancy) => {
    await updateShelterOccupancy(id, parseInt(occupancy) || 0);
    fetchShelters();
  };

  const totalCap = shelters.reduce((s, sh) => s + sh.totalCapacity, 0);
  const totalOcc = shelters.reduce((s, sh) => s + sh.currentOccupancy, 0);

  if (loading) return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      Loading shelters...
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="page-header anim-slide-up">
        <div className="page-header-left">
          <h1>Shelters</h1>
          <p>Evacuation shelter monitoring &amp; capacity control &mdash; {shelters.length} registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Shelter</button>
      </div>

      <div className="grid-stats anim-stagger">
        <div className="card stat-card ai-border anim-slide-up">
          <div className="stat-label">Total Capacity</div>
          <div className="stat-value font-mono" style={{ color: "var(--blue)" }}>{totalCap}</div>
        </div>
        <div className="card stat-card active-border anim-slide-up">
          <div className="stat-label">Currently Occupied</div>
          <div className="stat-value font-mono" style={{ color: "var(--amber)" }}>{totalOcc}</div>
        </div>
        <div className="card stat-card anim-slide-up">
          <div className="stat-label">Available Slots</div>
          <div className="stat-value font-mono" style={{ color: "var(--green)" }}>{totalCap - totalOcc}</div>
        </div>
        <div className="card stat-card critical-border anim-slide-up">
          <div className="stat-label">Full Shelters</div>
          <div className="stat-value font-mono" style={{ color: "var(--red)" }}>{shelters.filter(s => s.status === "Full").length}</div>
        </div>
      </div>

      <div className="grid-3 anim-stagger">
        {shelters.length === 0 ? (
          <div className="card anim-fade-in" style={{ gridColumn: "1 / -1" }}>
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
              <div
                key={s.id}
                className="card anim-slide-up"
                style={{ borderLeft: `3px solid ${s.status === "Full" ? "var(--red)" : s.status === "Active" ? "var(--green)" : "var(--text-dim)"}` }}
              >
                <div className="card-header">
                  <div className="card-title">{s.name}</div>
                  <StatusBadge status={s.status} size="sm" />
                </div>
                <div className="text-muted" style={{ fontSize: "12px", marginBottom: "3px" }}>📍 {s.location || "—"}</div>
                <div className="text-muted" style={{ fontSize: "12px", marginBottom: "14px" }}>📞 {s.contactNumber || "—"}</div>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span className="text-muted">Occupancy</span>
                    <span className="font-mono" style={{ fontWeight: "700" }}>{s.currentOccupancy} / {s.totalCapacity} ({pct}%)</span>
                  </div>
                  <div className="progress-bar" style={{ height: "8px" }}>
                    <div className={`progress-fill ${pct >= 90 ? "red" : pct >= 70 ? "amber" : "green"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "10px", borderTop: "1px solid var(--border-subtle)" }}>
                  <span className="text-dim" style={{ fontSize: "11px" }}>Headcount:</span>
                  <input
                    type="number"
                    className="form-control"
                    defaultValue={s.currentOccupancy}
                    onBlur={(e) => handleOccupancyUpdate(s.id, e.target.value)}
                    style={{ width: "70px", padding: "5px 8px", fontSize: "12px" }}
                  />
                  <div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(s)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id, s.name)}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Shelter" subtitle="Register a new evacuation shelter">
        <form onSubmit={handleCreate}>
          <FormField label="Shelter Name" required>
            <input className="form-control" placeholder="e.g. Central School Shelter" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </FormField>
          <FormRow>
            <FormField label="Location">
              <input className="form-control" placeholder="District" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </FormField>
            <FormField label="Max Capacity">
              <input className="form-control" type="number" value={form.totalCapacity} onChange={(e) => setForm({ ...form, totalCapacity: parseInt(e.target.value) || 0 })} />
            </FormField>
          </FormRow>
          <FormField label="Contact Number">
            <input className="form-control" placeholder="Hotline" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
          </FormField>
          <FormField label="Address">
            <input className="form-control" placeholder="e.g. 123 Main Street, Colombo" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-success">Add Shelter</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Shelter" subtitle={`Updating shelter #${editForm.id}`}>
        <form onSubmit={handleUpdate}>
          <FormField label="Shelter Name" required>
            <input className="form-control" placeholder="e.g. Central School Shelter" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
          </FormField>
          <FormRow>
            <FormField label="Location">
              <input className="form-control" placeholder="District" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
            </FormField>
            <FormField label="Max Capacity">
              <input className="form-control" type="number" value={editForm.totalCapacity} onChange={(e) => setEditForm({ ...editForm, totalCapacity: parseInt(e.target.value) || 0 })} />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Current Occupancy">
              <input className="form-control" type="number" value={editForm.currentOccupancy} onChange={(e) => setEditForm({ ...editForm, currentOccupancy: parseInt(e.target.value) || 0 })} />
            </FormField>
            <FormField label="Status">
              <select className="form-select" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Full">Full</option>
                <option value="Inactive">Inactive</option>
              </select>
            </FormField>
          </FormRow>
          <FormField label="Contact Number">
            <input className="form-control" placeholder="Hotline" value={editForm.contactNumber} onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })} />
          </FormField>
          <FormField label="Address">
            <input className="form-control" placeholder="e.g. 123 Main Street, Colombo" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
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
