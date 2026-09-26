import axios from "axios";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5009"}/api`;

export const getDispatches = async () => {
  const response = await axios.get(`${API_BASE_URL}/dispatches`);
  return response.data;
};

export const getDispatch = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/dispatches/${id}`);
  return response.data;
};

export const createDispatch = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/dispatches`, data);
  return response.data;
};

export const updateDispatchStatus = async (id, status) => {
  const response = await axios.put(`${API_BASE_URL}/dispatches/${id}/status`, { status });
  return response.data;
};

export const createDispatchTask = async (dispatchId, data) => {
  const response = await axios.post(`${API_BASE_URL}/dispatches/${dispatchId}/tasks`, data);
  return response.data;
};

export const updateDispatchTask = async (dispatchId, taskId, data) => {
  const response = await axios.put(`${API_BASE_URL}/dispatches/${dispatchId}/tasks/${taskId}`, data);
  return response.data;
};

export const deleteDispatchTask = async (dispatchId, taskId) => {
  const response = await axios.delete(`${API_BASE_URL}/dispatches/${dispatchId}/tasks/${taskId}`);
  return response.data;
};

export const proposeAllocation = async (dispatchId, allocationPlanId) => {
  const response = await axios.post(`${API_BASE_URL}/dispatches/${dispatchId}/propose-allocation`, {
    allocationPlanId,
  });
  return response.data;
};
