import api from "./api";

export const getGovernorReports = async (params = {}) => {
  const { data } = await api.get("/governor/reports", { params });
  return data;
};

export const getGovernorAnalytics = async () => {
  const { data } = await api.get("/governor/analytics");
  return data;
};

export const getGovernorHeatmap = async (params = {}) => {
  const { data } = await api.get("/governor/heatmap", { params });
  return data;
};
