import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAssignmentsForUser,
  updateAssignmentStatus,
} from "../../services/sopCreatorApi";
import Notification from "../../components/Notification";

const MyAssignmentsPage = () => {
  // Hook untuk navigasi
  const navigate = useNavigate();

  // State untuk data
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  // State untuk modal response
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [responseData, setResponseData] = useState({
    status: "",
    response: "",
  });

  // State untuk notification
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  /**
   * Mengambil daftar penugasan untuk user
   */
  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAssignmentsForUser();
      setAssignments(response.data);
    } catch (error) {
      console.error("❌ Error loading user assignments:", error);
      console.error("❌ Error details:", error.response?.data);
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
   * Handle navigasi ke halaman buat SOP dengan assignment context
   */
  const handleCreateSOP = (assignment) => {
    // Navigasi ke halaman create SOP dengan assignment ID sebagai parameter
    navigate(`/sop/create?assignmentId=${assignment.id}`, {
      state: {
        assignment: assignment,
        notes: assignment.notes,
        assigner: assignment.assigner_name,
      },
    });
  };

  /**
   * Handle membuka modal response
   */
  const handleOpenResponseModal = (assignment, status) => {
    setSelectedAssignment(assignment);
    setResponseData({
      status: status,
      response: "",
    });
    setShowResponseModal(true);
  };

  /**
   * Handle menutup modal response
   */
  const handleCloseResponseModal = () => {
    setShowResponseModal(false);
    setSelectedAssignment(null);
    setResponseData({
      status: "",
      response: "",
    });
  };

  /**
   * Handle submit response
   */
  const handleSubmitResponse = async () => {
    if (!selectedAssignment || !responseData.status) {
      showNotification("Status harus dipilih", "error");
      return;
    }

    try {
      setUpdating(selectedAssignment.id);

      await updateAssignmentStatus(selectedAssignment.id, responseData);

      // Refresh data
      await loadAssignments();

      showNotification("Status penugasan berhasil diperbarui", "success");
      handleCloseResponseModal();
    } catch (error) {
      console.error("❌ Error updating assignment status:", error);
      const errorMessage =
        error.response?.data?.message || "Gagal memperbarui status";
      showNotification(errorMessage, "error");
    } finally {
      setUpdating(null);
    }
  };

  /**
   * Handle quick status update
   */
  const handleQuickStatusUpdate = async (assignmentId, status) => {
    try {
      setUpdating(assignmentId);

      // Cari assignment yang sedang diupdate untuk cek task_type
      const assignment = assignments.find((a) => a.id === assignmentId);

      await updateAssignmentStatus(assignmentId, { status });

      // Refresh data
      await loadAssignments();

      // Notifikasi berbeda untuk tugas revisi
      if (
        assignment &&
        assignment.task_type === "revise" &&
        status === "in_progress"
      ) {
        showNotification(
          "Tugas revisi dimulai! Mengarahkan ke halaman Dokumen SOP...",
          "success"
        );
      } else {
        showNotification("Status berhasil diperbarui", "success");
      }

      // Jika ini tugas revisi dan status menjadi in_progress, redirect ke halaman docs
      if (
        assignment &&
        assignment.task_type === "revise" &&
        status === "in_progress"
      ) {
        setTimeout(() => {
          navigate("/docs");
        }, 1500); // Delay 1.5 detik untuk memberi waktu user melihat notifikasi
      }
    } catch (error) {
      console.error("❌ Error updating status:", error);
      const errorMessage =
        error.response?.data?.message || "Gagal memperbarui status";
      showNotification(errorMessage, "error");
    } finally {
      setUpdating(null);
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
        label: "Menunggu Respons",
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

  /**
   * Cek apakah deadline sudah lewat
   */
  const isOverdue = (dueDateString) => {
    if (!dueDateString) return false;

    const dueDate = new Date(dueDateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return dueDate < today;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Penugasan SOP Saya
          </h1>
          <p className="mt-2 text-gray-600">
            Kelola dan respons penugasan pembuatan SOP yang diberikan kepada
            Anda
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
                  <p className="text-sm font-medium text-gray-500">
                    Butuh Respons
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {assignments.filter((a) => a.status === "pending").length}
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
                    Sedang Dikerjakan
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
            ) : assignments.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Belum Ada Penugasan
                </h3>
                <p className="text-gray-500">
                  Anda belum memiliki penugasan pembuatan SOP.
                </p>
              </div>
            ) : (
              <div className="space-y-4 p-6">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {assignment.task_type === "revise"
                            ? "Tugas Revisi SOP"
                            : "Tugas Pembuatan SOP"}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span>👤 Dari: {assignment.assigner_name}</span>
                          <span>
                            📅 Dibuat: {formatDate(assignment.created_at)}
                          </span>
                          {assignment.due_date && (
                            <span
                              className={
                                isOverdue(assignment.due_date) &&
                                assignment.status !== "completed"
                                  ? "text-red-600 font-medium"
                                  : ""
                              }>
                              ⏰ Deadline: {formatDate(assignment.due_date)}
                              {isOverdue(assignment.due_date) &&
                                assignment.status !== "completed" &&
                                " (Terlambat)"}
                            </span>
                          )}
                        </div>

                        {assignment.notes && (
                          <div className="bg-gray-50 rounded-md p-3 mb-4">
                            <p className="text-sm text-gray-700">
                              <strong>Catatan:</strong> {assignment.notes}
                            </p>
                          </div>
                        )}

                        {/* Tampilkan informasi SOP yang akan direvisi */}
                        {assignment.task_type === "revise" &&
                          assignment.target_sop_title && (
                            <div className="bg-blue-50 rounded-md p-3 mb-4 border-l-4 border-blue-400">
                              <p className="text-sm text-blue-800">
                                <strong>📄 SOP yang akan direvisi:</strong>
                                <br />
                                <span className="font-medium">
                                  {assignment.target_sop_title}
                                </span>
                                {assignment.target_sop_code && (
                                  <span className="text-blue-600">
                                    {" "}
                                    ({assignment.target_sop_code})
                                  </span>
                                )}
                                {assignment.target_sop_version && (
                                  <span className="text-blue-600">
                                    {" "}
                                    - Versi {assignment.target_sop_version}
                                  </span>
                                )}
                              </p>
                            </div>
                          )}

                        <div className="flex items-center space-x-3">
                          {getStatusBadge(assignment)}
                          {assignment.assignee_response && (
                            <span className="text-sm text-gray-600">
                              ""{assignment.assignee_response}""
                            </span>
                          )}
                          {assignment.sop_approved === 1 &&
                            assignment.sop_code && (
                              <span className="text-sm text-blue-600 font-medium">
                                Kode SOP: {assignment.sop_code}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                      {/* Jika SOP sudah disetujui, tidak perlu ada tombol action */}
                      {assignment.sop_approved === 1 ? (
                        <div className="flex items-center text-green-600 font-medium">
                          <span>🎉 Tugas selesai - SOP telah disahkan</span>
                        </div>
                      ) : (
                        <>
                          {assignment.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleOpenResponseModal(
                                    assignment,
                                    "accepted"
                                  )
                                }
                                disabled={updating === assignment.id}
                                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
                                ✅ Terima
                              </button>
                              <button
                                onClick={() =>
                                  handleOpenResponseModal(
                                    assignment,
                                    "rejected"
                                  )
                                }
                                disabled={updating === assignment.id}
                                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50">
                                ❌ Tolak
                              </button>
                            </>
                          )}

                          {assignment.status === "accepted" && (
                            <button
                              onClick={() =>
                                handleQuickStatusUpdate(
                                  assignment.id,
                                  "in_progress"
                                )
                              }
                              disabled={updating === assignment.id}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                              {updating === assignment.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                              ) : (
                                "🔄"
                              )}{" "}
                              Mulai Kerjakan
                            </button>
                          )}

                          {assignment.status === "in_progress" && (
                            <>
                              {/* Show SOP status if created */}
                              {assignment.sop_document_id ? (
                                <div className="flex items-center space-x-3">
                                  <span className="text-sm text-gray-600">
                                    📄 SOP sudah dibuat
                                  </span>
                                  {assignment.sop_review_status && (
                                    <span
                                      className={`text-sm font-medium ${
                                        assignment.sop_review_status ===
                                        "approved"
                                          ? "text-green-600"
                                          : assignment.sop_review_status ===
                                            "reviewer_approved"
                                          ? "text-blue-600"
                                          : assignment.sop_review_status ===
                                            "submitted_for_review"
                                          ? "text-purple-600"
                                          : assignment.sop_review_status ===
                                            "needs_revision"
                                          ? "text-red-600"
                                          : "text-gray-600"
                                      }`}>
                                      Status:{" "}
                                      {assignment.sop_review_status ===
                                      "approved"
                                        ? "Disetujui"
                                        : assignment.sop_review_status ===
                                          "reviewer_approved"
                                        ? "Disetujui Pemeriksa"
                                        : assignment.sop_review_status ===
                                          "submitted_for_review"
                                        ? "Dalam Review"
                                        : assignment.sop_review_status ===
                                          "needs_revision"
                                        ? "Perlu Revisi"
                                        : assignment.sop_review_status ===
                                          "draft"
                                        ? "Draft"
                                        : assignment.sop_review_status}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      if (
                                        assignment.task_type === "revise" &&
                                        assignment.sop_to_revise
                                      ) {
                                        // Untuk revisi: langsung ke halaman edit SOP yang akan direvisi
                                        navigate(
                                          `/docs/edit/${assignment.sop_to_revise}`
                                        );
                                      } else {
                                        // Untuk create: ke halaman buat SOP baru dengan assignment context
                                        handleCreateSOP(assignment);
                                      }
                                    }}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                                    {assignment.task_type === "revise"
                                      ? "✏️ Edit SOP"
                                      : "📝 Buat SOP"}
                                  </button>

                                  {/* Tombol Edit Visualisasi untuk tugas revisi */}
                                  {assignment.task_type === "revise" &&
                                    assignment.sop_to_revise && (
                                      <button
                                        onClick={() =>
                                          navigate(
                                            `/sop/visualisasi/${assignment.sop_to_revise}`
                                          )
                                        }
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                        🎨 Edit Visualisasi
                                      </button>
                                    )}
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {responseData.status === "accepted" && "Terima Penugasan"}
                {responseData.status === "rejected" && "Tolak Penugasan"}
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pesan Response (Opsional)
                </label>
                <textarea
                  value={responseData.response}
                  onChange={(e) =>
                    setResponseData((prev) => ({
                      ...prev,
                      response: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Tambahkan komentar atau alasan..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseResponseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Batal
                </button>
                <button
                  onClick={handleSubmitResponse}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                      Memproses...
                    </>
                  ) : (
                    "Kirim"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default MyAssignmentsPage;
