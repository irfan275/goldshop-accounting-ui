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

  const [form, setForm] = useState({
    date: "",
    name: "",
    description: "",
    shop: "",
    cash: { credit: "", debit: "" },
    gold_raw: { credit: "", debit: "" },
    gold_bar_1tt: { credit: "", debit: "" },
    bank: { credit: "", debit: "" }
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

    // convert entries → form
    const newForm = {
      date: inv.date?.split("T")[0],
      name: inv.name || "", 
      description: inv.description || "",
      shop : inv.shop || "",
      goldRate : inv.goldRate || "",
      goldValue : inv.goldValue || "",
      cash: { credit: "", debit: "" },
      gold_raw: { credit: "", debit: "" },
      gold_bar_1tt: { credit: "", debit: "" },
      bank: { credit: "", debit: "" }
    };

    inv.entries.forEach((e) => {
      if (e.type === "cash") newForm.cash = e;
      if (e.type === "gold_raw") newForm.gold_raw = e;
      if (e.type === "gold_bar") newForm.gold_bar_1tt = e;
      if (e.type === "bank") newForm.bank = e;
    });

    setForm(newForm);
    setInvoiceNumber(inv.invoiceNumber)
    setInvoiceId(inv._id);
};
useEffect(() => {
  const total = calculateGoldValue(form);

  setForm((prev) => ({
    ...prev,
    goldValue: total
  }));
}, [
  form.gold_raw,
  form.gold_bar_1tt,
  form.goldRate
]);
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
          debit: Number(data.debit || 0)
        });
      }
    };

    pushIf("cash", form.cash);
    pushIf("gold_raw", form.gold_raw);
    pushIf("gold_bar", form.gold_bar_1tt, { subType: "1tt" });
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
        shop:form.shop,
        goldRate : form.goldRate,
        goldValue : form.goldValue,
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

        <div className="col-md-4">
          <label className="form-label">Description</label>
          <input
            className="form-control"
            placeholder="Enter description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </div>

      {/* ===== CASH ===== */}
      <div className="card mb-3">
        <div className="card-header">Cash</div>
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

<div className="card mb-3">

  {/* HEADER */}
  <div className="card-header bg-warning d-flex justify-content-between align-items-center">
    <strong>🪙 Gold</strong>

    <div className="d-flex gap-2">
      <input
        type="number"
        className="form-control form-control-sm"
        style={{ width: "120px" }}
        placeholder="Rate/g"
        value={form.goldRate}
        onChange={(e) =>
          setForm({ ...form, goldRate: Number(e.target.value) })
        }
      />

      <input
        className="form-control form-control-sm"
        style={{ width: "150px" }}
        value={form.goldValue}
        readOnly
      />
    </div>
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
            <div className="col-6">
              <input
                className="form-control"
                placeholder="Credit"
                value={form.gold_raw.credit}
                onChange={(e) =>
                  handleChange("gold_raw", "credit", e.target.value)
                }
              />
            </div>

            <div className="col-6">
              <input
                className="form-control"
                placeholder="Debit"
                value={form.gold_raw.debit}
                onChange={(e) =>
                  handleChange("gold_raw", "debit", e.target.value)
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
            <div className="col-6">
              <input
                className="form-control"
                placeholder="Credit (count)"
                value={form.gold_bar_1tt.credit}
                onChange={(e) =>
                  handleChange("gold_bar_1tt", "credit", e.target.value)
                }
              />
            </div>

            <div className="col-6">
              <input
                className="form-control"
                placeholder="Debit (count)"
                value={form.gold_bar_1tt.debit}
                onChange={(e) =>
                  handleChange("gold_bar_1tt", "debit", e.target.value)
                }
              />
            </div>
          </div>

        </div>
      </div>

    </div>

  </div>
</div>

      {/* ===== BANK ===== */}
      <div className="card mb-3">
        <div className="card-header">Bank</div>
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
  <div className="card shadow mt-4">
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
  </div>

</div>
  );
}