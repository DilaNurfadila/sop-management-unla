import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiGrid,
  FiHash,
  FiTag,
} from "react-icons/fi";
import * as unitApi from "../services/unitApi";

const UnitManagementPage = () => {
  const [units, setUnits] = useState([]);
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [formData, setFormData] = useState({
    nomor_unit: "",
    kode_unit: "",
    nama_unit: "",
  });
  // State untuk menampilkan error di dalam modal
  const [modalError, setModalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data saat komponen dimount
  useEffect(() => {
    loadUnits();
    loadStats();
  }, []);

  // Filter units berdasarkan search (client-side filtering)
  useEffect(() => {
    let filtered = units;

    // Filter berdasarkan search query
    if (searchQuery) {
      filtered = filtered.filter(
        (unit) =>
          unit.nomor_unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
          unit.kode_unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
          unit.nama_unit.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredUnits(filtered);
  }, [units, searchQuery]);

  const loadUnits = async () => {
    try {
      setLoading(true);
      const response = await unitApi.getAllUnits();
      if (response.success) {
        setUnits(response.units);
        setError("");
      }
    } catch (err) {
      setError(err.message || "Gagal memuat data unit");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await unitApi.getUnitStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const handleCreateUnit = async () => {
    // Reset modal error
    setModalError("");
    setIsSubmitting(true);

    try {
      const response = await unitApi.createUnit(formData);
      if (response.success) {
        setUnits([...units, response.unit]);
        setShowCreateModal(false);
        resetForm();
        loadStats();
      }
    } catch (err) {
      // Tampilkan error di dalam modal, bukan di halaman utama
      setModalError(err.message || "Gagal membuat unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUnit = async () => {
    if (!selectedUnit) return;

    // Reset modal error
    setModalError("");
    setIsSubmitting(true);

    try {
      const response = await unitApi.updateUnit(selectedUnit.id, formData);
      if (response.success) {
        setUnits(
          units.map((unit) =>
            unit.id === selectedUnit.id ? response.unit : unit
          )
        );
        setShowEditModal(false);
        setSelectedUnit(null);
        resetForm();
        loadStats();
      }
    } catch (err) {
      // Tampilkan error di dalam modal, bukan di halaman utama
      setModalError(err.message || "Gagal mengupdate unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUnit = async () => {
    if (!selectedUnit) return;

    try {
      const response = await unitApi.deleteUnit(selectedUnit.id);
      if (response.success) {
        setUnits(units.filter((unit) => unit.id !== selectedUnit.id));
        setShowDeleteModal(false);
        setSelectedUnit(null);
        loadStats();
      }
    } catch (err) {
      setError(err.message || "Gagal menghapus unit");
    }
  };

  const resetForm = () => {
    setFormData({
      nomor_unit: "",
      kode_unit: "",
      nama_unit: "",
    });
    setModalError("");
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (unit) => {
    setSelectedUnit(unit);
    setFormData({
      nomor_unit: unit.nomor_unit,
      kode_unit: unit.kode_unit,
      nama_unit: unit.nama_unit,
    });
    setModalError("");
    setShowEditModal(true);
  };

  const openDeleteModal = (unit) => {
    setSelectedUnit(unit);
    setShowDeleteModal(true);
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
          Pengelolaan Unit
        </h1>
        <p className="text-gray-600">Kelola unit kerja dalam sistem SOP</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <FiGrid className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Unit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Cari berdasarkan nomor, kode, atau nama unit..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-sm">
            <FiPlus className="h-4 w-4" />
            Tambah Unit
          </button>
        </div>
      </div>

      {/* Units Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/4">
                  Nomor Unit
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/4">
                  Kode Unit
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-2/4">
                  Nama Unit
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <FiGrid className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Tidak ada unit yang ditemukan
                      </p>
                      <p className="text-sm text-gray-500">
                        Coba ubah kata kunci pencarian atau tambah unit baru
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUnits.map((unit) => (
                  <tr
                    key={unit.id}
                    className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                          <FiHash className="h-4 w-4 text-gray-600" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {unit.nomor_unit}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        <FiTag className="h-3 w-3 mr-2" />
                        {unit.kode_unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <FiGrid className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {unit.nama_unit}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => openEditModal(unit)}
                          className="inline-flex items-center p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Unit">
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(unit)}
                          className="inline-flex items-center p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Unit">
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Tambah Unit Baru
            </h3>

            {/* Error Message dalam Modal */}
            {modalError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {modalError}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Unit
                </label>
                <input
                  type="text"
                  placeholder="001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.nomor_unit}
                  onChange={(e) =>
                    setFormData({ ...formData, nomor_unit: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode Unit
                </label>
                <input
                  type="text"
                  placeholder="REKTORAT"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.kode_unit}
                  onChange={(e) =>
                    setFormData({ ...formData, kode_unit: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Unit
                </label>
                <input
                  type="text"
                  placeholder="Rektorat"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.nama_unit}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_unit: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
                Batal
              </button>
              <button
                onClick={handleCreateUnit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit Unit
            </h3>

            {/* Error Message dalam Modal */}
            {modalError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {modalError}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Unit
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.nomor_unit}
                  onChange={(e) =>
                    setFormData({ ...formData, nomor_unit: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode Unit
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.kode_unit}
                  onChange={(e) =>
                    setFormData({ ...formData, kode_unit: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Unit
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.nama_unit}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_unit: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUnit(null);
                  resetForm();
                }}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
                Batal
              </button>
              <button
                onClick={handleUpdateUnit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Konfirmasi Hapus Unit
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Apakah Anda yakin ingin menghapus unit{" "}
              <strong>{selectedUnit.nama_unit}</strong>?
              <br />
              <span className="text-red-600">
                Tindakan ini tidak dapat dibatalkan.
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUnit(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Batal
              </button>
              <button
                onClick={handleDeleteUnit}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitManagementPage;
