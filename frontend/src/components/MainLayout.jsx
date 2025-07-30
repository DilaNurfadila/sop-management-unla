import Sidebar from "./Sidebar";
import Navbar from "./NavbarDashboard";
import { Outlet } from "react-router-dom";

const MainLayout = ({
  sidebarOpen,
  setSidebarOpen,
  currentPage,
  setCurrentPage,
}) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar sidebarOpen={sidebarOpen} currentPage={currentPage} />

        <main className="flex-1 overflow-y-auto p-4">
          {<Outlet /> || <div>Default content if children is empty</div>}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
