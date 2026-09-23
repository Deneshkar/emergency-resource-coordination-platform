import axios from "axios";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5009"}/api`;

// Resources API
export const getResources = async (resourceType = "", status = "") => {
  const params = {};
  if (resourceType) params.resourceType = resourceType;
  if (status) params.status = status;
  const response = await axios.get(`${API_BASE_URL}/Resources`, { params });
  return response.data;
};

export const createResource = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/Resources`, data);
  return response.data;
};

export const updateResource = async (id, data) => {
  await axios.put(`${API_BASE_URL}/Resources/${id}`, data);
};

export const updateResourceStatus = async (id, status) => {
  const response = await axios.put(`${API_BASE_URL}/Resources/${id}/status`, { status });
  return response.data;
};

// Shelters API
export const getShelters = async (status = "") => {
  const params = {};
  if (status) params.status = status;
  const response = await axios.get(`${API_BASE_URL}/Shelters`, { params });
  return response.data;
};

export const createShelter = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/Shelters`, data);
  return response.data;
};

export const updateShelter = async (id, data) => {
  await axios.put(`${API_BASE_URL}/Shelters/${id}`, data);
};

export const deleteShelter = async (id) => {
  await axios.delete(`${API_BASE_URL}/Shelters/${id}`);
};

export const updateShelterOccupancy = async (id, currentOccupancy) => {
  const response = await axios.put(`${API_BASE_URL}/Shelters/${id}/occupancy`, { currentOccupancy });
  return response.data;
};

// Inventory API
export const getInventory = async (category = "", status = "") => {
  const params = {};
  if (category) params.category = category;
  if (status) params.status = status;
  const response = await axios.get(`${API_BASE_URL}/Inventory`, { params });
  return response.data;
};

export const createInventoryItem = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/Inventory`, data);
  return response.data;
};

export const adjustStock = async (id, quantityAdjustment) => {
  const response = await axios.put(`${API_BASE_URL}/Inventory/${id}/adjust-stock`, { quantityAdjustment });
  return response.data;
};

export const updateInventoryItem = async (id, data) => {
  await axios.put(`${API_BASE_URL}/Inventory/${id}`, data);
};

export const deleteInventoryItem = async (id) => {
  await axios.delete(`${API_BASE_URL}/Inventory/${id}`);
};

export const deleteResource = async (id) => {
  await axios.delete(`${API_BASE_URL}/Resources/${id}`);
};

// Situation Analysis AI Agent API
export const assessSituation = async (incidentId) => {
  const response = await axios.post(`${API_BASE_URL}/SituationAnalysis/assess`, { incidentId });
  return response.data;
};
