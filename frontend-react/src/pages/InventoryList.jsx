import { useEffect, useState } from "react";
import { getInventory, createInventoryItem, updateInventoryItem, adjustStock, deleteInventoryItem } from "../services/resourceService";
import { useNotification } from "../context/NotificationContext";
import { sendLowStockEmail, sendOutOfStockEmail, sendStockRestoredEmail } from "../services/emailNotificationService";
import { waLowStock, waOutOfStock, waStockRestored, waManualAlert } from "../services/whatsappService";
import StatusBadge from "../components/StatusBadge";
import Modal, { FormField, FormRow } from "../components/Modal";

/* ── WhatsApp SVG Icon ─────────────────────────────────────────── */
const WhatsAppIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function InventoryList() {
  const { notify } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ itemName: "", category: "Medical", quantity: 50, unitOfMeasure: "Kits", minimumThreshold: 10, location: "" });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: null, itemName: "", category: "Medical", quantity: 0, unitOfMeasure: "", minimumThreshold: 0, location: "" });
  const [waSending, setWaSending] = useState({}); // { [itemId]: true/false }

  const checkAndNotifyStock = (fetchedItems) => {
    fetchedItems.forEach((item) => {
      if (item.quantity === 0 || item.status === "OutOfStock") {
        notify.error(`🚨 OUT OF STOCK: "${item.itemName}" — Immediate restock required!`, 8000);
        sendOutOfStockEmail(item.itemName, item.location);
        waOutOfStock(item.itemName, item.location, item.unitOfMeasure);
      } else if (item.status === "LowStock" || item.quantity <= item.minimumThreshold) {
        notify.warning(`⚠️ Low Stock: "${item.itemName}" — ${item.quantity} ${item.unitOfMeasure} remaining (min: ${item.minimumThreshold})`);
        sendLowStockEmail(item.itemName, item.quantity, item.minimumThreshold, item.location);
        waLowStock(item.itemName, item.quantity, item.minimumThreshold, item.location, item.unitOfMeasure);
      }
    });
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await getInventory();
      setItems(data);
      checkAndNotifyStock(data);
    } catch (err) {
      console.error(err);
      notify.error("Failed to load inventory data.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchInventory(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await createInventoryItem(form);
    notify.success(`✅ Item "${form.itemName}" added to inventory!`);
    setForm({ itemName: "", category: "Medical", quantity: 50, unitOfMeasure: "Kits", minimumThreshold: 10, location: "" });
    setShowModal(false);
    fetchInventory();
  };

  const handleAdjust = async (id, delta) => {
    const item = items.find((i) => i.id === id);
    await adjustStock(id, delta);
    const updated = await getInventory();
    const updatedItem = updated.find((i) => i.id === id);
    if (updatedItem) {
      if (delta > 0 && item && (item.status === "LowStock" || item.status === "OutOfStock")) {
        notify.success(`✅ Stock Restocked: "${updatedItem.itemName}" — Now: ${updatedItem.quantity} ${updatedItem.unitOfMeasure}`);
        sendStockRestoredEmail(updatedItem.itemName, updatedItem.quantity, updatedItem.unitOfMeasure);
        waStockRestored(updatedItem.itemName, updatedItem.quantity, updatedItem.unitOfMeasure);
      } else if (updatedItem.quantity === 0 || updatedItem.status === "OutOfStock") {
        notify.error(`🚨 OUT OF STOCK: "${updatedItem.itemName}" — Restock immediately!`, 8000);
        sendOutOfStockEmail(updatedItem.itemName, updatedItem.location);
        waOutOfStock(updatedItem.itemName, updatedItem.location, updatedItem.unitOfMeasure);
      } else if (updatedItem.status === "LowStock") {
        notify.warning(`⚠️ Low Stock: "${updatedItem.itemName}" — ${updatedItem.quantity} ${updatedItem.unitOfMeasure} remaining`);
        sendLowStockEmail(updatedItem.itemName, updatedItem.quantity, updatedItem.minimumThreshold, updatedItem.location);
        waLowStock(updatedItem.itemName, updatedItem.quantity, updatedItem.minimumThreshold, updatedItem.location, updatedItem.unitOfMeasure);
      } else if (delta > 0) {
        notify.info(`📦 Stock updated: "${updatedItem.itemName}" → ${updatedItem.quantity} ${updatedItem.unitOfMeasure}`);
      } else {
        notify.info(`📦 Stock reduced: "${updatedItem.itemName}" → ${updatedItem.quantity} ${updatedItem.unitOfMeasure}`);
      }
    }
    setItems(updated);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await deleteInventoryItem(id);
    notify.info(`🗑️ Item "${name}" removed from inventory.`);
    fetchInventory();
  };

  const openEditModal = (item) => {
    setEditForm({
      id: item.id,
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      unitOfMeasure: item.unitOfMeasure,
      minimumThreshold: item.minimumThreshold,
      location: item.location || "",
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateInventoryItem(editForm.id, {
      itemName: editForm.itemName,
      category: editForm.category,
      quantity: editForm.quantity,
      unitOfMeasure: editForm.unitOfMeasure,
      minimumThreshold: editForm.minimumThreshold,
      shelterId: null,
      location: editForm.location,
    });
    notify.success(`✅ Item "${editForm.itemName}" updated successfully!`);
    setShowEditModal(false);
    fetchInventory();
  };

  /* ── Manual WhatsApp Alert ─────────────────────────────────── */
  const handleSendWhatsApp = async (item) => {
    setWaSending((prev) => ({ ...prev, [item.id]: true }));
    try {
      const res = await waManualAlert(
        item.itemName,
        item.quantity,
        item.unitOfMeasure,
        item.minimumThreshold,
        item.location,
        item.status
      );
      if (res.success) {
        notify.success(`📲 WhatsApp alert sent for "${item.itemName}"!`, 4000);
      } else {
        notify.error(`❌ WhatsApp failed: ${res.error || "Unknown error"}`);
      }
    } catch {
      notify.error("❌ WhatsApp send failed.");
    } finally {
      setWaSending((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const lowStock = items.filter((i) => i.status === "LowStock" || i.status === "OutOfStock");
  const inStock = items.filter((i) => i.status === "InStock");

  if (loading) return <div className="loading-spinner">Loading inventory...</div>;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Inventory</h1>
          <p>Emergency supplies &amp; stock level monitoring &mdash; {items.length} items</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Item</button>
      </div>

      <div className="grid-stats" style={{ marginBottom: "24px" }}>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>Total Items</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--blue)", marginTop: "2px" }}>{items.length}</div>
        </div>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>In Stock</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--green)", marginTop: "2px" }}>{inStock.length}</div>
        </div>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>Low / Out of Stock</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: lowStock.length > 0 ? "var(--red)" : "var(--green)", marginTop: "2px" }}>{lowStock.length}</div>
        </div>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#25D366" }}><WhatsAppIcon size={12} /></span> WhatsApp Alerts
          </div>
          <div style={{ fontSize: "13px", fontWeight: "700", color: "#25D366", marginTop: "4px" }}>
            ● Auto-Send Active
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "2px" }}>+94 71 175 9718</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Threshold</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <div className="empty-state-text">No inventory items</div>
                      <div className="empty-state-sub">Add supply items to begin tracking</div>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((i) => (
                  <tr key={i.id}>
                    <td>#{i.id}</td>
                    <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{i.itemName}</td>
                    <td>{i.category}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: "700" }}>{i.quantity} {i.unitOfMeasure}</td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>{i.minimumThreshold} {i.unitOfMeasure}</td>
                    <td>{i.location || <span style={{ color: "var(--text-dim)" }}>—</span>}</td>
                    <td><StatusBadge status={i.status} /></td>
                    <td>
                      <div style={{ display: "flex", gap: "4px", alignItems: "center", flexWrap: "wrap" }}>
                        <button className="btn btn-success btn-sm" onClick={() => handleAdjust(i.id, 10)}>+10</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleAdjust(i.id, -10)}>-10</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(i)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(i.id, i.itemName)}>Delete</button>

                        {/* WhatsApp Manual Alert Button */}
                        <button
                          className="btn btn-sm wa-alert-btn"
                          onClick={() => handleSendWhatsApp(i)}
                          disabled={waSending[i.id]}
                          title={`Send WhatsApp alert for "${i.itemName}"`}
                          style={{
                            background: waSending[i.id]
                              ? "rgba(37, 211, 102, 0.3)"
                              : (i.status === "OutOfStock" ? "rgba(239,68,68,0.15)" :
                                 i.status === "LowStock"  ? "rgba(245,158,11,0.15)" :
                                 "rgba(37, 211, 102, 0.12)"),
                            color: waSending[i.id]
                              ? "#25D366"
                              : (i.status === "OutOfStock" ? "#ef4444" :
                                 i.status === "LowStock"  ? "#f59e0b" :
                                 "#25D366"),
                            border: `1px solid ${
                              i.status === "OutOfStock" ? "rgba(239,68,68,0.35)" :
                              i.status === "LowStock"  ? "rgba(245,158,11,0.35)" :
                              "rgba(37,211,102,0.35)"
                            }`,
                            borderRadius: "6px",
                            padding: "4px 8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            fontWeight: 600,
                            fontSize: "12px",
                            cursor: waSending[i.id] ? "not-allowed" : "pointer",
                            transition: "all 0.2s",
                            minWidth: "80px",
                            justifyContent: "center",
                          }}
                        >
                          {waSending[i.id] ? (
                            <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
                          ) : (
                            <WhatsAppIcon size={13} />
                          )}
                          {waSending[i.id] ? "Sending…" : "Alert"}
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Inventory Item" subtitle="Register a new supply item">
        <form onSubmit={handleCreate}>
          <FormField label="Item Name" required>
            <input placeholder="e.g. Trauma Dressing" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} required />
          </FormField>
          <FormRow>
            <FormField label="Category">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="Medical">Medical</option>
                <option value="Food">Food</option>
                <option value="Water">Water</option>
                <option value="ShelterSupplies">Shelter Supplies</option>
                <option value="Power">Power &amp; Fuel</option>
              </select>
            </FormField>
            <FormField label="Quantity">
              <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Unit">
              <input placeholder="e.g. Kits" value={form.unitOfMeasure} onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })} />
            </FormField>
            <FormField label="Min Threshold">
              <input type="number" value={form.minimumThreshold} onChange={(e) => setForm({ ...form, minimumThreshold: parseInt(e.target.value) || 0 })} />
            </FormField>
          </FormRow>
          <FormField label="Location">
            <input placeholder="e.g. Colombo Warehouse A" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Item</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Inventory Item" subtitle={`Updating item #${editForm.id}`}>
        <form onSubmit={handleUpdate}>
          <FormField label="Item Name" required>
            <input placeholder="e.g. Trauma Dressing" value={editForm.itemName} onChange={(e) => setEditForm({ ...editForm, itemName: e.target.value })} required />
          </FormField>
          <FormRow>
            <FormField label="Category">
              <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                <option value="Medical">Medical</option>
                <option value="Food">Food</option>
                <option value="Water">Water</option>
                <option value="ShelterSupplies">Shelter Supplies</option>
                <option value="Power">Power &amp; Fuel</option>
              </select>
            </FormField>
            <FormField label="Quantity">
              <input type="number" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })} />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Unit">
              <input placeholder="e.g. Kits" value={editForm.unitOfMeasure} onChange={(e) => setEditForm({ ...editForm, unitOfMeasure: e.target.value })} />
            </FormField>
            <FormField label="Min Threshold">
              <input type="number" value={editForm.minimumThreshold} onChange={(e) => setEditForm({ ...editForm, minimumThreshold: parseInt(e.target.value) || 0 })} />
            </FormField>
          </FormRow>
          <FormField label="Location">
            <input placeholder="e.g. Colombo Warehouse A" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
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
