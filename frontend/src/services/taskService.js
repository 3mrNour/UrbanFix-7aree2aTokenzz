import api from "./api";

export const getAssignedTasks = async () => {
  const { data } = await api.get("/tasks");
  return data;
};

export const getTaskDetails = async (taskId) => {
  const { data } = await api.get(`/tasks/${taskId}`);
  return data;
};

export const updateTaskStatus = async (taskId, payload) => {
  const formData = new FormData();
  formData.append("status", payload.status);

  if (payload.photoAfter) {
    formData.append("photoAfter", payload.photoAfter);
  }

  const { data } = await api.patch(`/tasks/${taskId}/status`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
};
