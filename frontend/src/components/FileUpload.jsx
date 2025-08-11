import { useState } from "react";
import { uploadFile } from "../services/apiPdf";
import { FiUpload, FiFile } from "react-icons/fi";

const FileUpload = ({ metadata, onUploadSuccess, showNotification }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError(null);

    if (selectedFile) {
      // Validasi type file PDF
      if (selectedFile.type !== "application/pdf") {
        setError("Hanya file PDF yang diperbolehkan");
        e.target.value = ""; // Reset input
        setFile(null);
        return;
      }

      // Validasi ukuran file (maksimal 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("Ukuran file harus kurang dari 10MB");
        e.target.value = ""; // Reset input
        setFile(null);
        return;
      }

      setFile(selectedFile);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Silakan pilih file");
      return;
    }

    if (!metadata?.sop_code || !metadata?.sop_title) {
      setError("Kode SOP dan Judul harus diisi");
      return;
    }

    if (!metadata?.sop_applicable) {
      setError("Tanggal Berlaku harus diisi");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Prepare the form data with metadata
      const uploadData = {
        code: metadata.sop_code,
        title: metadata.sop_title,
        organization: metadata.organization || "",
        effective_date: metadata.sop_applicable || "",
        version: metadata.sop_version || "",
      };

      const response = await uploadFile(file, uploadData);

      if (onUploadSuccess) {
        onUploadSuccess(response);
      }

      // Reset form
      setFile(null);
      document.getElementById("file").value = "";

      if (showNotification) {
        showNotification("File berhasil diunggah!", "success");
      }
    } catch (err) {
      const errorMsg = err.message || "Gagal mengunggah file";
      setError(errorMsg);
      if (showNotification) {
        showNotification(errorMsg, "error");
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* File Upload Area */}
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
        <div className="space-y-1 text-center">
          <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="file"
              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
              <span>Pilih file PDF</span>
              <input
                id="file"
                name="file"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
            <p className="pl-1">atau drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">PDF hingga 10MB</p>
          {file && (
            <div className="mt-3">
              <div className="flex items-center justify-center text-sm text-green-600 font-medium">
                <FiFile className="mr-2 h-4 w-4" />
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Validation Info */}
      {(!metadata?.sop_code ||
        !metadata?.sop_title ||
        !metadata?.sop_applicable) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-700 text-sm">
            <strong>Mohon lengkapi:</strong> Kode SOP, Judul SOP, dan Tanggal
            Berlaku harus diisi sebelum mengunggah file
          </p>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleSubmit}
        disabled={
          isUploading ||
          !file ||
          !metadata?.sop_code ||
          !metadata?.sop_title ||
          !metadata?.sop_applicable
        }
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Mengunggah...
          </>
        ) : (
          <>
            <FiUpload className="mr-2 h-4 w-4" />
            Unggah File PDF
          </>
        )}
      </button>
    </div>
  );
};

export default FileUpload;
