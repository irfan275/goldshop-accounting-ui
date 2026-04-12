import api from "./api";

const API_URL = "receipt";

// GET all customers
export const getInvoices = (page, limit, invoiceNumber, customerId) => {
  return api.get(API_URL, {
    params: { page, limit, invoiceNumber, customerId }
  });
};
// GET customer by id
export const getInvoiceById = (id) => {
  return api.get(`${API_URL}/${id}`);
};

// CREATE customer
export const createInvoice = (customer) => {
  return api.post(API_URL, customer);
};

// UPDATE customer
export const updateInvoice = (id, customer) => {
  return api.put(`${API_URL}/${id}`, customer);
};

// DELETE customer
export const deleteInvoice = (id) => {
  return api.delete(`${API_URL}/${id}`);
};

export const getInvoiceNumber = (id) => {
  return api.get(`shop/receipt/sequence/${id}`);
};