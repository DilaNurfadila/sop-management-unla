import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  updateSopDocument,
  getSopDocumentById,
} from "../../services/flowchartApi";
import { FiArrowLeft } from "react-icons/fi";
import Notification from "../../components/Notification";
// Approval roles & unit scope are set at assignment; no selection here

const EditSOPPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // State untuk versioning SOP yang sudah pernah disahkan
  const [wasEverPublished, setWasEverPublished] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionType, setVersionType] = useState("");
  const [pendingFormData, setPendingFormData] = useState(null);

  // State form disederhanakan, 'version' dan 'status' dihapus
  const [formData, setFormData] = useState({
    sop_code: "",
    title: "",
    goals: "",
    scope: "",
    definition: "",
    sop_reference: "",
    procedure_description: "",
  });

  // Load SOP data dan user list
  useEffect(() => {
    const loadData = async () => {
      try {
        setInitialLoading(true);

        // Load SOP data
        const sopData = await getSopDocumentById(id);

        // SOP dianggap pernah disahkan jika:
        // 1. Status Published/Unpublished (bukan Draft)
        // 2. Atau punya published_at (pernah dipublish)
        // 3. Atau versi bukan 1.0 (sudah ada perubahan)
        const everPublished =
          sopData.status === "published" ||
          sopData.status === "unpublished" ||
          sopData.published_at !== null;
        setWasEverPublished(everPublished);

        setFormData({
          sop_code: sopData.sop_code || "",
          title: sopData.title || "",
          goals: sopData.goals || "",
          scope: sopData.scope || "",
          definition: sopData.definition || "",
          sop_reference: sopData.sop_reference || "",
          procedure_description: sopData.procedure_description || "",
          // 'version' dan 'status' tidak lagi di-set
        });
      } catch (error) {
        console.error("Error loading data:", error);
        alert("Error loading SOP data: " + (error.message || "Unknown error"));
        navigate("/docs");
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id, navigate]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fungsi handleVersionUpdate dihapus seluruhnya

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Jika SOP sudah pernah disahkan, tampilkan modal versioning
    if (wasEverPublished) {
      setPendingFormData({ ...formData });
      setShowVersionModal(true);
      return;
    }

    // Jika belum pernah disahkan (draft pertama), update langsung
    setIsLoading(true);
    try {
      const completeData = { ...formData };

      await updateSopDocument(id, completeData);
      setNotification({
        type: "success",
        message: "SOP berhasil diupdate!",
      });
      setTimeout(() => navigate("/docs"), 1500);
    } catch (error) {
      console.error("Error updating SOP:", error);
      setNotification({
        type: "error",
        message: "Gagal mengupdate SOP: " + (error.message || "Unknown error"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle versioning update untuk SOP yang sudah published
  const handleVersionUpdate = async () => {
    if (!versionType || !pendingFormData) return;

    setIsLoading(true);
    setShowVersionModal(false);

    try {
      const completeData = { ...pendingFormData, version_type: versionType };

      await updateSopDocument(id, completeData);

      // Pesan notifikasi sesuai jenis perubahan
      const versionMessage =
        versionType === "major"
          ? `SOP berhasil diupdate dengan perubahan MAJOR! Status kembali ke Draft. Versi akan naik ke V.X.0 setelah disahkan ulang.`
          : `SOP berhasil diupdate dengan perubahan MINOR! Versi naik ke V.X.Y dan status kembali ke Unpublished untuk review.`;

      setNotification({
        type: "success",
        message: versionMessage,
      });
      setTimeout(() => navigate("/docs"), 2500); // Waktu lebih lama untuk membaca pesan
    } catch (error) {
      console.error("Error updating SOP:", error);
      setNotification({
        type: "error",
        message: "Gagal mengupdate SOP: " + (error.message || "Unknown error"),
      });
    } finally {
      setIsLoading(false);
      setPendingFormData(null);
      setVersionType("");
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SOP data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate("/docs")}
          className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors">
          <FiArrowLeft className="mr-2" />
          Kembali
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Edit SOP</h1>
          <p className="text-gray-600">
            Edit Standard Operating Procedure yang sudah ada.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Section */}
        <div className="border-b pb-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Informasi Dasar
          </h2>

          {/* SOP Code */}
          {formData.sop_code ? (
            <div>
              <label
                htmlFor="sop_code"
                className="block text-sm font-medium text-gray-700 mb-1">
                SOP Code
              </label>
              <input
                type="text"
                id="sop_code"
                name="sop_code"
                value={formData.sop_code}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none"
                readOnly
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 mt-1">
                SOP Code di-generate otomatis saat disahkan.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status SOP Code
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-yellow-50 text-yellow-800">
                SOP Code akan di-generate setelah disahkan.
              </div>
            </div>
          )}

          {/* Field Versi SOP Dihapus */}

          {/* Judul SOP */}
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
              autoComplete="off"
            />
          </div>

          {/* Field Status Dihapus */}

          {/* Ruang Lingkup Unit Kerja dipilih saat penugasan, tidak dapat diubah di sini */}
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

        {/* Persetujuan dipilih saat penugasan (admin/admin_unit), tidak dapat diubah di sini */}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate("/docs")}
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
            {isLoading ? "Menyimpan..." : "Update SOP"}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/sop/visualisasi/${id}`)}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
            Edit Visualisasi
          </button>
        </div>
      </form>

      {/* Notification Component */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Version Type Modal untuk SOP yang sudah disahkan */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Pilih Tipe Perubahan SOP
            </h3>
            <p className="text-gray-600 mb-6">
              SOP ini sudah pernah disahkan sebelumnya. Pilih tipe perubahan
              yang sesuai dengan modifikasi yang Anda lakukan:
            </p>

            <div className="space-y-4 mb-6">
              {/* Minor Version */}
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="versionType"
                  value="minor"
                  checked={versionType === "minor"}
                  onChange={(e) => setVersionType(e.target.value)}
                  className="mt-1"
                  autoComplete="off"
                />
                <div>
                  <div className="font-semibold text-green-700">
                    Perubahan Minor
                  </div>
                  <div className="text-sm text-gray-600">
                    • Perbaikan kesalahan ketik
                    <br />
                    • Update informasi kontak
                    <br />
                    • Penyesuaian format yang tidak mengubah isi
                    <br />• Penambahan lampiran non-prosedural
                  </div>
                </div>
              </label>

              {/* Major Version */}
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="versionType"
                  value="major"
                  checked={versionType === "major"}
                  onChange={(e) => setVersionType(e.target.value)}
                  className="mt-1"
                  autoComplete="off"
                />
                <div>
                  <div className="font-semibold text-red-700">
                    Perubahan Major
                  </div>
                  <div className="text-sm text-gray-600">
                    • Perubahan prosedur kerja
                    <br />
                    • Penambahan/penghapusan langkah
                    <br />
                    • Perubahan tanggung jawab
                    <br />• Update kebijakan atau aturan
                  </div>
                </div>
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowVersionModal(false);
                  setVersionType("");
                  setPendingFormData(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                Batal
              </button>
              <button
                type="button"
                onClick={handleVersionUpdate}
                disabled={!versionType || isLoading}
                className={`px-4 py-2 text-white rounded ${
                  !versionType || isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}>
                {isLoading ? "Menyimpan..." : "Update SOP"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditSOPPage;
