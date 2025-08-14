// Import komponen sidebar untuk navigasi dashboard
import Sidebar from "./Sidebar";
// Import navbar khusus untuk dashboard
import Navbar from "./NavbarDashboard";
// Import Outlet dari React Router untuk nested routing
import { Outlet } from "react-router-dom";

/**
 * Komponen MainLayout - Layout utama untuk dashboard dengan sidebar dan navbar
 * Menggunakan flex layout dengan sidebar di kiri dan main content di kanan
 * @param {boolean} sidebarOpen - State untuk kontrol visibility sidebar
 * @param {Function} setSidebarOpen - Function untuk toggle sidebar
 * @param {string} currentPage - State untuk halaman aktif saat ini
 * @param {Function} setCurrentPage - Function untuk set halaman aktif
 */
const MainLayout = ({
  sidebarOpen,
  setSidebarOpen,
  currentPage,
  setCurrentPage,
}) => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Navigation - Fixed di sebelah kiri */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      {/* Main Content Area - Flex-1 untuk mengisi sisa ruang */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar - Fixed di atas */}
        <Navbar sidebarOpen={sidebarOpen} currentPage={currentPage} />

        {/* Main Content - Scrollable area untuk konten halaman */}
        <main className="flex-1 overflow-y-auto p-4">
          {/* Outlet untuk nested routes atau default content */}
          {<Outlet /> || <div>Default content if children is empty</div>}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
