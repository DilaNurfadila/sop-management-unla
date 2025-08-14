import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDocPdf, updateFile } from "../../services/apiPdf";
import Notification from "../../components/Notification";
import ArchiveReasonModal from "../../components/ArchiveReasonModal";
import { dateFormatterDB } from "../../utils/dateFormatter";
import { FiArrowLeft, FiEdit, FiUpload, FiFile } from "react-icons/fi";

const EditPdfDocPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    sop_code: "",
    sop_title: "",
    organization: "",
    sop_applicable: "",
    sop_version: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentFileUrl, setCurrentFileUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showArchiveReasonModal, setShowArchiveReasonModal] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(null);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        setLoading(true);
        const response = await getDocPdf(id);

        setFormData({
          sop_code: response.sop_code || "",
          sop_title: response.sop_title || "",
          organization: response.organization || "",
          sop_applicable: response.sop_applicable
            ? dateFormatterDB(response.sop_applicable)
            : "",
          sop_version: response.sop_version || "",
        });
        setCurrentFileUrl(response.url || "");
      } catch (error) {
        console.error("Error fetching document:", error);
        setNotification({
          message: error.message || "Gagal memuat dokumen",
          type: "error",
        });
        // Navigate back after delay
        setTimeout(() => {
          navigate("/docs");
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (file.type !== "application/pdf") {
        setNotification({
          message: "Hanya file PDF yang diperbolehkan",
          type: "error",
        });
        e.target.value = "";
        return;
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setNotification({
          message: "Ukuran file tidak boleh lebih dari 10MB",
          type: "error",
        });
        e.target.value = "";
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.sop_code.trim() || !formData.sop_title.trim()) {
      setNotification({
        message: "Kode SOP dan Judul SOP wajib diisi",
        type: "error",
      });
      return;
    }

    // Prepare submission data
    const submissionData = {
      code: formData.sop_code.trim(),
      title: formData.sop_title.trim(),
      organization: formData.organization.trim(),
      effective_date: formData.sop_applicable,
      version: formData.sop_version.trim(),
    };

    // If there's a new file, show archive reason modal
    if (selectedFile) {
      setPendingSubmission(submissionData);
      setShowArchiveReasonModal(true);
      return;
    }

    // If no new file, proceed directly
    await executeSubmission(submissionData, null);
  };

  const executeSubmission = async (metadata, archiveReason) => {
    setIsSubmitting(true);

    try {
      console.log("Executing submission with archive reason:", archiveReason);

      await updateFile(id, selectedFile, metadata, archiveReason);

      setNotification({
        message: selectedFile
          ? "Dokumen dan file berhasil diperbarui"
          : "Dokumen berhasil diperbarui",
        type: "success",
      });

      // Navigate back to list after delay
      setTimeout(() => {
        navigate("/docs", {
          state: {
            message: selectedFile
              ? "Dokumen dan file berhasil diperbarui"
              : "Dokumen berhasil diperbarui",
            type: "success",
          },
        });
      }, 1500);
    } catch (error) {
      console.error("Error updating document:", error);
      setNotification({
        message: error.message || "Gagal memperbarui dokumen",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
      setShowArchiveReasonModal(false);
      setPendingSubmission(null);
    }
  };

  const handleArchiveReasonConfirm = (reason) => {
    if (pendingSubmission) {
      executeSubmission(pendingSubmission, reason);
    }
  };

  const handleArchiveReasonCancel = () => {
    setShowArchiveReasonModal(false);
    setPendingSubmission(null);
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const handleOpenCurrentFile = () => {
    if (currentFileUrl) {
      window.open(currentFileUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="flex justify-center items-center py-12">
          <div className="text-lg text-gray-600">Memuat dokumen...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              to="/docs"
              className="mr-4 text-blue-600 hover:text-blue-800 transition-colors">
              <FiArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FiEdit className="mr-3" />
                Ubah Dokumen SOP
              </h1>
              <p className="text-gray-600 mt-1">
                Ubah informasi dokumen dan ganti file PDF jika diperlukan
              </p>
            </div>
          </div>
          {currentFileUrl && (
            <button
              onClick={handleOpenCurrentFile}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <FiFile className="h-4 w-4" />
              Lihat File Saat Ini
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kode SOP */}
            <div>
              <label
                htmlFor="sop_code"
                className="block text-sm font-medium text-gray-700 mb-2">
                Kode SOP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="sop_code"
                name="sop_code"
                value={formData.sop_code}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan kode SOP"
                required
              />
            </div>

            {/* Versi */}
            <div>
              <label
                htmlFor="sop_version"
                className="block text-sm font-medium text-gray-700 mb-2">
                Versi
              </label>
              <input
                type="text"
                id="sop_version"
                name="sop_version"
                value={formData.sop_version}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan versi SOP"
              />
            </div>
          </div>

          {/* Judul SOP */}
          <div>
            <label
              htmlFor="sop_title"
              className="block text-sm font-medium text-gray-700 mb-2">
              Judul SOP <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="sop_title"
              name="sop_title"
              value={formData.sop_title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Masukkan judul SOP"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Organisasi */}
            <div>
              <label
                htmlFor="organization"
                className="block text-sm font-medium text-gray-700 mb-2">
                Organisasi
              </label>
              <input
                type="text"
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan nama organisasi"
              />
            </div>

            {/* Tanggal Berlaku */}
            <div>
              <label
                htmlFor="sop_applicable"
                className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Berlaku
              </label>
              <input
                type="date"
                id="sop_applicable"
                name="sop_applicable"
                value={formData.sop_applicable}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label
              htmlFor="file"
              className="block text-sm font-medium text-gray-700 mb-2">
              Ganti File PDF (Opsional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
              <div className="space-y-1 text-center">
                <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Pilih file PDF baru</span>
                    <input
                      id="file"
                      name="file"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">atau drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF hingga 10MB</p>
                {selectedFile && (
                  <p className="text-sm text-green-600 font-medium">
                    File dipilih: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              <strong>Catatan:</strong> Jika Anda mengunggah file baru, file
              lama akan diganti secara otomatis. File lama akan dihapus setelah
              file baru berhasil diunggah.
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Memperbarui...
                </>
              ) : (
                <>
                  <FiEdit className="mr-2" />
                  Perbarui Dokumen
                </>
              )}
            </button>
            <Link
              to="/docs"
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors inline-flex items-center">
              Batal
            </Link>
          </div>
        </form>
      </div>

      {/* Archive Reason Modal */}
      <ArchiveReasonModal
        isOpen={showArchiveReasonModal}
        onConfirm={handleArchiveReasonConfirm}
        onCancel={handleArchiveReasonCancel}
      />
    </div>
  );
};

export default EditPdfDocPage;
