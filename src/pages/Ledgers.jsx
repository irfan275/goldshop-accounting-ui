import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteLedger, getBalance, getLedger } from "../services/ledgerService";
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
  const [balance, setBalance] = useState(null);
  const [ledgers, setLedgers] = useState([]);

  // ---------------- LOAD LEDGERS ----------------
  useEffect(() => {
    loadLedgers(1);
  }, []);

  const loadLedgers = async (pageNumber = 1) => {
    let invoiceNo = "";
    let customer = "";

    if (searchText) {
      invoiceNo = searchText;
    } else if (selectedCustomer) {
      customer = selectedCustomer.name;
    }

    const response = await getLedger(
      invoiceNo,
      customer,
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
  useEffect(() => {
    loadBalance();
  }, []);
  const loadBalance = async () => {
    const res = await getBalance(); // new API
    setBalance(res.data);
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
      {balance && (
        <div className="row mb-3">

          {/* GOLD */}
          <div className="col-md-2">
            <div className="card shadow border-0 bg-warning text-dark">
              <div className="card-body text-center">
                <h6 className="mb-1">🪙 Gold (g)</h6>
                <h4 className="mb-0">{balance.gold_raw}</h4>
              </div>
            </div>
          </div>

          {/* TTB */}
          <div className="col-md-2">
            <div className="card shadow border-0 bg-info text-white">
              <div className="card-body text-center">
                <h6 className="mb-1">🪙 TTB</h6>
                <h4 className="mb-0">{balance.gold_bar}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card shadow border-0 bg-primary   text-dark">
              <div className="card-body text-center">
                <h6 className="mb-1">⚪ Silver (g)</h6>
                <h4 className="mb-0">{balance.silver_raw}</h4>
              </div>
            </div>
          </div>
          {/* TTB */}
          <div className="col-md-2">
            <div className="card shadow border-0 bg-info text-white">
              <div className="card-body text-center">
                <h6 className="mb-1">⬜ S-KGB</h6>
                <h4 className="mb-0">{balance.silver_bar}</h4>
              </div>
            </div>
          </div>
          {/* CASH */}
          <div className="col-md-2">
            <div className="card shadow border-0 bg-success text-white">
              <div className="card-body text-center">
                <h6 className="mb-1">💰 Cash</h6>
                <h4 className="mb-0">{balance.cash}</h4>
              </div>
            </div>
          </div>
          {/* BANK */}
          <div className="col-md-2">
            <div className="card shadow border-0 bg-primary text-white">
              <div className="card-body text-center">
                <h6 className="mb-1">🏦 Bank</h6>
                <h4 className="mb-0">{balance.bank}</h4>
              </div>
            </div>
          </div>

        </div>
      )}
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
            <ul className="list-group position-absolute w-100 shadow" style={{
              zIndex: 9999,
              maxHeight: "200px",
              overflowY: "auto",
              background: "white"
            }}>
              {customerResults.map((c) => (
                <li
                  key={c._id}
                  className="list-group-item list-group-item-action"
                  onClick={() => handleCustomerSelection(c)}
                >
                  {c.name}  {c.civilId}
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
            onChange={(date) => setFromDate(date)}
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
            Search
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

          <table className="table table-bordered table-hover text-center align-middle">

            {/* HEADER */}
            <thead className="table-dark">
              <tr>
                <th rowSpan="2">Date</th>
                <th rowSpan="2">Invoice No</th>
                <th rowSpan="2">Customer</th>
                <th rowSpan="2" style={{width:'25%'}}>Description</th>

                <th colSpan="2">Gold</th>
                <th colSpan="2">TTB</th>
                <th colSpan="2">Silver</th>
                <th colSpan="2">KGB</th>
                <th colSpan="2">Cash</th>
                <th colSpan="2">Bank</th>

                <th rowSpan="2" style={{width:'12%'}}>Action</th>
              </tr>

              <tr>
                <th className="text-success">Cr</th>
                <th className="text-danger">Dr</th>

                <th className="text-success">Cr</th>
                <th className="text-danger">Dr</th>

                <th className="text-success">Cr</th>
                <th className="text-danger">Dr</th>

                <th className="text-success">Cr</th>
                <th className="text-danger">Dr</th>

                <th className="text-success">Cr</th>
                <th className="text-danger">Dr</th>
                <th className="text-success">Cr</th>
                <th className="text-danger">Dr</th>
              </tr>
            </thead>

            {/* BODY */}
            <tbody>
              {ledgers.map((item, index) => {

                const isTotal = item.isTotal;
                const rows = [];

                // 🔹 MAIN ROW (ENTRY OR TOTAL)
                rows.push(
                  <tr
                    key={item._id || index}
                    className={isTotal ? "table-warning fw-bold" : ""}
                  >

                    {/* DATE */}
                    <td>{!isTotal ? formatDate(item.date) : ""}</td>

                    {/* Invoice Nummber */}
                    <td>{item.invoiceNumber}</td>
                    {/* CUSTOMER */}
                    <td className="fw-semibold">{item.customer}</td>

                    {/* DESCRIPTION */}
                    <td>{item.description}</td>

                    

                    {/* GOLD */}
                    <td className="bg-warning-subtle text-success">{item.gold.credit || 0}</td>
                    <td className="bg-warning-subtle text-danger">{item.gold.debit || 0}</td>

                    {/* TTB */}
                    <td className="bg-warning-subtle text-success">{item.ttb.credit || 0}</td>
                    <td className="bg-warning-subtle text-danger">{item.ttb.debit || 0}</td>

                    {/* Silver */}
                    <td className="text-success" style={{ backgroundColor: "#EBEEF0" }} >{item.silver.credit || 0}</td>
                    <td className="text-danger" style={{ backgroundColor: "#EBEEF0" }} >{item.silver.debit || 0}</td>

                    {/* KGB */}
                    <td className="text-success" style={{ backgroundColor: "#EBEEF0" }}>{item.silver_bar.credit || 0}</td>
                    <td className="text-danger" style={{ backgroundColor: "#EBEEF0" }}>{item.silver_bar.debit || 0}</td>

                    {/* CASH */}
                    <td className="text-success" style={{ backgroundColor: "#EACAB3" }}>{item.cash.credit || 0}</td>
                    <td className="text-danger" style={{ backgroundColor: "#EACAB3" }}>{item.cash.debit || 0}</td>

                    {/* BANK */}
                    <td className="text-success" style={{ backgroundColor: "#73A3E7" }}>{item.bank.credit || 0}</td>
                    <td className="text-danger" style={{ backgroundColor: "#73A3E7" }}>{item.bank.debit || 0}</td>

                    {/* ACTION */}
                    <td>
                      {!isTotal && (
                        <>
                          <button
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => navigate(`/ledgers/edit/${item.id}`)}
                          >
                            Edit
                          </button>

                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(item._id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );

                // 🔥 CLOSING ROW (RIGHT AFTER TOTAL)
                if (isTotal) {
                  rows.push(
                    <tr key={"closing-" + index} className="table-dark text-white">

                      <td colSpan="4">
                        <strong>Closing Balance</strong>
                      </td>

                      
                      <td colSpan="2">{item.gold.closing || 0}</td>
                      <td colSpan="2">{item.ttb.closing || 0}</td>
                      <td colSpan="2">{item.silver.closing || 0}</td>
                      <td colSpan="2">{item.silver_bar.closing || 0}</td>
                      <td colSpan="2">{item.cash.closing || 0}</td>
                      <td colSpan="2">{item.bank.closing || 0}</td>

                      <td></td>
                    </tr>
                  );
                }

                return rows;
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