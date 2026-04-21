import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { createLedger, getInvoiceNumber, getLedgerById, updateLedger } from "../services/ledgerService";
import { getCustomers } from "../services/customerService";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getShops } from "../services/userService";

export default function AddLedger() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [invoiceId, setInvoiceId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [loading, setLoading] = useState(false);
    const [shops, setShops] = useState([]);

  const emptyEntry = {
  credit: "",
  debit: "",
  rate: "",
  value: ""
};
  const [form, setForm] = useState({
    date: "",
    name: "",
    description: "",
    shop: "",
    isOfficial: true,
    cash: emptyEntry,
    gold_raw: emptyEntry,
    gold_bar_1tt: emptyEntry,
    silver_raw: emptyEntry,
    silver_bar_kg: emptyEntry,
    bank: emptyEntry
  });
    useEffect(() => {
      fetchShops();
    }, []);
    const fetchShops = async () => {
      const response = await getShops();
      setShops(response.data.data || []);
    };
  useEffect(() => {
  if (!isEditMode) {
    const today = new Date().toISOString().split("T")[0];
    setForm((prev) => ({ ...prev, date: today }));
  }
}, []);
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
// ------------------ Edit Invoice ------------------
  useEffect(() => {

    if (isEditMode) {
      loadInvoice();
    }

  }, [id]);
  // useEffect(() => {
  // if (!isEditMode) {
  //     loadInvoiceNumber();
  //   }
  // }, [isEditMode]);
  useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (user?.role === "EMPLOYEE") {
    // ✅ set form value
    setForm(prev => ({
      ...prev,
      shopId: user.shopId
    }));
    if(!isEditMode){
        handleShopChange(user.shopId);
    }
    
  }
}, []);
  const handleShopChange = async (shopId) => {
    //setSelectedShop(shopId);

      if (!shopId) {
        setInvoiceNumber("");
        return;
      }
    // ✅ set form value
    setForm(prev => ({
      ...prev,
      shop: shopId
    }));
    try {
      const res = await getInvoiceNumber(shopId); // API call
      setInvoiceNumber(res.data.invoiceNumber);
    } catch (err) {
      console.error(err);
    }
  };

  const loadInvoice = async () => {
      const res = await getLedgerById(id);
    const inv = res.data.data;

    setSelectedCustomer(inv.name);
    setCustomerSearch(inv.name);

    const newForm = {
      date: inv.date?.split("T")[0],
      name: inv.name || "",
      description: inv.description || "",
      shop: inv.shop || "",
      isOfficial : inv.isOfficial,

      cash: { ...emptyEntry },
      gold_raw: { ...emptyEntry },
      gold_bar_1tt: { ...emptyEntry },
      silver_raw: { ...emptyEntry },
      silver_bar_kg: { ...emptyEntry },
      bank: { ...emptyEntry }
    };

    inv.entries.forEach((e) => {
      const mapped = {
        credit: e.credit || 0,
        debit: e.debit || 0,
        rate: e.rate || 0,
        value: e.value || 0
      };

      switch (e.type) {
        case "cash":
          newForm.cash = mapped;
          break;

        case "gold_raw":
          newForm.gold_raw = mapped;
          break;

        case "gold_bar_1tt":
        case "gold_bar":
          newForm.gold_bar_1tt = mapped;
          break;

        case "silver_raw":
          newForm.silver_raw = mapped;
          break;

        case "silver_bar_kg":
        case "silver_bar":
          newForm.silver_bar_kg = mapped;
          break;

        case "bank":
          newForm.bank = mapped;
          break;

        default:
          break;
      }
    });
    setForm(newForm);
    setInvoiceNumber(inv.invoiceNumber)
    setInvoiceId(inv._id);
};
// useEffect(() => {
//   const total = calculateGoldValue(form);

//   setForm((prev) => ({
//     ...prev,
//     goldValue: total
//   }));
// }, [
//   form.gold_raw,
//   form.gold_bar_1tt,
//   form.goldRate
// ]);
const TTB_GRAMS = 116.64;

const calculateGoldValue = (form) => {
  const raw =
    (form.gold_raw.credit || 0) - (form.gold_raw.debit || 0);

  const bar =
    (form.gold_bar_1tt.credit || 0) -
    (form.gold_bar_1tt.debit || 0);

  const totalGrams = raw + bar * TTB_GRAMS;

  return totalGrams * (form.goldRate || 0);
};
const SILVER_BAR_GRAMS = 1000; // 1 KG = 1000 grams
// useEffect(() => {
//   const total = calculateSilverValue(form);

//   setForm((prev) => ({
//     ...prev,
//     silverValue: total
//   }));
// }, [
//   form.silver_raw,
//   form.silver_bar_kg,
//   form.silverRate
// ]);
const calculateSilverValue = (form) => {
  const raw =
    (form.silver_raw.credit || 0) - (form.silver_raw.debit || 0);

  const bar =
    (form.silver_bar_kg.credit || 0) -
    (form.silver_bar_kg.debit || 0);

  const totalGrams = raw + bar * SILVER_BAR_GRAMS;

  return totalGrams * (form.silverRate || 0);
};
  const handleChange = (section, field, value) => {
    setForm({
      ...form,
      [section]: {
        ...form[section],
        [field]: value
      }
    });
  };

  const buildEntries = () => {
    const entries = [];

    const pushIf = (type, data, extra = {}) => {
      if (data.credit || data.debit) {
        entries.push({
          type,
          ...extra,
          credit: Number(data.credit || 0),
          debit: Number(data.debit || 0),
          rate: Number(data.rate || 0),
          value: Number(data.value || 0)
        });
      }
    };

    pushIf("cash", form.cash);
    pushIf("gold_raw", form.gold_raw);
    pushIf("gold_bar", form.gold_bar_1tt, { subType: "1tt" });
    pushIf("silver_raw", form.silver_raw);
    pushIf("silver_bar", form.silver_bar_kg, { subType: "kg" });
    pushIf("bank", form.bank);

    return entries;
  };

  const handleSubmit = async () => {
    try{
      setLoading(true); // 🔥 start loader
      const payload = {
        date: form.date,
        name: selectedCustomer?.name || form.name,
        //customerId: selectedCustomer?._id,
        description: form.description,
        isOfficial : form.isOfficial,
        shop:form.shop,
        entries: buildEntries()
      };

      if (isEditMode) {
      
        await updateLedger(id, payload);
        setInvoiceId(id);
        alert("Ledger updated");
        
      } else {

        let invoice = await createLedger(payload);
        setInvoiceId(invoice.data.data._id);
        alert("Ledger created");

      }
      navigate("/ledgers");
    }catch (error) {
        console.error(error);
        alert("Something went wrong");

      } finally {
        setLoading(false); // 🔥 always stop loader
      }
    
  };

  return (
    <div className="container mt-4">

  {/* ===== CARD ===== */}
  <div className="card shadow">
    <div className="card-header bg-primary text-white">
      <h3>{isEditMode ? "Edit Ledger" : "Create Ledger"}</h3>
      {invoiceNumber && (
        <div className="row mb-3">
          <div className="col-md-6">
            <strong>Invoice Number: </strong> {invoiceNumber}
          </div>
          
        </div>
      )}
    </div>

    <div className="card-body">

      {/* ===== TOP FIELDS ===== */}
      <div className="row mb-3">
        <div className="col-md-3">
          <label className="form-label">Date</label>
          <div className="w-100">
            <DatePicker
              selected={form.date ? new Date(form.date) : null}
              onChange={(date) =>
                setForm({
                  ...form,
                  date: date ? date.toLocaleDateString("en-CA") : null
                })
              }
              className="form-control w-100"
              wrapperClassName="w-100"
              dateFormat="dd-MMM-yyyy"
              placeholderText="Select Date"
            />
          </div>
        </div>
        {/* SHOP */}

        <div className="col-md-4">

          <label className="form-label"><strong>Shop</strong></label>

          <select
            className="form-control"
            name="shopId"
            value={form.shop}
            onChange={(e) => handleShopChange(e.target.value )}
            disabled={JSON.parse(localStorage.getItem("user"))?.role === "EMPLOYEE"}
          >

            <option value="">Select Shop</option>

            {shops.map((shop) => (
              <option key={shop._id} value={shop._id}>
                {shop.name}
              </option>
            ))}

          </select>

        </div>
        <div className="col-md-5 position-relative">
          <label className="form-label">Customer</label>
          <input
            className="form-control"
            placeholder="Search Customer..."
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setSelectedCustomer(null);
            }}
          />

          {/* Dropdown */}
          {customerResults.length > 0 && (
            <ul className="list-group position-absolute w-100" style={{ zIndex: 1000 }}>
              {customerResults.map((c) => (
                <li
                  key={c._id}
                  className="list-group-item list-group-item-action"
                  onClick={() => {
                    setSelectedCustomer(c);
                    setCustomerSearch(c.name);
                    setCustomerResults([]);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {c.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="row mb-3">

  {/* Description */}
  <div className="col-md-6">
    <label className="form-label">Description</label>
    <input
      className="form-control"
      placeholder="Enter description"
      value={form.description}
      onChange={(e) =>
        setForm({ ...form, description: e.target.value })
      }
    />
  </div>

  {/* Status */}
  <div className="col-md-4">
    <label className="form-label">Status</label>

    <div className="d-flex align-items-center gap-4 mt-">

      <div className="form-check form-switch m-0">
        <input
          className="form-check-input"
          type="checkbox"
          style={{ transform: "scale(1.5)", transformOrigin: "left center" }}
          checked={form.isOfficial || false}
          onChange={(e) =>
            setForm({ ...form, isOfficial: e.target.checked })
          }
        />
      </div>

      <span
        className={`badge ${
          form.isOfficial ? "bg-success" : "bg-danger"
        }`}
      >
        {form.isOfficial ? "Official" : "Unofficial"}
      </span>

    </div>
  </div>

</div>

      

<div className="card mb-3">

  {/* HEADER */}
  <div className="card-header bg-warning d-flex justify-content-between align-items-center">
    <strong>🪙 Gold</strong>

    {/* <div className="d-flex gap-2">
      <input
        type="number"
        className="form-control form-control-sm"
        style={{ width: "120px" }}
        placeholder="Rate/g"
        value={form.gold_raw.rate}
        onChange={(e) =>
          handleChange("gold_raw", "rate", e.target.value)
        }
      />

      <input
        className="form-control form-control-sm"
        style={{ width: "150px" }}
        value={form.gold_raw.value}
        placeholder="Total Price"
        onChange={(e) =>
          handleChange("gold_raw", "value", e.target.value)
        }
      />
    </div> */}
  </div>

  {/* BODY */}
  <div className="card-body">

    <div className="row g-3">

      {/* 🔹 GOLD RAW */}
      <div className="col-md-6">
        <div className="border rounded p-3 bg-light">

          <h6 className="text-warning mb-3">
            ⚖️ Gold Raw (grams)
          </h6>

          <div className="row g-2">
            <div className="col-3">
              <label className="form-label">Credit</label>
              <input
                className="form-control"
                placeholder="Credit"
                value={form.gold_raw.credit}
                onChange={(e) =>
                  handleChange("gold_raw", "credit", e.target.value)
                }
              />
            </div>

            <div className="col-3">
              <label className="form-label">Debit</label>
              <input
                className="form-control"
                placeholder="Debit"
                value={form.gold_raw.debit}
                onChange={(e) =>
                  handleChange("gold_raw", "debit", e.target.value)
                }
              />
            </div>
            <div className="col-3">
              <label className="form-label">Rate/g</label>
              <input
                className="form-control "
                //style={{ width: "150px" }}
                value={form.gold_raw.rate}
                placeholder="Rate/g"
                onChange={(e) =>
                  handleChange("gold_raw", "rate", e.target.value)
                }
                />
            </div>
            <div className="col-3">
              <label className="form-label">Price</label>
              <input
                className="form-control "
                //style={{ width: "150px" }}
                value={form.gold_raw.value}
                placeholder="Total Price"
                onChange={(e) =>
                  handleChange("gold_raw", "value", e.target.value)
                }
                />
            </div>
          </div>

        </div>
      </div>

      {/* 🔹 GOLD BAR */}
      <div className="col-md-6">
        <div className="border rounded p-3 bg-white shadow-sm">

          <h6 className="text-primary mb-3">
            🪙 Gold Bar (TTB)
          </h6>

          <div className="row g-2">
            <div className="col-3">
              <label className="form-label">Credit</label>
              <input
                className="form-control"
                placeholder="Credit"
                value={form.gold_bar_1tt.credit}
                onChange={(e) =>
                  handleChange("gold_bar_1tt", "credit", e.target.value)
                }
              />
            </div>

            <div className="col-3">
              <label className="form-label">Debit</label>
              <input
                className="form-control"
                placeholder="Debit"
                value={form.gold_bar_1tt.debit}
                onChange={(e) =>
                  handleChange("gold_bar_1tt", "debit", e.target.value)
                }
              />
            </div>
            <div className="col-3">
              <label className="form-label">Rate/g</label>
              <input
                className="form-control "
                //style={{ width: "150px" }}
                value={form.gold_bar_1tt.rate}
                placeholder="Rate/g"
                onChange={(e) =>
                  handleChange("gold_bar_1tt", "rate", e.target.value)
                }
                />
            </div>
            <div className="col-3">
              <label className="form-label">Price</label>
              <input
                className="form-control "
                //style={{ width: "150px" }}
                value={form.gold_bar_1tt.value}
                placeholder="Total Price"
                onChange={(e) =>
                  handleChange("gold_bar_1tt", "value", e.target.value)
                }
                />
            </div>
          </div>

        </div>
      </div>

    </div>

  </div>
</div>
<div className="card mb-3">

  {/* HEADER */}
  <div
  className="card-header d-flex justify-content-between align-items-center"
      style={{
        background: "linear-gradient(135deg, #f5f5f5, #dcdcdc)",
        color: "#333"
      }}
    >
    <strong>
       🥈 Silver
    </strong>

      </div>

  {/* BODY */}
  <div className="card-body">

    <div className="row g-3">

      {/* 🔹 SILVER RAW */}
      <div className="col-md-6">
        <div className="border rounded p-3 bg-light">

          <h6 className="mb-3" style={{ color: "#6c757d" }}>
           ⚪ Silver Raw (grams)
          </h6>

          <div className="row g-2">
            <div className="col-3">
              <label className="form-label">Credit</label>
              <input
                //type="number"
                className="form-control"
                placeholder="Credit"
                value={form.silver_raw.credit}
                onChange={(e) =>
                  handleChange("silver_raw", "credit", e.target.value)
                }
              />
            </div>

            <div className="col-3">
              <label className="form-label">Debit</label>
              <input
                //type="number"
                className="form-control"
                placeholder="Debit"
                value={form.silver_raw.debit}
                onChange={(e) =>
                  handleChange("silver_raw", "debit", e.target.value)
                }
              />
            </div>
            <div className="col-3">
              <label className="form-label">Rate/g</label>
              <input
                className="form-control "
                //style={{ width: "150px" }}
                value={form.silver_raw.rate}
                placeholder="Rate/g"
                onChange={(e) =>
                  handleChange("silver_raw", "rate", e.target.value)
                }
                />
            </div>
            <div className="col-3">
              <label className="form-label">Price</label>
              <input
                className="form-control "
                //style={{ width: "150px" }}
                value={form.silver_raw.value}
                placeholder="Total Price"
                onChange={(e) =>
                  handleChange("silver_raw", "value", e.target.value)
                }
                />
            </div>
          </div>

        </div>
      </div>

      {/* 🔹 SILVER BAR */}
      <div className="col-md-6">
        <div className="border rounded p-3 bg-white shadow-sm">

          <h6 className="mb-3 text-secondary">
            ⬜ Silver Bar (1 KG)
          </h6>

          <div className="row g-2">
            <div className="col-3">
              <label className="form-label">Credit</label>
              <input
                //type="number"
                className="form-control"
                placeholder="Credit"
                value={form.silver_bar_kg.credit}
                onChange={(e) =>
                  handleChange("silver_bar_kg", "credit", e.target.value)
                }
              />
            </div>

            <div className="col-3">
              <label className="form-label">Debit</label>
              <input
                //type="number"
                className="form-control"
                placeholder="Debit"
                value={form.silver_bar_kg.debit}
                onChange={(e) =>
                  handleChange("silver_bar_kg", "debit", e.target.value)
                }
              />
            </div>
            <div className="col-3">
              <label className="form-label">Rate/g</label>
              <input
                className="form-control "
                //style={{ width: "150px" }}
                value={form.silver_bar_kg.rate}
                placeholder="Rate/g"
                onChange={(e) =>
                  handleChange("silver_bar_kg", "rate", e.target.value)
                }
                />
            </div>
            <div className="col-3">
              <label className="form-label">Price</label>
              <input
                className="form-control "
                //style={{ width: "150px" }}
                value={form.silver_bar_kg.value}
                placeholder="Total Price"
                onChange={(e) =>
                  handleChange("silver_bar_kg", "value", e.target.value)
                }
                />
            </div>
          </div>

        </div>
      </div>

    </div>

  </div>
</div>
{/* ===== CASH ===== */}
      <div className="card mb-3">
        <div className="card-header bg-info">💰 Cash</div>
        <div className="card-body row">
          <div className="col-md-6">
            <input
              className="form-control"
              placeholder="Credit"
              value={form.cash.credit}
              onChange={(e) => handleChange("cash", "credit", e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <input
              className="form-control"
              placeholder="Debit"
              value={form.cash.debit}
              onChange={(e) => handleChange("cash", "debit", e.target.value)}
            />
          </div>
        </div>
      </div>
      {/* ===== BANK ===== */}
      <div className="card mb-3">
        <div className="card-header bg-info">🏦 Bank</div>
        <div className="card-body row">
          <div className="col-md-6">
            <input
              className="form-control"
              placeholder="Credit"
              value={form.bank.credit}
              onChange={(e) => handleChange("bank", "credit", e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <input
              className="form-control"
              placeholder="Debit"
              value={form.bank.debit}
              onChange={(e) => handleChange("bank", "debit", e.target.value)}
            />
          </div>
        </div>
      </div>
        {loading && (
          <div className="overlay-loader">
            <div className="spinner-border text-light" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
      {/* ===== BUTTON ===== */}
      <div className="text-end">
        <button className="btn btn-success" onClick={handleSubmit}>
          {/* {loading && (
            <span className="spinner-border spinner-border-sm me-2"></span>
          )} */}
          {isEditMode ? "Update Ledger" : "Save Ledger"}
        </button>
      </div>
    </div>
  </div>

  {/* ===== PREVIEW TABLE ===== */}
  {/* <div className="card shadow mt-4">
    <div className="card-header bg-dark text-white">
      Preview
    </div>

    <div className="card-body table-responsive">
      <table className="table table-bordered table-striped text-center">
        <thead className="table-dark">
          <tr>
            <th>Date</th>
            <th>Name</th>
            <th>Cash</th>
            <th>Gold (g)</th>
            <th>TTB</th>
            <th>Bank</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>{form.date}</td>
            <td>{customerSearch || form.name}</td>

            <td>
              <span className="text-success">C: {form.cash.credit || 0}</span> /
              <span className="text-danger"> D: {form.cash.debit || 0}</span>
            </td>

            <td>
              <span className="text-success">C: {form.gold_raw.credit || 0}</span> /
              <span className="text-danger"> D: {form.gold_raw.debit || 0}</span>
            </td>

            <td>
              <span className="text-success">C: {form.gold_bar_1tt.credit || 0}</span> /
              <span className="text-danger"> D: {form.gold_bar_1tt.debit || 0}</span>
            </td>

            <td>
              <span className="text-success">C: {form.bank.credit || 0}</span> /
              <span className="text-danger"> D: {form.bank.debit || 0}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div> */}

</div>
  );
}