import { API_BASE, apiGet, apiPost, apiPut, apiDelete } from "./api";

// Resources API
export const getResources = async (resourceType = "", status = "") => {
  const params = {};
  if (resourceType) params.resourceType = resourceType;
  if (status) params.status = status;
  return await apiGet(`${API_BASE}/Resources`, params);
};

export const createResource = async (data) => {
  return await apiPost(`${API_BASE}/Resources`, data);
};

export const updateResource = async (id, data) => {
  await apiPut(`${API_BASE}/Resources/${id}`, data);
};

export const updateResourceStatus = async (id, status) => {
  return await apiPut(`${API_BASE}/Resources/${id}/status`, { status });
};

// Shelters API
export const getShelters = async (status = "") => {
  const params = {};
  if (status) params.status = status;
  return await apiGet(`${API_BASE}/Shelters`, params);
};

export const createShelter = async (data) => {
  return await apiPost(`${API_BASE}/Shelters`, data);
};

export const updateShelter = async (id, data) => {
  await apiPut(`${API_BASE}/Shelters/${id}`, data);
};

export const deleteShelter = async (id) => {
  await apiDelete(`${API_BASE}/Shelters/${id}`);
};

export const updateShelterOccupancy = async (id, currentOccupancy) => {
  return await apiPut(`${API_BASE}/Shelters/${id}/occupancy`, { currentOccupancy });
};

// Inventory API
export const getInventory = async (category = "", status = "") => {
  const params = {};
  if (category) params.category = category;
  if (status) params.status = status;
  return await apiGet(`${API_BASE}/Inventory`, params);
};

export const createInventoryItem = async (data) => {
  return await apiPost(`${API_BASE}/Inventory`, data);
};

export const adjustStock = async (id, quantityAdjustment) => {
  return await apiPut(`${API_BASE}/Inventory/${id}/adjust-stock`, { quantityAdjustment });
};

export const updateInventoryItem = async (id, data) => {
  await apiPut(`${API_BASE}/Inventory/${id}`, data);
};

export const deleteInventoryItem = async (id) => {
  await apiDelete(`${API_BASE}/Inventory/${id}`);
};

export const deleteResource = async (id) => {
  await apiDelete(`${API_BASE}/Resources/${id}`);
};

// Situation Analysis AI Agent API
export const assessSituation = async (incidentId) => {
  return await apiPost(`${API_BASE}/SituationAnalysis/assess`, { incidentId });
};
