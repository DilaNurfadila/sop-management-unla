import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  getUploadedFiles,
  deleteUploadedFile,
  updateDocPdfStatus,
} from "../../services/apiPdf";
import Notification from "../../components/Notification";
import {
  FiUpload,
  FiCheck,
  FiX,
  FiExternalLink,
  FiEdit2,
  FiTrash2,
  FiFilePlus,
} from "react-icons/fi";

const ListDocsPage = () => {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [notification, setNotification] = useState(null);
  const [loadingStates, setLoadingStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchPdfFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filesData = await getUploadedFiles();
      if (Array.isArray(filesData)) {
        setPdfFiles(filesData);
      } else {
        setPdfFiles([]);
        console.warn(
          "Unexpected PDF data structure, expected array:",
          filesData
        );
      }
    } catch (error) {
      setError(
        error.message || "Gagal memuat daftar file PDF. Silakan coba lagi."
      );
      setPdfFiles([]);
      console.error("Error fetching PDF files:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPdfFiles();

    if (location.state?.message) {
      showNotification(location.state.message, location.state.type);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [fetchPdfFiles, location, navigate]);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const closeNotification = () => {
    setNotification(null);
  };

  // PDF Functions
  const handlePdfPublish = async (fileId) => {
    const isConfirmed = window.confirm(
      "Apakah Anda yakin ingin mempublikasi file ini?"
    );
    if (isConfirmed) {
      setLoadingStates((prev) => ({ ...prev, [fileId]: true }));
      try {
        await updateDocPdfStatus(fileId, "published");
        fetchPdfFiles();
        showNotification("File berhasil dipublikasi", "success");
      } catch (error) {
        console.error("Error publishing file:", error);
        showNotification("Gagal mempublikasi file", "error");
      } finally {
        setLoadingStates((prev) => ({ ...prev, [fileId]: false }));
      }
    }
  };

  const handlePdfUnpublish = async (fileId) => {
    const isConfirmed = window.confirm(
      "Apakah Anda yakin ingin membatalkan publikasi file ini?"
    );
    if (isConfirmed) {
      setLoadingStates((prev) => ({ ...prev, [fileId]: true }));
      try {
        await updateDocPdfStatus(fileId, "draft");
        fetchPdfFiles();
        showNotification("File berhasil dikembalikan ke draft", "success");
      } catch (error) {
        console.error("Error unpublishing file:", error);
        showNotification("Gagal membatalkan publikasi file", "error");
      } finally {
        setLoadingStates((prev) => ({ ...prev, [fileId]: false }));
      }
    }
  };

  const handlePdfDelete = async (fileId) => {
    const isConfirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus file ini? Tindakan ini tidak dapat dibatalkan."
    );
    if (isConfirmed) {
      setDeletingId(fileId);
      try {
        await deleteUploadedFile(fileId);
        fetchPdfFiles();
        showNotification("File berhasil dihapus", "success");
      } catch (error) {
        console.error("Error deleting file:", error);
        showNotification("Gagal menghapus file", "error");
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleOpenFile = (url) => {
    window.open(url, "_blank");
  };

  const handleEdit = (fileId) => {
    // Navigate to edit PDF page
    navigate(`/docs/edit-pdf/${fileId}`);
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      draft: "bg-yellow-100 text-yellow-800",
      published: "bg-green-100 text-green-800",
    };

    const statusText = {
      draft: "Draft",
      published: "Published",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusStyles[status] || statusStyles.draft
        }`}>
        {statusText[status] || status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Memuat data...</div>
      </div>
    );

  if (error)
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchPdfFiles}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
          Coba Lagi
        </button>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Daftar Dokumen SOP</h1>
      </div>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <Link
          to="/docs/add"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
          <FiFilePlus className="mr-2" /> Tambah Dokumen SOP
        </Link>
      </div>

      {/* PDF Files Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Daftar Dokumen SOP</h2>
          <span className="text-gray-500">
            {pdfFiles.length} file ditemukan
          </span>
        </div>

        {pdfFiles.length === 0 ? (
          <div className="text-center py-8">
            <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Belum ada file PDF yang diunggah</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Kode SOP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Judul SOP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Organisasi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Tanggal Berlaku
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Versi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pdfFiles.map((file, index) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                      <span className="font-medium">
                        {file.sop_code || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 border-b">
                      <div className="max-w-xs">
                        <p className="font-medium truncate">
                          {file.sop_title || "Tanpa Judul"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 border-b">
                      <span>{file.organization || "N/A"}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                      <span>{formatDate(file.sop_applicable)}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                      <span>{file.sop_version || "N/A"}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap border-b">
                      {getStatusBadge(file.status || "draft")}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center border-b">
                      <div className="flex justify-center space-x-1 flex-wrap gap-y-1">
                        {/* Publish/Unpublish Button */}
                        {file.status === "published" ? (
                          <button
                            onClick={() => handlePdfUnpublish(file.id)}
                            disabled={loadingStates[file.id]}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
                            title="Unpublish">
                            <FiX size={10} />
                            Unpublish
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePdfPublish(file.id)}
                            disabled={loadingStates[file.id]}
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
                            title="Publish">
                            <FiCheck size={10} />
                            Publish
                          </button>
                        )}

                        {/* Open File Button */}
                        <button
                          onClick={() => handleOpenFile(file.url)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1"
                          title="Buka File">
                          <FiExternalLink size={10} />
                          Buka
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleEdit(file.id)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1"
                          title="Ubah">
                          <FiEdit2 size={10} />
                          Ubah
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handlePdfDelete(file.id)}
                          disabled={deletingId === file.id}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                          title="Hapus">
                          <FiTrash2 size={10} />
                          {deletingId === file.id ? "..." : "Hapus"}
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
    </div>
  );
};

export default ListDocsPage;
