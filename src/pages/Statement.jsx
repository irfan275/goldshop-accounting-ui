import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {  getStatement } from "../services/statementService";
import Pagination from "./Pagination";
import { getCustomers } from "../services/customerService";
import { format, subDays } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

function Statement() {
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
  const [showBanks, setShowBanks] = useState(false);

  // ---------------- LOAD LEDGERS ----------------
  // useEffect(() => {
  //   loadLedgers(1);
  // }, []);

  const loadLedgers = async (pageNumber = 1) => {
    let invoiceNo = "";
    let customer = "";

    // if (searchText) {
    //   invoiceNo = searchText;
    // } else 
      if (selectedCustomer) {
      customer = selectedCustomer._id;
    }

    const response = await getStatement(
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
const getFileTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
};

const bankEntries = Object.entries(balance || {}).filter(([k]) =>
  k.startsWith("bank_")
);
  return (
    <div className="container mt-3">

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3">

  {/* LEFT */}
  <h3 className="mb-0">Ledger Statement</h3>

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
        {/* <div className="col-md-3">
          <input
            className="form-control"
            placeholder="Ledger No / Ref"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div> */}

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
        <div className="card-body table-responsive p-0">

          <table className="table table-bordered table-hover text-center align-middle text-nowrap" style={{ minWidth: "1600px" }}>

            {/* HEADER */}
            <thead className="table-dark">
              <tr>
                <th rowSpan="2" style={{width:'6%'}}>Date</th>
                <th rowSpan="2" style={{width:'6%'}}>Invoice No</th>
                <th rowSpan="2">Customer</th>
                <th rowSpan="2" style={{width:'30%'}}>Description</th>

                <th colSpan="2">Gold</th>
                <th colSpan="2">TTB</th>
                <th colSpan="2">Silver</th>
                <th colSpan="2">KGB</th>
                <th colSpan="2">Cash</th>
                <th colSpan="2">Bank Muscat</th>
                <th colSpan="2">Bank NBO</th>
                <th colSpan="2">Bank</th>

                {/* <th rowSpan="2" style={{width:'10%'}}>Action</th> */}
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
                    <td className="text-success" style={{ backgroundColor: "#73A3E7" }}>{item.bank_muscat?.credit || 0}</td>
                    <td className="text-danger" style={{ backgroundColor: "#73A3E7" }}>{item.bank_muscat?.debit || 0}</td>
                    <td className="text-success" style={{ backgroundColor: "#73A3E7" }}>{item.bank_nbo?.credit || 0}</td>
                    <td className="text-danger" style={{ backgroundColor: "#73A3E7" }}>{item.bank_nbo?.debit || 0}</td>
                    <td className="text-success" style={{ backgroundColor: "#73A3E7" }}>{item.bank?.credit || 0}</td>
                    <td className="text-danger" style={{ backgroundColor: "#73A3E7" }}>{item.bank?.debit || 0}</td>

                    {/* ACTION */}
                    {/* <td>
                      {!isTotal && (
                        <>
                          <button
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => navigate(`/purchaseLedger/edit/${item.id}`)}
                          >
                            Edit
                          </button>
                        </>
                      )}
                    </td> */}
                  </tr>
                );

                // 🔥 CLOSING ROW (RIGHT AFTER TOTAL)
                // if (isTotal) {
                //   rows.push(
                //     <tr key={"closing-" + index} className="table-dark text-white">

                //       <td colSpan="4">
                //         <strong>Closing Balance</strong>
                //       </td>

                      
                //       <td colSpan="2">{item.gold.closing || 0}</td>
                //       <td colSpan="2">{item.ttb.closing || 0}</td>
                //       <td colSpan="2">{item.silver.closing || 0}</td>
                //       <td colSpan="2">{item.silver_bar.closing || 0}</td>
                //       <td colSpan="2">{item.cash.closing || 0}</td>
                //       <td colSpan="2">{item.bank_muscat?.closing || 0}</td>
                //       <td colSpan="2">{item.bank_nbo?.closing || 0}</td>
                //       <td colSpan="2">{item.bank.closing || 0}</td>

                //       <td></td>
                //     </tr>
                //   );
                // }

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

export default Statement;