import api from "./api";

export const getUsers = async (params = {}) => {
  const { data } = await api.get("/users", { params });
  return data;
};

export const updateUserById = async (id, payload) => {
  const { data } = await api.patch(`/users/${id}`, payload);
  return data;
};

export const toggleUserStatus = async (id) => {
  const { data } = await api.delete(`/users/${id}`);
  return data;
};
