import axios from "axios";

const API_BASE_URL = "http://localhost:5009/api";

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
