// Import React hooks untuk state management dan lifecycle
import { useState, useEffect } from "react";
// Import React Router hooks untuk navigasi dan location
import { useNavigate, useLocation, Link } from "react-router-dom";
// Import API services untuk authentication
import {
  requestOtp,
  verifyOtp,
  loginWithPassword,
  forgotPassword,
} from "../../services/authApi";
import { getUserByEmail } from "../../services/userApi";
// Import auth client untuk token scheduling
import { scheduleAutoLogout } from "../../services/authClient";
// Import crypto utils untuk dekripsi user data (gunakan file .jsx yang sudah ada)
import {
  decryptUserData,
  getUserDataFromStorage,
  encryptUserData,
} from "../../utils/cryptoUtils.jsx";
// Import komponen Navbar
import Navbar from "../../components/Navbar";
// Import icon untuk UI
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser } from "react-icons/fi";

/**
 * Komponen Login untuk authentication user dengan dua metode:
 * 1. Login dengan Email & Password
 * 2. Login dengan OTP (Email → Request OTP → Verify OTP)
 */
const Login = () => {
  // State untuk memilih metode login
  const [loginMethod, setLoginMethod] = useState("password"); // "password" atau "otp"

  // State untuk data form
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    access_code: "",
  });

  // State untuk loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // State untuk error dan success messages
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // State untuk tracking apakah OTP sudah dikirim
  const [isOtpSent, setIsOtpSent] = useState(false);

  // State untuk show/hide password
  const [showPassword, setShowPassword] = useState(false);

  // Hooks untuk navigasi dan current location
  const navigate = useNavigate();
  const location = useLocation();

  // useEffect untuk cek apakah user sudah login
  useEffect(() => {
    // Cek user di localStorage (token dikelola via cookie http-only)
    const user = getUserDataFromStorage();
    // Hanya redirect jika user sudah login DAN sedang mengakses halaman login
    // Jangan redirect jika user mengakses protected routes lain seperti dashboard
    if (user && location.pathname.includes("/auth")) {
      navigate(location.state?.from || "/dashboard", { replace: true });
    }
  }, [navigate, location]);

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
    if (successMessage) setSuccessMessage("");
  };

  /**
   * Handler untuk submit login dengan password
   * @param {Event} e - Event dari form submit
   */
  const handlePasswordLogin = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setErrorMessage("Email dan password wajib diisi");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const result = await loginWithPassword(formData.email, formData.password);

      if (result.error) {
        setErrorMessage(result.message);
        return;
      }

      // Debug: log hasil login
      console.log("Login result:", result);
      console.log("User data from backend:", result.user);

      // Dekripsi user data menggunakan cryptoUtils.jsx yang sudah ada
      const userData = decryptUserData(result.user);
      console.log("User data after decryption:", userData);

      // Token disimpan sebagai HTTP-only cookie oleh backend
      // Hanya schedule auto logout berdasarkan token expiry
      if (result.token) {
        console.log("Token received from backend (stored as HTTP-only cookie)");
        scheduleAutoLogout(result.token);
      }

      // Enkripsi ulang data user sebelum disimpan ke sessionStorage untuk keamanan
      const encryptedUserData = encryptUserData(userData);
      sessionStorage.setItem("user", JSON.stringify(encryptedUserData));

      // Debug: log data yang disimpan
      console.log("Data encrypted and saved to sessionStorage");

      // Redirect ke halaman yang dituju atau home
      navigate(location.state?.from || "/", { replace: true });
    } catch (error) {
      setErrorMessage("Terjadi kesalahan saat login", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handler untuk request forgot password
   */
  const handleForgotPassword = async () => {
    if (!formData.email) {
      setErrorMessage("Masukkan email terlebih dahulu");
      return;
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage("Format email tidak valid");
      return;
    }

    setIsForgotPassword(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Periksa apakah email sudah terdaftar
      const userCheck = await getUserByEmail(formData.email);

      if (!userCheck) {
        setErrorMessage(
          "Email tidak terdaftar dalam sistem. Silakan daftar terlebih dahulu atau periksa kembali email Anda."
        );
        setIsForgotPassword(false);
        return;
      }

      // Jika email terdaftar, kirim reset password email
      const result = await forgotPassword(formData.email);

      if (result.error) {
        setErrorMessage(result.message);
        return;
      }

      setSuccessMessage("Link reset password telah dikirim ke email Anda");
    } catch (error) {
      console.error("Forgot password error:", error);
      setErrorMessage(
        "Terjadi kesalahan saat mengirim email reset. Silakan coba lagi."
      );
    } finally {
      setIsForgotPassword(false);
    }
  };

  /**
   * Handler untuk submit request OTP
   * @param {Event} e - Event dari form submit
   */
  const handleOtpRequest = async (e) => {
    e.preventDefault();

    if (!formData.email) {
      setErrorMessage("Email wajib diisi");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Cek apakah user ada di sistem
      const userExists = await getUserByEmail(formData.email);
      if (!userExists) {
        setErrorMessage("Email tidak terdaftar dalam sistem");
        return;
      }

      // Request OTP
      const result = await requestOtp(formData.email);

      if (result.error) {
        setErrorMessage(result.message);
        return;
      }

      setIsOtpSent(true);
      setSuccessMessage("OTP telah dikirim ke email Anda");
    } catch (error) {
      setErrorMessage("Terjadi kesalahan saat mengirim OTP", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handler untuk verifikasi OTP
   * @param {Event} e - Event dari form submit
   */
  const handleOtpVerify = async (e) => {
    e.preventDefault();

    if (!formData.access_code) {
      setErrorMessage("Kode OTP wajib diisi");
      return;
    }

    setIsVerifying(true);
    setErrorMessage("");

    try {
      const result = await verifyOtp(formData.email, formData.access_code);

      if (result.error) {
        setErrorMessage(result.message);
        return;
      }

      // Debug: log hasil OTP verification
      console.log("OTP verification result:", result);
      console.log("User data from backend:", result.user);

      // Dekripsi user data menggunakan cryptoUtils.jsx yang sudah ada
      const userData = decryptUserData(result.user);
      console.log("User data after decryption:", userData);

      // Token disimpan sebagai HTTP-only cookie oleh backend
      // Hanya schedule auto logout berdasarkan token expiry
      if (result.token) {
        console.log("Token received from backend (stored as HTTP-only cookie)");
        scheduleAutoLogout(result.token);
      }

      // Enkripsi ulang data user sebelum disimpan ke sessionStorage untuk keamanan
      const encryptedUserData = encryptUserData(userData);
      sessionStorage.setItem("user", JSON.stringify(encryptedUserData));

      // Debug: log data yang disimpan
      console.log("Data encrypted and saved to sessionStorage");

      // Redirect ke halaman yang dituju atau home
      navigate(location.state?.from || "/", { replace: true });
    } catch (error) {
      setErrorMessage("Terjadi kesalahan saat verifikasi OTP", error.message);
    } finally {
      setIsVerifying(false);
    }
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
              Masuk ke Akun Anda
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Pilih metode login yang Anda inginkan
            </p>
          </div>

          {/* Login Method Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLoginMethod("password")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                loginMethod === "password"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              <FiLock className="inline mr-2" size={16} />
              Email & Password
            </button>
            <button
              onClick={() => setLoginMethod("otp")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                loginMethod === "otp"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              <FiMail className="inline mr-2" size={16} />
              OTP Email
            </button>
          </div>

          {/* Login Form */}
          <div className="bg-white py-8 px-6 shadow-lg rounded-lg sm:px-8">
            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {errorMessage}
                {errorMessage.includes("tidak terdaftar") && (
                  <div className="mt-2">
                    <Link
                      to="/register"
                      className="text-blue-600 hover:text-blue-800 underline font-medium">
                      Daftar akun baru di sini
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                {successMessage}
              </div>
            )}

            {/* Password Login Form */}
            {loginMethod === "password" && (
              <form onSubmit={handlePasswordLogin} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiMail className="inline mr-2" size={16} />
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan email Anda"
                    required
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiLock className="inline mr-2" size={16} />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Masukkan password Anda"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {showPassword ? (
                        <FiEyeOff className="text-gray-400" size={18} />
                      ) : (
                        <FiEye className="text-gray-400" size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isForgotPassword}
                    className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50">
                    {isForgotPassword ? "Mengirim..." : "Lupa Password?"}
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium">
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Masuk...
                    </>
                  ) : (
                    <>
                      <FiUser className="mr-2" size={16} />
                      Masuk
                    </>
                  )}
                </button>
              </form>
            )}

            {/* OTP Login Form */}
            {loginMethod === "otp" && (
              <form
                onSubmit={isOtpSent ? handleOtpVerify : handleOtpRequest}
                className="space-y-6">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiMail className="inline mr-2" size={16} />
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isOtpSent}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Masukkan email Anda"
                    required
                  />
                </div>

                {/* OTP Input (hanya muncul setelah OTP dikirim) */}
                {isOtpSent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kode OTP
                    </label>
                    <input
                      type="text"
                      name="access_code"
                      value={formData.access_code}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                      placeholder="Masukkan 6 digit OTP"
                      maxLength="6"
                      required
                    />
                    <p className="text-sm text-gray-500 text-center mt-2">
                      Masukkan kode OTP yang dikirim ke email Anda
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isVerifying}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium">
                  {isSubmitting || isVerifying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isOtpSent ? "Memverifikasi..." : "Mengirim OTP..."}
                    </>
                  ) : (
                    <>
                      <FiMail className="mr-2" size={16} />
                      {isOtpSent ? "Verifikasi OTP" : "Kirim OTP"}
                    </>
                  )}
                </button>

                {/* Reset OTP Button */}
                {isOtpSent && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOtpSent(false);
                        setFormData({ ...formData, access_code: "" });
                        setErrorMessage("");
                        setSuccessMessage("");
                      }}
                      className="text-sm text-blue-600 hover:text-blue-500">
                      Kirim Ulang OTP
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Belum punya akun?{" "}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500">
                Daftar di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
