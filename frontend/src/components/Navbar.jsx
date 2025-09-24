// Import React Router untuk navigasi
import { Link, useNavigate } from "react-router-dom";
import { getSafeUserDataNoRedirect } from "../utils/cryptoUtils.jsx";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

/**
 * Komponen Navbar untuk navigasi utama di halaman publik
 * Menampilkan menu navigasi dengan conditional rendering berdasarkan status login
 */
const Navbar = () => {
  // Hook untuk navigasi programmatic
  const navigate = useNavigate();

  // Ambil data user dari sessionStorage untuk cek status login
  const user = getSafeUserDataNoRedirect();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLinks = () => (
    <>
      {/* Menu Dokumen SOP - navigasi ke halaman published SOPs */}
      <a
        className="cursor-pointer hover:underline"
        onClick={(e) => {
          e.preventDefault();
          setMobileOpen(false);
          navigate("/sop"); // Navigate programmatically
        }}>
        Dokumen SOP
      </a>

      {/* Menu Tentang - navigasi ke halaman about */}
      <a
        className="cursor-pointer hover:underline"
        onClick={(e) => {
          e.preventDefault();
          setMobileOpen(false);
          navigate("/about");
        }}>
        Tentang
      </a>

      {/* Menu Kontak - navigasi ke halaman contact */}
      <a
        className="cursor-pointer hover:underline"
        onClick={(e) => {
          e.preventDefault();
          setMobileOpen(false);
          navigate("/contact");
        }}>
        Kontak
      </a>

      {/* Conditional rendering berdasarkan status login user */}
      {user ? (
        // Jika user sudah login, tampilkan link ke Dashboard
        <Link
          to="/dashboard"
          className="hover:underline"
          onClick={() => setMobileOpen(false)}>
          <span>Dashboard</span>
        </Link>
      ) : (
        // Jika user belum login, tampilkan link ke Login
        <Link
          to="/auth/login"
          className="hover:underline"
          onClick={() => setMobileOpen(false)}>
          Login
        </Link>
      )}
    </>
  );

  return (
    <nav className="bg-blue-800 text-white shadow-md">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-3 sm:py-4">
          {/* Logo/Brand - Link ke homepage */}
          <Link
            to="/"
            className="text-xl sm:text-2xl font-bold hover:text-gray-300">
            Universitas Langlangbuana
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLinks />
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded hover:bg-blue-700"
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}>
            {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>

        {/* Mobile menu panel */}
        <div
          className={`md:hidden overflow-hidden transition-[max-height] duration-300 ${
            mobileOpen ? "max-h-96" : "max-h-0"
          }`}>
          <div className="flex flex-col gap-3 pb-3">
            <NavLinks />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
