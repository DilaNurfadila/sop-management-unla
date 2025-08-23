// Catatan: useLocation di-comment karena tidak digunakan saat ini
// import { useLocation } from "react-router-dom";

// Import komponen untuk dashboard feedback
import FeedbackDashboard from "../components/FeedbackDashboard";
// Import komponen untuk list feedback SOP
import SOPFeedbackList from "../components/SOPFeedbackList";
import { getSafeUserDataNoRedirect } from "../utils/cryptoUtils.jsx";

/**
 * Komponen Dashboard utama untuk user yang sudah login
 * Menampilkan welcome message, dashboard feedback, dan list feedback SOP
 */
const Dashboard = () => {
  // Catatan: pathname tidak digunakan saat ini
  // const pathname = useLocation().pathname;

  // Ambil data user dari localStorage untuk personalisasi dengan aman (tanpa auto-redirect)
  const decryptedUser = getSafeUserDataNoRedirect();

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

      {/* Feedback Dashboard - Komponen untuk statistik dan overview feedback */}
      <FeedbackDashboard />

      {/* SOP Feedback List - Komponen untuk daftar lengkap feedback SOP */}
      <SOPFeedbackList />
    </div>
  );
};

export default Dashboard;
