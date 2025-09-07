import React, { useState, useEffect, useCallback } from "react";
import {
  getUsersByAdminUnit,
  assignSopCreator,
  getApprovedSopsByAdminUnit,
} from "../../services/sopCreatorApi";
import { getSopDocuments } from "../../services/flowchartApi";
import Notification from "../../components/Notification";
import { useAdminPermissions } from "../../hooks/useAdminRole";

const AssignSopCreatorPage = () => {
  // Admin permissions check
  const { canAssignSopCreator, userRole } = useAdminPermissions();

  // State untuk data
  const [users, setUsers] = useState([]);
  // const [sopDocuments, setSopDocuments] = useState([]); // Dinonaktifkan sementara
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // State untuk form
  const [formData, setFormData] = useState({
    assigned_to: "",
    task_type: "create", // Default ke "create", revisi dinonaktifkan sementara
    sop_to_revise: "", // ID SOP yang akan direvisi (jika task_type = revise)
    notes: "",
    due_date: "",
  });

  // State untuk notification
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  /**
   * Mengambil daftar pengguna dalam unit yang sama dengan admin
   */
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getUsersByAdminUnit();
      setUsers(response.data);
    } catch (error) {
      console.error("❌ Error loading users:", error);
      showNotification("Gagal memuat daftar pengguna", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mengambil daftar SOP documents yang bisa direvisi
   */
  const loadSopDocuments = useCallback(async () => {
    try {
      // Gunakan endpoint yang sesuai berdasarkan role
      let response;
      if (userRole === "admin_unit") {
        // Admin unit: hanya SOP dari unit mereka yang sudah approved
        response = await getApprovedSopsByAdminUnit();
      } else {
        // Admin: semua SOP yang sudah approved
        const allSops = await getSopDocuments();
        const dataArray = Array.isArray(allSops) ? allSops : allSops.data || [];
        response = dataArray.filter((doc) => doc.review_status === "approved");
      }

      // Pastikan response adalah array
      const dataArray = Array.isArray(response)
        ? response
        : response.data || [];

      // Filter SOP yang sudah disahkan (review_status = 'approved')
      let availableSops = dataArray.filter((doc) => {
        return doc.review_status === "approved";
      });

      setSopDocuments(availableSops);
    } catch (error) {
      console.error("❌ Error loading SOP documents:", error);
      showNotification("Gagal memuat daftar SOP", "error");
    }
  }, [userRole]);

  // Load users saat komponen dimount (SOP documents dinonaktifkan sementara)
  useEffect(() => {
    if (canAssignSopCreator) {
      loadUsers();
      // loadSopDocuments(); // Dinonaktifkan sementara karena fitur revisi dimatikan
    }
  }, [canAssignSopCreator, userRole, loadUsers]);

  /**
   * Handle perubahan input form
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Reset sop_to_revise jika task_type berubah ke create
      ...(name === "task_type" && value === "create" && { sop_to_revise: "" }),
    }));
  };

  /**
   * Handle submit form penugasan
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi form
    if (!formData.assigned_to || !formData.notes || !formData.task_type) {
      showNotification("Harap lengkapi semua field yang wajib diisi", "error");
      return;
    }

    // Validasi khusus untuk revisi
    if (formData.task_type === "revise" && !formData.sop_to_revise) {
      showNotification("Harap pilih SOP yang akan direvisi", "error");
      return;
    }

    try {
      setSubmitting(true);

      // Kirim data penugasan
      const response = await assignSopCreator(formData);

      // Reset form
      setFormData({
        assigned_to: "",
        task_type: "",
        sop_to_revise: "",
        notes: "",
        due_date: "",
      });
    } catch (error) {
      console.error("❌ Error creating assignment:", error);
      const errorMessage =
        error.response?.data?.message || "Gagal membuat penugasan";
      showNotification(errorMessage, "error");
    } finally {
      setSubmitting(false);
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
  if (!canAssignSopCreator) {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tugaskan</h1>
              <p className="mt-2 text-gray-600">
                {userRole === "admin"
                  ? "Tugaskan pengguna dari unit manapun untuk membuat dokumen SOP"
                  : "Tugaskan anggota unit Anda untuk membuat dokumen SOP"}
              </p>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <p className="text-sm text-blue-700">
                <span className="font-medium">
                  {userRole === "admin" ? "� Admin Penuh" : "�👤 Admin Unit"}
                </span>
              </p>
              <p className="text-xs text-blue-600">
                {userRole === "admin"
                  ? "Akses ke semua unit dan pengguna"
                  : "Fitur khusus untuk admin unit"}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-8">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">
                  Memuat data pengguna...
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Jenis Tugas */}
                <div>
                  <label
                    htmlFor="task_type"
                    className="block text-sm font-medium text-gray-700 mb-2">
                    Jenis Tugas <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="task_type"
                    name="task_type"
                    value={formData.task_type}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="create">Membuat SOP Baru</option>
                    {/* <option value="revise">Merevisi SOP Existing</option> */}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Saat ini hanya tersedia tugas pembuatan SOP baru. Fitur
                    revisi sedang dalam pengembangan.
                  </p>
                </div>

                {/* SOP yang akan direvisi - FITUR DINONAKTIFKAN SEMENTARA */}
                {/* formData.task_type === "revise" && (
                  <div>
                    <label
                      htmlFor="sop_to_revise"
                      className="block text-sm font-medium text-gray-700 mb-2">
                      SOP yang sudah disahkan untuk direvisi{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="sop_to_revise"
                      name="sop_to_revise"
                      value={formData.sop_to_revise}
                      onChange={handleInputChange}
                      required={formData.task_type === "revise"}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                      <option value="">
                        -- Pilih SOP yang sudah disahkan --
                      </option>
                      {sopDocuments.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.title} - {doc.sop_code || "No Code"} (Unit:{" "}
                          {doc.unit_scope_name || "N/A"})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      Total {sopDocuments.length} SOP yang sudah disahkan
                      tersedia untuk direvisi
                    </p>
                  </div>
                )}

                {/* Pilih Pengguna */}
                <div>
                  <label
                    htmlFor="assigned_to"
                    className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Pengguna <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="assigned_to"
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="">-- Pilih Pengguna --</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {userRole === "admin"
                          ? `${user.name} (Unit: ${
                              user.unit_name || user.unit || "Tidak ada unit"
                            })`
                          : user.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    {userRole === "admin"
                      ? `Total ${users.length} pengguna dari semua unit`
                      : `Total ${users.length} pengguna dalam unit Anda`}
                  </p>
                </div>

                {/* Catatan Tugas */}
                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700 mb-2">
                    Catatan Tugas <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    required
                    placeholder={
                      formData.task_type === "create"
                        ? "Jelaskan detail SOP baru yang akan dibuat: topik, tujuan, scope, deadline, dan panduan khusus lainnya..."
                        : formData.task_type === "revise"
                        ? "Jelaskan bagian mana yang perlu direvisi: perubahan proses, update informasi, perbaikan format, atau hal lain yang perlu diperbaiki..."
                        : "Pilih jenis tugas terlebih dahulu untuk melihat panduan catatan yang sesuai..."
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Tanggal Deadline */}
                <div>
                  <label
                    htmlFor="due_date"
                    className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Deadline
                  </label>
                  <input
                    type="date"
                    id="due_date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Opsional: Tentukan deadline untuk penyelesaian SOP
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        assigned_to: "",
                        task_type: "",
                        sop_to_revise: "",
                        notes: "",
                        due_date: "",
                      })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={submitting}>
                    Reset Form
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                        Membuat Penugasan...
                      </>
                    ) : (
                      "Buat Penugasan"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              💡 Tips Penugasan
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • <strong>Untuk SOP Baru:</strong> Jelaskan topik, tujuan, dan
                scope yang diinginkan
              </li>
              <li>
                • <strong>Untuk Revisi:</strong> Hanya SOP yang sudah disahkan
                (approved) yang bisa direvisi
              </li>
              <li>
                • Jelaskan bagian mana yang perlu diperbaiki secara spesifik
              </li>
              <li>• Tentukan deadline yang realistis untuk penyelesaian</li>
              <li>• Komunikasikan ekspektasi dan panduan dengan jelas</li>
            </ul>
          </div>

          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-green-900 mb-2">
              📋 Status Penugasan
            </h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>
                • <strong>Pending:</strong> Menunggu respons
              </li>
              <li>
                • <strong>Accepted:</strong> Diterima dan akan dikerjakan
              </li>
              <li>
                • <strong>In Progress:</strong> Sedang dalam pengerjaan
              </li>
              <li>
                • <strong>Completed:</strong> Sudah selesai
              </li>
            </ul>
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

export default AssignSopCreatorPage;
