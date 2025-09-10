import React, { useState, useEffect, useCallback } from "react";
import {
  getAssignmentsByAdmin,
  deleteAssignment,
} from "../../services/sopCreatorApi";
import Notification from "../../components/Notification";
import { useAdminPermissions } from "../../hooks/useAdminRole";
import { FiX, FiSearch } from "react-icons/fi";

const AssignmentManagementPage = () => {
  // Admin permissions check
  const { canManageAssignments, userRole } = useAdminPermissions();
  // State untuk data
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // State untuk notification
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  /**
   * Mengambil daftar penugasan yang dibuat oleh admin
   */
  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAssignmentsByAdmin();
      setAssignments(response.data);
    } catch (error) {
      console.error("❌ Error loading assignments:", error);
      showNotification("Gagal memuat daftar penugasan", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load assignments saat komponen dimount
  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  /**
   * Handle penghapusan penugasan
   */
  const handleDeleteAssignment = async (assignmentId, sopTitle) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus penugasan "${sopTitle}"?`
      )
    ) {
      return;
    }

    try {
      setDeleting(assignmentId);
      await deleteAssignment(assignmentId);

      // Refresh data
      await loadAssignments();

      showNotification("Penugasan berhasil dihapus", "success");
    } catch (error) {
      console.error("❌ Error deleting assignment:", error);
      const errorMessage =
        error.response?.data?.message || "Gagal menghapus penugasan";
      showNotification(errorMessage, "error");
    } finally {
      setDeleting(null);
    }
  };

  /**
   * Menampilkan notification
   */
  const showNotification = (message, type = "success") => {
    setNotification({
      show: true,
      message,
      type,
    });
  };

  /**
   * Menutup notification
   */
  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, show: false }));
  };

  // Admin access guard
  if (!canManageAssignments) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Akses Dibatasi
            </h1>
            <p className="text-gray-600 mb-4">
              Halaman ini hanya dapat diakses oleh Admin Unit.
            </p>
            <p className="text-sm text-gray-500">
              Role Anda: <span className="font-medium">{userRole}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Mendapatkan warna badge berdasarkan status
   */
  const getStatusBadge = (assignment) => {
    // Jika SOP sudah disetujui, maka assignment dianggap selesai
    if (assignment.sop_approved === 1) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✅ Selesai (SOP Disahkan)
        </span>
      );
    }

    // Status assignment yang belum selesai
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Menunggu Respon",
      },
      accepted: { bg: "bg-blue-100", text: "text-blue-800", label: "Diterima" },
      rejected: { bg: "bg-red-100", text: "text-red-800", label: "Ditolak" },
      in_progress: {
        bg: "bg-purple-100",
        text: "text-purple-800",
        label: "Sedang Dikerjakan",
      },
    };

    const config = statusConfig[assignment.status] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  /**
   * Format tanggal
   */
  const formatDate = (dateString) => {
    if (!dateString) return "Tidak ditentukan";

    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Function untuk filter penugasan berdasarkan search term
  const filteredAssignments = assignments.filter((assignment) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      assignment.assignee_name?.toLowerCase().includes(searchLower) ||
      assignment.assignee_email?.toLowerCase().includes(searchLower) ||
      assignment.notes?.toLowerCase().includes(searchLower) ||
      assignment.status?.toLowerCase().includes(searchLower) ||
      assignment.task_type?.toLowerCase().includes(searchLower) ||
      assignment.assignee_response?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Manajemen Penugasan SOP
            </h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Admin Unit
            </span>
          </div>
          <p className="mt-2 text-gray-600">
            Kelola dan pantau penugasan pembuatan SOP yang telah Anda buat
            sebagai admin unit
          </p>
        </div>

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">📋</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Penugasan
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {assignments.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">⏳</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Menunggu</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {
                      assignments.filter(
                        (a) => a.status === "pending" && a.sop_approved !== 1
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">🔄</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Dikerjakan
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {
                      assignments.filter(
                        (a) =>
                          a.status === "in_progress" && a.sop_approved !== 1
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">✅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Selesai</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {assignments.filter((a) => a.sop_approved === 1).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama, email, catatan, status, atau jenis tugas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
              Menampilkan {filteredAssignments.length} dari {assignments.length}{" "}
              penugasan untuk "{searchTerm}"
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Daftar Penugasan
              </h2>
              <button
                onClick={loadAssignments}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Memuat...
                  </>
                ) : (
                  <>🔄 Refresh</>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">
                  Memuat data penugasan...
                </span>
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm
                    ? "Tidak ada hasil pencarian"
                    : "Belum Ada Penugasan"}
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? `Tidak ditemukan penugasan yang sesuai dengan "${searchTerm}"`
                    : "Anda belum membuat penugasan SOP untuk anggota unit."}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Lihat Semua Penugasan
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Penugasan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ditugaskan Kepada
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deadline
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dibuat
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAssignments.map((assignment) => (
                      <tr key={assignment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Tugas Pembuatan SOP
                            </div>
                            {assignment.notes && (
                              <div className="text-sm text-gray-500 mt-1">
                                {assignment.notes.length > 100
                                  ? `${assignment.notes.substring(0, 100)}...`
                                  : assignment.notes}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {assignment.assignee_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.assignee_email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(assignment)}
                          {assignment.assignee_response && (
                            <div className="text-xs text-gray-500 mt-1">
                              "{assignment.assignee_response}"
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(assignment.due_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(assignment.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() =>
                              handleDeleteAssignment(
                                assignment.id,
                                "tugas pembuatan SOP"
                              )
                            }
                            disabled={deleting === assignment.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed">
                            {deleting === assignment.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              "🗑️ Hapus"
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
    </div>
  );
};

export default AssignmentManagementPage;
