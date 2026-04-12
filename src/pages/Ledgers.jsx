import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteLedger, getLedger } from "../services/ledgerService";
import Pagination from "./Pagination";
import { getCustomers } from "../services/customerService";
import { format } from "date-fns"; // optional, makes date formatting easier



function Ledgers() {
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

  const [ledgers, setLedgers] = useState([]);
  useEffect(() => {
    loadInvoices();
  }, []);

const loadInvoices = async (pageNumber = 1) => {

  let invoiceNo = "";
  let custId = "";

  // 🔥 Priority logic
  if (searchText) {
    invoiceNo = searchText;
  } else if (selectedCustomer) {
    custId = selectedCustomer._id;
  }

  const response = await getLedger(
    pageNumber,
    size,
    invoiceNo,
    custId
  );

  setLedgers(response.data.data || []);
  setTotalPages(response.data.totalPages || 0);
  setPage(pageNumber);
};
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure to delete this invoice?")) {
      try {
        // Call API to delete
        await deleteLedger(id); // replace with your API function
    
        // Update local state to remove deleted record
        setLedgers((prev) => prev.filter((inv) => inv._id !== id));
    
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
    <h3 className="m-0">Invoices</h3>

    <button
      className="btn btn-primary"
      onClick={() => navigate("/ledgers/add")}
    >
      Add Entry
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

      <div className="card shadow">
        <div className="card-body table-responsive">

          <table className="table table-bordered table-hover align-middle text-center">

            <thead className="table-dark">
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Description</th>
                <th>Cash</th>
                <th>Gold (g)</th>
                <th>TTB</th>
                <th>Bank</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {ledgers.map((item) => {

                const getEntry = (type) =>
                  item.entries.find((e) => e.type === type) || {};

                const cash = getEntry("cash");
                const gold = getEntry("gold_raw");
                const ttb = getEntry("gold_bar");
                const bank = getEntry("bank");

                return (
                  <tr key={item._id}>

                    {/* DATE */}
                    <td>
                      {new Date(item.date).toLocaleDateString()}
                    </td>

                    {/* CUSTOMER */}
                    <td className="fw-bold">
                      {item.name}
                    </td>

                    {/* DESCRIPTION */}
                    <td>{item.description}</td>

                    {/* CASH */}
                    <td>
                      <span className="text-success">C:{cash.credit || 0}</span>
                      <br />
                      <span className="text-danger">D:{cash.debit || 0}</span>
                    </td>

                    {/* GOLD GRAMS */}
                    <td>
                      <span className="text-success">C:{gold.credit || 0}</span>
                      <br />
                      <span className="text-danger">D:{gold.debit || 0}</span>
                    </td>

                    {/* TTB */}
                    <td>
                      <span className="text-success">C:{ttb.credit || 0}</span>
                      <br />
                      <span className="text-danger">D:{ttb.debit || 0}</span>
                    </td>

                    {/* BANK */}
                    <td>
                      <span className="text-success">C:{bank.credit || 0}</span>
                      <br />
                      <span className="text-danger">D:{bank.debit || 0}</span>
                    </td>

                    {/* ACTIONS */}
                    <td>
                      <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => window.location.href = `/ledger/edit/${item._id}`}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => alert(JSON.stringify(item, null, 2))}
                      >
                        View
                      </button>
                    </td>

                  </tr>
                );
              })}

            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
}

export default Ledgers;