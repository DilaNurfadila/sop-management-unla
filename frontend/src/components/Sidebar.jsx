/**
 * Component: Sidebar
 *
 * Navigasi samping (dashboard). Menyesuaikan item berdasarkan role/user.
 */
// Import icon dari react-icons untuk UI sidebar
import {
  FiHome,
  FiFile,
  FiArchive,
  FiUsers,
  FiGrid,
  FiActivity,
  FiUserPlus,
  FiClipboard,
  FiCheckSquare,
  FiEye,
} from "react-icons/fi";
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
  const isSuperAdmin = userData?.role === "superadmin";
  const isAdmin = userData?.role === "admin";
  const isAdminUnit = userData?.role === "admin_unit";

  return (
    <div
      className={`bg-blue-800 text-white h-full z-40
        md:relative md:translate-x-0 md:transition-none
        fixed inset-y-0 left-0 transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        w-64 ${sidebarOpen ? "md:w-64" : "md:w-20"}`}>
      {/* Header sidebar dengan judul dan tombol toggle */}
      <div className="p-4 flex items-center justify-between">
        {/* Conditional rendering judul berdasarkan state sidebar */}
        {sidebarOpen ? (
          <h1 className="text-xl font-bold text-center">
            Universitas Langlangbuana
          </h1>
        ) : (
          <h1 className="text-xl font-bold">UNLA</h1>
        )}
        {/* Tombol toggle sidebar expand/collapse */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 rounded-lg hover:bg-blue-700"
          aria-label="Toggle sidebar">
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

        {/* Menu Pengelolaan Pengguna - Untuk Superadmin */}
        {isSuperAdmin && (
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

        {/* Menu Superadmin Panel dihilangkan (permintaan) */}

        {/* Menu Pengelolaan Unit - Hanya untuk Admin Penuh (tetap admin, superadmin juga dapat via isAdmin check elsewhere if needed) */}
        {(isAdmin || isSuperAdmin) && (
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

        {/* Menu Riwayat Aktivitas - Hanya untuk Superadmin */}
        {isSuperAdmin && (
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

        {/* Menu Feedback - Admin & Admin Unit & Superadmin */}
        {(isSuperAdmin || isAdmin || isAdminUnit) && (
          <Link
            to="/feedback"
            className={`flex items-center w-full p-3 my-1 ${
              currentPage === "feedback" ? "bg-blue-700" : ""
            } rounded-lg transition-colors`}>
            <FiCheckSquare size={20} />
            {sidebarOpen && <span className="ml-3">Feedback</span>}
          </Link>
        )}

        {/* Menu Tugaskan - Hanya untuk Admin */}
        {(isAdmin || isAdminUnit) && (
          <Link
            to="/sop/assign-creator"
            className={`flex items-center w-full p-3 my-1 ${
              location.pathname === "/sop/assign-creator" ? "bg-blue-700" : ""
            } rounded-lg transition-colors`}>
            <FiUserPlus size={20} />
            {/* Text label hanya tampil saat sidebar expanded */}
            {sidebarOpen && <span className="ml-3">Tugaskan</span>}
          </Link>
        )}

        {/* Menu Kelola Penugasan - Hanya untuk Admin */}
        {(isAdmin || isAdminUnit) && (
          <Link
            to="/sop/assignment-management"
            className={`flex items-center w-full p-3 my-1 ${
              location.pathname === "/sop/assignment-management"
                ? "bg-blue-700"
                : ""
            } rounded-lg transition-colors`}>
            <FiClipboard size={20} />
            {/* Text label hanya tampil saat sidebar expanded */}
            {sidebarOpen && <span className="ml-3">Kelola Penugasan</span>}
          </Link>
        )}

        {/* Menu Penugasan Saya - Untuk user dan admin_unit yang ditugaskan */}
        {(userData?.role === "user" || isAdminUnit) && (
          <Link
            to="/my-assignments"
            className={`flex items-center w-full p-3 my-1 ${
              location.pathname === "/my-assignments" ? "bg-blue-700" : ""
            } rounded-lg transition-colors`}>
            <FiClipboard size={20} />
            {/* Text label hanya tampil saat sidebar expanded */}
            {sidebarOpen && <span className="ml-3">Penugasan Saya</span>}
          </Link>
        )}

        {/* Menu Review SOP - Untuk reviewer / admin / admin_unit / superadmin */}
        {(userData?.role === "user" || isAdminUnit || isAdmin) && (
          <Link
            to="/review"
            className={`flex items-center w-full p-3 my-1 ${
              location.pathname.startsWith("/review") ? "bg-blue-700" : ""
            } rounded-lg transition-colors`}>
            <FiEye size={20} />
            {sidebarOpen && <span className="ml-3">Review SOP</span>}
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
