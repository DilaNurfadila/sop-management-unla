// Import React hooks untuk state management
import { useState, useEffect, useCallback } from "react";
// Import crypto utility functions untuk dekripsi data
import {
  getSafeUserDataNoRedirect,
  updateUserDataInStorage,
} from "../utils/cryptoUtils.jsx";
// Import API untuk user operations
import { updateUserProfile, changePassword } from "../services/userApi";
import { getAllUnits } from "../services/unitApi.jsx";
// Import icon dari react-icons untuk UI settings
import {
  FiSave,
  FiLock,
  FiUser,
  FiEye,
  FiEyeOff,
  FiX,
  FiUsers,
  FiBriefcase,
  FiMail,
  FiLoader,
} from "react-icons/fi";
// Import komponen Notification
import Notification from "../components/Notification";

/**
 * Page: Settings
 *
 * Halaman pengaturan akun user: profile, keamanan (password), dan preferensi.
 */
const Settings = () => {
  // State untuk mengatur tab yang aktif
  const [activeTab, setActiveTab] = useState("profile");

  // State untuk data profil pengguna
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    position: "",
    unit: "",
    role: "",
  });

  // State untuk daftar unit kerja
  const [units, setUnits] = useState([]);
  // Ambil daftar unit kerja dari API
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const data = await getAllUnits();
        // Jika respons API mengandung properti units, gunakan itu
        if (data && Array.isArray(data.units)) {
          setUnits(data.units);
        } else if (Array.isArray(data)) {
          setUnits(data);
        } else {
          setUnits([]);
        }
      } catch {
        // Tidak perlu notifikasi error di sini, cukup biarkan kosong
      }
    };
    fetchUnits();
  }, []);

  // State untuk form update profil
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    position: "",
    unit: "",
  });

  // State untuk form ganti password
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // State loading status (notifications removed)
  const [isLoading, setIsLoading] = useState({
    profile: false,
    password: false,
  });

  // State untuk menampilkan/menyembunyikan password
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // State untuk validasi error
  const [errors, setErrors] = useState({});

  // State untuk notifikasi
  const [notification, setNotification] = useState({
    show: false,
    type: "",
    message: "",
  });

  // Fungsi untuk memuat data user dari sessionStorage
  const loadUserData = useCallback(() => {
    try {
      const userData = getSafeUserDataNoRedirect();
      if (userData) {
        // Fungsi untuk mendapatkan unit ID berdasarkan nama_unit atau langsung menggunakan ID
        const getUnitId = (unitValue) => {
          if (!unitValue || !units.length) return unitValue;

          // Jika unitValue sudah berupa ID (angka), kembalikan langsung
          if (!isNaN(unitValue)) return unitValue;

          // Cari unit berdasarkan nama_unit dan kembalikan ID
          const foundUnit = units.find((unit) => unit.nama_unit === unitValue);
          return foundUnit ? foundUnit.id : unitValue;
        };

        const unitId = getUnitId(userData.unit);

        setProfileData({
          name: userData.name || "",
          email: userData.email || "",
          position: userData.position || "",
          unit: unitId,
          role: userData.role || "",
        });

        setProfileForm({
          name: userData.name || "",
          email: userData.email || "",
          position: userData.position || "",
          unit: unitId,
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      showNotification("error", "Gagal memuat data pengguna");
    }
  }, [units]);

  // loadNotificationSettings dihapus (fitur notifikasi frontend dihapus)

  // Fungsi untuk menampilkan notifikasi
  const showNotification = (type, message) => {
    setNotification({
      show: true,
      type,
      message,
    });
    setTimeout(() => {
      setNotification({ show: false, type: "", message: "" });
    }, 3000);
  };

  // Fungsi untuk handle perubahan form profil
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error untuk field yang sedang diubah
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Fungsi untuk handle perubahan form password
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error untuk field yang sedang diubah
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Fungsi untuk validasi form profil
  const validateProfileForm = () => {
    const newErrors = {};

    if (!profileForm.name.trim()) {
      newErrors.name = "Nama wajib diisi";
    }

    if (!profileForm.email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      newErrors.email = "Format email tidak valid";
    }

    if (!profileForm.position.trim()) {
      newErrors.position = "Posisi wajib diisi";
    }

    if (!profileForm.unit.trim()) {
      newErrors.unit = "Unit kerja wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fungsi untuk validasi form password
  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = "Password saat ini wajib diisi";
    }

    if (!passwordForm.newPassword) {
      newErrors.newPassword = "Password baru wajib diisi";
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = "Password minimal 6 karakter";
    }

    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password wajib diisi";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password tidak sesuai";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fungsi untuk handle submit form profil
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!validateProfileForm()) return;

    setIsLoading((prev) => ({ ...prev, profile: true }));

    try {
      await updateUserProfile(profileForm);

      // Update data profil di state
      setProfileData(profileForm);

      // Update sessionStorage dengan data yang sudah diupdate menggunakan enkripsi
      const updateSuccess = updateUserDataInStorage({
        name: profileForm.name,
        email: profileForm.email,
        position: profileForm.position,
        unit: profileForm.unit,
      });

      if (!updateSuccess) {
        console.warn("Failed to update user data in sessionStorage");
      }

      showNotification("success", "Profil berhasil diperbarui");
    } catch (error) {
      console.error("Error updating profile:", error);
      showNotification("error", "Gagal memperbarui profil");
    } finally {
      setIsLoading((prev) => ({ ...prev, profile: false }));
    }
  };

  // Fungsi untuk handle submit form password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) return;

    setIsLoading((prev) => ({ ...prev, password: true }));

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      // Reset form password
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      showNotification("success", "Password berhasil diubah");
    } catch (error) {
      console.error("Error changing password:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Gagal mengubah password"
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, password: false }));
    }
  };

  // handleNotificationChange dihapus (fitur notifikasi frontend dihapus)

  // Fungsi untuk toggle visibility password
  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Fungsi untuk mendapatkan label role dalam bahasa Indonesia
  const getRoleLabel = (role) => {
    const roleLabels = {
      user: "Pengguna",
      admin: "Admin",
      admin_unit: "Admin Unit",
      superadmin: "Super Admin",
    };
    return roleLabels[role] || role;
  };

  // Load user data dan notification settings saat komponen dimount
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Notification Component */}
      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() =>
            setNotification({ show: false, type: "", message: "" })
          }
        />
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pengaturan</h1>
          <p className="text-gray-600">
            Kelola profil dan preferensi akun Anda
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "profile", label: "Profil", icon: FiUser },
                { id: "security", label: "Keamanan", icon: FiLock },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}>
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Informasi Profil
              </h2>

              {/* Current Role Display */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <FiUsers className="text-blue-600" size={20} />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Role Saat Ini
                    </p>
                    <p className="text-blue-700">
                      {getRoleLabel(profileData.role)}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <FiUser className="mr-2" size={16} />
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.name ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Masukkan nama lengkap"
                      autoComplete="off"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm flex items-center mt-1">
                        <FiX size={14} className="mr-1" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <FiMail className="mr-2" size={16} />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="nama@email.com"
                      autoComplete="off"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm flex items-center mt-1">
                        <FiX size={14} className="mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Position Field */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <FiBriefcase className="mr-2" size={16} />
                      Posisi/Jabatan
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={profileForm.position}
                      onChange={handleProfileChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.position ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Masukkan posisi/jabatan"
                      autoComplete="off"
                    />
                    {errors.position && (
                      <p className="text-red-500 text-sm flex items-center mt-1">
                        <FiX size={14} className="mr-1" />
                        {errors.position}
                      </p>
                    )}
                  </div>

                  {/* Unit Field */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <FiUsers className="mr-2" size={16} />
                      Unit Kerja
                    </label>
                    <select
                      name="unit"
                      value={profileForm.unit}
                      onChange={handleProfileChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.unit ? "border-red-500" : "border-gray-300"
                      }`}>
                      <option value="">Pilih unit kerja</option>
                      {units &&
                        units.length > 0 &&
                        units.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.nama_unit}
                          </option>
                        ))}
                    </select>
                    {errors.unit && (
                      <p className="text-red-500 text-sm flex items-center mt-1">
                        <FiX size={14} className="mr-1" />
                        {errors.unit}
                      </p>
                    )}
                  </div>
                </div>

                {/* Catatan */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs text-blue-700 flex items-center">
                    <FiMail className="mr-2" size={12} />
                    Pastikan email yang dimasukkan adalah email aktif
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isLoading.profile}
                    className="w-full px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
                    {isLoading.profile ? (
                      <div className="flex items-center justify-center space-x-2">
                        <FiLoader className="animate-spin" size={16} />
                        <span>Menyimpan...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <FiSave size={16} />
                        <span>Simpan Perubahan</span>
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Keamanan Akun
              </h2>

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                {/* Current Password */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <FiLock className="mr-2" size={16} />
                    Password Saat Ini
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.current ? "text" : "password"}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className={`w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.currentPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Masukkan password saat ini"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("current")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors">
                      {showPassword.current ? (
                        <FiEyeOff className="text-gray-400" size={16} />
                      ) : (
                        <FiEye className="text-gray-400" size={16} />
                      )}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="text-red-500 text-sm flex items-center mt-1">
                      <FiX size={14} className="mr-1" />
                      {errors.currentPassword}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <FiLock className="mr-2" size={16} />
                    Password Baru
                  </label>
                  <p className="text-xs text-gray-500">
                    Password minimal 6 karakter
                  </p>
                  <div className="relative">
                    <input
                      type={showPassword.new ? "text" : "password"}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className={`w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.newPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Masukkan password baru"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("new")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors">
                      {showPassword.new ? (
                        <FiEyeOff className="text-gray-400" size={16} />
                      ) : (
                        <FiEye className="text-gray-400" size={16} />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-red-500 text-sm flex items-center mt-1">
                      <FiX size={14} className="mr-1" />
                      {errors.newPassword}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <FiLock className="mr-2" size={16} />
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className={`w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Konfirmasi password baru"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("confirm")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors">
                      {showPassword.confirm ? (
                        <FiEyeOff className="text-gray-400" size={16} />
                      ) : (
                        <FiEye className="text-gray-400" size={16} />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm flex items-center mt-1">
                      <FiX size={14} className="mr-1" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isLoading.password}
                    className="w-full px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {isLoading.password ? (
                      <div className="flex items-center justify-center space-x-2">
                        <FiLoader className="animate-spin" size={16} />
                        <span>Mengubah...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <FiLock size={16} />
                        <span>Ubah Password</span>
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Notifications Tab dihapus */}
        </div>
      </div>
    </div>
  );
};

export default Settings;
