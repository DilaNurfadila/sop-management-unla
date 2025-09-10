// Catatan: useLocation di-comment karena tidak digunakan saat ini
// import { useLocation } from "react-router-dom";

// Import komponen untuk dashboard feedback
import FeedbackDashboard from "../components/FeedbackDashboard";
// Import komponen untuk list feedback SOP
import SOPFeedbackList from "../components/SOPFeedbackList";
// Import komponen untuk admin feedback management
import AdminFeedbackManagement from "../components/AdminFeedbackManagement";
import { getSafeUserDataNoRedirect } from "../utils/cryptoUtils.jsx";
import { useAdminRole } from "../hooks/useAdminRole.js";

/**
 * Komponen Dashboard utama untuk user yang sudah login
 * Menampilkan welcome message, dashboard feedback, dan list feedback SOP
 */
const Dashboard = () => {
  // Catatan: pathname tidak digunakan saat ini
  // const pathname = useLocation().pathname;

  // Ambil data user dari localStorage untuk personalisasi dengan aman (tanpa auto-redirect)
  const decryptedUser = getSafeUserDataNoRedirect();

  // Check apakah user adalah admin atau admin_unit
  const { isAdmin } = useAdminRole();

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section - Section sambutan untuk user */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat Datang di Aplikasi SOP UNLA, {decryptedUser?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          SOP UNLA adalah aplikasi untuk mengelola dokumen Standar Operasional
          Prosedur (SOP) di Universitas Langlangbuana.
        </p>
      </div>

      {/* Feedback Dashboard & Management - Hanya tampil untuk admin dan admin_unit */}
      {isAdmin ? (
        <>
          {/* Feedback Dashboard - Komponen untuk statistik dan overview feedback */}
          <FeedbackDashboard />

          {/* Admin Feedback Management - Komponen untuk kelola feedback dengan approve/reject */}
          <AdminFeedbackManagement />
        </>
      ) : (
        /* Pesan untuk user yang bukan admin */
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Informasi:</strong> Dashboard feedback hanya dapat
                diakses oleh Administrator dan Administrator Unit.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
