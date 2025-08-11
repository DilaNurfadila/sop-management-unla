import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FileUpload from "../../components/FileUpload";
import Notification from "../../components/Notification";
import { FiArrowLeft, FiFilePlus, FiUpload } from "react-icons/fi";

const AddDocPage = () => {
  const [formData, setFormData] = useState({
    sop_code: "",
    sop_title: "",
    organization: "",
    sop_applicable: "",
    sop_version: "",
  });
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleUploadSuccess = () => {
    showNotification("File PDF berhasil diunggah", "success");
    // Navigate to list page after successful upload
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
