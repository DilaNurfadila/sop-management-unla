/**
 * Page: FeedbackPage
 *
 * Wrapper halaman untuk dashboard feedback (user vs admin).
 * Menampilkan komponen berbeda berdasarkan role.
 */
import FeedbackDashboard from "../components/FeedbackDashboard";
import AdminFeedbackManagement from "../components/AdminFeedbackManagement";
import { useAdminRole } from "../hooks/useAdminRole";

const FeedbackPage = () => {
  const { isAdmin } = useAdminRole();

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900">Feedback SOP</h1>
        <p className="text-gray-600 mt-2">
          Kelola dan pantau feedback untuk dokumen SOP.
        </p>
      </div>

      {isAdmin ? (
        <>
          <FeedbackDashboard />
          <AdminFeedbackManagement />
        </>
      ) : (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg">
          <p className="text-sm text-blue-700">
            Hanya Administrator yang dapat mengakses halaman ini.
          </p>
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;
