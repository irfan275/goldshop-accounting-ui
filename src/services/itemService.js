import api from "./api";

const API_URL = "item";

// GET items
export const getItems = async () => {
 return api.get(API_URL);
};

// CREATE item
export const createItem = async (item) => {
  return api.post(API_URL,item);
};

// UPDATE item
export const updateItem = async (id, item) => {
  return api.put(`${API_URL}/${id}`, item);
};

// DELETE item
export const deleteItem = async (id) => {
return api.delete(`${API_URL}/${id}`);
};
export const searchItems = (text) => {
  return api.get(`${API_URL}/search`, {
    params: { text }
  });
};