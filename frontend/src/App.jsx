// Import React hooks untuk state management
import { useState } from "react";
// Import React Router components untuk routing
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Import semua page components
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import ListDocsPage from "./pages/docPages/ListDocsPage";
import AddDocPage from "./pages/docPages/AddDocPage";
import EditPdfDocPage from "./pages/docPages/EditPdfDocPage";
import Login from "./pages/authPage/Login";
import Register from "./pages/authPage/Register";
import MainLayout from "./components/MainLayout";
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import About from "./pages/About";
import PublishedSOPsPage from "./pages/PublishedSOPsPage";
import ArchivePage from "./pages/ArchivePage";

/**
 * Komponen App - Root component aplikasi SOP Management
 * Mengatur routing, authentication, dan layout utama
 */
function App() {
  // State untuk kontrol sidebar (open/close)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // State untuk tracking halaman aktif saat ini
  const [currentPage, setCurrentPage] = useState("dashboard");

  /**
   * Komponen PrivateRoute - Higher Order Component untuk protected routes
   * Mengecek apakah user sudah login sebelum mengakses halaman terproteksi
   * @param {ReactNode} children - Component yang akan di-render jika user sudah login
   */
  const PrivateRoute = ({ children }) => {
    // Cek apakah ada data user di localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    // Return children jika user ada, redirect ke login jika tidak
    return user ? children : <Navigate to="/auth/login" />;
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes (tanpa layout) - dapat diakses tanpa login */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/sop" element={<PublishedSOPsPage />} />

        {/* Protected Routes (dengan layout) - memerlukan authentication */}
        <Route
          element={
            <MainLayout
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          }>
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/docs"
            element={
              <PrivateRoute>
                <ListDocsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/docs/add"
            element={
              <PrivateRoute>
                <AddDocPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/docs/edit-pdf/:id"
            element={
              <PrivateRoute>
                <EditPdfDocPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/archive"
            element={
              <PrivateRoute>
                <ArchivePage />
              </PrivateRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
