import api from "./api";

const API_URL = "ledger";

// GET all customers
// export const getInvoices = (page, size, invoiceNumber,customerId) => {
//   return api.get(API_URL, {
//     params: { page, size, invoiceNumber,customerId }
//   });
// };
export const getLedger = (invoiceNumber, customerId, fromDate, toDate) => {
  return api.get(API_URL, {
    params: { invoiceNumber, customerId, fromDate, toDate }
  });
};
// GET customer by id
export const getLedgerById = (id) => {
  return api.get(`${API_URL}/${id}`);
};

// CREATE customer
export const createLedger = (customer) => {
  return api.post(API_URL, customer);
};

// UPDATE customer
export const updateLedger = (id, customer) => {
  return api.put(`${API_URL}/${id}`, customer);
};

// DELETE customer
export const deleteLedger = (id) => {
  return api.delete(`${API_URL}/${id}`);
};

export const getInvoiceNumber = (id) => {
  return api.get(`/sequence/${id}`);
};
