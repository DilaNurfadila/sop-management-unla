import React, { useState, useEffect } from "react";
import {
  FiArchive,
  FiDownload,
  FiRotateCcw,
  FiTrash2,
  FiEye,
  FiCalendar,
  FiUser,
  FiFileText,
  FiFilter,
  FiSearch,
} from "react-icons/fi";
import {
  getAllArchived,
  downloadArchivedFile,
  restoreDocument,
  deleteArchived,
  getArchiveStats,
} from "../services/archiveApi";
import { formatDateTime } from "../utils/dateFormatter";

const ArchivePage = () => {
  const [archivedDocs, setArchivedDocs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedArchiveId, setSelectedArchiveId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    fetchArchivedDocs();
    fetchStats();
  }, []);

  const fetchArchivedDocs = async () => {
    try {
      setLoading(true);
      const data = await getAllArchived();
      setArchivedDocs(data);
    } catch (err) {
      setError("Gagal memuat data arsip");
      console.error("Error fetching archived docs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getArchiveStats();
      setStats(data);
    } catch (err) {
      console.error("Error fetching archive stats:", err);
    }
  };

  const handleDownload = async (archiveId, fileName) => {
    try {
      await downloadArchivedFile(archiveId, fileName);
    } catch (err) {
      setError("Gagal mengunduh file");
      console.error("Error downloading file:", err);
    }
  };

  const handleRestore = async (archiveId) => {
    try {
      await restoreDocument(archiveId);
      await fetchArchivedDocs();
      setShowConfirmModal(false);
      alert("Dokumen berhasil dikembalikan");
    } catch (err) {
      setError("Gagal mengembalikan dokumen");
      console.error("Error restoring document:", err);
    }
  };

  const handleDelete = async (archiveId) => {
    try {
      await deleteArchived(archiveId);
      await fetchArchivedDocs();
      await fetchStats();
      setShowConfirmModal(false);
      alert("Dokumen arsip berhasil dihapus permanen");
    } catch (err) {
      setError("Gagal menghapus dokumen arsip");
      console.error("Error deleting archived document:", err);
    }
  };

  const showConfirm = (action, archiveId) => {
    setConfirmAction(action);
    setSelectedArchiveId(archiveId);
    setShowConfirmModal(true);
  };

  const filteredDocs = archivedDocs.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.current_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    ...new Set(archivedDocs.map((doc) => doc.category).filter(Boolean)),
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <FiArchive className="text-2xl text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Arsip Dokumen SOP
          </h1>
        </div>
        <p className="text-gray-600">
          Kelola dokumen SOP yang telah diarsipkan. Anda dapat melihat,
          mengunduh, atau mengembalikan versi lama.
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Arsip</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.total_archived}
                </p>
              </div>
              <FiArchive className="text-3xl text-blue-100" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Dokumen dengan Arsip
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.documents_with_archives}
                </p>
              </div>
              <FiFileText className="text-3xl text-green-100" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Ukuran Rata-rata
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.avg_file_size
                    ? `${(stats.avg_file_size / 1024 / 1024).toFixed(1)} MB`
                    : "0 MB"}
                </p>
              </div>
              <FiDownload className="text-3xl text-purple-100" />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari dokumen arsip..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
              <option value="">Semua Kategori</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Archived Documents List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-12">
            <FiArchive className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">
              {searchTerm || selectedCategory
                ? "Tidak ada dokumen arsip yang cocok"
                : "Belum ada dokumen arsip"}
            </h3>
            <p className="text-gray-400">
              {searchTerm || selectedCategory
                ? "Coba ubah filter pencarian"
                : "Dokumen akan muncul di sini ketika ada SOP yang diperbarui"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dokumen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dokumen Saat Ini
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Info Arsip
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiFileText className="text-red-500 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {doc.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            Versi: {doc.version || "N/A"} •{" "}
                            {doc.category || "Tanpa Kategori"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {doc.current_title || "Dokumen telah dihapus"}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-2">
                        <FiCalendar className="text-gray-400" />
                        {formatDateTime(doc.archived_at)}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                        <FiUser className="text-gray-400" />
                        {doc.archived_by_name}
                      </div>
                      {doc.archived_reason && (
                        <div className="text-xs text-gray-400 mt-1">
                          {doc.archived_reason}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(doc.id, doc.file_name)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                          title="Unduh File">
                          <FiDownload />
                        </button>

                        <button
                          onClick={() => showConfirm("restore", doc.id)}
                          className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50"
                          title="Kembalikan Dokumen">
                          <FiRotateCcw />
                        </button>

                        <button
                          onClick={() => showConfirm("delete", doc.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                          title="Hapus Permanen">
                          <FiTrash2 />
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

      {/* Recent Archives */}
      {stats?.recent_archives && stats.recent_archives.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Arsip Terbaru
          </h2>
          <div className="space-y-3">
            {stats.recent_archives.map((archive, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{archive.title}</p>
                  <p className="text-sm text-gray-500">
                    oleh {archive.archived_by_name}
                  </p>
                </div>
                <span className="text-sm text-gray-400">
                  {formatDateTime(archive.archived_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {confirmAction === "restore"
                ? "Kembalikan Dokumen"
                : "Hapus Permanen"}
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmAction === "restore"
                ? "Dokumen ini akan menggantikan versi saat ini. Versi saat ini akan diarsipkan. Lanjutkan?"
                : "Dokumen arsip akan dihapus permanen dan tidak dapat dikembalikan. Lanjutkan?"}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                Batal
              </button>
              <button
                onClick={() => {
                  if (confirmAction === "restore") {
                    handleRestore(selectedArchiveId);
                  } else {
                    handleDelete(selectedArchiveId);
                  }
                }}
                className={`px-4 py-2 text-white rounded-lg ${
                  confirmAction === "restore"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}>
                {confirmAction === "restore" ? "Kembalikan" : "Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchivePage;
