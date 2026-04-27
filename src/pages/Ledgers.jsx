import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteLedger, getBalance, getLedger } from "../services/ledgerService";
import Pagination from "./Pagination";
import { getCustomers } from "../services/customerService";
import { format, subDays } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

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
  const [showBanks, setShowBanks] = useState(false);

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
const getFileTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
};

// const handleExport = async () => {
//   const workbook = new ExcelJS.Workbook();
//   const sheet = workbook.addWorksheet("Ledger");

//   const totalColumns = 16;

//   // ===== BORDER STYLE =====
//   const thinBorder = {
//     top: { style: "thin", color: { argb: "FF999999" } },
//     left: { style: "thin", color: { argb: "FF999999" } },
//     bottom: { style: "thin", color: { argb: "FF999999" } },
//     right: { style: "thin", color: { argb: "FF999999" } }
//   };

//   // ================= HEADER =================

//   sheet.addRow([
//     "Date", "Invoice", "Customer", "Description",
//     "Gold", "", "TTB", "", "Silver", "", "KGB", "",
//     "Cash", "", "Bank", ""
//   ]);

//   sheet.addRow([
//     "", "", "", "",
//     "Cr", "Dr",
//     "Cr", "Dr",
//     "Cr", "Dr",
//     "Cr", "Dr",
//     "Cr", "Dr",
//     "Cr", "Dr"
//   ]);

//   // Merge header
//   sheet.mergeCells("A1:A2");
//   sheet.mergeCells("B1:B2");
//   sheet.mergeCells("C1:C2");
//   sheet.mergeCells("D1:D2");

//   [
//     ["E1","F1"], ["G1","H1"], ["I1","J1"],
//     ["K1","L1"], ["M1","N1"], ["O1","P1"]
//   ].forEach(([s, e]) => sheet.mergeCells(`${s}:${e}`));

//   // Header style
//   [1, 2].forEach(r => {
//     sheet.getRow(r).eachCell(cell => {
//       cell.font = { bold: true };
//       cell.alignment = { horizontal: "center", vertical: "middle" };
//       cell.border = thinBorder;
//     });
//   });

//   sheet.views = [{ state: "frozen", ySplit: 2 }];

//   // ================= DATA =================

//   ledgers.forEach(item => {

//     const row = sheet.addRow([
//       item.date ? new Date(item.date).toLocaleDateString() : "",
//       item.invoiceNumber,
//       item.customer,
//       item.description,

//       item.gold?.credit || 0,
//       item.gold?.debit || 0,

//       item.ttb?.credit || 0,
//       item.ttb?.debit || 0,

//       item.silver?.credit || 0,
//       item.silver?.debit || 0,

//       item.silver_bar?.credit || 0,
//       item.silver_bar?.debit || 0,

//       item.cash?.credit || 0,
//       item.cash?.debit || 0,

//       item.bank?.credit || 0,
//       item.bank?.debit || 0
//     ]);

//     // ===== ROW STYLING =====
//     for (let i = 1; i <= totalColumns; i++) {
//       const cell = row.getCell(i);

//       cell.border = thinBorder;

//       cell.alignment = {
//         horizontal: i <= 4 ? "left" : "center",
//         vertical: "middle"
//       };

//       if ([5,7,9,11,13,15].includes(i)) {
//         cell.font = { color: { argb: "FF008000" } };
//       }

//       if ([6,8,10,12,14,16].includes(i)) {
//         cell.font = { color: { argb: "FFFF0000" } };
//       }

//       if ([5,6,7,8].includes(i)) {
//         cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3CD" } };
//       }

//       if ([9,10,11,12].includes(i)) {
//         cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEBEEF0" } };
//       }

//       if ([13,14].includes(i)) {
//         cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEACAB3" } };
//       }

//       if ([15,16].includes(i)) {
//         cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF73A3E7" } };
//       }
//     }

//     // ================= TOTAL =================
//     if (item.isTotal) {
//       for (let i = 1; i <= totalColumns; i++) {
//         const cell = row.getCell(i);

//         cell.font = { bold: true };
//         cell.border = thinBorder;
//         cell.fill = {
//           type: "pattern",
//           pattern: "solid",
//           fgColor: { argb: "FFFFE699" }
//         };
//       }

//       // ================= CLOSING BALANCE =================
// const closingRow = sheet.addRow([
//   "", "", "", "",
//   item.gold?.closing || 0, item.gold?.closingDr || "",
//   item.ttb?.closing || 0, item.ttb?.closingDr || "",
//   item.silver?.closing || 0, item.silver?.closingDr || "",
//   item.silver_bar?.closing || 0, item.silver_bar?.closingDr || "",
//   item.cash?.closing || 0, item.cash?.closingDr || "",
//   item.bank?.closing || 0, item.bank?.closingDr || ""
// ]);

// const r = closingRow.number;

// // merge
// sheet.mergeCells(`A${r}:C${r}`);
// //closingRow.getCell(4).value = "Closing Balance";

// // IMPORTANT: ONLY style first cell (A)
// const cell = closingRow.getCell(4);

// cell.value = "Closing Balance";
// cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
// cell.fill = {
//   type: "pattern",
//   pattern: "solid",
//   fgColor: { argb: "FF343A40" }
// };

// // THIS is the key fix
// cell.alignment = {
//   horizontal: "center",   // makes it appear centered across A-D
//   vertical: "middle"
// };

// // borders for merged area
// for (let i = 1; i <= 4; i++) {
//   //closingRow.getCell(i).border = thinBorder;
//   const cell = closingRow.getCell(i);

//   cell.fill = {
//     type: "pattern",
//     pattern: "solid",
//     fgColor: { argb: "FF343A40" }
//   };

//   cell.font = {
//     bold: true,
//     color: { argb: "FFFFFFFF" }
//   };

//   cell.alignment = {
//     horizontal: "center",
//     vertical: "middle"
//   };

//   cell.border = thinBorder;
// }

// // data columns styling
// for (let i = 5; i <= totalColumns; i++) {
//   const c = closingRow.getCell(i);

//   c.font = { bold: true, color: { argb: "FFFFFFFF" } };
//   c.fill = {
//     type: "pattern",
//     pattern: "solid",
//     fgColor: { argb: "FF343A40" }
//   };
//   c.alignment = { horizontal: "center", vertical: "middle" };
//   c.border = thinBorder;
// }

//     }
//   });

//   // ================= COLUMN WIDTH =================

//   sheet.columns = [
//     { width: 12 },
//     { width: 12 },
//     { width: 20 },
//     { width: 40 },

//     { width: 9 }, { width: 9 },
//     { width: 9 }, { width: 9 },
//     { width: 9 }, { width: 9 },
//     { width: 9 }, { width: 9 },
//     { width: 9 }, { width: 9 },
//     { width: 9 }, { width: 9 }
//   ];

//   sheet.getColumn(4).alignment = { wrapText: true };

//   // ================= EXPORT =================

//   const buffer = await workbook.xlsx.writeBuffer();
//   saveAs(new Blob([buffer]), "Ledger.xlsx");
// };
const handleExport = async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Ledger");

  const thinBorder = {
    top: { style: "thin", color: { argb: "FF999999" } },
    left: { style: "thin", color: { argb: "FF999999" } },
    bottom: { style: "thin", color: { argb: "FF999999" } },
    right: { style: "thin", color: { argb: "FF999999" } }
  };

  // ================= BANK DETECTION =================
  const bankSet = new Set();

  ledgers.forEach(item => {
    Object.keys(item || {}).forEach(k => {
      if (k.startsWith("bank_")) bankSet.add(k);
    });
  });

  const banks = Array.from(bankSet);

  // ================= HEADER =================
  const header1 = [
    "Date", "Invoice", "Customer", "Description",
    "Gold", "", "TTB", "", "Silver", "", "KGB", "",
    "Cash", "", "BANK TOTAL", ""
  ];

  const header2 = [
    "", "", "", "",
    "Cr", "Dr",
    "Cr", "Dr",
    "Cr", "Dr",
    "Cr", "Dr",
    "Cr", "Dr",
    "Cr", "Dr"
  ];

  banks.forEach(b => {
    const name = b.replace("bank_", "").toUpperCase();
    header1.push(name, "");
    header2.push("Cr", "Dr");
  });

  sheet.addRow(header1);
  sheet.addRow(header2);

  // ================= MERGE HEADER =================
  sheet.mergeCells("A1:A2");
  sheet.mergeCells("B1:B2");
  sheet.mergeCells("C1:C2");
  sheet.mergeCells("D1:D2");

  let col = 5;

  for (let i = 0; i < 6; i++) {
    sheet.mergeCells(1, col, 1, col + 1);
    col += 2;
  }

  banks.forEach(() => {
    sheet.mergeCells(1, col, 1, col + 1);
    col += 2;
  });

  // ================= HEADER STYLE =================
  [1, 2].forEach(r => {
    sheet.getRow(r).eachCell(cell => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = thinBorder;
    });
  });

  sheet.views = [{ state: "frozen", ySplit: 2 }];

  // ================= DATA =================
  ledgers.forEach(item => {

    let bankCr = 0;
    let bankDr = 0;

    banks.forEach(b => {
      bankCr += Number(item[b]?.credit || 0);
      bankDr += Number(item[b]?.debit || 0);
    });

    const rowData = [
      item.date ? new Date(item.date).toLocaleDateString() : "",
      item.invoiceNumber,
      item.customer,
      item.description,

      item.gold?.credit || 0,
      item.gold?.debit || 0,

      item.ttb?.credit || 0,
      item.ttb?.debit || 0,

      item.silver?.credit || 0,
      item.silver?.debit || 0,

      item.silver_bar?.credit || 0,
      item.silver_bar?.debit || 0,

      item.cash?.credit || 0,
      item.cash?.debit || 0,

      bankCr,
      bankDr
    ];

    banks.forEach(b => {
      rowData.push(
        item[b]?.credit || 0,
        item[b]?.debit || 0
      );
    });

    const row = sheet.addRow(rowData);

    row.eachCell(cell => {
      cell.border = thinBorder;
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // ================= TOTAL ROW =================
    if (item.isTotal) {
      row.eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFE699" }
        };
      });

      // ================= CLOSING ROW =================
      const closingData = [
        "", "", "", "Closing Balance",

        item.gold?.closing || 0,
        item.gold?.closingDr || "",

        item.ttb?.closing || 0,
        item.ttb?.closingDr || "",

        item.silver?.closing || 0,
        item.silver?.closingDr || "",

        item.silver_bar?.closing || 0,
        item.silver_bar?.closingDr || "",

        item.cash?.closing || 0,
        item.cash?.closingDr || "",

        item.bank?.closing || 0,
        item.bank?.closingDr || ""
      ];

      banks.forEach(b => {
        closingData.push(
          item[b]?.closing || 0,
          item[b]?.closingDr || ""
        );
      });

      const closingRow = sheet.addRow(closingData);
      const r = closingRow.number;

      // ================= FIXED ALIGNMENT + COLOR =================

      sheet.mergeCells(`A${r}:D${r}`);

      // style merged area A-D properly
      for (let i = 1; i <= 4; i++) {
        const cell = sheet.getCell(r, i);

        cell.value = i === 4 ? "Closing Balance" : "";

        cell.font = {
          bold: true,
          color: { argb: "FFFFFFFF" }
        };

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF343A40" }
        };

        cell.alignment = {
          horizontal: "center",
          vertical: "middle"
        };

        cell.border = thinBorder;
      }

      // style data columns
      for (let i = 5; i <= closingData.length; i++) {
        const cell = sheet.getCell(r, i);

        cell.font = {
          bold: true,
          color: { argb: "FFFFFFFF" }
        };

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF343A40" }
        };

        cell.alignment = {
          horizontal: "center",
          vertical: "middle"
        };

        cell.border = thinBorder;
      }
    }
  });

  // ================= COLUMN WIDTH =================
  const columns = [
    { width: 12 },
    { width: 12 },
    { width: 20 },
    { width: 40 }
  ];

  for (let i = 0; i < 6; i++) {
    columns.push({ width: 9 }, { width: 9 });
  }

  banks.forEach(() => {
    columns.push({ width: 9 }, { width: 9 });
  });

  sheet.columns = columns;

  sheet.getColumn(4).alignment = { wrapText: true };

  // ================= EXPORT =================
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Ledger_${getFileTimestamp()}.xlsx`);
};
const bankEntries = Object.entries(balance || {}).filter(([k]) =>
  k.startsWith("bank_")
);
  return (
    <div className="container mt-3">

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3">

  {/* LEFT */}
  <h3 className="mb-0">Ledgers</h3>

  {/* RIGHT */}
  <div className="d-flex gap-2">
    
    <button
      className="btn btn-primary"
      onClick={() => navigate("/ledgers/add")}
    >
      Add Entry
    </button>
    <button
      className="btn btn-success"
      onClick={handleExport}
    >
      Export Excel
    </button>

  </div>

</div>
      {balance && (
        <div>
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
          <div className="col-12 mb-2">
  <button
    className={`btn w-100 d-flex justify-content-between align-items-center shadow-sm ${
      showBanks ? "btn-info text-white" : "btn-light"
    }`}
    style={{
      border: "1px solid #dee2e6",
      padding: "10px 14px",
      fontWeight: "500",
      transition: "all 0.2s ease"
    }}
    onClick={() => setShowBanks(!showBanks)}
  >
    {/* LEFT */}
    <div className="d-flex align-items-center gap-2">
      <span style={{ fontSize: "18px" }}>🏦</span>
      <span>Bank Details</span>
    </div>

    {/* RIGHT */}
    <div className="d-flex align-items-center gap-2">
      <span style={{ fontSize: "13px" }}>
        {showBanks ? "Collapse" : "Expand"}
      </span>

      <span
        style={{
          fontSize: "18px",
          transition: "transform 0.25s ease",
          transform: showBanks ? "rotate(180deg)" : "rotate(0deg)"
        }}
      >
        ⌄
      </span>
    </div>
  </button>
</div>
          {showBanks && (
  <div className="row">
    {Object.entries(balance)
      .filter(([k]) => k.startsWith("bank_"))
      .map(([key, value]) => {
        const name = key.replace("bank_", "").toUpperCase();

        return (
          <div className="col-md-2 col-6 mb-2" key={key}>
            <div className="card border-0 bg-primary text-white shadow-sm">
              <div className="card-body text-center p-2">
                <div style={{ fontSize: "12px" }}>🏦 {name}</div>
                <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                  {value}
                </div>
              </div>
            </div>
          </div>
        );
      })}
  </div>
)}
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

                <th rowSpan="2" style={{width:'10%'}}>Action</th>
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
                    className={isTotal ? "table-warning fw-bold" : !item.isOfficial? "table-danger":""}
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
                    <td>
                      {!isTotal && (
                        <>
                          <button
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => navigate(`/ledgers/edit/${item.id}`)}
                          >
                            Edit
                          </button>

                          {/* <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(item._id)}
                          >
                            Delete
                          </button> */}
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
                      <td colSpan="2">{item.bank_muscat?.closing || 0}</td>
                      <td colSpan="2">{item.bank_nbo?.closing || 0}</td>
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