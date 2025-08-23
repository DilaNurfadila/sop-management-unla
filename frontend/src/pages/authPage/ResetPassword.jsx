// Import React hooks untuk state management
import { useState, useEffect } from "react";
// Import React Router hooks untuk navigasi dan query params
import { useNavigate, useSearchParams, Link } from "react-router-dom";
// Import API untuk reset password
import { resetPassword } from "../../services/authApi";
// Import icon untuk UI
import { FiEye, FiEyeOff, FiLock, FiCheck, FiX } from "react-icons/fi";
// Import komponen Navbar
import Navbar from "../../components/Navbar";

/**
 * Komponen ResetPassword untuk mengubah password menggunakan token
 * yang dikirim melalui email forgot password
 */
const ResetPassword = () => {
  // State untuk form data
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // State untuk show/hide password
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false,
  });

  // State untuk loading dan messages
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // State untuk token dan email dari URL query params
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");

  // Hooks untuk navigasi dan query params
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // useEffect untuk ambil token dan email dari URL
  useEffect(() => {
    const urlToken = searchParams.get("token");
    const urlEmail = searchParams.get("email");

    if (!urlToken || !urlEmail) {
      setErrorMessage("Link reset password tidak valid");
      return;
    }

    setToken(urlToken);
    setEmail(urlEmail);
  }, [searchParams]);

  /**
   * Handler untuk perubahan input form
   * @param {Event} e - Event dari input field
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error saat user mulai typing
    if (errorMessage) setErrorMessage("");
  };

  /**
   * Function untuk validasi form
   * @returns {boolean} - True jika form valid
   */
  const validateForm = () => {
    if (!formData.newPassword) {
      setErrorMessage("Password baru wajib diisi");
      return false;
    }

    if (formData.newPassword.length < 6) {
      setErrorMessage("Password minimal 6 karakter");
      return false;
    }

    if (!formData.confirmPassword) {
      setErrorMessage("Konfirmasi password wajib diisi");
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMessage("Konfirmasi password tidak sesuai");
      return false;
    }

    return true;
  };

  /**
   * Handler untuk submit form reset password
   * @param {Event} e - Event dari form submit
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await resetPassword(token, email, formData.newPassword);

      if (result.error) {
        setErrorMessage(result.message);
        return;
      }

      setSuccessMessage(
        "Password berhasil direset. Anda akan diarahkan ke halaman login."
      );

      // Redirect ke login setelah 3 detik
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      setErrorMessage("Terjadi kesalahan saat reset password", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Function untuk toggle visibility password
   * @param {string} field - Field yang akan ditoggle
   */
  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div>
      {/* Navbar */}
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Reset Password
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Masukkan password baru untuk akun Anda
            </p>
          </div>

          {/* Form */}
          <div className="bg-white py-8 px-6 shadow-lg rounded-lg sm:px-8">
            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
                <FiX className="mr-2" size={16} />
                {errorMessage}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
                <FiCheck className="mr-2" size={16} />
                {successMessage}
              </div>
            )}

            {/* Show email info */}
            {email && (
              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">
                <p className="text-sm">
                  <strong>Email:</strong> {decodeURIComponent(email)}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiLock className="inline mr-2" size={16} />
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan password baru"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("new")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {showPassword.new ? (
                      <FiEyeOff className="text-gray-400" size={18} />
                    ) : (
                      <FiEye className="text-gray-400" size={18} />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password minimal 6 karakter
                </p>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiLock className="inline mr-2" size={16} />
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Konfirmasi password baru"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {showPassword.confirm ? (
                      <FiEyeOff className="text-gray-400" size={18} />
                    ) : (
                      <FiEye className="text-gray-400" size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !token || !email}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium">
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mereset Password...
                  </>
                ) : (
                  <>
                    <FiLock className="mr-2" size={16} />
                    Reset Password
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Back to Login Link */}
          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500">
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
