import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  getUsersByAdminUnit,
  assignSopCreator,
  getAdminUsers,
} from "../../services/sopCreatorApi";
import { getAllUnits } from "../../services/unitApi";
import Notification from "../../components/Notification";
import { useAdminPermissions } from "../../hooks/useAdminRole";
import { getSafeUserDataNoRedirect } from "../../utils/cryptoUtils";

// Reusable dropdown with internal search
const SearchableDropdown = ({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));
  const display = selected ? selected.label : placeholder;
  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter(
        (o) =>
          (o.label || "").toLowerCase().includes(q) ||
          (o.search || "").toLowerCase().includes(q)
      )
    : options;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`w-full flex justify-between items-center px-3 py-2 border rounded-md shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled ? "opacity-60 cursor-not-allowed" : ""
        }`}>
        <span
          className={`text-left ${
            selected ? "text-gray-900" : "text-gray-500"
          }`}>
          {display}
        </span>
        <svg
          className={`h-4 w-4 ml-2 transform transition-transform ${
            open ? "rotate-180" : ""
          }`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow-lg">
          <div className="p-2 border-b">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari..."
              autoFocus
              className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <ul className="max-h-56 overflow-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500">
                Tidak ada hasil
              </li>
            )}
            {filtered.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${
                    String(value) === String(opt.value) ? "bg-blue-50" : ""
                  }`}>
                  <div className="text-gray-900">{opt.label}</div>
                  {opt.meta && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {opt.meta}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const AssignSopCreatorPage = () => {
  const { canAssignSopCreator, userRole } = useAdminPermissions();

  // Data state
  const [users, setUsers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    assigned_to: "",
    task_type: "create",
    sop_to_revise: "",
    reviewer_id: "",
    approver_id: "",
    unit_scope: "",
    notes: "",
    due_date: "",
  });

  // Helper: local today string (YYYY-MM-DD) respecting timezone
  const todayStr = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  })();

  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Loaders
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getUsersByAdminUnit();
      setUsers(res.data);
    } catch (e) {
      console.error("❌ loadUsers error", e);
      showNotification("Gagal memuat daftar pengguna", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAdminUsers = useCallback(async () => {
    try {
      const res = await getAdminUsers();
      setAdminUsers(res.data);
    } catch (e) {
      console.error("❌ loadAdminUsers error", e);
      showNotification("Gagal memuat admin users", "error");
    }
  }, []);

  const loadUnits = useCallback(async () => {
    try {
      const res = await getAllUnits();
      setUnits(res.units || []);
    } catch (e) {
      console.error("❌ loadUnits error", e);
      showNotification("Gagal memuat unit", "error");
    }
  }, []);

  useEffect(() => {
    if (canAssignSopCreator) {
      loadUsers();
      loadAdminUsers();
      loadUnits();
    }
  }, [canAssignSopCreator, loadUsers, loadAdminUsers, loadUnits]);

  // Auto-select unit for admin_unit
  useEffect(() => {
    if (userRole === "admin_unit") {
      const u = getSafeUserDataNoRedirect();
      if (u?.unit) {
        setFormData((prev) => ({ ...prev, unit_scope: String(u.unit) }));
      }
    }
  }, [userRole]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "task_type" && value === "create" && { sop_to_revise: "" }),
    }));
  };

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
  };
  const closeNotification = () =>
    setNotification((prev) => ({ ...prev, show: false }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.assigned_to ||
      !formData.notes ||
      !formData.task_type ||
      !formData.reviewer_id ||
      !formData.approver_id ||
      !formData.unit_scope ||
      !formData.due_date
    ) {
      showNotification("Harap lengkapi semua field yang wajib diisi", "error");
      return;
    }

    // Cegah tanggal masa lalu
    if (formData.due_date < todayStr) {
      showNotification(
        "Tanggal jatuh tempo tidak boleh tanggal yang sudah berlalu",
        "error"
      );
      return;
    }

    if (
      formData.assigned_to === formData.reviewer_id ||
      formData.assigned_to === formData.approver_id
    ) {
      showNotification(
        "Penyusun tidak boleh sama dengan Pemeriksa atau Pengesah",
        "error"
      );
      return;
    }

    if (formData.task_type === "revise" && !formData.sop_to_revise) {
      showNotification("Harap pilih SOP yang akan direvisi", "error");
      return;
    }

    try {
      setSubmitting(true);
      await assignSopCreator(formData);
      showNotification("Penugasan berhasil dibuat!", "success");
      setFormData({
        assigned_to: "",
        task_type: "create",
        sop_to_revise: "",
        reviewer_id: "",
        approver_id: "",
        unit_scope: userRole === "admin_unit" ? formData.unit_scope : "",
        notes: "",
        due_date: "",
      });
    } catch (e) {
      console.error("❌ create assignment error", e);
      showNotification(
        e.response?.data?.message || "Gagal membuat penugasan",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!canAssignSopCreator) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Akses Dibatasi
            </h1>
            <p className="text-gray-600 mb-4">
              Halaman ini hanya dapat diakses oleh Admin Unit.
            </p>
            <p className="text-sm text-gray-500">
              Role Anda: <span className="font-medium">{userRole}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Option builders
  const assignedOptions = users
    .filter((u) => u.role !== "superadmin")
    .map((u) => {
      const unitLabel =
        u.unit_name || u.nama_unit || u.unit || "Unit tidak tersedia";
      const pos = u.position || u.jabatan || "(Posisi tidak ada)";
      return {
        value: u.id,
        label: u.name, // hanya nama utama
        search: `${u.name || ""} ${unitLabel} ${pos}`,
        meta: `${unitLabel} • ${pos}`,
      };
    });

  const baseUsers = users
    .filter((u) => u.role !== "superadmin")
    .map((u) => {
      const unitLabel =
        u.unit_name || u.nama_unit || u.unit || "Unit tidak tersedia";
      const pos = u.position || u.jabatan || "(Posisi tidak ada)";
      return {
        value: u.id,
        label: u.name,
        search: `${u.name || ""} ${unitLabel} ${pos}`,
        meta: `${unitLabel} • ${pos}`,
      };
    });

  const baseAdmins = adminUsers
    .filter((u) => u.role !== "superadmin")
    .map((u) => {
      const unitLabel =
        u.unit_name || u.nama_unit || u.unit || "Unit tidak tersedia";
      const pos = u.position || u.jabatan || "(Posisi tidak ada)";
      return {
        value: u.id,
        label: u.name,
        search: `${u.name || ""} ${unitLabel} ${pos}`,
        meta: `${unitLabel} • ${pos}`,
      };
    });

  const reviewerOptions = [
    { value: "", label: "-- Pilih Pemeriksa --" },
    ...baseUsers,
    ...baseAdmins,
  ];
  const approverOptions = [
    { value: "", label: "-- Pilih Pengesah --" },
    ...baseUsers,
    ...baseAdmins,
  ];

  const unitOptions = [
    {
      value: "",
      label:
        userRole === "admin_unit"
          ? "Unit kerja telah ditentukan"
          : "-- Pilih Unit Kerja --",
      search: "",
      meta: "",
    },
    ...units.map((u) => ({
      value: u.id,
      label: u.nama_unit || u.unit_name || "(Tanpa Nama)",
      search: `${u.nama_unit || ""} ${u.kode_unit || ""}`,
      meta: u.kode_unit || "",
    })),
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tugaskan</h1>
              <p className="mt-2 text-gray-600">
                {userRole === "admin"
                  ? "Tugaskan pengguna dari unit manapun untuk membuat dokumen SOP"
                  : "Tugaskan anggota unit Anda untuk membuat dokumen SOP"}
              </p>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">
                {userRole === "admin" ? "👑 Admin Penuh" : "👤 Admin Unit"}
              </p>
              <p className="text-xs text-blue-600">
                {userRole === "admin"
                  ? "Akses ke semua unit dan pengguna"
                  : "Fitur khusus untuk admin unit"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-8">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">
                  Memuat data pengguna...
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Jenis Tugas */}
                <div>
                  <label
                    htmlFor="task_type"
                    className="block text-sm font-medium text-gray-700 mb-2">
                    Jenis Tugas <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="task_type"
                    name="task_type"
                    value={formData.task_type}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="create">Membuat SOP Baru</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Saat ini hanya tersedia tugas pembuatan SOP baru.
                  </p>
                </div>

                {/* Penyusun */}
                <div>
                  <label
                    htmlFor="assigned_to"
                    className="block text-sm font-medium text-gray-700 mb-2">
                    Penyusun <span className="text-red-500">*</span>
                  </label>
                  <SearchableDropdown
                    value={formData.assigned_to}
                    onChange={(val) =>
                      setFormData((p) => ({ ...p, assigned_to: val }))
                    }
                    options={[
                      { value: "", label: "-- Pilih Penyusun --" },
                      ...assignedOptions,
                    ]}
                    placeholder="-- Pilih Penyusun --"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Pilih pengguna yang akan menyusun SOP
                  </p>
                </div>

                {/* Unit Scope */}
                <div>
                  <label
                    htmlFor="unit_scope"
                    className="block text-sm font-medium text-gray-700 mb-2">
                    Ruang Lingkup Unit Kerja{" "}
                    <span className="text-red-500">*</span>
                    {userRole === "admin_unit" && (
                      <span className="text-sm text-blue-600 font-normal ml-2">
                        (Otomatis sesuai unit Anda)
                      </span>
                    )}
                  </label>
                  <SearchableDropdown
                    value={formData.unit_scope}
                    onChange={(val) =>
                      setFormData((p) => ({ ...p, unit_scope: val }))
                    }
                    options={unitOptions}
                    placeholder="-- Pilih Unit Kerja --"
                    disabled={userRole === "admin_unit"}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Pilih ruang lingkup unit kerja
                  </p>
                </div>

                {/* Reviewer */}
                <div>
                  <label
                    htmlFor="reviewer_id"
                    className="block text-sm font-medium text-gray-700 mb-2">
                    Pemeriksa <span className="text-red-500">*</span>
                  </label>
                  <SearchableDropdown
                    value={formData.reviewer_id}
                    onChange={(val) =>
                      setFormData((p) => ({ ...p, reviewer_id: val }))
                    }
                    options={reviewerOptions}
                    placeholder="-- Pilih Pemeriksa --"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Pilih pengguna yang akan memeriksa SOP (
                    {users.filter((u) => u.role !== "superadmin").length} user +{" "}
                    {adminUsers.filter((u) => u.role !== "superadmin").length}{" "}
                    admin)
                  </p>
                </div>

                {/* Approver */}
                <div>
                  <label
                    htmlFor="approver_id"
                    className="block text-sm font-medium text-gray-700 mb-2">
                    Pengesah <span className="text-red-500">*</span>
                  </label>
                  <SearchableDropdown
                    value={formData.approver_id}
                    onChange={(val) =>
                      setFormData((p) => ({ ...p, approver_id: val }))
                    }
                    options={approverOptions}
                    placeholder="-- Pilih Pengesah --"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Pilih pengguna yang akan mengesahkan SOP (
                    {users.filter((u) => u.role !== "superadmin").length} user +{" "}
                    {adminUsers.filter((u) => u.role !== "superadmin").length}{" "}
                    admin)
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700 mb-2">
                    Catatan Penugasan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tuliskan instruksi atau ruang lingkup"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Catatan ini terlihat oleh penyusun.
                  </p>
                </div>

                {/* Due Date (wajib) */}
                <div>
                  <label
                    htmlFor="due_date"
                    className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Batas Waktu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="due_date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    min={todayStr}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Pilih tanggal batas waktu pengerjaan SOP.
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        assigned_to: "",
                        task_type: "create",
                        sop_to_revise: "",
                        reviewer_id: "",
                        approver_id: "",
                        unit_scope:
                          userRole === "admin_unit" ? prev.unit_scope : "",
                        notes: "",
                        due_date: "",
                      }))
                    }
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                    Batalkan
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60">
                    {submitting ? "Menyimpan..." : "Buat Penugasan"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Info Cards */}
          <div className="px-6 pb-8">
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  💡 Tips Penugasan
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>
                    • <strong>Untuk SOP Baru:</strong> Jelaskan topik dan
                    tujuan.
                  </li>
                  <li>
                    • <strong>Untuk Revisi:</strong> Hanya SOP disahkan yang
                    bisa direvisi.
                  </li>
                  <li>• Jelaskan bagian yang perlu diperbaiki.</li>
                  <li>• Tentukan deadline realistis.</li>
                  <li>• Komunikasikan ekspektasi jelas.</li>
                </ul>
              </div>
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-green-900 mb-2">
                  📋 Status Penugasan
                </h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>
                    • <strong>Pending:</strong> Menunggu respons
                  </li>
                  <li>
                    • <strong>Accepted:</strong> Diterima
                  </li>
                  <li>
                    • <strong>In Progress:</strong> Dikerjakan
                  </li>
                  <li>
                    • <strong>Completed:</strong> Selesai
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {notification.show && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={closeNotification}
          />
        )}
      </div>
    </div>
  );
};

export default AssignSopCreatorPage;
