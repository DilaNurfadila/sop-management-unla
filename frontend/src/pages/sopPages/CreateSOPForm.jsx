import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createSopDocument } from "../../services/flowchartApi";
import { getUsers } from "../../services/userApi";
import { getAssignmentsForUser } from "../../services/sopCreatorApi";
// Import crypto utility functions
import { getSafeUserDataNoRedirect } from "../../utils/cryptoUtils.jsx";

const CreateSOPForm = () => {
  // Ambil data user dari sessionStorage menggunakan fungsi helper
  const login_user = getSafeUserDataNoRedirect();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);

  // State untuk assignment validation
  const [assignmentCheck, setAssignmentCheck] = useState({
    isValidated: false,
    hasActiveAssignment: false,
    assignmentData: null,
    error: null,
  });

  // Form state sesuai schema baru dari code.txt
  const [formData, setFormData] = useState({
    title: "", // judul SOP
    goals: "", // tujuan (dulu objective)
    scope: "", // ruang lingkup
    definition: "", // definisi
    sop_reference: "", // referensi (dulu reference)
    procedure_description: "", // deskripsi prosedur
    status: "draft", // default status
  });

  // Data untuk approval roles
  const [approvalRoles, setApprovalRoles] = useState({
    reviewer_id: "",
    approver_id: "",
  });

  // Load user list untuk reviewer dan approver
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load users untuk reviewer dan approver
        const userList = await getUsers();
        setUsers(userList);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadData();
  }, []);

  // Validasi assignment saat komponen dimount
  useEffect(() => {
    const validateAssignment = async () => {
      try {
        // Ambil assignmentId dari URL params
        const assignmentId = searchParams.get("assignmentId");

        if (!assignmentId) {
          setAssignmentCheck({
            isValidated: true,
            hasActiveAssignment: false,
            assignmentData: null,
            error:
              "Akses ditolak: Anda hanya dapat membuat SOP melalui penugasan yang aktif.",
          });
          return;
        }

        // Ambil daftar assignment user
        const response = await getAssignmentsForUser();
        const assignments = response.data;

        // Cari assignment yang sesuai dengan ID dan statusnya in_progress
        const activeAssignment = assignments.find(
          (a) => a.id === parseInt(assignmentId) && a.status === "in_progress"
        );

        if (!activeAssignment) {
          setAssignmentCheck({
            isValidated: true,
            hasActiveAssignment: false,
            assignmentData: null,
            error:
              "Assignment tidak ditemukan atau belum dimulai. Pastikan Anda sudah mengklik 'Mulai Kerjakan' pada penugasan.",
          });
          return;
        }

        // Assignment valid, izinkan pembuatan SOP
        setAssignmentCheck({
          isValidated: true,
          hasActiveAssignment: true,
          assignmentData: activeAssignment,
          error: null,
        });

        // Pre-fill form dengan data dari assignment
        setFormData((prev) => ({
          ...prev,
          title: `${activeAssignment.notes}`,
          goals: `Membuat SOP berdasarkan penugasan: ${activeAssignment.notes}`,
        }));

        // Auto-fill reviewer dan approver dari assignment data
        if (activeAssignment.reviewer_id && activeAssignment.approver_id) {
          setApprovalRoles({
            reviewer_id: activeAssignment.reviewer_id.toString(),
            approver_id: activeAssignment.approver_id.toString(),
          });
        }

        // unit_scope ditentukan saat penugasan → tidak perlu input di form
      } catch (error) {
        console.error("Error validating assignment:", error);
        setAssignmentCheck({
          isValidated: true,
          hasActiveAssignment: false,
          assignmentData: null,
          error: "Gagal memvalidasi penugasan. Silakan coba lagi.",
        });
      }
    };

    validateAssignment();
  }, [searchParams]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle approval roles change
  const handleApprovalChange = (e) => {
    const { name, value } = e.target;
    setApprovalRoles((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submit
  const handleSubmit = async (e, submitForReview = false) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validasi required fields
      if (!formData.title.trim()) {
        alert("Judul SOP wajib diisi!");
        setIsLoading(false);
        return;
      }

      // Jika submit untuk review, validasi reviewer dan approver (hanya jika bukan dari assignment)
      if (submitForReview && !assignmentCheck.hasActiveAssignment) {
        if (!approvalRoles.reviewer_id) {
          alert("Pemeriksa harus dipilih untuk mengajukan review!");
          setIsLoading(false);
          return;
        }
        if (!approvalRoles.approver_id) {
          alert("Pengesah harus dipilih untuk mengajukan review!");
          setIsLoading(false);
          return;
        }
      }

      // Tentukan unit_scope yang akan dikirim:
      // - gunakan dari form jika diisi
      // - jika kosong, fallback ke assignment.unit_scope bila tersedia
      const unitScopeFromAssignment =
        assignmentCheck.assignmentData?.unit_scope;
      const normalizedUnitScope =
        unitScopeFromAssignment !== undefined &&
        unitScopeFromAssignment !== null
          ? Number(unitScopeFromAssignment)
          : null;

      // Prepare data untuk sop_documents table (SOP Code dan Version akan di-generate otomatis)
      const sopDocumentData = {
        ...formData,
        unit_scope: normalizedUnitScope,
        ...approvalRoles, // Include reviewer_id dan approver_id
        sop_code: null, // SOP Code akan di-generate setelah disahkan
        assignment_id: assignmentCheck.assignmentData?.id || null, // Link ke assignment
        status: submitForReview ? "submitted_for_review" : "draft", // Set status berdasarkan aksi
      };

      // Create SOP document
      const response = await createSopDocument(sopDocumentData);

      // Extract ID dari response
      const sopId = response.newDoc?.id || response.id;

      if (!sopId) {
        throw new Error("ID SOP tidak ditemukan dalam response");
      }

      if (submitForReview) {
        alert(
          "SOP berhasil dibuat dan diajukan untuk pemeriksaan! Pemeriksa akan menerima notifikasi."
        );
        navigate("/my-assignments"); // Kembali ke halaman assignments
      } else {
        // Jika berhasil, redirect ke halaman flowchart untuk visualisasi
        alert("SOP berhasil dibuat! Lanjutkan ke tahap visualisasi flowchart.");
        navigate(`/sop/visualisasi/${sopId}`);
      }
    } catch (error) {
      console.error("Error creating SOP:", error);
      alert("Gagal membuat SOP: " + (error.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      {/* Loading state saat validasi assignment */}
      {!assignmentCheck.isValidated && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Memvalidasi penugasan...</span>
        </div>
      )}

      {/* Error state jika tidak ada assignment yang valid */}
      {assignmentCheck.isValidated && !assignmentCheck.hasActiveAssignment && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚫</div>
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Akses Ditolak
          </h3>
          <p className="text-red-600 mb-6 max-w-md mx-auto">
            {assignmentCheck.error}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/my-assignments")}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              📋 Lihat Penugasan Saya
            </button>
            <br />
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              🏠 Kembali ke Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Form content jika assignment valid */}
      {assignmentCheck.isValidated && assignmentCheck.hasActiveAssignment && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Buat SOP Baru
            </h1>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <div className="text-blue-500 mr-3">📋</div>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Penugasan dari:{" "}
                    {assignmentCheck.assignmentData?.assigner_name}
                  </p>
                  <p className="text-sm text-blue-700">
                    {assignmentCheck.assignmentData?.notes}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-gray-600">
              Isi formulir di bawah untuk membuat Standard Operating Procedure
              (SOP) berdasarkan penugasan yang Anda terima. Setelah formulir
              selesai, Anda akan diarahkan ke halaman visualisasi flowchart.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Section */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Informasi Dasar
              </h2>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-1">
                    Judul SOP *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Judul lengkap Standard Operating Procedure"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Konten SOP
              </h2>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="goals"
                    className="block text-sm font-medium text-gray-700 mb-1">
                    Tujuan *
                  </label>
                  <textarea
                    id="goals"
                    name="goals"
                    value={formData.goals}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Tujuan dari SOP ini..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="scope"
                    className="block text-sm font-medium text-gray-700 mb-1">
                    Ruang Lingkup *
                  </label>
                  <textarea
                    id="scope"
                    name="scope"
                    value={formData.scope}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Ruang lingkup penerapan SOP..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="definition"
                    className="block text-sm font-medium text-gray-700 mb-1">
                    Definisi
                  </label>
                  <textarea
                    id="definition"
                    name="definition"
                    value={formData.definition}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Definisi istilah-istilah yang digunakan..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sop_reference"
                    className="block text-sm font-medium text-gray-700 mb-1">
                    Referensi
                  </label>
                  <textarea
                    id="sop_reference"
                    name="sop_reference"
                    value={formData.sop_reference}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Dokumen referensi yang terkait..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="procedure_description"
                    className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi Prosedur *
                  </label>
                  <textarea
                    id="procedure_description"
                    name="procedure_description"
                    value={formData.procedure_description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Deskripsi umum prosedur yang akan dijalankan..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Approval Section - Hidden when creating from assignment */}
            {!assignmentCheck.hasActiveAssignment && (
              <div className="border-b pb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Persetujuan
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="reviewer_id"
                      className="block text-sm font-medium text-gray-700 mb-1">
                      Reviewer (Peninjau)
                    </label>
                    <select
                      id="reviewer_id"
                      name="reviewer_id"
                      value={approvalRoles.reviewer_id}
                      onChange={handleApprovalChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Pilih Reviewer</option>
                      {users
                        .filter((user) => user.id !== login_user.id) // kecuali user yang sedang login
                        .map((user) => (
                          <option key={`reviewer-${user.id}`} value={user.id}>
                            {user.name} ({user.role})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="approver_id"
                      className="block text-sm font-medium text-gray-700 mb-1">
                      Approver (Penyetuju)
                    </label>
                    <select
                      id="approver_id"
                      name="approver_id"
                      value={approvalRoles.approver_id}
                      onChange={handleApprovalChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Pilih Approver</option>
                      {users
                        .filter(
                          (user) =>
                            user.id !== login_user.id &&
                            (user.role === "admin" ||
                              user.role === "admin_unit")
                        ) // kecuali user yang sedang login
                        .map((user) => (
                          <option key={`approver-${user.id}`} value={user.id}>
                            {user.name} ({user.role})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    <strong>Catatan:</strong> Pembuat SOP akan secara otomatis
                    tercatat sebagai Creator. SOP Code dan Version akan
                    di-generate otomatis oleh sistem. Version dimulai dari 1.0
                    untuk SOP baru, dan akan auto-increment untuk revisi.
                    <br />
                    <strong>Status:</strong> SOP baru akan dibuat dengan status
                    "Draft" dan perlu melalui proses review dan approval untuk
                    dapat dipublikasikan.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate("/sop")}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500">
                Batal
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}>
                {isLoading ? "Menyimpan..." : "Simpan sebagai Draft"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default CreateSOPForm;
