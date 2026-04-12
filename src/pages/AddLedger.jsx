import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { createLedger, getLedgerById, updateLedger } from "../services/ledgerService";

export default function AddLedger() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [invoiceId, setInvoiceId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [form, setForm] = useState({
    date: "",
    name: "",
    description: "",
    cash: { credit: "", debit: "" },
    gold_raw: { credit: "", debit: "" },
    gold_bar_1tt: { credit: "", debit: "" },
    bank: { credit: "", debit: "" }
  });
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
  const loadInvoice = async () => {
    const res = await getLedgerById(id);
    const inv = res.data;

    setSelectedCustomer(inv.customerId);
    setCustomerSearch(inv.customerId?.name);

    // convert entries → form
    const newForm = {
      date: inv.date?.split("T")[0],
      name: inv.name || "",
      description: inv.description || "",
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
    const payload = {
      date: form.date,
      name: selectedCustomer?.name || form.name,
      customerId: selectedCustomer?._id,
      description: form.description,
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
  };

  return (
    <div className="container mt-4">

  {/* ===== CARD ===== */}
  <div className="card shadow">
    <div className="card-header bg-primary text-white">
      <h5 className="mb-0">Ledger Entry</h5>
    </div>

    <div className="card-body">

      {/* ===== TOP FIELDS ===== */}
      <div className="row mb-3">
        <div className="col-md-3">
          <label className="form-label">Date</label>
          <input
            type="date"
            className="form-control"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
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

      {/* ===== GOLD RAW ===== */}
      <div className="card mb-3">
        <div className="card-header">Gold Raw (grams)</div>
        <div className="card-body row">
          <div className="col-md-6">
            <input
              className="form-control"
              placeholder="Credit"
              value={form.gold_raw.credit}
              onChange={(e) => handleChange("gold_raw", "credit", e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <input
              className="form-control"
              placeholder="Debit"
              value={form.gold_raw.debit}
              onChange={(e) => handleChange("gold_raw", "debit", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ===== GOLD BAR ===== */}
      <div className="card mb-3">
        <div className="card-header">Gold Bar (1 TTB)</div>
        <div className="card-body row">
          <div className="col-md-6">
            <input
              className="form-control"
              placeholder="Credit (count)"
              value={form.gold_bar_1tt.credit}
              onChange={(e) => handleChange("gold_bar_1tt", "credit", e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <input
              className="form-control"
              placeholder="Debit (count)"
              value={form.gold_bar_1tt.debit}
              onChange={(e) => handleChange("gold_bar_1tt", "debit", e.target.value)}
            />
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

      {/* ===== BUTTON ===== */}
      <div className="text-end">
        <button className="btn btn-success" onClick={handleSubmit}>
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