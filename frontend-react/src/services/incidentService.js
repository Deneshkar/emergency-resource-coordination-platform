import axios from "axios";

const API_BASE_URL = "http://localhost:5009/api";

export const getIncidents = async () => {
  const response = await axios.get(`${API_BASE_URL}/incident`);
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
