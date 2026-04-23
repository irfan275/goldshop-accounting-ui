import { BrowserRouter, Routes, Route } from "react-router-dom";
//import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Users from "./pages/Users";
import Login from "./pages/Login";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./ProtectedRoute";
import Unauthorized from "./pages/UnAuthorized";
import Ledgers from "./pages/Ledgers";
import AddLedger from "./pages/AddLedger";

function App() {
  return (
    <BrowserRouter basename="/app2">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          {/* <Route path="dashboard" element={<Dashboard />} /> */}
          <Route path="customers" element={<ProtectedRoute ><Customers /></ProtectedRoute>} />
          <Route path="ledgers" element={<ProtectedRoute><Ledgers /></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute allowedRoles={["SUPER_ADMIN","ADMIN"]}><Users /></ProtectedRoute>} />
          <Route path="/ledgers/add" element={<ProtectedRoute>< AddLedger/></ProtectedRoute>} />
          {/* <Route path="/invoice/view/:id" element={<ProtectedRoute><ViewInvoice /></ProtectedRoute>} /> */}
          <Route path="/ledgers/edit/:id" element={<ProtectedRoute><AddLedger /></ProtectedRoute>} />

          {/* <Route path="goldreceive" element={<ProtectedRoute><GoldReceive /></ProtectedRoute>} />
          <Route path="goldreceive/add" element={<ProtectedRoute>< AddGoldReceiveInvoice/></ProtectedRoute>} />
          <Route path="/goldreceive/edit/:id" element={<ProtectedRoute><AddGoldReceiveInvoice /></ProtectedRoute>} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;