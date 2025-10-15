/**
 * Page: Dashboard
 *
 * Ringkasan metrik dan akses cepat ke fitur utama (berbeda sesuai role).
 */
// Catatan: useLocation di-comment karena tidak digunakan saat ini
// import { useLocation } from "react-router-dom";

import { getSafeUserDataNoRedirect } from "../utils/cryptoUtils.jsx";
import { useAdminRole } from "../hooks/useAdminRole.js";
import { useEffect, useState } from "react";
import { getKpiSummary } from "../services/kpiApi";
import {
  FiFile,
  FiUpload,
  FiEdit3,
  FiArchive,
  FiMessageCircle,
  FiUsers,
  FiClock,
} from "react-icons/fi";

/**
 * Komponen Dashboard utama untuk user yang sudah login
 * Menampilkan welcome message, dashboard feedback, dan list feedback SOP
 */
const Dashboard = () => {
  // Catatan: pathname tidak digunakan saat ini
  // const pathname = useLocation().pathname;

  // Ambil data user dari localStorage untuk personalisasi dengan aman (tanpa auto-redirect)
  const decryptedUser = getSafeUserDataNoRedirect();

  const { isSuperAdmin } = useAdminRole();
  // KPI hanya boleh untuk admin & superadmin (bukan admin_unit)
  const canViewKpi = isSuperAdmin || decryptedUser?.role === "admin";

  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!canViewKpi) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const data = await getKpiSummary();
        setKpi(data);
      } catch {
        setError("Gagal memuat KPI");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [canViewKpi]);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section - Section sambutan untuk user */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat Datang di Aplikasi SOP UNLA, {decryptedUser?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          SOP UNLA adalah aplikasi untuk mengelola dokumen Standar Operasional
          Prosedur (SOP) di Universitas Langlangbuana.
        </p>
      </div>
      {/* KPI + Metrics Sections (only for Admin/Superadmin) */}
      {canViewKpi && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FiFile className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total SOP</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {kpi?.sop?.total ?? (loading ? "..." : 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <FiUpload className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Published</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {kpi?.sop?.published ?? (loading ? "..." : 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <FiEdit3 className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Draft/Unpublished
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {(kpi?.sop?.draft ?? 0) + (kpi?.sop?.unpublished ?? 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <FiArchive className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Archived</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {kpi?.sop?.archived ?? (loading ? "..." : 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <FiMessageCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Feedback</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {kpi?.feedback?.total_feedback ?? (loading ? "..." : 0)}
                  <span className="text-sm text-gray-500 ml-2">
                    avg {kpi?.feedback?.average_rating ?? 0}
                  </span>
                </p>
              </div>
            </div>
          </div>
          {canViewKpi && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-teal-100 p-3 rounded-lg">
                  <FiUsers className="h-6 w-6 text-teal-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    Pengguna
                  </h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {kpi?.users?.total ?? (loading ? "..." : 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {canViewKpi && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-lg">
                <FiClock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Tugas Aktif
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {kpi?.sla?.active_assignments ?? (loading ? "..." : 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-lg">
                <FiClock className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Terlambat</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {kpi?.sla?.overdue_assignments ?? (loading ? "..." : 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <FiClock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Batas Waktu dalam {kpi?.sla?.due_soon_days ?? 7} Hari
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {kpi?.sla?.due_soon_assignments ?? (loading ? "..." : 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {canViewKpi && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500">
              Rata-rata Pembuatan (hari)
            </h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {kpi?.sla?.avg_creation_days ?? (loading ? "..." : 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500">
              Rata-rata Disetujui (hari)
            </h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {kpi?.sla?.avg_approval_days ?? (loading ? "..." : 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500">
              Rata-rata Publikasi (hari)
            </h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {kpi?.sla?.avg_publish_days ?? (loading ? "..." : 0)}
            </p>
          </div>
        </div>
      )}
      {canViewKpi && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rasio Tepat Waktu */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500">
              Rasio Tepat Waktu
            </h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {kpi?.sla?.creation_sla?.rate_percent ?? 0}%
              <span className="text-sm text-gray-500 ml-2">
                ({kpi?.sla?.creation_sla?.on_time ?? 0} /{" "}
                {kpi?.sla?.creation_sla?.total ?? 0} SOP)
              </span>
            </p>
          </div>

          {/* Rata-rata Penyelesaian vs Target */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500">
              Rata-rata Penyelesaian
            </h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {/* Negative (e.g., -2.0) means faster than target; positive means slower */}
              {(() => {
                const delta = kpi?.sla?.avg_creation_delta_days;
                if (delta === null || delta === undefined) return 0;
                const absVal = Math.abs(delta).toFixed(1);
                if (Number(delta) < 0)
                  return `${absVal} hari lebih cepat dari target`;
                if (Number(delta) > 0)
                  return `${absVal} hari lebih lambat dari target`;
                return `sesuai target`;
              })()}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
