import axios from "axios";

const API_BASE_URL = "http://localhost:5009/api";

export const getIncidents = async (params = {}) => {
  const response = await axios.get(`${API_BASE_URL}/incident`, { params });
  return response.data;
};

export const getIncident = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/incident/${id}`);
  return response.data;
};

export const createIncident = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/incident`, data);
  return response.data;
};

export const updateIncident = async (id, data) => {
  const response = await axios.put(`${API_BASE_URL}/incident/${id}`, data);
  return response.data;
};

export const deleteIncident = async (id) => {
  await axios.delete(`${API_BASE_URL}/incident/${id}`);
};

export const getSummaryStats = async () => {
  const response = await axios.get(`${API_BASE_URL}/incident/stats/summary`);
  return response.data;
};

export const generatePlan = async (incidentId, customDirectives = "", focusPhase = "") => {
  const response = await axios.post(`${API_BASE_URL}/incident/${incidentId}/generate-plan`, {
    customDirectives,
    focusPhase,
  });
  return response.data;
};

export const updatePlanStatus = async (planId, status, approvedBy = "") => {
  const response = await axios.put(`${API_BASE_URL}/incident/plan/${planId}/status`, {
    status,
    approvedBy,
  });
  return response.data;
};

export const addTimelineEvent = async (incidentId, title, description, eventType = "Note", createdBy = "User") => {
  const response = await axios.post(`${API_BASE_URL}/incident/${incidentId}/timeline`, {
    title,
    description,
    eventType,
    createdBy,
  });
  return response.data;
};

const incidentService = {
  getIncidents,
  getIncident,
  createIncident,
  updateIncident,
  deleteIncident,
  getSummaryStats,
  generatePlan,
  updatePlanStatus,
  addTimelineEvent,
};

export default incidentService;
