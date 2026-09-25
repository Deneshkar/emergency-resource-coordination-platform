import { useEffect, useState } from "react";
import { getInventory, createInventoryItem, updateInventoryItem, adjustStock, deleteInventoryItem } from "../services/resourceService";
import { useNotification } from "../context/NotificationContext";
import { sendLowStockEmail, sendOutOfStockEmail, sendStockRestoredEmail } from "../services/emailNotificationService";
import StatusBadge from "../components/StatusBadge";
import Modal, { FormField, FormRow } from "../components/Modal";

export default function InventoryList() {
  const { notify } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ itemName: "", category: "Medical", quantity: 50, unitOfMeasure: "Kits", minimumThreshold: 10, location: "" });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: null, itemName: "", category: "Medical", quantity: 0, unitOfMeasure: "", minimumThreshold: 0, location: "" });

  const checkAndNotifyStock = (fetchedItems) => {
    fetchedItems.forEach((item) => {
      if (item.quantity === 0 || item.status === "OutOfStock") {
        notify.error(`🚨 OUT OF STOCK: "${item.itemName}" — Immediate restock required!`, 8000);
        sendOutOfStockEmail(item.itemName, item.location);
      } else if (item.status === "LowStock" || item.quantity <= item.minimumThreshold) {
        notify.warning(`⚠️ Low Stock: "${item.itemName}" — ${item.quantity} ${item.unitOfMeasure} remaining (min: ${item.minimumThreshold})`);
        sendLowStockEmail(item.itemName, item.quantity, item.minimumThreshold, item.location);
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
      } else if (updatedItem.quantity === 0 || updatedItem.status === "OutOfStock") {
        notify.error(`🚨 OUT OF STOCK: "${updatedItem.itemName}" — Restock immediately!`, 8000);
        sendOutOfStockEmail(updatedItem.itemName, updatedItem.location);
      } else if (updatedItem.status === "LowStock") {
        notify.warning(`⚠️ Low Stock: "${updatedItem.itemName}" — ${updatedItem.quantity} ${updatedItem.unitOfMeasure} remaining`);
        sendLowStockEmail(updatedItem.itemName, updatedItem.quantity, updatedItem.minimumThreshold, updatedItem.location);
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
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button className="btn btn-success btn-sm" onClick={() => handleAdjust(i.id, 10)}>+10</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleAdjust(i.id, -10)}>-10</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(i)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(i.id, i.itemName)}>Delete</button>
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
                <option value="Power">Power & Fuel</option>
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
                <option value="Power">Power & Fuel</option>
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
