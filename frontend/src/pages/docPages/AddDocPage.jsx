// Import React dan hooks untuk state management
import React, { useState } from "react";
// Import React Router untuk navigasi
import { Link, useNavigate } from "react-router-dom";
// Import komponen FileUpload untuk upload PDF
import FileUpload from "../../components/FileUpload";
// Import komponen Notification untuk feedback user
import Notification from "../../components/Notification";
// Import icon dari react-icons
import { FiArrowLeft, FiFilePlus, FiUpload } from "react-icons/fi";

/**
 * Komponen AddDocPage - Halaman untuk menambahkan dokumen SOP baru
 * Menampilkan form metadata dan komponen upload file
 */
const AddDocPage = () => {
  // State untuk data form metadata dokumen
  const [formData, setFormData] = useState({
    sop_code: "", // Kode SOP
    sop_title: "", // Judul SOP
    organization: "", // Organisasi/Divisi
    sop_applicable: "", // Tanggal berlaku
    sop_version: "", // Versi SOP
  });

  // State untuk notification message
  const [notification, setNotification] = useState(null);

  // Hook untuk navigasi programmatic
  const navigate = useNavigate();

  /**
   * Function untuk menampilkan notification
   * @param {string} message - Pesan notification
   * @param {string} type - Tipe notification (success, error, warning, info)
   */
  const showNotification = (message, type) => {
    setNotification({ message, type });
    // Auto hide notification setelah 5 detik
    setTimeout(() => setNotification(null), 5000);
  };

  /**
   * Function untuk menutup notification secara manual
   */
  const closeNotification = () => {
    setNotification(null);
  };

  /**
   * Handler untuk perubahan input form
   * @param {Event} e - Event dari input field
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update form data dengan spread operator
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  /**
   * Handler untuk upload file berhasil
   * Menampilkan notification sukses dan navigate ke halaman list
   */
  const handleUploadSuccess = () => {
    showNotification("File PDF berhasil diunggah", "success");
    // Navigate ke list page setelah upload berhasil dengan delay
    setTimeout(() => {
      navigate("/docs", {
        state: {
          message: "Dokumen SOP berhasil ditambahkan",
          type: "success",
        },
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Background dengan min height full screen */}
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
                <FiFilePlus className="mr-3" />
                Tambah Dokumen SOP Baru
              </h1>
              <p className="text-gray-600 mt-1">
                Isi informasi dokumen dan unggah file PDF SOP
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-6">
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
                placeholder="Contoh: SOP-001"
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
                placeholder="Contoh: 1.0"
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
              placeholder="Contoh: Prosedur Keamanan Sistem"
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
                placeholder="Contoh: Universitas Langlangbuana"
              />
            </div>

            {/* Tanggal Berlaku */}
            <div>
              <label
                htmlFor="sop_applicable"
                className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Berlaku <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="sop_applicable"
                name="sop_applicable"
                value={formData.sop_applicable}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label
              htmlFor="file"
              className="block text-sm font-medium text-gray-700 mb-2">
              Upload File PDF SOP <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <FileUpload
                metadata={formData}
                onUploadSuccess={handleUploadSuccess}
                showNotification={showNotification}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              <strong>Catatan:</strong> Pastikan file PDF sudah berisi informasi
              lengkap sesuai dengan metadata yang diisi.
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-6">
            <Link
              to="/docs"
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors inline-flex items-center">
              <FiArrowLeft className="mr-2" />
              Kembali ke Daftar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDocPage;
