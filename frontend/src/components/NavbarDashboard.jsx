// Import React hooks untuk state management dan lifecycle
import { useState, useRef, useEffect } from "react";
// Import icon dari react-icons untuk UI navbar
import {
  FiBell,
  FiChevronDown,
  FiUser,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";
// Import komponen navigasi dari React Router
import { Link } from "react-router-dom";
// Import service API untuk logout
import { forceLogout } from "../services/authClient";
import { getSafeUserDataNoRedirect } from "../utils/cryptoUtils.jsx";

/**
 * Komponen Navbar - Navigation bar untuk dashboard
 * Navbar dengan dropdown profile, notifikasi, dan logout functionality
 * @param {boolean} sidebarOpen - State untuk kontrol visibility sidebar
 */
const Navbar = ({ sidebarOpen }) => {
  // State untuk kontrol dropdown profile menu
  const [isOpen, setIsOpen] = useState(false);
  // Ref untuk handle klik di luar dropdown
  const dropdownRef = useRef(null);
  // Redirect ditangani oleh forceLogout helper

  /**
   * Effect untuk handle klik di luar dropdown menu
   * Menutup dropdown jika user klik di area lain
   */
  useEffect(() => {
    // Function untuk detect klik di luar dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Tutup dropdown jika klik di luar
        setIsOpen(false);
      }
    };

    // Tambah event listener untuk mouse click
    document.addEventListener("mousedown", handleClickOutside);
    // Cleanup event listener saat component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Ambil data user dari localStorage dengan aman (tanpa auto-redirect)
  const decryptedUser = getSafeUserDataNoRedirect();

  // Fallback jika user data tidak tersedia - tampilkan navbar sederhana
  if (!decryptedUser) {
    return (
      <nav className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
        <div className="text-lg font-semibold text-gray-900">SOP UNLA</div>
        <div className="text-sm text-gray-500">Loading user data...</div>
      </nav>
    );
  }

  /**
   * Handle logout process dengan konfirmasi
   * Tampilkan dialog konfirmasi sebelum logout
   */
  const handleLogout = async () => {
    // Tampilkan dialog konfirmasi logout
    const isConfirmed = window.confirm("Apakah Anda yakin ingin keluar?");
    if (isConfirmed) {
      try {
        // Gunakan helper terpusat untuk panggil API logout, hapus semua data lokal, dan redirect
        await forceLogout("/auth/login");
      } catch (err) {
        // Log error jika logout API gagal
        console.error("Logout error:", err);
      }
    }
  };

  return (
    <header className="bg-white shadow-sm p-4 flex justify-end items-center">
      {/* Commented out page title - bisa diaktifkan jika diperlukan */}
      {/* <h2 className="text-xl font-semibold text-gray-800">
        {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
      </h2> */}

      <div className="flex items-center space-x-4">
        {/* Tombol Notifikasi */}
        <button className="p-2 rounded-full hover:bg-gray-100 relative">
          <FiBell size={20} className="text-gray-600" />
          {/* Indicator badge untuk notifikasi baru */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          {/* Trigger button untuk dropdown */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-2 focus:outline-none cursor-pointer">
            {/* Avatar circle dengan inisial */}
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
              {decryptedUser?.name
                ? decryptedUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : "U"}
            </div>
            {/* Nama user - tampil hanya saat sidebar expanded */}
            {sidebarOpen && (
              <span className="text-sm">{decryptedUser?.name}</span>
            )}
            {/* Chevron icon dengan animasi rotasi */}
            <FiChevronDown
              className={`transition-transform ${
                isOpen ? "transform rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu Content */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              {/* User info section */}
              <div className="px-4 py-2 border-b">
                <p className="text-sm font-medium">{decryptedUser?.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {decryptedUser?.email}
                </p>
              </div>

              {/* Menu Profile */}
              <Link
                to="/profile"
                className={`flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                onClick={() => {
                  setIsOpen(false);
                }}>
                <FiUser className="mr-2" /> Profil
              </Link>

              {/* Menu Settings */}
              <Link
                to="/settings"
                className={`flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                onClick={() => {
                  setIsOpen(false);
                }}>
                <FiSettings className="mr-2" /> Pengaturan
              </Link>

              {/* Separator line */}
              <div className="border-t border-gray-200"></div>

              {/* Logout button */}
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
