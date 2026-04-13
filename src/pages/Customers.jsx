import { useState, useEffect } from "react";
import { getCustomers, createCustomer, updateCustomer,deleteCustomer } from "../services/customerService";
import Pagination from "./Pagination";

function Customers() {

  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    description: "",
    type: "Resident",
  });

useEffect(() => {
  loadCustomers(1, "");
}, []);

const loadCustomers = async (pageNumber = 1, search = "") => {

  const response = await getCustomers(pageNumber, size, search);

  setCustomers(response.data.data || []);
  setTotalPages(response.data.totalPages || 0);
  setPage(pageNumber);

};
const handleSearch = () => {

  if (searchText.length > 0 && searchText.length < 3) {
    alert("Search text must be at least 3 characters");
    return;
  }

  loadCustomers(1, searchText);
};
  const openAddModal = () => {
    setForm({ name:"", phone:"", description:"",type:"Resident" });
    setEditId(null);
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setForm(customer);
    setEditId(customer._id);
    setShowModal(true);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();

  const formElement = e.currentTarget;

  if (!formElement.checkValidity()) {
      e.stopPropagation();
    } else {
      let data = {}
      if(editId){
        data =  await updateCustomer(editId, form);
      }else{
        data =await createCustomer(form);
      }
      if(!data.status){
          alert(data.message);
      }else{
        setShowModal(false);
        loadCustomers();
      }
    }
    formElement.classList.add("was-validated");
  };
const handleDelete = async (id) => {
  if (window.confirm("Are you sure to delete this customer?")) {
  try {
    // Call API to delete
    await deleteCustomer(id); // replace with your API function

    // Update local state to remove deleted record
    setCustomers((prev) => prev.filter((cust) => cust._id !== id));

    // Show success alert
    alert("Customer deleted successfully!");
  } catch (error) {
    console.error("Delete failed:", error);
    alert("Failed to delete customer.");
  }
}
};
const validateDate = (date) => {
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  return regex.test(date);
};
const handleBlur = () => {
  if (form.cardExpiry && !validateDate(form.cardExpiry)) {
    alert("Date must be in format dd/mm/yyyy");
  }
};
const handlePageChange = (pageNumber) => {
   setPage(pageNumber); 
  loadCustomers(pageNumber, searchText);
};
  return (
    <div className="container-fluid mt-4">

      <div className="d-flex justify-content-between align-items-center mb-3">

        <h3 className="mb-0">Customers</h3>

        <div className="d-flex align-items-center">

          <input
            type="text"
            className="form-control me-2"
            style={{ width: "250px" }}
            placeholder="Search customer"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <button
            className="btn btn-outline-success me-2"
            onClick={handleSearch}
          >
            Search
          </button>

          <button
            className="btn btn-primary"
            onClick={openAddModal}
          >
            Add Customer
          </button>

        </div>

      </div>

      <table className="table table-bordered table-striped">

        <thead className="table-dark">
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Description</th>
            <th>Customer Type</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {customers.map((c)=>(
            <tr key={c._id}>
              <td>{c.name}</td>
              <td>{c.phone}</td>
              <td>{c.description}</td>
              <td>{c.type}</td>
              <td>
                <button
                  className="btn btn-sm btn-warning"
                  onClick={()=>openEditModal(c)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-danger mx-2"
                  onClick={() => handleDelete(c._id)}
                >Delete</button>
              </td>
            </tr>
          ))}

        </tbody>

      </table>
      <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      {/* Modal */}

      {showModal && (

        <div className="modal show d-block">

          <div className="modal-dialog">
            <div className="modal-content">

              <div className="modal-header">
                <h5>{editId ? "Edit Customer" : "Add Customer"}</h5>
                <button
                  className="btn-close"
                  onClick={()=>setShowModal(false)}
                />
              </div>
<form className="needs-validation" noValidate onSubmit={handleSave}>
              <div className="modal-body">

                <div className="row mb-2">
                  <div className="col-3"><label className="form-label">Name</label></div>
                  <div className="col-9">
                    <input
                      className="form-control"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-3"><label className="form-label">Phone</label></div>
                  <div className="col-9">
                    <input
                      className="form-control"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-3"><label className="form-label">Description</label></div>
                  <div className="col-9">
                    <input
                      className="form-control"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-3">
                    <label className="form-label">Customer Type</label>
                  </div>

                  <div className="col-9">
                    <select
                      className="form-control"
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Resident">Resident</option>
                      <option value="Visitor">Visitor</option>
                      <option value="Corporate">Corporate</option>
                    </select>
                  </div>
                </div>

              </div>

              <div className="modal-footer">

                <button
                  className="btn btn-secondary"
                  onClick={()=>setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-success"
                  //onClick={handleSave}
                >
                  Save
                </button>

              </div>
</form>
            </div>
          </div>

        </div>

      )}

    </div>
  );
}

export default Customers;