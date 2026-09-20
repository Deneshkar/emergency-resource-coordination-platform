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

// Student 4 — assign a shift to a volunteer (Coordinator/Admin only, 403 otherwise).
// Backend: POST /api/Volunteers/{id}/shifts { startTime, endTime, status }
export const createShift = async (id, { startTime, endTime, status }) => {
  const response = await axios.post(`${API_BASE_URL}/Volunteers/${id}/shifts`, {
    startTime,
    endTime,
    status,
  });
  return response.data;
};

export const createVolunteer = async (volunteerData) => {
  const response = await axios.post(`${API_BASE_URL}/Volunteers`, volunteerData);
  return response.data;
};

export const deleteAllVolunteers = async () => {
  await axios.delete(`${API_BASE_URL}/Volunteers`);
};

export const deleteVolunteer = async (id) => {
  await axios.delete(`${API_BASE_URL}/Volunteers/${id}`);
};