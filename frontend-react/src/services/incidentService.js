const API_BASE = "http://localhost:5009/api/incident";

export const incidentService = {
  // Fetch list of incidents with optional filters
  async getIncidents(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append("status", params.status);
    if (params.priority) query.append("priority", params.priority);
    if (params.category) query.append("category", params.category);
    if (params.search) query.append("search", params.search);

    const res = await fetch(`${API_BASE}?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch incidents");
    return res.json();
  },

  // Fetch summary statistics
  async getSummaryStats() {
    const res = await fetch(`${API_BASE}/stats/summary`);
    if (!res.ok) throw new Error("Failed to fetch summary stats");
    return res.json();
  },

  // Fetch incident details including plans and timeline
  async getIncident(id) {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch incident #${id}`);
    return res.json();
  },

  // Create a new incident
  async createIncident(data) {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to report incident");
    return res.json();
  },

  // Update incident status/priority/category/coordinator
  async updateIncident(id, data) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to update incident #${id}`);
  },

  // Delete incident
  async deleteIncident(id) {
    const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Failed to delete incident #${id}`);
  },

  // Generate AI Response Plan
  async generatePlan(id, customDirectives = "", focusPhase = "") {
    const res = await fetch(`${API_BASE}/${id}/generate-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customDirectives, focusPhase }),
    });
    if (!res.ok) throw new Error("Failed to generate AI Response Plan");
    return res.json();
  },

  // Update Plan status (Approve / Execute / Reject)
  async updatePlanStatus(planId, status, approvedBy = "Command Center") {
    const res = await fetch(`${API_BASE}/plans/${planId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, approvedBy }),
    });
    if (!res.ok) throw new Error("Failed to update plan status");
  },

  // Add timeline note or log event
  async addTimelineEvent(id, title, description, eventType = "DispatcherNote", createdBy = "Dispatcher") {
    const res = await fetch(`${API_BASE}/${id}/timeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, eventType, createdBy }),
    });
    if (!res.ok) throw new Error("Failed to record timeline event");
    return res.json();
  },
};

// Direct named exports for backwards compatibility
export const getIncidents = (params) => incidentService.getIncidents(params);
export const getIncident = (id) => incidentService.getIncident(id);
export const createIncident = (data) => incidentService.createIncident(data);
export const updateIncident = (id, data) => incidentService.updateIncident(id, data);
export const deleteIncident = (id) => incidentService.deleteIncident(id);
