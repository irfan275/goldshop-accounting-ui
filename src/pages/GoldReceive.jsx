import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteInvoice, getInvoices } from "../services/goldReceiveService";
import Pagination from "./Pagination";
import { getCustomers } from "../services/customerService";
import { format } from "date-fns"; // optional, makes date formatting easier

function GoldReceive() {
  const today = format(new Date(), "dd-MMM-yyyy"); // e.g., "05-Apr-2026"
  const navigate=useNavigate();
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));

  const [invoices, setInvoices] = useState([
    {
      id: "",
      invoiceNumber: "",
      customerId: {},
      items:[],
      total: "",
      date: ""
    }
  ]);
  useEffect(() => {
    loadInvoices();
  }, []);

  // const loadInvoices = async () => {
  //   const response = await getInvoices();
  //   setInvoices(response.data || []);
  // };
const loadInvoices = async (pageNumber = 1) => {

  let invoiceNo = "";
  let custId = "";

  // 🔥 Priority logic
  if (searchText) {
    invoiceNo = searchText;
  } else if (selectedCustomer) {
    custId = selectedCustomer._id;
  }

  const response = await getInvoices(
    pageNumber,
    size,
    invoiceNo,
    custId
  );

  setInvoices(response.data.data || []);
  setTotalPages(response.data.totalPages || 0);
  setPage(pageNumber);
};
const handlePrint = (invoice) => {
  navigate("/goldreceive/preview", { state : { invoice: invoice, show: false }});
};
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure to delete this invoice?")) {
      try {
        // Call API to delete
        await deleteInvoice(id); // replace with your API function
    
        // Update local state to remove deleted record
        setInvoices((prev) => prev.filter((inv) => inv._id !== id));
    
        // Show success alert
        alert("Invoice deleted successfully!");
      } catch (error) {
        console.error("Delete failed:", error);
        alert("Failed to delete Invoice.");
      }
    }
  };
  const handleSearch = () => {

    loadInvoices(1, searchText);
  };
  const handlePageChange = (pageNumber) => {
   setPage(pageNumber); 
  loadInvoices(pageNumber, searchText);
};
const handleCustomerSelection = async (c) => {
  try {
    //const res = await checkCardExpiry(c._id);

    // success (200)
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setCustomerResults([]);

  } catch (err) {
    if (err.response) {
      // backend returned 400
      alert(err.response.data.message || "Invalid card expiry");
    } else {
      alert("Something went wrong");
    }
  }
};
  // ------------------ CUSTOMER SEARCH ------------------
  useEffect(() => {

    if (customerSearch.length < 3 || selectedCustomer) {
      setCustomerResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const res = await getCustomers(1, 10, customerSearch);
      setCustomerResults(res.data.data || []);
    }, 400);

    return () => clearTimeout(timer);

  }, [customerSearch, selectedCustomer]);
const formatDate = (date) => {
  return new Date(date).toLocaleString();
};
  return (
    <div>

      <div className="mb-3">

  {/* Top Row */}
  <div className="d-flex justify-content-between align-items-center mb-2">
    <h3 className="m-0">Gold Receive Invoices</h3>

    <button
      className="btn btn-primary"
      onClick={() => navigate("/goldreceive/add")}
    >
      Add Invoice
    </button>
  </div>

  {/* Filters Row */}
  <div className="row g-2 align-items-end">

    {/* Customer Search */}
    <div className="col-md-4 position-relative">
      <label className="form-label mb-1"><strong>Customer</strong></label>

      <input
        className="form-control"
        placeholder="Search Customer"
        value={customerSearch}
        onChange={(e) => setCustomerSearch(e.target.value)}
        disabled={searchText} // 🔥 disable if invoice search used
      />

      {customerResults.length > 0 && (
        <ul
          className="list-group position-absolute w-100 shadow"
          style={{ zIndex: 1000, maxHeight: "200px", overflowY: "auto" }}
        >
          {customerResults.map((c) => (
            <li
              key={c._id}
              className="list-group-item list-group-item-action"
              onClick={() => handleCustomerSelection(c)}
              style={{ cursor: "pointer" }}
            >
              {c.name } - {c.civilId}
            </li>
          ))}
        </ul>
      )}
    </div>

    {/* Invoice Search */}
    <div className="col-md-3">
      <label className="form-label mb-1"><strong>Invoice No</strong></label>
      <input
        type="text"
        className="form-control"
        placeholder="Enter Invoice No"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />
    </div>

    {/* Search Button */}
    <div className="col-md-2">
      <button
        className="btn btn-success w-100"
        onClick={handleSearch}
      >
        Search
      </button>
    </div>

    {/* Reset Button */}
    <div className="col-md-2">
      <button
        className="btn btn-secondary w-100"
        onClick={() => {
          setSearchText("");
          setCustomerSearch("");
          setCustomerResults([]);
          setSelectedCustomer(null);
          handleSearch();
        }}
      >
        Reset
      </button>
    </div>

  </div>
</div>

      <table className="table table-bordered table-striped">

        <thead className="table-dark">
          <tr>
            <th>Invoice #</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Date</th>
            <th>Created By</th>
            <th width="220">Actions</th>
          </tr>
        </thead>

        <tbody>

          {invoices.map((inv) => (
            <tr key={inv._id}>
              <td>{inv.invoiceNumber}</td>
              <td>{inv.customerId?.name}</td>
              <td>{inv.total}</td>
              <td>{formatDate(inv.updatedAt)}</td>
              <td>{inv.createdBy?.name}</td>

              <td>
{(user?.role !== 'EMPLOYEE' || inv.invoiceDate === today) && (
                <button className="btn btn-sm btn-warning mx-1" onClick={() => navigate(`/goldreceive/edit/${inv._id}`)}>
                  Edit
                </button>
)}
                <button
                  className="btn btn-sm btn-primary mx-1"
                  onClick={() => handlePrint(inv)}
                >
                  Print
                </button>
                {user?.role !=='EMPLOYEE' && (<button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(inv._id)}
                >
                  Delete
                </button>)}

              </td>
            </tr>
          ))}

        </tbody>

      </table>
      <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
}

export default GoldReceive;