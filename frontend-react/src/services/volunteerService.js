import axios from "axios";

const API_BASE_URL = "http://localhost:5009/api"; // change port to match your backend

export const getVolunteers = async (search = "", isAvailable = null, page = 1, pageSize = 10) => {
  const params = { search, page, pageSize };
  if (isAvailable !== null) params.isAvailable = isAvailable;

  const response = await axios.get(`${API_BASE_URL}/Volunteers`, { params });
  return response.data;
};

export const updateAvailability = async (id, isAvailable) => {
  await axios.put(`${API_BASE_URL}/Volunteers/${id}/availability`, { isAvailable });
};

export const getVolunteerShifts = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/Volunteers/${id}/shifts`);
  return response.data;
};