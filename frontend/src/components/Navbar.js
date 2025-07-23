import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../services/authApi";

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = async () => {
    const isConfirmed = window.confirm("Apakah Anda yakin ingin keluar?");
    if (isConfirmed) {
      // try {
      //   const response = await logout();
      //   if (response.error) {
      //     showNotification(response.message, "error");
      //   } else {
      //     navigate("/auth/login", { replace: true });
      //   }
      // } catch (error) {
      //   showNotification(
      //     error.message || "Gagal keluar. Silakan coba lagi.",
      //     "error"
      //   );
      // }

      try {
        await logout();
        localStorage.removeItem("user");
        navigate("/auth/login");
      } catch (err) {
        console.log(err.message);
        console.error("Logout error:", err);
      }
    }
  };
  return (
    <nav className="bg-gray-800 p-4 mb-6">
      <ul className="flex gap-5 list-none m-0 p-0">
        <li>
          <Link to="/" className="text-white no-underline hover:text-gray-300">
            Home
          </Link>
        </li>

        {user && (
          <li>
            <Link
              to="/docs"
              className="text-white no-underline hover:text-gray-300">
              Daftar Dokumen SOP
            </Link>
          </li>
        )}

        {user && (
          <li>
            <Link
              to="/docs/add"
              className="text-white no-underline hover:text-gray-300">
              Tambah Dokumen SOP
            </Link>
          </li>
        )}

        {!user ? (
          <li>
            <Link
              to="/auth/login"
              className="text-white no-underline hover:text-gray-300">
              Login
            </Link>
          </li>
        ) : (
          <>
            <li>
              <Link
                onClick={handleLogout}
                className="text-white no-underline hover:text-gray-300">
                Logout
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
