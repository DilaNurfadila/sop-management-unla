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
  FiFolder,
} from "react-icons/fi";
import CustomModal from "../components/CustomModal";
import { useModal } from "../hooks/useModal";
import {
  getAllArchived,
  downloadArchivedFile,
  restoreDocument,
  deleteArchived,
  getArchiveStats,
} from "../services/archiveApi.jsx";
import { formatDateTime } from "../utils/dateFormatter";
import { getSafeUserDataNoRedirect } from "../utils/cryptoUtils";

const ArchivePage = () => {
  const [archivedDocs, setArchivedDocs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Get user data untuk cek role
  const userData = getSafeUserDataNoRedirect();
  const isAdmin = userData?.role === "admin";
  const isAdminUnit = userData?.role === "admin_unit";
  const canManageArchives = isAdmin || isAdminUnit;

  // Initialize modal hook
  const {
    modalState,
    showDeleteConfirm,
    showRestoreConfirm,
    showAlert,
    closeModal,
    setLoading: setModalLoading,
  } = useModal();

  useEffect(() => {
    fetchArchivedDocs();
    fetchStats();
  }, []);

  const fetchArchivedDocs = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAllArchived();
      // Pastikan kita mengambil array data dari response
      setArchivedDocs(response.data || []);
    } catch (err) {
      let errorMessage = "Gagal memuat data arsip";

      if (err.message === "Akses ditolak, token tidak tersedia") {
        errorMessage = "Anda belum login. Silakan login terlebih dahulu.";
      } else if (err.message === "Akses ditolak") {
        errorMessage = "Anda tidak memiliki akses ke halaman arsip.";
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }

      setError(errorMessage);
      console.error("Error fetching archived docs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getArchiveStats();
      // Pastikan kita mengambil data dari response
      setStats(response.data || {});
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
    await showRestoreConfirm({
      title: "Konfirmasi Restore Dokumen",
      message:
        "Apakah Anda yakin ingin mengembalikan dokumen ini ke daftar aktif? Dokumen akan dipindahkan dari arsip.",
      onConfirm: async () => {
        try {
          setModalLoading(true);
          await restoreDocument(archiveId);
          await fetchArchivedDocs();
          await fetchStats(); // Update statistics after restore

          showAlert({
            title: "Berhasil",
            message: "Dokumen berhasil dikembalikan ke daftar aktif",
            type: "success",
          });
        } catch (err) {
          setError("Gagal mengembalikan dokumen");
          console.error("Error restoring document:", err);
          showAlert({
            title: "Error",
            message: "Gagal mengembalikan dokumen. Silakan coba lagi.",
            type: "danger",
          });
        } finally {
          setModalLoading(false);
        }
      },
    });
  };

  const handleDelete = async (archiveId) => {
    await showDeleteConfirm({
      title: "Konfirmasi Hapus Permanen",
      message:
        "Apakah Anda yakin ingin menghapus dokumen arsip ini secara permanen? Tindakan ini tidak dapat dibatalkan.",
      onConfirm: async () => {
        try {
          setModalLoading(true);
          await deleteArchived(archiveId);
          await fetchArchivedDocs();
          await fetchStats();

          showAlert({
            title: "Berhasil",
            message: "Dokumen arsip berhasil dihapus permanen",
            type: "success",
          });
        } catch (err) {
          setError("Gagal menghapus dokumen arsip");
          console.error("Error deleting archived document:", err);
          showAlert({
            title: "Error",
            message: "Gagal menghapus dokumen arsip. Silakan coba lagi.",
            type: "danger",
          });
        } finally {
          setModalLoading(false);
        }
      },
    });
  };

  const filteredDocs = archivedDocs.filter((doc) => {
    const matchesSearch = doc.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  Dokumen Aktif
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.total_active || 0}
                </p>
              </div>
              <FiFileText className="text-3xl text-green-100" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Dokumen dengan Arsip
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.documents_with_archives}
                </p>
              </div>
              <FiFolder className="text-3xl text-orange-100" />
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
                    Dokumen Arsip
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                        {doc.title} (Arsip)
                      </div>
                      <div className="text-sm text-gray-500">
                        Dokumen telah diarsipkan
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

                        {/* Tombol Restore - hanya untuk admin dan admin_unit */}
                        {canManageArchives && (
                          <button
                            onClick={() => handleRestore(doc.id)}
                            className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50"
                            title="Kembalikan Dokumen">
                            <FiRotateCcw />
                          </button>
                        )}

                        {/* Tombol Delete - hanya untuk admin dan admin_unit */}
                        {canManageArchives && (
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                            title="Hapus Permanen">
                            <FiTrash2 />
                          </button>
                        )}
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

      {/* Custom Modal */}
      <CustomModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
        isLoading={modalState.isLoading}
      />
    </div>
  );
};

export default ArchivePage;
