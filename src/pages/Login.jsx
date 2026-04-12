import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {

      const request = await fetch(import.meta.env.VITE_APP_API_URL+"user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phoneNumber,
          password
        })
      });

      const response = await request.json();

      if (response.status) {

        // store token
        localStorage.setItem("token", response.data.accessToken);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        // redirect
        navigate("/invoices");

      } else {
        alert(data.message);
      }

    } catch (error) {
      console.error(error);
      alert("Login failed");
    }
  };


  return (
    <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100 bg-light">

      <div className="card p-4 shadow" style={{ width: "400px" }}>

        <h3 className="text-center mb-4">Gold Shop Login</h3>

        <form onSubmit={handleLogin}>

          <div className="mb-3">
            <label>Phone Number</label>
            <input
              type="number"
              className="form-control"
              placeholder="Enter email"
              value={phoneNumber}
              onChange={(e)=>setPhoneNumber(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary w-100">
            Login
          </button>

        </form>

      </div>

    </div>
  );
}

export default Login;