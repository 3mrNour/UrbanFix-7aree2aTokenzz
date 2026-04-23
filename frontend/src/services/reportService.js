import api from "./api";

export const createReport = async (payload) => {
  const formData = new FormData();
  formData.append("category", payload.category);
  formData.append("description", payload.description);
  formData.append("urgency", payload.urgency);
  formData.append("addressDescription", payload.addressDescription || "");
  formData.append("location", JSON.stringify(payload.location));
  formData.append("photoBefore", payload.photoBefore);

  const { data } = await api.post("/reports", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const getMyReports = async () => {
  const { data } = await api.get("/reports/my-reports");
  return data;
};
