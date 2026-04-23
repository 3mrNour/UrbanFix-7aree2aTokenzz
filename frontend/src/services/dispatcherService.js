import api from "./api";

export const getPendingReports = async () => {
  const { data } = await api.get("/manager/reports/pending");
  return data;
};

export const reviewReport = async (reportId, payload) => {
  const { data } = await api.patch(`/manager/reports/${reportId}/review`, payload);
  return data;
};

export const getAvailableTechnicians = async () => {
  const { data } = await api.get("/manager/technicians");
  return data;
};

export const getTechnicianSuggestions = async (reportId) => {
  const { data } = await api.get(`/manager/reports/${reportId}/technicians/suggestions`);
  return data;
};

export const assignTask = async (reportId, technicianId) => {
  const { data } = await api.patch(`/manager/reports/${reportId}/assign`, { technicianId });
  return data;
};

export const delegateTasks = async (payload) => {
  const { data } = await api.post("/manager/technicians/delegate", payload);
  return data;
};
