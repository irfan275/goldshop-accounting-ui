import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteLedger, getLedger } from "../services/ledgerService";
import Pagination from "./Pagination";
import { getCustomers } from "../services/customerService";
import { format, subDays } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function Ledgers() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const today = new Date();
  const defaultFrom = subDays(today, 7);

  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(today);

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [ledgers, setLedgers] = useState([]);

  // ---------------- LOAD LEDGERS ----------------
  useEffect(() => {
    loadLedgers(1);
  }, []);

  const loadLedgers = async (pageNumber = 1) => {
    let invoiceNo = "";
    let custId = "";

    if (searchText) {
      invoiceNo = searchText;
    } else if (selectedCustomer) {
      custId = selectedCustomer._id;
    }

    const response = await getLedger(
      invoiceNo,
      custId,
      fromDate.toLocaleDateString("en-CA"),
      toDate.toLocaleDateString("en-CA")
    );

    setLedgers(response.data.data || []);
    setTotalPages(response.data.totalPages || 0);
    setPage(pageNumber);
  };

  // ---------------- DELETE ----------------
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure to delete this ledger entry?")) {
      try {
        await deleteLedger(id);
        setLedgers((prev) => prev.filter((l) => l._id !== id));
        alert("Deleted successfully!");
      } catch (err) {
        console.error(err);
        alert("Delete failed");
      }
    }
  };

  // ---------------- SEARCH ----------------
  const handleSearch = () => {
    loadLedgers(1);
  };

  const handlePageChange = (pageNumber) => {
    loadLedgers(pageNumber);
  };

  // ---------------- CUSTOMER SELECT ----------------
  const handleCustomerSelection = (c) => {
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setCustomerResults([]);
  };

  // ---------------- CUSTOMER SEARCH ----------------
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

  // ---------------- FORMAT HELPERS ----------------
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="container mt-3">

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Ledgers</h3>

        <button
          className="btn btn-primary"
          onClick={() => navigate("/ledgers/add")}
        >
          Add Entry
        </button>
      </div>

      {/* FILTERS */}
      <div className="row g-2 mb-3">

        {/* CUSTOMER */}
        <div className="col-md-3 position-relative">
          <input
            className="form-control"
            placeholder="Search Customer"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            disabled={searchText}
          />

          {customerResults.length > 0 && (
            <ul className="list-group position-absolute w-100 shadow">
              {customerResults.map((c) => (
                <li
                  key={c._id}
                  className="list-group-item list-group-item-action"
                  onClick={() => handleCustomerSelection(c)}
                >
                  {c.name} - {c.civilId}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* SEARCH */}
        <div className="col-md-3">
          <input
            className="form-control"
            placeholder="Ledger No / Ref"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* FROM DATE */}
        <div className="col-md-2">
           <DatePicker
            selected={fromDate}
            onChange={(date) => setToDate(date)}
            className="form-control"
            dateFormat="dd-MMM-yyyy"
            placeholderText="Select To Date"
          />
        </div>

        {/* TO DATE */}
        <div className="col-md-2">
           <DatePicker
            selected={toDate}
            onChange={(date) => setToDate(date)}
            className="form-control"
            dateFormat="dd-MMM-yyyy"
            placeholderText="Select To Date"
          />
        </div>

        {/* SEARCH BTN */}
        <div className="col-md-1">
          <button className="btn btn-success w-100" onClick={handleSearch}>
            Go
          </button>
        </div>

        {/* RESET */}
        <div className="col-md-1">
          <button
            className="btn btn-secondary w-100"
            onClick={() => {
              setSearchText("");
              setCustomerSearch("");
              setSelectedCustomer(null);
              setFromDate(defaultFrom);
              setToDate(today);
              loadLedgers(1);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="card shadow">
        <div className="card-body table-responsive">

          <table className="table table-bordered table-hover text-center">

            <thead className="table-dark">
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Description</th>
                <th>Cash</th>
                <th>Gold</th>
                <th>TTB</th>
                <th>Bank</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {ledgers.map((item) => {

                const getEntry = (type) =>
                  item.entries?.find((e) => e.type === type) || {};

                return (
                  <tr key={item._id} style={{ fontWeight:  item.isTotal ? 'bold' : 'normal' }}>

                    <td>{formatDate(item.createdAt || item.date)}</td>

                    <td className="fw-bold">{item.customer?.name || item.name}</td>

                    <td>{item.description}</td>

                    <td>
                      C:{item.cash.credit || 0}<br />
                      D:{item.cash.debit || 0}
                    </td>

                    <td>
                      C:{item.gold.credit || 0}<br />
                      D:{item.gold.debit || 0}
                    </td>

                    <td>
                      C:{item.ttb.credit || 0}<br />
                      D:{item.ttb.debit || 0}
                    </td>

                    <td>
                      C:{item.bank.credit || 0}<br />
                      D:{item.bank.debit || 0}
                    </td>

                    <td>
                      {!item.isTotal && (<button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => navigate(`/ledgers/edit/${item._id}`)}
                      >
                        Edit
                      </button>)}

                      {!item.isTotal && (<button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(item._id)}
                      >
                        Delete
                      </button>)}
                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>

        </div>
      </div>

      {/* PAGINATION */}
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

    </div>
  );
}

export default Ledgers;