import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { requestOtp, verifyOtp } from "../../services/authApi";
import { getUsers, getUserByEmail } from "../../services/userApi";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    access_code: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false); // New state for verification
  const [errorMessage, setErrorMessage] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Cek jika sudah login
    const token = localStorage.getItem("token");
    if (token) {
      navigate(location.state?.from || "/docs", { replace: true });
    }
  }, [navigate, location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isOtpSent) {
      setIsSubmitting(true);
      setErrorMessage("");

      if (!formData.email) {
        setErrorMessage("Email wajib diisi.");
        setIsSubmitting(false);
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setErrorMessage("Silakan masukkan alamat email yang valid.");
        setIsSubmitting(false);
        return;
      }

      const response = await requestOtp(formData.email);
      if (response.error) {
        setErrorMessage(response.message);
      } else {
        setIsOtpSent(true);
      }
      setIsSubmitting(false);
    } else {
      setIsVerifying(true);
      setErrorMessage("");

      if (!formData.access_code) {
        setErrorMessage("Kode Akses wajib diisi.");
        setIsVerifying(false);
        return;
      }

      if (!/^\d{6}$/.test(formData.access_code)) {
        setErrorMessage("Kode Akses harus berupa 6 digit angka.");
        setIsVerifying(false);
        return;
      }

      try {
        const response = await verifyOtp(formData.email, formData.access_code);
        console.log(response.user);
        if (response.error) {
          const accessCodeErrors = [
            "OTP record not found or expired. please request again",
            "OTP has expired, please request again",
          ];

          if (response.message === "Invalid access code") {
            setErrorMessage("Kode Akses tidak valid. Silakan coba lagi.");
          } else if (accessCodeErrors.includes(response.message)) {
            setErrorMessage(
              "Kode Akses telah kedaluwarsa. Silakan minta kode baru."
            );
            setIsOtpSent(false);
            setFormData({ ...formData, access_code: "" });
          } else if (response.message === "Please complete registration") {
            return navigate("/auth/register", {
              state: {
                email: formData.email,
                message: "Silakan lengkapi pendaftaran Anda.",
              },
            });
          } else {
            setErrorMessage(response.message);
          }
        } else {
          const users = await getUsers();
          const foundUser = users.find((user) => formData.email === user.email);

          console.log(foundUser);

          if (foundUser) {
            const user = await getUserByEmail(formData.email);
            console.log(user);
            console.log(!user.name);
            if (user && !user.name) {
              return navigate("/auth/register", {
                state: {
                  email: formData.email,
                  message: "Silakan lengkapi pendaftaran Anda.",
                },
              });
            } else {
              localStorage.setItem("user", JSON.stringify(response.user));
              navigate("/docs");
            }
          } else {
            return navigate("/auth/register", {
              state: {
                email: formData.email,
                message: "Silakan lengkapi pendaftaran Anda.",
              },
            });
          }
        }
      } catch (error) {
        setErrorMessage(
          "Terjadi kesalahan saat verifikasi. Silakan coba lagi."
        );
        console.log(error.message);
      } finally {
        setIsVerifying(false);
      }
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">Login</h2>
      {errorMessage && (
        <div className="mb-4 text-red-600 font-semibold">{errorMessage}</div>
      )}
      <form onSubmit={handleSubmit} className="max-w-md">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isOtpSent}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Kode Akses (OTP):</label>
          <input
            type="text"
            name="access_code"
            maxLength="6"
            value={formData.access_code}
            onChange={handleChange}
            required
            disabled={!isOtpSent}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex gap-5">
          <button
            type="submit"
            disabled={
              (!isOtpSent && isSubmitting) || (isOtpSent && isVerifying)
            } // Adjusted disable logic
            className={`px-4 py-2 rounded-md text-white ${
              isSubmitting || isVerifying
                ? "bg-blue-600 opacity-70"
                : "bg-blue-500 hover:bg-blue-600"
            }`}>
            {isOtpSent
              ? isVerifying
                ? "Memproses..."
                : "Verifikasi OTP"
              : isSubmitting
              ? "Memproses..."
              : "Kirim OTP"}
          </button>
          {isOtpSent && (
            <button
              type="button"
              onClick={() => {
                setIsOtpSent(false);
                setFormData({ ...formData, access_code: "" });
                setErrorMessage("");
              }}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md">
              Kembali
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default Login;
