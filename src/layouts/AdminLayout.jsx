import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

function AdminLayout() {
  return (
    <div className="d-flex">

      <Sidebar />

      <div className="flex-grow-1">
        <Navbar />

        <div className="container mt-4">
          <Outlet />
        </div>
      </div>

    </div>
  );
}

export default AdminLayout;