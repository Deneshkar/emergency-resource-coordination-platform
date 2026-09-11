import React, { useEffect, useState } from "react";
import { getInventory, createInventoryItem, adjustStock } from "../services/resourceService";

export default function InventoryList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({ itemName: "", category: "Medical", quantity: 50, unitOfMeasure: "Kits", minimumThreshold: 10, location: "" });

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await getInventory();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newItem.itemName) return;
    await createInventoryItem(newItem);
    setNewItem({ itemName: "", category: "Medical", quantity: 50, unitOfMeasure: "Kits", minimumThreshold: 10, location: "" });
    fetchInventory();
  };

  const handleAdjust = async (id, delta) => {
    await adjustStock(id, delta);
    fetchInventory();
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>📦 Emergency Inventory & Medical Supplies</h2>
      <p style={{ color: "#666" }}>Track stock levels, minimum safety thresholds, and low-stock alerts.</p>

      <form onSubmit={handleCreate} style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", background: "#f5f5f5", padding: "15px", borderRadius: "8px" }}>
        <input
          type="text"
          placeholder="Item Name (e.g. Trauma Dressing)"
          value={newItem.itemName}
          onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
          style={{ flex: 1, padding: "8px" }}
          required
        />
        <select
          value={newItem.category}
          onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
          style={{ padding: "8px" }}
        >
          <option value="Medical">Medical</option>
          <option value="Food">Food</option>
          <option value="Water">Water</option>
          <option value="ShelterSupplies">Shelter Supplies</option>
          <option value="Power">Power & Fuel</option>
        </select>
        <input
          type="number"
          placeholder="Qty"
          value={newItem.quantity}
          onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
          style={{ width: "70px", padding: "8px" }}
        />
        <input
          type="text"
          placeholder="Unit (e.g. Kits)"
          value={newItem.unitOfMeasure}
          onChange={(e) => setNewItem({ ...newItem, unitOfMeasure: e.target.value })}
          style={{ width: "90px", padding: "8px" }}
        />
        <input
          type="number"
          placeholder="Min Threshold"
          value={newItem.minimumThreshold}
          onChange={(e) => setNewItem({ ...newItem, minimumThreshold: parseInt(e.target.value) || 0 })}
          style={{ width: "90px", padding: "8px" }}
        />
        <button type="submit" style={{ padding: "8px 16px", background: "#17a2b8", color: "#fff", border: "none", borderRadius: "4px" }}>
          Add Stock Item
        </button>
      </form>

      {loading ? (
        <p>Loading inventory...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#e9ecef", textAlign: "left" }}>
              <th style={{ padding: "10px" }}>ID</th>
              <th style={{ padding: "10px" }}>Item Name</th>
              <th style={{ padding: "10px" }}>Category</th>
              <th style={{ padding: "10px" }}>Quantity</th>
              <th style={{ padding: "10px" }}>Min Threshold</th>
              <th style={{ padding: "10px" }}>Status</th>
              <th style={{ padding: "10px" }}>Adjust Stock</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "10px" }}>#{i.id}</td>
                <td style={{ padding: "10px", fontWeight: "bold" }}>{i.itemName}</td>
                <td style={{ padding: "10px" }}>{i.category}</td>
                <td style={{ padding: "10px" }}>{i.quantity} {i.unitOfMeasure}</td>
                <td style={{ padding: "10px" }}>{i.minimumThreshold} {i.unitOfMeasure}</td>
                <td style={{ padding: "10px" }}>
                  <span style={{
                    padding: "4px 8px", borderRadius: "4px", fontSize: "12px", color: "#fff",
                    background: i.status === "InStock" ? "#28a745" : i.status === "LowStock" ? "#ffc107" : "#dc3545"
                  }}>
                    {i.status}
                  </span>
                </td>
                <td style={{ padding: "10px" }}>
                  <button onClick={() => handleAdjust(i.id, 10)} style={{ marginRight: "4px", padding: "4px 8px", background: "#28a745", color: "#fff", border: "none", borderRadius: "4px" }}>+10</button>
                  <button onClick={() => handleAdjust(i.id, -10)} style={{ padding: "4px 8px", background: "#dc3545", color: "#fff", border: "none", borderRadius: "4px" }}>-10</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
