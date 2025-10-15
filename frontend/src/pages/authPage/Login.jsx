/**
 * Page: Login
 *
 * Halaman untuk autentikasi pengguna (email/password). Mengatur redirect pasca-login.
 */
// Import React hooks untuk state management dan lifecycle
import { useState, useEffect } from "react";
// Import React Router hooks untuk navigasi dan location
import { useNavigate, useLocation, Link } from "react-router-dom";
// Import API services untuk authentication
import { loginWithPassword, forgotPassword } from "../../services/authApi";
import { getUserByEmail } from "../../services/userApi";
// Import auth client untuk token scheduling
import { scheduleAutoLogout } from "../../services/authClient";
// Import crypto utils untuk dekripsi user data (gunakan file .jsx yang sudah ada)
import { getUserDataFromStorage } from "../../utils/cryptoUtils.jsx";
// Import komponen Navbar
import Navbar from "../../components/Navbar";
// Import icon untuk UI
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser } from "react-icons/fi";

/**
 * Komponen Login untuk authentication user dengan Email & Password
 */
const Login = () => {
  // State untuk data form
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // State untuk loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // State untuk error dan success messages
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
      // Attempt login dengan password
      const result = await loginWithPassword(formData.email, formData.password);

      // Cek apakah response mengandung error
      if (result.error) {
        setErrorMessage(result.message);
        setIsSubmitting(false);
        return;
      }

      // Jika butuh registrasi (user belum melengkapi data)
      if (result.requiresRegistration) {
        setIsVerifying(true);
        setTimeout(() => {
          navigate("/auth/register", {
            state: { email: formData.email, fromLogin: true },
          });
          setIsVerifying(false);
        }, 1000);
        return;
      }

      // Login berhasil - simpan data ke localStorage
      if (result.user) {
        // Simpan data user langsung tanpa enkripsi dulu untuk debugging
        localStorage.setItem("userData", JSON.stringify(result.user));

        // Schedule auto logout berdasarkan token expiry
        if (result.token) {
          scheduleAutoLogout(result.token);
        }

        // Set success message
        setSuccessMessage("Login berhasil! Mengarahkan ke dashboard...");

        // Delay sebelum navigate untuk show success message
        setTimeout(() => {
          navigate(location.state?.from || "/dashboard", { replace: true });
        }, 1500);
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Terjadi kesalahan saat login. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handler untuk proses forgot password
   */
  const handleForgotPassword = async () => {
    if (!formData.email) {
      setErrorMessage("Masukkan email terlebih dahulu");
      return;
    }

    setIsForgotPassword(true);
    setErrorMessage("");

    try {
      // Validasi apakah email terdaftar
      const user = await getUserByEmail(formData.email);
      if (!user) {
        setErrorMessage("Email tidak ditemukan dalam sistem");
        setIsForgotPassword(false);
        return;
      }

      const result = await forgotPassword(formData.email);

      if (result.error) {
        setErrorMessage(result.message);
      } else {
        setSuccessMessage(
          "Link reset password telah dikirim ke email Anda. Silakan cek email dan ikuti instruksi untuk reset password."
        );
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat mengirim reset password");
    } finally {
      setIsForgotPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />

      <div className="flex items-center justify-center min-h-screen pt-16">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-100">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <FiUser className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Selamat Datang
              </h2>
              <p className="text-gray-600">
                Masuk ke Sistem SOP Management UNLA
              </p>
            </div>

            {/* Error/Success Messages */}
            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium">
                  {errorMessage}
                </p>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm font-medium">
                  {successMessage}
                </p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handlePasswordLogin} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    placeholder="Masukkan email Anda"
                    required
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    placeholder="Masukkan password Anda"
                    required
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
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
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200">
                  {isForgotPassword ? "Mengirim..." : "Lupa Password?"}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isVerifying}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                  isSubmitting || isVerifying
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                }`}>
                {isSubmitting
                  ? "Memproses Login..."
                  : isVerifying
                  ? "Memverifikasi..."
                  : "Masuk"}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Belum punya akun?{" "}
                <Link
                  to="/auth/register"
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200">
                  Daftar di sini
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
