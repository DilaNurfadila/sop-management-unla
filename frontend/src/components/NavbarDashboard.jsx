import { useState, useRef, useEffect } from "react";
import crypto from "crypto-js";
import {
  FiBell,
  FiChevronDown,
  FiUser,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../services/authApi";

const Navbar = ({ sidebarOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Handle klik di luar dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return null; // or handle the case where user data is not available
  }

  const secretKey = crypto.enc.Hex.parse(import.meta.env.VITE_SECRET_KEY);
  const encryptedEmail = user?.email; // misalnya dari response API
  const [ivHex, cipherText] = encryptedEmail.split(":");
  const iv = crypto.enc.Hex.parse(ivHex);
  const bytes = crypto.AES.decrypt(cipherText, secretKey, { iv });
  const emailDecrypted = bytes.toString(crypto.enc.Utf8);

  const handleLogout = async () => {
    const isConfirmed = window.confirm("Apakah Anda yakin ingin keluar?");
    if (isConfirmed) {
      try {
        await logout();
        localStorage.removeItem("user");
        navigate("/auth/login");
      } catch (err) {
        console.error("Logout error:", err);
      }
    }
  };

  return (
    <header className="bg-white shadow-sm p-4 flex justify-end items-center">
      {/* <h2 className="text-xl font-semibold text-gray-800">
        {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
      </h2> */}

      <div className="flex items-center space-x-4">
        {/* Notifikasi */}
        <button className="p-2 rounded-full hover:bg-gray-100 relative">
          <FiBell size={20} className="text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profil Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-2 focus:outline-none cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
              JD
            </div>
            {sidebarOpen && <span className="text-sm">{user?.name}</span>}
            <FiChevronDown
              className={`transition-transform ${
                isOpen ? "transform rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {emailDecrypted}
                </p>
              </div>
              <Link
                to="/profile"
                className={`flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                onClick={() => {
                  setIsOpen(false);
                }}>
                <FiUser className="mr-2" /> Profil
              </Link>
              <Link
                to="/settings"
                className={`flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                onClick={() => {
                  setIsOpen(false);
                }}>
                <FiSettings className="mr-2" /> Pengaturan
              </Link>
              <div className="border-t border-gray-200"></div>
              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                <FiLogOut className="mr-2" /> Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
