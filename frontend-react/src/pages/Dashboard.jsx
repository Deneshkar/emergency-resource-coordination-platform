import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { getIncidents } from "../services/incidentService";
import { getDispatches } from "../services/dispatchService";
import { getVolunteers } from "../services/volunteerService";
import { getResources, getShelters, getInventory } from "../services/resourceService";

export default function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [resources, setResources] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [inc, dis, vol, res, she, inv] = await Promise.all([
          getIncidents().catch(() => []),
          getDispatches().catch(() => []),
          getVolunteers("", null, 1, 100).catch(() => []),
          getResources().catch(() => []),
          getShelters().catch(() => []),
          getInventory().catch(() => []),
        ]);
        setIncidents(inc);
        setDispatches(dis);
        setVolunteers(vol);
        setResources(res);
        setShelters(she);
        setInventory(inv);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeIncidents = incidents.filter((i) => i.status !== "Resolved" && i.status !== "Closed");
  const criticalIncidents = incidents.filter((i) => i.priority === "Critical");
  const availableVolunteers = volunteers.filter((v) => v.isAvailable);
  const availableResources = resources.filter((r) => r.status === "Available");
  const lowStockItems = inventory.filter((i) => i.status === "LowStock" || i.status === "OutOfStock");
  const totalCapacity = shelters.reduce((s, sh) => s + sh.totalCapacity, 0);
  const totalOccupancy = shelters.reduce((s, sh) => s + sh.currentOccupancy, 0);
  const shelterPct = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  if (loading) {
    return <div className="loading-spinner">Loading operational data...</div>;
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>Emergency operations overview &mdash; real-time status across all modules</p>
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid-stats">
        <StatCard icon="⚠️" label="Active Incidents" value={activeIncidents.length} sub={`${criticalIncidents.length} critical`} color={criticalIncidents.length > 0 ? "red" : "amber"} glow={criticalIncidents.length > 0} />
        <StatCard icon="🚛" label="Dispatches" value={dispatches.length} sub={`${dispatches.filter(d => d.status === "InProgress").length} in progress`} color="blue" />
        <StatCard icon="👤" label="Volunteers" value={volunteers.length} sub={`${availableVolunteers.length} available`} color="green" />
        <StatCard icon="📦" label="Resources" value={resources.length} sub={`${availableResources.length} ready`} color="cyan" />
        <StatCard icon="🏠" label="Shelter Capacity" value={`${shelterPct}%`} sub={`${totalOccupancy} / ${totalCapacity} occupants`} color={shelterPct > 80 ? "red" : "green"} />
        <StatCard icon="📋" label="Low Stock Alerts" value={lowStockItems.length} sub="items need restock" color={lowStockItems.length > 0 ? "amber" : "green"} />
      </div>

      {/* Two Column Layout */}
      <div className="grid-2">
        {/* Recent Incidents */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">⚠️ Recent Incidents</span>
            <Link to="/incidents" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {incidents.length === 0 ? (
            <div className="empty-state" style={{ padding: "30px" }}>
              <div className="empty-state-text">No incidents reported</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {incidents.slice(0, 5).map((inc) => (
                <div
                  key={inc.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: "var(--bg-base)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: "600", fontSize: "13px", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>
                      {inc.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                      #{inc.id} &middot; {inc.location || "No location"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                    <StatusBadge status={inc.priority} size="sm" />
                    <StatusBadge status={inc.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Dispatches */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🚛 Active Dispatches</span>
            <Link to="/dispatches" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {dispatches.length === 0 ? (
            <div className="empty-state" style={{ padding: "30px" }}>
              <div className="empty-state-text">No dispatches created</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {dispatches.slice(0, 5).map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: "var(--bg-base)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "13px", color: "var(--text-primary)" }}>
                      Dispatch #{d.id}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                      Incident #{d.incidentId} &middot; {d.tasks?.length || 0} tasks
                    </div>
                  </div>
                  <StatusBadge status={d.status} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shelter Status */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🏠 Shelter Status</span>
            <Link to="/shelters" className="btn btn-ghost btn-sm">Manage</Link>
          </div>
          {shelters.length === 0 ? (
            <div className="empty-state" style={{ padding: "30px" }}>
              <div className="empty-state-text">No shelters registered</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {shelters.slice(0, 4).map((s) => {
                const pct = Math.round((s.currentOccupancy / s.totalCapacity) * 100) || 0;
                return (
                  <div key={s.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "600" }}>{s.name}</span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {s.currentOccupancy}/{s.totalCapacity}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${pct >= 90 ? "red" : pct >= 70 ? "amber" : "green"}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📋 Inventory Alerts</span>
            <Link to="/inventory" className="btn btn-ghost btn-sm">Manage</Link>
          </div>
          {lowStockItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "var(--green)" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>✓</div>
              <div style={{ fontSize: "13px", fontWeight: "600" }}>All stock levels adequate</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {lowStockItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: "var(--bg-base)",
                    borderRadius: "var(--radius-sm)",
                    border: `1px solid ${item.status === "OutOfStock" ? "var(--red)" : "var(--amber)"}33`,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "13px" }}>{item.itemName}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>{item.category}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: "700", fontSize: "13px", fontFamily: "var(--font-mono)" }}>
                      {item.quantity} {item.unitOfMeasure}
                    </div>
                    <StatusBadge status={item.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
