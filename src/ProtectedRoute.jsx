import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

   if (!token || token === "undefined" || token === "null") {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles != null &&!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  return children;
}

export default ProtectedRoute;