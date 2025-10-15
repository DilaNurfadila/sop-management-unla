// Import React hooks untuk state management
import { useState } from "react";
// Import React Router components untuk routing
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
// Import global CSS styles
import "./App.css";

// Import semua page components
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import ListDocsPage from "./pages/docPages/ListDocsPage";
import EditPdfDocPage from "./pages/docPages/EditPdfDocPage";
import Login from "./pages/authPage/Login";
import Register from "./pages/authPage/Register";
import ResetPassword from "./pages/authPage/ResetPassword";
import MainLayout from "./components/MainLayout";
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import About from "./pages/About";
import PublishedSOPsPage from "./pages/PublishedSOPsPage";
import SOPByUnitPage from "./pages/SOPByUnitPage";
import ArchivePage from "./pages/ArchivePage";
import UserManagementPage from "./pages/UserManagementPage";
import UnitManagementPage from "./pages/UnitManagementPage";
import ActivityLogsPage from "./pages/ActivityLogsPage";
import FeedbackPage from "./pages/FeedbackPage";
import SopFlowchartPage from "./pages/SopFlowchartPage";
import CreateSOPForm from "./pages/sopPages/CreateSOPForm";
import AssignSopCreatorPage from "./pages/sopPages/AssignSopCreatorPage";
import AssignmentManagementPage from "./pages/sopPages/AssignmentManagementPage";
import MyAssignmentsPage from "./pages/sopPages/MyAssignmentsPage";
import ViewSOPDocument from "./pages/sopPages/ViewSOPDocument";
import PublicSOPViewer from "./pages/PublicSOPViewer";
import SOPVisualizationLandingPage from "./pages/sopPages/SOPVisualizationLandingPage.jsx";
import ReviewDashboard from "./pages/review/ReviewDashboard";
import ReviewSopPage from "./pages/review/ReviewSopPage";
import CreateSOPVizPage from "./pages/sopPages/CreateSOPVizPage";
import ManageSOPVizPage from "./pages/sopPages/ManageSOPVizPage";
import FlowchartVisualizationPage from "./pages/sopPages/FlowchartVisualizationPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { getSafeUserDataNoRedirect } from "./utils/cryptoUtils.jsx";

/**
 * Component: App
 *
 * Peran:
 * - Root component aplikasi SOP Management
 * - Mengatur routing, proteksi halaman, dan layout utama
 * - Memuat halaman publik (home/published) dan private (dashboard/admin dll.)
 *
 * Catatan:
 * - Gunakan ProtectedRoute untuk endpoint yang butuh autentikasi/role tertentu
 * - Sidebar state disesuaikan dengan ukuran layar saat initial render
 */
function App() {
  // State untuk kontrol sidebar (open/close)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768; // open on md+, closed on mobile
    }
    return true;
  });
  // State untuk tracking halaman aktif saat ini
  const [currentPage, setCurrentPage] = useState("dashboard");

  /**
   * Komponen PrivateRoute - Higher Order Component untuk protected routes
   * Mengecek apakah user sudah login sebelum mengakses halaman terproteksi
   * @param {ReactNode} children - Component yang akan di-render jika user sudah login
   */
  const PrivateRoute = ({ children }) => {
    // Cek apakah ada data user di storage menggunakan fungsi yang tidak auto-redirect
    const user = getSafeUserDataNoRedirect();

    // Jika tidak ada user, redirect ke login. Validasi lanjutan dilakukan server via cookie
    if (!user) {
      return <Navigate to="/auth/login" />;
    }

    return children;
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes (tanpa layout) - dapat diakses tanpa login */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/sop" element={<PublishedSOPsPage />} />
        <Route path="/sop/public/:id" element={<PublicSOPViewer />} />
        <Route path="/sop/by-unit" element={<SOPByUnitPage />} />
        {/* <Route path="/sopvis" element={<SOPVizListPage />} */}
        <Route path="/sopvis/:id" element={<SOPVisualizationLandingPage />} />
        <Route path="/sopvis/create" element={<CreateSOPVizPage />} />
        <Route path="/sopvis/:id/manage" element={<ManageSOPVizPage />} />
        <Route
          path="/sopvis/:id/flowchart"
          element={<FlowchartVisualizationPage />}
        />
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
            path="/docs/edit/:id"
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
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <ProtectedRoute allowedRoles={["superadmin"]}>
                  <UserManagementPage />
                </ProtectedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/units"
            element={
              <PrivateRoute>
                <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
                  <UnitManagementPage />
                </ProtectedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/activity-logs"
            element={
              <PrivateRoute>
                <ProtectedRoute allowedRoles={["superadmin"]}>
                  <ActivityLogsPage />
                </ProtectedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <PrivateRoute>
                <ProtectedRoute
                  allowedRoles={["superadmin", "admin", "admin_unit"]}>
                  <FeedbackPage />
                </ProtectedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/revision-requests"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/sop-flowchart"
            element={
              <PrivateRoute>
                <SopFlowchartPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/sop/create"
            element={
              <PrivateRoute>
                <CreateSOPForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/sop/assign-creator"
            element={
              <PrivateRoute>
                <ProtectedRoute allowedRoles={["admin", "admin_unit"]}>
                  <AssignSopCreatorPage />
                </ProtectedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/sop/assignment-management"
            element={
              <PrivateRoute>
                <ProtectedRoute allowedRoles={["admin", "admin_unit"]}>
                  <AssignmentManagementPage />
                </ProtectedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/my-assignments"
            element={
              <PrivateRoute>
                <MyAssignmentsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/sop/view/:id"
            element={
              <PrivateRoute>
                <ViewSOPDocument />
              </PrivateRoute>
            }
          />
          <Route
            path="/sop/visualisasi/:id"
            element={
              <PrivateRoute>
                <SopFlowchartPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/review"
            element={
              <PrivateRoute>
                <ReviewDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/review/sop/:id"
            element={
              <PrivateRoute>
                <ReviewSopPage />
              </PrivateRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
