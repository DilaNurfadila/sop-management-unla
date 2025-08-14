// Import React hooks untuk state management
import { useState } from "react";
// Import React Router hooks untuk navigasi dan location state
import { useLocation, useNavigate } from "react-router-dom";
// Import API service untuk registrasi user
import { register } from "../../services/authApi";

/**
 * Komponen Register untuk registrasi user baru
 * Menggunakan data email dari login flow dan meminta data tambahan
 */
const Register = () => {
  // Hooks untuk akses location state dan navigasi
  const { state } = useLocation();
  const navigate = useNavigate();

  // State untuk form data dengan email dari login flow
  const [formData, setFormData] = useState({
    email: state?.email, // Email dari halaman login
    name: "",
    role: "",
    organization: "",
    position: "",
  });

  // State untuk loading saat submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State untuk error message
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * Handler untuk perubahan input form
   * @param {Event} e - Event dari input field
   */
  const handleChange = (e) => {
    // Update form data dengan spread operator
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error message saat user mengetik
    setErrorMessage("");
  };

  /**
   * Handler untuk submit form registrasi
   * @param {Event} e - Event dari form submit
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Panggil API register dengan semua data form
      const response = await register(
        formData.email,
        formData.name,
        formData.role,
        formData.organization,
        formData.position
      );

      // Cek apakah ada error dari response
      if (response.error) {
        setErrorMessage(response.message);
      } else {
        // Registrasi berhasil, redirect ke dashboard
        navigate("/dashboard");
      }
    } catch {
      // Handle error dari network atau server
      setErrorMessage("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      // Reset loading state
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">Daftar Pengguna</h2>
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
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Nama:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Role:</label>
          <input
            type="text"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Organisasi:</label>
          <input
            type="text"
            name="organization"
            value={formData.organization}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Posisi:</label>
          <input
            type="text"
            name="position"
            value={formData.position}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 rounded-md text-white ${
            isSubmitting
              ? "bg-blue-600 opacity-70"
              : "bg-blue-500 hover:bg-blue-600"
          }`}>
          {isSubmitting ? "Memproses..." : "Daftar"}
        </button>
      </form>
    </div>
  );
};

export default Register;
