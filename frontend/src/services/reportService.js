import api from "./api";

export const createReport = async (payload) => {
  const { data } = await api.post("/reports", payload);
  return data;
};

export const getMyReports = async () => {
  const { data } = await api.get("/reports/my-reports");
  return data;
};
