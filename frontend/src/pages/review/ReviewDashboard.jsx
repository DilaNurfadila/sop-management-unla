import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../services/api";
import {
  FiEye,
  FiCheck,
  FiX,
  FiClock,
  FiUser,
  FiCalendar,
} from "react-icons/fi";
import Notification from "../../components/Notification";
import { getSafeUserDataNoRedirect } from "../../utils/cryptoUtils";

const ReviewDashboard = () => {
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Get user data untuk filter berdasarkan role
  const userData = getSafeUserDataNoRedirect();
  const userRole = userData?.role;

  // Filter reviews berdasarkan role user
  const filteredReviews = useMemo(() => {
    if (!pendingReviews.length) return [];

    // Jika admin, tampilkan semua (sudah tidak duplikat dari backend)
    if (userRole === "admin" || userRole === "admin_unit") {
      return pendingReviews;
    }

    // Untuk user biasa, data sudah difilter dari backend berdasarkan user_id dan role
    // Tidak perlu filtering tambahan di frontend
    return pendingReviews;
  }, [pendingReviews, userRole]);

  const fetchPendingReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/review/pending");
      setPendingReviews(response.data.data);
    } catch (error) {
      console.error("Error fetching pending reviews:", error);
      showNotification("Error mengambil daftar review", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingReviews();
  }, [fetchPendingReviews]);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const getStatusBadge = (reviewStatus) => {
    const statusConfig = {
      submitted_for_review: {
        color: "bg-yellow-100 text-yellow-800",
        text: "Menunggu Review",
      },
      reviewer_approved: {
        color: "bg-blue-100 text-blue-800",
        text: "Menunggu Pengesahan",
      },
      approved: { color: "bg-green-100 text-green-800", text: "Disetujui" },
      needs_revision: {
        color: "bg-red-100 text-red-800",
        text: "Perlu Revisi",
      },
    };

    const config = statusConfig[reviewStatus] || {
      color: "bg-gray-100 text-gray-800",
      text: reviewStatus,
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      Creator: { color: "bg-green-100 text-green-800", text: "Penyusun" },
      Reviewer: { color: "bg-purple-100 text-purple-800", text: "Pemeriksa" },
      Approver: { color: "bg-indigo-100 text-indigo-800", text: "Pengesah" },
      Admin: { color: "bg-red-100 text-red-800", text: "Administrator" },
    };

    const config = roleConfig[role] || {
      color: "bg-gray-100 text-gray-800",
      text: role,
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading review dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Review
        </h1>
        <p className="text-gray-600 mb-2">
          Kelola proses review dan persetujuan dokumen SOP
        </p>
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">Keterangan Peran:</p>
          <div className="flex flex-wrap gap-4">
            <span className="flex items-center">
              <span className="inline-block w-3 h-3 bg-green-200 rounded-full mr-2"></span>
              <strong>Penyusun:</strong> Pembuat SOP
            </span>
            <span className="flex items-center">
              <span className="inline-block w-3 h-3 bg-purple-200 rounded-full mr-2"></span>
              <strong>Pemeriksa:</strong> Meninjau dan memeriksa SOP
            </span>
            <span className="flex items-center">
              <span className="inline-block w-3 h-3 bg-indigo-200 rounded-full mr-2"></span>
              <strong>Pengesah:</strong> Mengesahkan SOP yang sudah diperiksa
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FiClock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Menunggu Review
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  filteredReviews.filter(
                    (r) => r.review_status === "submitted_for_review"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FiCheck className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Menunggu Pengesahan
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  filteredReviews.filter(
                    (r) => r.review_status === "reviewer_approved"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FiUser className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Review</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredReviews.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Reviews Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Dokumen Menunggu Review
          </h2>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="p-8 text-center">
            <FiCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {userRole === "admin" || userRole === "admin_unit"
                ? "Tidak ada review pending"
                : "Tidak ada SOP yang perlu Anda review"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {userRole === "admin" || userRole === "admin_unit"
                ? "Semua dokumen SOP sudah direview atau belum ada yang diajukan."
                : "Anda belum ditugaskan untuk mereview SOP atau semua SOP yang ditugaskan sudah direview."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dokumen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Penyusun
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peran Anda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReviews.map((review, index) => (
                  <tr
                    key={`review-${review.id}-${index}`}
                    className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {review.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {review.name}
                        </div>
                        {review.sop_code && (
                          <div className="text-xs text-gray-400">
                            {review.sop_code}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiUser className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {review.creator_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {review.unit_scope_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(review.review_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {review.my_role ? (
                        getRoleBadge(review.my_role)
                      ) : (
                        <span className="text-sm text-gray-500">Admin</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <FiCalendar className="h-4 w-4 mr-2" />
                        {new Date(review.updated_at).toLocaleDateString(
                          "id-ID"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            (window.location.href = `/review/sop/${review.id}`)
                          }
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                          title="Lihat dan Review">
                          <FiEye className="h-4 w-4 mr-1" />
                          Review
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewDashboard;
