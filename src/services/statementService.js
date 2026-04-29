import api from "./api";

const API_URL = "statement";

// GET all customers
// export const getInvoices = (page, size, invoiceNumber,customerId) => {
//   return api.get(API_URL, {
//     params: { page, size, invoiceNumber,customerId }
//   });
// };
export const getStatement = (customer, fromDate, toDate) => {
  return api.get(API_URL, {
    params: { customer, fromDate, toDate }
  });
};
