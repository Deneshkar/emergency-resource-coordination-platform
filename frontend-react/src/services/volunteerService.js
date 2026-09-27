import { API_BASE, apiGet, apiPost, apiPut, apiDelete } from "./api";

export const getVolunteers = async (search = "", isAvailable = null, page = 1, pageSize = 10) => {
  const params = { search, page, pageSize };
  if (isAvailable !== null) params.isAvailable = isAvailable;
  return await apiGet(`${API_BASE}/Volunteers`, params);
};

export const updateAvailability = async (id, isAvailable) => {
  await apiPut(`${API_BASE}/Volunteers/${id}/availability`, { isAvailable });
};

export const getVolunteerShifts = async (id) => {
  return await apiGet(`${API_BASE}/Volunteers/${id}/shifts`);
};

export const createShift = async (id, { startTime, endTime, status }) => {
  return await apiPost(`${API_BASE}/Volunteers/${id}/shifts`, {
    startTime,
    endTime,
    status,
  });
};

export const createVolunteer = async (volunteerData) => {
  return await apiPost(`${API_BASE}/Volunteers`, volunteerData);
};

export const deleteAllVolunteers = async () => {
  await apiDelete(`${API_BASE}/Volunteers`);
};

export const deleteVolunteer = async (id) => {
  await apiDelete(`${API_BASE}/Volunteers/${id}`);
};

export const getVolunteerById = async (id) => {
  return await apiGet(`${API_BASE}/Volunteers/${id}`);
};

export const updateVolunteer = async (id, { name, phone, skills }) => {
  return await apiPut(`${API_BASE}/Volunteers/${id}`, {
    name,
    phone,
    skills,
  });
};

export const updateShift = async (volunteerId, shiftId, { startTime, endTime, status }) => {
  return await apiPut(
    `${API_BASE}/Volunteers/${volunteerId}/shifts/${shiftId}`,
    { startTime, endTime, status }
  );
};

export const deleteShift = async (volunteerId, shiftId) => {
  await apiDelete(`${API_BASE}/Volunteers/${volunteerId}/shifts/${shiftId}`);
};