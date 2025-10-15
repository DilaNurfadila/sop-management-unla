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
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("reviewer"); // reviewer | approver

  // Get user data untuk filter berdasarkan role
  const userData = getSafeUserDataNoRedirect();
  const userRole = userData?.role;

  // Filter reviews berdasarkan role user dan search term
  const filteredReviews = useMemo(() => {
    if (!pendingReviews.length) return [];

    let filtered = [];

    // Filter berdasarkan role user
    if (userRole === "admin" || userRole === "admin_unit") {
      filtered = pendingReviews;
    } else {
      // Untuk user biasa, data sudah difilter dari backend berdasarkan user_id dan role
      filtered = pendingReviews;
    }

    // Filter berdasarkan search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (review) =>
          review.sop_title?.toLowerCase().includes(searchLower) ||
          review.sop_code?.toLowerCase().includes(searchLower) ||
          review.status?.toLowerCase().includes(searchLower) ||
          review.review_status?.toLowerCase().includes(searchLower) ||
          review.creator_name?.toLowerCase().includes(searchLower) ||
          review.reviewer_name?.toLowerCase().includes(searchLower) ||
          review.approver_name?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [pendingReviews, userRole, searchTerm]);

  // Tabel: sembunyikan item ketika pengguna bertindak sebagai Pengesah (Approver)
  const tableReviews = useMemo(() => {
    const normalizedUserRole = (userRole || "").toString().trim().toLowerCase();
    return filteredReviews.filter((r) => {
      const role = (r.my_role || "").toString().trim().toLowerCase();
      const status = (r.review_status || "").toString().trim().toLowerCase();
      // Sembunyikan jika peran per item adalah Approver
      if (role === "approver") return false;
      // Untuk admin/admin_unit: sembunyikan juga item yang berada di tahap pengesahan
      if (
        (normalizedUserRole === "admin" ||
          normalizedUserRole === "admin_unit") &&
        status === "reviewer_approved"
      ) {
        return false;
      }
      return true;
    });
  }, [filteredReviews, userRole]);

  // Tabel khusus Pengesah: tampilkan hanya SOP di mana per-item role adalah Approver
  const approverTableReviews = useMemo(() => {
    return filteredReviews.filter(
      (r) =>
        (r.my_role || "").toString().trim().toLowerCase() === "approver" &&
        (r.review_status || "").toString().trim().toLowerCase() ===
          "reviewer_approved"
    );
  }, [filteredReviews]);

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

  // Helper: prefer creator's unit name for listing; fallback to unit scope name
  const formatUnitForList = (unitName, unitScopeName) => {
    // Show creator's unit if available; otherwise show scope name
    return unitName || unitScopeName || "";
  };

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

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiEye className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari berdasarkan judul SOP, kode, status, penyusun, pemeriksa, atau pengesah..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                autoComplete="off"
              />
            </div>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <FiX className="h-4 w-4 mr-1" />
              Clear
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="mt-3 text-sm text-gray-600">
            Menampilkan {tableReviews.length} dari {pendingReviews.length} SOP
            untuk "{searchTerm}"
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FiClock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Menunggu Pemeriksaan
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  tableReviews.filter(
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
                  approverTableReviews.filter(
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
                {tableReviews.length + approverTableReviews.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg mb-4">
        <div className="px-6 pt-4">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("reviewer")}
              className={`-mb-px px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === "reviewer"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}>
              Pemeriksaan
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                {tableReviews.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("approver")}
              className={`-mb-px ml-6 px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === "approver"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}>
              Pengesahan
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                {approverTableReviews.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pending Table based on active tab */}
      {activeTab === "reviewer" ? (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Dokumen Menunggu Pemeriksaan
            </h2>
          </div>

          {tableReviews.length === 0 ? (
            <div className="p-8 text-center">
              <FiCheck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm
                  ? "Tidak ada hasil pencarian"
                  : "Tidak ada permintaan pemeriksaan"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? `Tidak ditemukan SOP yang sesuai dengan "${searchTerm}"`
                  : "Semua dokumen SOP yang menunggu pemeriksaan telah diperiksa atau belum ada permintaan SOP untuk diperiksa oleh Anda."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Lihat Semua SOP Review
                </button>
              )}
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
                  {tableReviews.map((review, index) => (
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
                          {formatUnitForList(
                            review.unit_name,
                            review.unit_scope_name
                          )}
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
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Dokumen Menunggu Pengesahan
            </h2>
          </div>
          {approverTableReviews.length === 0 ? (
            <div className="p-8 text-center">
              <FiCheck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Tidak ada permintaan pengesahan
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Semua dokumen SOP yang menunggu pengesahan telah disahkan atau
                belum ada permintaan SOP untuk disahkan oleh Anda.
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
                  {approverTableReviews.map((review, index) => (
                    <tr
                      key={`approver-${review.id}-${index}`}
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
                          {formatUnitForList(
                            review.unit_name,
                            review.unit_scope_name
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(review.review_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge("Approver")}
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
                            title="Lihat dan Sahkan">
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
      )}
    </div>
  );
};

export default ReviewDashboard;
