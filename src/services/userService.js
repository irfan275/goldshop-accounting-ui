import api from "./api";

const API_URL = "user"; // backend endpoint

export const getUsers = async () => {
  return api.get(API_URL);
};

export const createUser = async (user) => {
  return api.post(API_URL,user);
};

export const updateUser = async (id, user) => {
  return api.put(`${API_URL}/${id}`,user);
};

export const deleteUser = async (id) => {
  return api.delete(`${API_URL}/${id}`);
};

export const getShops = async () => {
  return api.get('shop');
};
export const getShopById = async (id) => {
  return api.get(`shop/${id}`);
};
export const getBanks = async () => {
  return api.get('bank');
};