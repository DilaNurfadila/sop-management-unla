import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiEdit2,
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiTrendingUp,
} from "react-icons/fi";
import * as adminApi from "../services/adminApi";
import { getAllUnits } from "../services/unitApi";
import { useAdminRole } from "../hooks/useAdminRole";

const UserManagementPage = () => {
  const [allUsers, setAllUsers] = useState([]); // Menyimpan semua data user
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  // Hapus fitur hapus pengguna: tidak ada modal hapus
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    position: "",
    unit: "",
    role: "user",
  });

  const { isSuperAdmin } = useAdminRole();

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllUsers();
      if (response.success) {
        setAllUsers(response.users); // Simpan semua data
        setError("");
      }
    } catch (err) {
      setError(err.message || "Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  };

  // Load data saat komponen dimount
  useEffect(() => {
    loadUsers();
    loadStats();
    // prefetch units for create modal
    (async () => {
      try {
        const data = await getAllUnits();
        // backend returns { success, message, units: [...] }
        setUnits(Array.isArray(data?.units) ? data.units : []);
      } catch {
        // ignore silently in main page; will show inside modal if needed
        setUnits([]);
      }
    })();
  }, []);

  // Filter users berdasarkan search dan role (client-side filtering)
  useEffect(() => {
    let filtered = allUsers;

    // Kecualikan superadmin (termasuk yang dinonaktifkan: disabled:superadmin)
    filtered = filtered.filter(
      (user) =>
        user.role !== "superadmin" &&
        !(
          typeof user.role === "string" &&
          user.role.startsWith("disabled:superadmin")
        )
    );

    // Filter berdasarkan search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((user) => {
        const name = (user.name || "").toLowerCase();
        const email = (user.email || "").toLowerCase();
        const unit = (user.unit || "").toLowerCase();
        return name.includes(q) || email.includes(q) || unit.includes(q);
      });
    }

    // Filter berdasarkan role
    if (selectedRole !== "all") {
      filtered = filtered.filter((user) => user.role === selectedRole);
    }

    setFilteredUsers(filtered);
  }, [allUsers, searchQuery, selectedRole]);

  // (duplicate useEffect removed)

  const loadStats = async () => {
    try {
      const response = await adminApi.getUserStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  // Hapus fitur hapus pengguna: handler dihapus

  const handleUpdateRole = async (newRole) => {
    if (!selectedUser) return;

    try {
      const response = await adminApi.updateUserRole(selectedUser.id, newRole);
      if (response.success) {
        const updatedUsers = allUsers.map((user) =>
          user.id === selectedUser.id ? { ...user, role: newRole } : user
        );
        setAllUsers(updatedUsers);
        setShowEditModal(false);
        setSelectedUser(null);
        loadStats(); // Refresh stats after role update
      }
    } catch (err) {
      setError(err.message || "Gagal mengubah role pengguna");
    }
  };

  const handleDeactivateUser = async () => {
    if (!selectedUser) return;
    try {
      const response = await adminApi.deactivateUser(selectedUser.id);
      if (response.success) {
        const updatedUsers = allUsers.map((user) =>
          user.id === selectedUser.id
            ? { ...user, role: `disabled:${selectedUser.role}` }
            : user
        );
        setAllUsers(updatedUsers);
        setShowDeactivateModal(false);
        setSelectedUser(null);
        loadStats();
      }
    } catch (err) {
      setError(err.message || "Gagal menonaktifkan pengguna");
    }
  };

  const getRoleBadgeColor = (role) => {
    const isDisabled = typeof role === "string" && role.startsWith("disabled");
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "admin_unit":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "user":
        return "bg-green-100 text-green-800 border-green-200";
      case "disabled":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return isDisabled
          ? "bg-gray-100 text-gray-700 border-gray-300"
          : "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleLabel = (role) => {
    const isDisabled = typeof role === "string" && role.startsWith("disabled");
    switch (role) {
      case "admin":
        return "Admin";
      case "admin_unit":
        return "Admin Unit";
      case "user":
        return "User";
      case "disabled":
        return "Dinonaktifkan";
      default:
        return isDisabled ? "Dinonaktifkan" : role;
    }
  };

  const handleActivateUser = async () => {
    if (!selectedUser) return;
    try {
      const response = await adminApi.activateUser(selectedUser.id);
      if (response.success) {
        const originalRole = (selectedUser.role || "").split(":")[1] || "user";
        const updatedUsers = allUsers.map((user) =>
          user.id === selectedUser.id ? { ...user, role: originalRole } : user
        );
        setAllUsers(updatedUsers);
        setShowActivateModal(false);
        setSelectedUser(null);
        loadStats();
      }
    } catch (err) {
      setError(err.message || "Gagal mengaktifkan pengguna");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pengelolaan Pengguna
        </h1>
        <p className="text-gray-600">Kelola pengguna sistem SOP</p>
        {isSuperAdmin && (
          <div className="mt-4">
            <button
              onClick={() => {
                setCreateError("");
                setForm({
                  name: "",
                  email: "",
                  password: "",
                  position: "",
                  unit: "",
                  role: "user",
                });
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              + Tambah Pengguna
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <FiUsers className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Pengguna
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <FiUserCheck className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Admin</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.admin}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <FiTrendingUp className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Admin Unit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.admin_unit}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <FiUserX className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">User</p>
                <p className="text-2xl font-bold text-gray-900">{stats.user}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama, email, atau unit..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="all">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="admin_unit">Admin Unit</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pengguna
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bergabung
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500">
                    Tidak ada pengguna yang ditemukan
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.position}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(
                          user.role
                        )}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Role">
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        {/* Deactivate user button: block superadmin and already disabled */}
                        {user.role !== "superadmin" &&
                          !(
                            typeof user.role === "string" &&
                            user.role.startsWith("disabled")
                          ) && (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeactivateModal(true);
                              }}
                              className="text-yellow-600 hover:text-yellow-800"
                              title="Nonaktifkan Pengguna">
                              <FiUserX className="h-4 w-4" />
                            </button>
                          )}
                        {typeof user.role === "string" &&
                          user.role.startsWith("disabled") && (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowActivateModal(true);
                              }}
                              className="text-green-600 hover:text-green-800"
                              title="Aktifkan Pengguna">
                              <FiUserCheck className="h-4 w-4" />
                            </button>
                          )}
                        {/* Fitur hapus pengguna dihapus */}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Ubah Role Pengguna
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Mengubah role untuk: <strong>{selectedUser.name}</strong>
            </p>
            <div className="space-y-3">
              {["admin", "admin_unit", "user"].map((role) => (
                <label key={role} className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={selectedUser.role === role}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, role: e.target.value })
                    }
                    className="mr-3"
                    autoComplete="off"
                  />
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(
                      role
                    )}`}>
                    {getRoleLabel(role)}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Batal
              </button>
              <button
                onClick={() => handleUpdateRole(selectedUser.role)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Tambah Pengguna
            </h3>
            {createError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">
                {createError}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nama lengkap"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="email@unla.ac.id"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Jabatan/Posisi
                </label>
                <input
                  type="text"
                  value={form.position}
                  onChange={(e) =>
                    setForm({ ...form, position: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Staf, Kepala Unit"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Unit Kerja
                </label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Pilih Unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nama_unit}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="user">User</option>
                  <option value="admin_unit">Admin Unit</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                disabled={creating}
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError("");
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-60">
                Batal
              </button>
              <button
                disabled={creating}
                onClick={async () => {
                  // simple client validation
                  if (
                    !form.name ||
                    !form.email ||
                    !form.password ||
                    !form.position ||
                    !form.unit
                  ) {
                    setCreateError("Semua field wajib diisi");
                    return;
                  }
                  setCreating(true);
                  setCreateError("");
                  try {
                    const payload = {
                      name: form.name.trim(),
                      email: form.email.trim(),
                      password: form.password,
                      position: form.position.trim(),
                      unit: parseInt(form.unit, 10),
                      role: form.role,
                    };
                    const resp = await adminApi.createUser(payload);
                    if (resp.success) {
                      // refresh list & stats
                      await loadUsers();
                      await loadStats();
                      setShowCreateModal(false);
                    } else {
                      setCreateError(resp.message || "Gagal membuat pengguna");
                    }
                  } catch (e) {
                    setCreateError(
                      e.message ||
                        e?.response?.data?.message ||
                        "Gagal membuat pengguna"
                    );
                  } finally {
                    setCreating(false);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {creating ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fitur hapus pengguna dihapus: modal dihapus */}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Nonaktifkan Pengguna
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Nonaktifkan akun <strong>{selectedUser.name}</strong>?
              <br />
              Pengguna yang dinonaktifkan tidak dapat login hingga diaktifkan
              kembali oleh admin.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Batal
              </button>
              <button
                onClick={handleDeactivateUser}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                Nonaktifkan
              </button>
            </div>
          </div>
        </div>
      )}

      {showActivateModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Aktifkan Pengguna
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Aktifkan kembali akun <strong>{selectedUser.name}</strong>?
              <br />
              Pengguna akan dapat login kembali setelah diaktifkan.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowActivateModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Batal
              </button>
              <button
                onClick={handleActivateUser}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Aktifkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
