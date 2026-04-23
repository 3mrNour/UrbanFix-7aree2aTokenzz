import api from "./api";

export const loginUser = async (payload, mode = "user") => {
  const endpoint = mode === "admin" ? "/users/admin/login" : "/users/login";
  const { data } = await api.post(endpoint, payload);
  return data;
};

export const registerUser = async (payload) => {
  const { data } = await api.post("/users", payload);
  return data;
};

export const getMyProfile = async () => {
  const { data } = await api.get("/users/profile");
  return data;
};
