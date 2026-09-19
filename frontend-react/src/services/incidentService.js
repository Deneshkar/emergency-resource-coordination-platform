import { request } from "./api";

const ENDPOINT = "/incident";

export const incidentService = {
  // Fetch list of incidents with optional filters
  async getIncidents(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append("status", params.status);
    if (params.priority) query.append("priority", params.priority);
    if (params.category) query.append("category", params.category);
    if (params.search) query.append("search", params.search);
    if (params.myOnly !== undefined) query.append("myOnly", params.myOnly);

    const qs = query.toString();
    const url = qs ? `${ENDPOINT}?${qs}` : ENDPOINT;
    const res = await request(url, { method: "GET" });
    if (!res.ok) throw new Error("Failed to fetch incidents");
    return res.json();
  },

  // Fetch summary statistics
  async getSummaryStats(params = {}) {
    const query = new URLSearchParams();
    if (params?.myOnly !== undefined) query.append("myOnly", params.myOnly);
    const qs = query.toString();
    const url = qs ? `${ENDPOINT}/stats/summary?${qs}` : `${ENDPOINT}/stats/summary`;

    const res = await request(url, { method: "GET" });
    if (!res.ok) throw new Error("Failed to fetch summary stats");
    return res.json();
  },

  // Fetch incident details including plans and timeline
  async getIncident(id) {
    const res = await request(`${ENDPOINT}/${id}`, { method: "GET" });
    if (!res.ok) throw new Error(`Failed to fetch incident #${id}`);
    return res.json();
  },

  // Create a new incident
  async createIncident(data) {
    const res = await request(ENDPOINT, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to report incident");
    return res.json();
  },

  // Update incident status/priority/category/coordinator
  async updateIncident(id, data) {
    const res = await request(`${ENDPOINT}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to update incident #${id}`);
  },

  // Delete incident
  async deleteIncident(id) {
    const res = await request(`${ENDPOINT}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Failed to delete incident #${id}`);
  },

  // Generate AI Response Plan
  async generatePlan(id, customDirectives = "", focusPhase = "") {
    const res = await request(`${ENDPOINT}/${id}/generate-plan`, {
      method: "POST",
      body: JSON.stringify({ customDirectives, focusPhase }),
    });
    if (!res.ok) throw new Error("Failed to generate AI Response Plan");
    return res.json();
  },

  // Update Plan status (Approve / Execute / Reject)
  async updatePlanStatus(planId, status, approvedBy = "Command Center") {
    const res = await request(`${ENDPOINT}/plans/${planId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, approvedBy }),
    });
    if (!res.ok) throw new Error("Failed to update plan status");
  },

  // Add timeline note or log event
  async addTimelineEvent(id, title, description, eventType = "DispatcherNote", createdBy = "Dispatcher") {
    const res = await request(`${ENDPOINT}/${id}/timeline`, {
      method: "POST",
      body: JSON.stringify({ title, description, eventType, createdBy }),
    });
    if (!res.ok) throw new Error("Failed to record timeline event");
    return res.json();
  },

  async generateRiskAssessment(id) {
    const res = await request(`${ENDPOINT}/${id}/risk-assessment`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to generate risk assessment");
    return res.json();
  },

  async generateSummary(id) {
    const res = await request(`${ENDPOINT}/${id}/summary`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to generate incident summary");
    return res.json();
  },

  async recommendResources(id) {
    const res = await request(`${ENDPOINT}/${id}/recommend-resources`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to recommend resources");
    return res.json();
  },

  async checkDuplicates(id) {
    const res = await request(`${ENDPOINT}/${id}/duplicate-check`, { method: "GET" });
    if (!res.ok) throw new Error("Failed to check for duplicates");
    return res.json();
  }
};

// Direct named exports for backwards compatibility
export const getIncidents = (params) => incidentService.getIncidents(params);
export const getIncident = (id) => incidentService.getIncident(id);
export const createIncident = (data) => incidentService.createIncident(data);
export const updateIncident = (id, data) => incidentService.updateIncident(id, data);
export const deleteIncident = (id) => incidentService.deleteIncident(id);
export default incidentService;
