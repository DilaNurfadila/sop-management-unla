import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { submitSopForReview } from "../../services/apiPdf";
import { getSopByUserUnit, getDocs } from "../../services/api";
import { forceLogout } from "../../services/authClient";
import api from "../../services/api";
import { archiveSopDocument } from "../../services/archiveApi.jsx";
import Notification from "../../components/Notification";
import CustomModal from "../../components/CustomModal";
import ArchiveReasonModal from "../../components/ArchiveReasonModal";
import PublishVisibilityModal from "../../components/PublishVisibilityModal";
import { useModal } from "../../hooks/useModal";
import {
  FiX,
  FiEdit2,
  FiEye,
  FiCalendar,
  FiFileText,
  FiShield,
  FiSend,
  FiArrowDown,
  FiArchive,
  FiInfo,
} from "react-icons/fi";
import { getSafeUserDataNoRedirect } from "../../utils/cryptoUtils";
import { dateFormatter } from "../../utils/dateFormatter";
import {
  formatTanggalPembuatanFromSop,
  formatTanggalRevisiFromSop,
  formatTanggalEfektifFromSop,
} from "../../utils/sopDateHelpers.jsx";

const ListDocsPage = () => {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [notification, setNotification] = useState(null);
  const [loadingStates, setLoadingStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState([]);
  const [loadingRevision, setLoadingRevision] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [selectedDocumentForArchive, setSelectedDocumentForArchive] =
    useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedDocumentForPublish, setSelectedDocumentForPublish] =
    useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailError, setDetailError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [unitFilter, setUnitFilter] = useState("ALL"); // "ALL" | unit name
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "draft" | "unpublished" | "published"
  // Riwayat revisi dipindahkan: fitur dihapus dari halaman ini

  // Get user data untuk cek role dan ID
  const userData = getSafeUserDataNoRedirect();

  const isSuperadmin = userData?.role === "superadmin";
  const isAdmin = userData?.role === "admin";
  const isAdminUnit = userData?.role === "admin_unit";

  // Kumpulkan opsi unit unik dari hasil fetch
  const unitOptions = useMemo(() => {
    const s = new Set();
    pdfFiles.forEach((f) => {
      const name = f?.unit_scope_name || f?.organization || "Tidak ditentukan";
      if (name) s.add(name);
    });
    return Array.from(s).sort();
  }, [pdfFiles]);

  // Function untuk mengecek apakah user bisa publikasi SOP tertentu
  const canPublishSop = (file) => {
    if (!userData) return false;
    if (userData.role === "user") return false;

    if (userData.role === "admin") {
      const sopUnitName = file.unit_scope_name || file.organization || "";
      return sopUnitName.toLowerCase().includes("universitas langlangbuana");
    }

    if (userData.role === "admin_unit") {
      const userUnit = parseInt(userData.unit);
      const sopUnit = parseInt(file.unit_scope);
      return sopUnit === userUnit;
    }

    return false;
  };

  // Function untuk mengecek apakah user bisa mengarsipkan SOP
  const canArchiveSop = () => {
    if (!userData) return false;
    // Admin, admin_unit, dan superadmin bisa mengarsipkan dokumen
    return (
      userData.role === "admin" ||
      userData.role === "admin_unit" ||
      userData.role === "superadmin"
    );
  };

  // FUNCTION BARU: Cek apakah user adalah penyusun SOP
  const isSOPCreator = (file) => {
    if (!userData) return false;

    // Cek berdasarkan berbagai field yang mungkin ada
    const isCreator = userData.id === file.creator_id;

    return isCreator;
  };

  // (Removed isSubmitted helper; logic is inlined where needed)

  // FUNCTION BARU: Cek apakah user boleh melihat dokumen
  const canViewDocument = (file) => {
    if (!userData) return false;

    // Jangan tampilkan dokumen yang sudah diarsipkan
    if (file.status === "archived") return false;

    // Creator (penyusun) selalu dapat melihat dokumennya sendiri (selama tidak archived)
    if (userData.id === file.creator_id) return true;

    // Superadmin dapat melihat semua dokumen (kecuali yang diarsipkan)
    if (userData.role === "superadmin") return true;

    // Admin bisa lihat semua dokumen (kecuali yang diarsipkan)
    if (userData.role === "admin") return true;

    // Admin unit bisa lihat dokumen di unit mereka (kecuali yang diarsipkan)
    if (userData.role === "admin_unit") {
      const userUnit = parseInt(userData.unit);
      const sopUnit = parseInt(file.unit_scope);
      return sopUnit === userUnit;
    }

    // User biasa hanya bisa lihat dokumen yang sudah dipublikasi
    // ATAU dokumen yang mereka buat sendiri (kecuali yang diarsipkan)
    if (userData.role === "user") {
      const isPublished = file.status === "published";
      return isPublished; // creator case sudah di-handle di atas
    }

    return false;
  };

  const navigate = useNavigate();
  const location = useLocation();
  const { modalState, closeModal } = useModal();

  // Function terpisah untuk fetch data yang bisa dipanggil ulang
  const fetchPdfFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      // Untuk superadmin (dan admin), ambil dari endpoint umum /docs agar backend permission mengatur visibilitas
      const response =
        userData?.role === "superadmin"
          ? await getDocs()
          : await getSopByUserUnit();

      // Normalisasi bentuk respons: /docs mengembalikan array langsung, /docs/my-unit membungkus di { data: [] }
      const responseData = Array.isArray(response)
        ? response
        : response?.data || [];

      const formattedData = responseData.map((sop) => ({
        ...sop,
        sop_title: sop.title || sop.name,
        uploader_name: sop.uploader_name || "Unknown",
        created_at: sop.created_at, // canonical created_at only (no alias)
        organization: sop.unit_scope_name || "Universitas Langlangbuana",
        approval_date: sop.approval_date || sop.approved_at || null,
        sop_applicable: sop.sop_applicable || null,
        // Pastikan field ID creator ada
        creator_id: sop.creator_id || sop.uploader_id || null,
        uploader_id: sop.uploader_id || null,
        user_id: sop.user_id || null,
      }));

      // Filter dokumen berdasarkan hak akses user (canViewDocument sudah mengecek status archive)
      let filteredData = formattedData;
      if (userData) {
        filteredData = filteredData.filter(canViewDocument);
      }

      setPdfFiles(filteredData);
    } catch (error) {
      console.error("❌ Error fetching SOP files:", error);
      const msg =
        error?.message ||
        "Gagal memuat daftar dokumen SOP untuk unit kerja Anda.";
      setError(msg);
      setPdfFiles([]);
      if (/akses ditolak|unauthorized|token|sesi berakhir/i.test(msg)) {
        await forceLogout();
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response =
          userData?.role === "superadmin"
            ? await getDocs()
            : await getSopByUserUnit();

        const responseData = Array.isArray(response)
          ? response
          : response?.data || [];

        const formattedData = responseData.map((sop) => ({
          ...sop,
          sop_title: sop.title || sop.name,
          uploader_name: sop.uploader_name || "Unknown",
          created_at: sop.created_at,
          organization: sop.unit_scope_name || "Universitas Langlangbuana",
          approval_date: sop.approval_date || sop.approved_at || null,
          sop_applicable: sop.sop_applicable || null,
          // Pastikan field ID creator ada
          creator_id: sop.creator_id || sop.uploader_id || null,
          uploader_id: sop.uploader_id || null,
          user_id: sop.user_id || null,
        }));

        // Filter dokumen berdasarkan hak akses user (canViewDocument sudah mengecek status archive)
        let filteredData = formattedData;
        if (userData) {
          filteredData = filteredData.filter(canViewDocument);
        }

        setPdfFiles(filteredData);
      } catch (error) {
        console.error("❌ Error fetching SOP files:", error);
        const msg =
          error?.message ||
          "Gagal memuat daftar dokumen SOP untuk unit kerja Anda.";
        setError(msg);
        setPdfFiles([]);
        if (/akses ditolak|unauthorized|token|sesi berakhir/i.test(msg)) {
          await forceLogout();
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    // Hanya fetch sekali saat component mount
    fetchData();

    // Handle notification dari location state
    if (location.state?.message) {
      showNotification(location.state.message, location.state.type);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Sengaja kosong untuk hanya run sekali

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const fetchRevisionNotes = async (sopId) => {
    try {
      setLoadingRevision(true);
      const response = await api.get(`/review/revision-notes/${sopId}`);
      setRevisionNotes(response.data.data || []);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Gagal mengambil catatan revisi";
      showNotification(errorMessage, "error");
      setRevisionNotes([]);
    } finally {
      setLoadingRevision(false);
    }
  };

  const handleShowRevisionNotes = async (document) => {
    setSelectedDocument(document);
    setShowRevisionModal(true);
    await fetchRevisionNotes(document.id);
  };

  const handleOpenSopDetail = async (file) => {
    try {
      setDetailError("");
      setDetailData(null);
      setShowDetailModal(true);
      setDetailLoading(true);
      const resp = await api.get(`/docs/${file.id}`);
      const data = resp?.data || {};
      setDetailData(data);
    } catch (e) {
      console.error("Gagal memuat detail SOP:", e);
      const msg =
        e?.response?.data?.message || "Gagal memuat detail SOP. Coba lagi.";
      setDetailError(msg);
      // Jika unauthorized, paksa logout agar konsisten dengan alur global
      const status = e?.response?.status;
      if (status === 401 || /unauthorized|token|sesi berakhir/i.test(msg)) {
        await forceLogout();
        return;
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseSopDetail = () => {
    setShowDetailModal(false);
    setDetailData(null);
    setDetailError("");
  };

  // Hapus handler riwayat revisi

  const handleSubmitForReview = async (fileId) => {
    try {
      setLoadingStates((prev) => ({
        ...prev,
        [`submit_${fileId}`]: true,
      }));
      const checkResponse = await api.get(
        `/docs/validate-before-submit/${fileId}`
      );

      if (!checkResponse.data.isValid) {
        showNotification(checkResponse.data.message, "error");
        return;
      }

      await submitSopForReview(fileId);
      showNotification("SOP berhasil diajukan untuk pemeriksaan", "success");
      await fetchPdfFiles();
    } catch (error) {
      if (error.message.includes("Harus pilih pemeriksa dan pengesah")) {
        showNotification(
          "Harus pilih pemeriksa dan pengesah terlebih dahulu sebelum mengajukan pemeriksaan",
          "error"
        );
      } else {
        showNotification(
          "Gagal mengajukan SOP untuk pemeriksaan: " + error.message,
          "error"
        );
      }
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [`submit_${fileId}`]: false,
      }));
    }
  };

  const openPublishModal = (file) => {
    setSelectedDocumentForPublish(file);
    setShowPublishModal(true);
  };

  const handlePublishConfirm = async (visibility) => {
    const fileId = selectedDocumentForPublish?.id;
    if (!fileId) return;
    try {
      setLoadingStates((prev) => ({ ...prev, [`publish_${fileId}`]: true }));
      await api.put(`/docs/publish/${fileId}`, {
        public_visibility: visibility,
      });
      showNotification(
        visibility === "everyone"
          ? "SOP dipublikasikan untuk semua orang"
          : "SOP dipublikasikan untuk internal unit",
        "success"
      );
      setShowPublishModal(false);
      setSelectedDocumentForPublish(null);
      await fetchPdfFiles();
    } catch (error) {
      showNotification(
        "Gagal mempublikasikan SOP: " +
          (error.response?.data?.message || error.message),
        "error"
      );
    } finally {
      setLoadingStates((prev) => ({ ...prev, [`publish_${fileId}`]: false }));
    }
  };

  const handleUnpublishSop = async (fileId) => {
    try {
      setLoadingStates((prev) => ({ ...prev, [`unpublish_${fileId}`]: true }));
      await api.put(`/docs/unpublish/${fileId}`);
      showNotification("SOP berhasil dibatalkan publikasinya", "success");
      await fetchPdfFiles();
    } catch (error) {
      showNotification(
        "Gagal membatalkan publikasi SOP: " +
          (error.response?.data?.message || error.message),
        "error"
      );
    } finally {
      setLoadingStates((prev) => ({ ...prev, [`unpublish_${fileId}`]: false }));
    }
  };

  const handleArchiveClick = (file) => {
    setSelectedDocumentForArchive(file);
    setShowArchiveModal(true);
  };

  const handleArchiveConfirm = async (reason) => {
    try {
      setLoadingStates((prev) => ({
        ...prev,
        [`archive_${selectedDocumentForArchive.id}`]: true,
      }));

      await archiveSopDocument(selectedDocumentForArchive.id, reason);
      showNotification("SOP berhasil diarsipkan", "success");
      setShowArchiveModal(false);
      setSelectedDocumentForArchive(null);
      await fetchPdfFiles();
    } catch (error) {
      showNotification(
        "Gagal mengarsipkan SOP: " +
          (error.response?.data?.message || error.message),
        "error"
      );
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [`archive_${selectedDocumentForArchive?.id}`]: false,
      }));
    }
  };

  const handleArchiveCancel = () => {
    setShowArchiveModal(false);
    setSelectedDocumentForArchive(null);
  };

  // Function untuk filter dokumen berdasarkan search term
  const filteredPdfFiles = pdfFiles.filter((file) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      file.sop_title?.toLowerCase().includes(searchLower) ||
      file.sop_code?.toLowerCase().includes(searchLower) ||
      file.uploader_name?.toLowerCase().includes(searchLower) ||
      (file.organization || file.unit_scope_name || "")
        ?.toLowerCase()
        .includes(searchLower) ||
      file.status?.toLowerCase().includes(searchLower) ||
      file.review_status?.toLowerCase().includes(searchLower);

    const fileUnit =
      file.unit_scope_name || file.organization || "Tidak ditentukan";
    const matchesUnit =
      unitFilter === "ALL" ? true : String(fileUnit) === String(unitFilter);

    const matchesStatus =
      statusFilter === "ALL" ? true : file.status === statusFilter;

    return matchesSearch && matchesUnit && matchesStatus;
  });

  // Local formatDate no longer used; centralized helpers handle date labels.

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Memuat dokumen...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isAdmin || isSuperadmin
                  ? "📋 Manajemen Semua SOP"
                  : isAdminUnit
                  ? "📋 SOP Unit Kerja"
                  : "📋 SOP Unit Kerja Saya"}
              </h1>
              <p className="text-gray-600">
                {isAdmin || isSuperadmin
                  ? "Kelola dan publikasi semua dokumen Standard Operating Procedure di seluruh universitas"
                  : isAdminUnit
                  ? "Kelola dokumen Standard Operating Procedure untuk unit kerja Anda"
                  : "Daftar Standard Operating Procedure (SOP) untuk unit kerja Anda"}
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center flex-wrap gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiFileText className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari berdasarkan judul, kode SOP, penyusun, unit, atau status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="off"
                />
              </div>
            </div>
            {/* Filter Unit */}
            {(isAdmin || isSuperadmin) && (
              <div>
                <select
                  value={unitFilter}
                  onChange={(e) => setUnitFilter(e.target.value)}
                  className="min-w-[200px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Filter Unit Kerja">
                  <option value="ALL">Semua Unit</option>
                  {unitOptions.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filter Status */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-w-[180px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Filter Status">
                <option value="ALL">Semua Status</option>
                <option value="draft">Draft</option>
                <option value="unpublished">Belum Dipublikasi</option>
                <option value="published">Dipublikasi</option>
              </select>
            </div>
            {(searchTerm || unitFilter !== "ALL" || statusFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setUnitFilter("ALL");
                  setStatusFilter("ALL");
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <FiX className="h-4 w-4 mr-1" />
                Reset
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="mt-3 text-sm text-gray-600">
              Menampilkan {filteredPdfFiles.length} dari {pdfFiles.length}{" "}
              dokumen untuk "{searchTerm}"
            </div>
          )}
        </div>

        {/* Unit Info Card */}
        {pdfFiles.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-center mb-4">
              <FiShield className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">
                {isAdmin || isSuperadmin
                  ? "Informasi Sistem"
                  : isAdminUnit
                  ? "Informasi Unit Kerja"
                  : "Informasi Unit Kerja"}
              </h2>
            </div>

            {isSuperadmin ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Institusi</p>
                  <p className="font-medium text-gray-900">
                    {pdfFiles[0]?.organization || "Universitas Langlangbuana"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total SOP</p>
                  <p className="font-medium text-blue-600 text-lg">
                    {pdfFiles.length} dokumen
                  </p>
                </div>
              </div>
            ) : isAdmin ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Institusi</p>
                  <p className="font-medium text-gray-900">
                    {pdfFiles[0]?.organization || "Universitas Langlangbuana"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total SOP</p>
                  <p className="font-medium text-blue-600 text-lg">
                    {pdfFiles.length} dokumen
                  </p>
                </div>
              </div>
            ) : isAdminUnit ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Unit Kerja</p>
                  <p className="font-medium text-gray-900">
                    {pdfFiles[0]?.organization || "Universitas Langlangbuana"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total SOP</p>
                  <p className="font-medium text-blue-600 text-lg">
                    {pdfFiles.length} dokumen
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Nama Unit</p>
                  <p className="font-medium text-gray-900">
                    {pdfFiles[0]?.organization || "Universitas Langlangbuana"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Kode Unit</p>
                  <p className="font-medium text-gray-900">
                    {pdfFiles[0]?.kode_unit || "UNLA"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total SOP</p>
                  <p className="font-medium text-blue-600 text-lg">
                    {pdfFiles.length} dokumen
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiX className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600">
                  <FiX className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {filteredPdfFiles.length === 0 ? (
            <div className="text-center py-12">
              <FiFileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "Tidak ada hasil pencarian" : "Belum ada dokumen"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? `Tidak ditemukan dokumen yang sesuai dengan "${searchTerm}"`
                  : isAdmin || isSuperadmin
                  ? "Tidak ada dokumen SOP yang tersedia di sistem saat ini"
                  : isAdminUnit
                  ? "Tidak ada dokumen SOP yang tersedia untuk unit kerja Anda saat ini"
                  : "Tidak ada dokumen SOP yang tersedia saat ini"}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Lihat Semua Dokumen
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dokumen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kode SOP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Scope
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal Pembuatan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal Efektif
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal Revisi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPdfFiles.map((file, index) => (
                    <tr
                      key={`sop-${file.id}-${index}`}
                      className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                              <FiFileText className="h-5 w-5 text-red-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {file.sop_title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {file.organization} • {file.version}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          {file.sop_code ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <FiShield className="mr-1 h-3 w-3" />
                              {file.sop_code}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Belum disahkan
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              file.status === "published"
                                ? "bg-green-100 text-green-800"
                                : file.status === "unpublished"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                            {file.status === "published"
                              ? "Dipublikasi"
                              : file.status === "unpublished"
                              ? "Belum Dipublikasi"
                              : "Draft"}
                          </span>
                          {file.status === "published" && (
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                file.public_visibility === "everyone"
                                  ? "bg-blue-100 text-blue-800"
                                  : file.public_visibility === "unit"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-gray-50 text-gray-400"
                              }`}
                              title={
                                file.public_visibility === "everyone"
                                  ? "Tampil di /sop (publik)"
                                  : file.public_visibility === "unit"
                                  ? "Hanya internal unit (/docs)"
                                  : "Visibilitas belum ditentukan"
                              }>
                              {file.public_visibility === "everyone"
                                ? "Publik"
                                : file.public_visibility === "unit"
                                ? "Internal Unit"
                                : "-"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {file.unit_scope_name ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {file.unit_scope_name}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">
                            Tidak ditentukan
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiCalendar className="mr-1 h-4 w-4" />
                          {formatTanggalPembuatanFromSop(file)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiCalendar className="mr-1 h-4 w-4" />
                          {formatTanggalEfektifFromSop(file)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiCalendar className="mr-1 h-4 w-4" />
                          {formatTanggalRevisiFromSop(file)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {/* Detail SOP Button */}
                          <button
                            onClick={() => handleOpenSopDetail(file)}
                            className="text-gray-700 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-50"
                            title="Detail SOP">
                            <FiInfo />
                          </button>
                          {/* View Button - selalu tampil */}
                          <button
                            onClick={() => navigate(`/sop/view/${file.id}`)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                            title="Lihat Dokumen">
                            <FiEye />
                          </button>

                          {/* Riwayat Revisi dihapus dari halaman ini */}

                          {/* Revision Notes Button - hanya untuk penyusun ketika perlu revisi */}
                          {file.review_status === "needs_revision" &&
                            isSOPCreator(file) && (
                              <button
                                onClick={() => handleShowRevisionNotes(file)}
                                className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                                title="Lihat Catatan Revisi">
                                <FiFileText />
                              </button>
                            )}

                          {/* Revisi Button - khusus untuk penyusun saat SOP sudah disahkan */}
                          {isSOPCreator(file) &&
                            file.review_status === "approved" && (
                              <button
                                onClick={() =>
                                  navigate(`/docs/edit/${file.id}`)
                                }
                                className="text-purple-600 hover:text-purple-800 p-2 rounded-lg hover:bg-purple-50"
                                title="Revisi SOP (Minor/Major)">
                                <FiEdit2 />
                              </button>
                            )}

                          {/* TOMBOL EDIT - HANYA UNTUK PENYUSUN SOP */}
                          {isSOPCreator(file) &&
                            ![
                              "submitted_for_review",
                              "reviewer_approved",
                              "approved",
                            ].includes(file.review_status) && (
                              <Link
                                to={`/docs/edit/${file.id}`}
                                className="text-yellow-600 hover:text-yellow-800 p-2 rounded-lg hover:bg-yellow-50"
                                title="Edit SOP">
                                <FiEdit2 />
                              </Link>
                            )}

                          {/* Publish/Unpublish Button - untuk pengesah */}
                          {canPublishSop(file) &&
                            file.review_status === "approved" && (
                              <>
                                {file.status !== "published" ? (
                                  <button
                                    onClick={() => openPublishModal(file)}
                                    disabled={
                                      loadingStates[`publish_${file.id}`]
                                    }
                                    className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 disabled:opacity-50"
                                    title="📢 Publikasi SOP">
                                    {loadingStates[`publish_${file.id}`] ? (
                                      <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                                    ) : (
                                      <FiSend />
                                    )}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUnpublishSop(file.id)}
                                    disabled={
                                      loadingStates[`unpublish_${file.id}`]
                                    }
                                    className="text-orange-600 hover:text-orange-800 p-2 rounded-lg hover:bg-orange-50 disabled:opacity-50"
                                    title="📤 Batalkan Publikasi SOP">
                                    {loadingStates[`unpublish_${file.id}`] ? (
                                      <div className="animate-spin h-4 w-4 border-2 border-orange-600 border-t-transparent rounded-full"></div>
                                    ) : (
                                      <FiArrowDown />
                                    )}
                                  </button>
                                )}
                              </>
                            )}

                          {/* Submit for review */}
                          {isSOPCreator(file) &&
                            file.review_status !== "reviewer_approved" &&
                            file.review_status !== "approved" &&
                            file.review_status !== "submitted_for_review" && (
                              <button
                                onClick={() => handleSubmitForReview(file.id)}
                                disabled={loadingStates[`submit_${file.id}`]}
                                className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                                title="Ajukan untuk Ditinjau">
                                {loadingStates[`submit_${file.id}`] ? (
                                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                ) : (
                                  <FiSend />
                                )}
                              </button>
                            )}

                          {/* Archive Button - untuk admin dan admin_unit */}
                          {canArchiveSop() && (
                            <button
                              onClick={() => handleArchiveClick(file)}
                              disabled={loadingStates[`archive_${file.id}`]}
                              className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                              title="Arsipkan SOP">
                              {loadingStates[`archive_${file.id}`] ? (
                                <div className="animate-spin h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full"></div>
                              ) : (
                                <FiArchive />
                              )}
                            </button>
                          )}

                          {/* Review Status Badge */}
                          {file.review_status && (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                file.review_status === "draft"
                                  ? "bg-gray-100 text-gray-800"
                                  : file.review_status ===
                                    "submitted_for_review"
                                  ? "bg-blue-100 text-blue-800"
                                  : file.review_status === "under_review"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : file.review_status === "needs_revision"
                                  ? "bg-red-100 text-red-800"
                                  : file.review_status === "reviewer_approved"
                                  ? "bg-purple-100 text-purple-800"
                                  : file.review_status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                              {file.review_status === "draft" && "Draft"}
                              {file.review_status === "submitted_for_review" &&
                                "Diajukan"}
                              {file.review_status === "under_review" &&
                                "Diperiksa"}
                              {file.review_status === "needs_revision" &&
                                "Perlu Revisi"}
                              {file.review_status === "reviewer_approved" &&
                                "Disetujui Pemeriksa - Menunggu Pengesahan"}
                              {file.review_status === "approved" && "Disahkan"}
                            </span>
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

        {/* Notification */}
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={closeNotification}
          />
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

        {/* Revision Notes Modal */}
        {showRevisionModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Catatan Revisi - {selectedDocument?.sop_title}
                  </h3>
                  <button
                    onClick={() => setShowRevisionModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1">
                    <FiX size={20} />
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {loadingRevision ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                      <span className="ml-2 text-gray-600">
                        Memuat catatan revisi...
                      </span>
                    </div>
                  ) : revisionNotes.length > 0 ? (
                    <div className="space-y-4">
                      {revisionNotes.map((note, index) => (
                        <div
                          key={index}
                          className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 rounded-r-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-red-800">
                              {note.reviewer_name || "Pemeriksa"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {dateFormatter(note.created_at)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700">
                            <p className="font-medium mb-1">Catatan Revisi:</p>
                            <p>{note.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FiFileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500">Belum ada catatan revisi</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowRevisionModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors">
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Archive Reason Modal */}
        <ArchiveReasonModal
          isOpen={showArchiveModal}
          onClose={handleArchiveCancel}
          onConfirm={handleArchiveConfirm}
          isLoading={loadingStates[`archive_${selectedDocumentForArchive?.id}`]}
        />

        {/* Publish Visibility Modal */}
        <PublishVisibilityModal
          isOpen={showPublishModal}
          onClose={() => {
            setShowPublishModal(false);
            setSelectedDocumentForPublish(null);
          }}
          onConfirm={handlePublishConfirm}
          isLoading={loadingStates[`publish_${selectedDocumentForPublish?.id}`]}
        />

        {/* Detail SOP Modal */}
        {showDetailModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Detail SOP
                  </h3>
                  <button
                    onClick={handleCloseSopDetail}
                    className="text-gray-400 hover:text-gray-600 p-1">
                    <FiX size={20} />
                  </button>
                </div>

                {detailLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Memuat detail...</span>
                  </div>
                ) : detailError ? (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                    {detailError}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">Penyusun</p>
                      <p className="font-medium text-gray-900">
                        {detailData?.creator_name ||
                          detailData?.uploader_name ||
                          "Tidak tersedia"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">Pemeriksa</p>
                      <p className="font-medium text-gray-900">
                        {detailData?.reviewer_name || "Tidak tersedia"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">Pengesah</p>
                      <p className="font-medium text-gray-900">
                        {detailData?.approver_name || "Tidak tersedia"}
                        {detailData?.approver_position ? (
                          <span className="text-sm text-gray-500">
                            {" "}
                            {`(${detailData.approver_position})`}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">
                        Tanggal Penyusunan
                      </p>
                      <p className="font-medium text-gray-900">
                        {detailData?.created_at
                          ? dateFormatter(detailData.created_at)
                          : "Tidak tersedia"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">
                        Tanggal Pemeriksaan
                      </p>
                      <p className="font-medium text-gray-900">
                        {detailData?.reviewer_approval_date
                          ? dateFormatter(detailData?.reviewer_approval_date)
                          : "Tidak tersedia"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">
                        Tanggal Pengesahan
                      </p>
                      <p className="font-medium text-gray-900">
                        {detailData?.approver_approval_date ||
                        detailData?.approval_date
                          ? dateFormatter(
                              detailData?.approver_approval_date ||
                                detailData?.approval_date
                            )
                          : "Tidak tersedia"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => {
                      const id = detailData?.id;
                      if (id) {
                        navigate(`/sop/view/${id}`);
                        setShowDetailModal(false);
                      }
                    }}
                    disabled={detailLoading || !!detailError || !detailData?.id}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                    Lihat SOP
                  </button>
                  <button
                    onClick={handleCloseSopDetail}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors">
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Riwayat Revisi dihapus */}
      </div>
    </div>
  );
};

export default ListDocsPage;
