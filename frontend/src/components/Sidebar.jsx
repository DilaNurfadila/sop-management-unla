import { FiHome, FiFile } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const currentPage = location.pathname.split("/")[1] || "dashboard";

  return (
    <div
      className={`${
        sidebarOpen ? "w-64" : "w-20"
      } bg-blue-800 text-white transition-all duration-300 h-full`}>
      <div className="p-4 flex items-center justify-between">
        {sidebarOpen ? (
          <h1 className="text-xl font-bold">MyDashboard</h1>
        ) : (
          <h1 className="text-xl font-bold">MD</h1>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 rounded-lg hover:bg-blue-700">
          {sidebarOpen ? "«" : "»"}
        </button>
      </div>

      <nav className="mt-8">
        <Link
          to="/dashboard"
          className={`flex items-center w-full p-3 my-1 ${
            currentPage === "dashboard" ? "bg-blue-700" : ""
          } rounded-lg transition-colors`}>
          <FiHome size={20} />
          {sidebarOpen && <span className="ml-3">Dashboard</span>}
        </Link>
        <Link
          to="/docs"
          className={`flex items-center w-full p-3 my-1 ${
            currentPage === "docs" ? "bg-blue-700" : ""
          } rounded-lg transition-colors`}>
          <FiFile size={20} />
          {sidebarOpen && <span className="ml-3">Daftar Dokumen SOP</span>}
        </Link>
      </nav>
    </div>
  );
};

const NavItem = ({ icon, text, active, sidebarOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full p-3 my-1 ${
        active ? "bg-blue-700" : "hover:bg-blue-700"
      } rounded-lg transition-colors`}>
      <span>{icon}</span>
      {sidebarOpen && <span className="ml-3">{text}</span>}
    </button>
  );
};

export default Sidebar;
