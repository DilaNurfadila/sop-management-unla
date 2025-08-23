// Import icon dari react-icons untuk UI sidebar
import { FiHome, FiFile, FiArchive, FiUsers, FiGrid, FiActivity } from "react-icons/fi";
// Import komponen navigasi dari React Router
import { Link, useLocation } from "react-router-dom";
// Import utility untuk mendapatkan data user
import { getSafeUserDataNoRedirect } from "../utils/cryptoUtils.jsx";

/**
 * Komponen Sidebar - Navigasi samping untuk dashboard
 * Sidebar yang dapat di-collapse dengan menu navigasi dinamis
 * @param {boolean} sidebarOpen - State untuk kontrol lebar sidebar (collapsed/expanded)
 * @param {Function} setSidebarOpen - Function untuk toggle lebar sidebar
 */
const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  // Mendapatkan lokasi URL saat ini untuk menentukan halaman aktif
  const location = useLocation();
  // Extract path pertama sebagai current page, default ke "dashboard"
  const currentPage = location.pathname.split("/")[1] || "dashboard";

  // Mendapatkan data user untuk pengecekan role
  const userData = getSafeUserDataNoRedirect();
  const isAdmin = userData?.role === "admin";

  return (
    <div
      className={`${
        sidebarOpen ? "w-64" : "w-20"
      } bg-blue-800 text-white transition-all duration-300 h-full`}>
      {/* Header sidebar dengan judul dan tombol toggle */}
      <div className="p-4 flex items-center justify-between">
        {/* Conditional rendering judul berdasarkan state sidebar */}
        {sidebarOpen ? (
          <h1 className="text-xl font-bold">MyDashboard</h1>
        ) : (
          <h1 className="text-xl font-bold">MD</h1>
        )}
        {/* Tombol toggle sidebar expand/collapse */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 rounded-lg hover:bg-blue-700">
          {/* Icon arrow berubah sesuai state sidebar */}
          {sidebarOpen ? "«" : "»"}
        </button>
      </div>

      {/* Navigation menu */}
      <nav className="mt-8">
        {/* Menu Dashboard */}
        <Link
          to="/dashboard"
          className={`flex items-center w-full p-3 my-1 ${
            currentPage === "dashboard" ? "bg-blue-700" : ""
          } rounded-lg transition-colors`}>
          <FiHome size={20} />
          {/* Text label hanya tampil saat sidebar expanded */}
          {sidebarOpen && <span className="ml-3">Dashboard</span>}
        </Link>

        {/* Menu Daftar Dokumen SOP */}
        <Link
          to="/docs"
          className={`flex items-center w-full p-3 my-1 ${
            currentPage === "docs" ? "bg-blue-700" : ""
          } rounded-lg transition-colors`}>
          <FiFile size={20} />
          {/* Text label hanya tampil saat sidebar expanded */}
          {sidebarOpen && <span className="ml-3">Daftar Dokumen SOP</span>}
        </Link>

        {/* Menu Arsip Dokumen */}
        <Link
          to="/archive"
          className={`flex items-center w-full p-3 my-1 ${
            currentPage === "archive" ? "bg-blue-700" : ""
          } rounded-lg transition-colors`}>
          <FiArchive size={20} />
          {/* Text label hanya tampil saat sidebar expanded */}
          {sidebarOpen && <span className="ml-3">Arsip Dokumen</span>}
        </Link>

        {/* Menu Pengelolaan Pengguna - Hanya untuk Admin */}
        {isAdmin && (
          <Link
            to="/users"
            className={`flex items-center w-full p-3 my-1 ${
              currentPage === "users" ? "bg-blue-700" : ""
            } rounded-lg transition-colors`}>
            <FiUsers size={20} />
            {/* Text label hanya tampil saat sidebar expanded */}
            {sidebarOpen && <span className="ml-3">Pengelolaan Pengguna</span>}
          </Link>
        )}

        {/* Menu Pengelolaan Unit - Hanya untuk Admin */}
        {isAdmin && (
          <Link
            to="/units"
            className={`flex items-center w-full p-3 my-1 ${
              currentPage === "units" ? "bg-blue-700" : ""
            } rounded-lg transition-colors`}>
            <FiGrid size={20} />
            {/* Text label hanya tampil saat sidebar expanded */}
            {sidebarOpen && <span className="ml-3">Pengelolaan Unit</span>}
          </Link>
        )}

        {/* Menu Riwayat Aktivitas - Hanya untuk Admin */}
        {isAdmin && (
          <Link
            to="/activity-logs"
            className={`flex items-center w-full p-3 my-1 ${
              currentPage === "activity-logs" ? "bg-blue-700" : ""
            } rounded-lg transition-colors`}>
            <FiActivity size={20} />
            {/* Text label hanya tampil saat sidebar expanded */}
            {sidebarOpen && <span className="ml-3">Riwayat Aktivitas</span>}
          </Link>
        )}
      </nav>
    </div>
  );
};

/**
 * Komponen NavItem - Item navigasi reusable untuk sidebar
 * Komponen helper untuk membuat item menu yang konsisten
 * @param {ReactElement} icon - Icon untuk menu item
 * @param {string} text - Text label untuk menu item
 * @param {boolean} active - State apakah item ini sedang aktif
 * @param {boolean} sidebarOpen - State sidebar untuk kondisional text
 * @param {Function} onClick - Handler function saat item diklik
 */
const NavItem = ({ icon, text, active, sidebarOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full p-3 my-1 ${
        active ? "bg-blue-700" : "hover:bg-blue-700"
      } rounded-lg transition-colors`}>
      {/* Render icon */}
      <span>{icon}</span>
      {/* Text hanya tampil saat sidebar expanded */}
      {sidebarOpen && <span className="ml-3">{text}</span>}
    </button>
  );
};

export default Sidebar;
