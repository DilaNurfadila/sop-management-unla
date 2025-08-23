// Import React hooks untuk state management
import { useState } from "react";
// Import React Router hooks untuk navigasi dan location state
import { Link, useNavigate } from "react-router-dom";
// Import icons dari react-icons
import {
  FiEye,
  FiEyeOff,
  FiMail,
  FiLock,
  FiUser,
  FiMapPin,
  FiLoader,
  FiBriefcase,
  FiUsers,
} from "react-icons/fi";
// Import API service untuk registrasi user
import { registerUser } from "../../services/authApi";

/**
 * Komponen Register untuk registrasi user baru
 * Form lengkap dengan validasi dan UI yang lebih baik
 */
const Register = () => {
  // Hooks untuk navigasi
  const navigate = useNavigate();

  // State untuk form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    position: "",
    unit: "",
  });

  // State untuk show/hide password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State untuk loading saat submit
  const [isLoading, setIsLoading] = useState(false);
  // State untuk error message
  const [error, setError] = useState("");

  /**
   * Handler untuk perubahan input form
   * @param {Event} e - Event dari input field
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error message saat user mengetik
    if (error) setError("");
  };

  /**
   * Validasi form sebelum submit
   */
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Nama lengkap harus diisi");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email harus diisi");
      return false;
    }
    if (!formData.password) {
      setError("Password harus diisi");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password minimal 6 karakter");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return false;
    }
    if (!formData.position.trim()) {
      setError("Posisi/jabatan harus diisi");
      return false;
    }
    if (!formData.unit.trim()) {
      setError("Unit kerja harus diisi");
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Format email tidak valid");
      return false;
    }

    return true;
  };

  /**
   * Handler untuk submit form registrasi
   * @param {Event} e - Event dari form submit
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      await registerUser(formData);

      // Show success message
      alert("Registrasi berhasil! Silakan login dengan akun baru Anda.");

      // Redirect to login
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message || "Terjadi kesalahan saat registrasi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FiUser className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Daftar Akun</h1>
          <p className="text-gray-600 mt-2">
            Buat akun baru untuk mengakses sistem SOP
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <FiUser className="mr-2" size={16} />
              Nama Lengkap
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <FiMail className="mr-2" size={16} />
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="nama@email.com"
              required
            />
          </div>

          {/* Position */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <FiBriefcase className="mr-2" size={16} />
              Posisi/Jabatan
            </label>
            <input
              type="text"
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Masukkan posisi/jabatan"
              required
            />
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <FiUsers className="mr-2" size={16} />
              Unit Kerja
            </label>
            <input
              type="text"
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Masukkan unit kerja"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <FiLock className="mr-2" size={16} />
              Password
            </label>
            <p className="text-xs text-gray-500">Password minimal 6 karakter</p>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Masukkan password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors">
                {showPassword ? (
                  <FiEyeOff className="text-gray-400" size={16} />
                ) : (
                  <FiEye className="text-gray-400" size={16} />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <FiLock className="mr-2" size={16} />
              Konfirmasi Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Konfirmasi password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors">
                {showConfirmPassword ? (
                  <FiEyeOff className="text-gray-400" size={16} />
                ) : (
                  <FiEye className="text-gray-400" size={16} />
                )}
              </button>
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
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <FiLoader className="animate-spin" size={16} />
                <span>Mendaftar...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <FiUser size={16} />
                <span>Daftar Akun</span>
              </div>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Sudah punya akun?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 font-medium">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
