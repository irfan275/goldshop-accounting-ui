import { NavLink } from "react-router-dom";
import { FaUsers, FaFileInvoice, FaUserTie,FaCoins ,FaGem  } from "react-icons/fa";
import "../css/Sidebar.css";

function Sidebar() {
  const user = JSON.parse(localStorage.getItem("user"));
  return (
    <div className="sidebar">

      <h4 className="sidebar-title">
        Muscat Bullion
      </h4>

      <ul className="sidebar-menu">

        <li>
          <NavLink
            to="/customers"
            className={({ isActive }) =>
              "menu-link" + (isActive ? " active" : "")
            }
          >
            <FaUsers className="menu-icon" />
            Customers
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/ledgers"
            className={({ isActive }) =>
              "menu-link" + (isActive ? " active" : "")
            }
          >
            <FaFileInvoice className="menu-icon" />
            Ledger
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/purchaseLedger"
            className={({ isActive }) =>
              "menu-link" + (isActive ? " active" : "")
            }
          >
            <FaFileInvoice className="menu-icon" />
            Purchase Ledger
          </NavLink>
        </li>
         <li>
          <NavLink
            to="/statement"
            className={({ isActive }) =>
              "menu-link" + (isActive ? " active" : "")
            }
          >
            <FaFileInvoice className="menu-icon" />
            Statement
          </NavLink>
        </li>

          {user?.role !== "EMPLOYEE" && (
        <li>
          <NavLink
            to="/users"
            className={({ isActive }) =>
              "menu-link" + (isActive ? " active" : "")
            }
          >
            <FaUserTie className="menu-icon" />
            Users
          </NavLink>
        </li>)}

      </ul>

    </div>
  );
}

export default Sidebar;