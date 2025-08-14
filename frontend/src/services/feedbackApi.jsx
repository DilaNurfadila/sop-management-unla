// Import axios untuk HTTP requests
import axios from "axios";

// Base URL API dari environment variable atau default localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Enable credentials (cookies) untuk semua axios requests
// Diperlukan untuk authentication menggunakan HTTP-only cookies
axios.defaults.withCredentials = true;

// Buat instance axios khusus untuk feedback API dengan konfigurasi default
const feedbackApi = axios.create({
  baseURL: `${API_URL}/feedback`, // Base URL untuk feedback endpoints
  headers: {
    "Content-Type": "application/json", // Default content type untuk JSON data
  },
});

/**
 * Function untuk membuat feedback baru pada dokumen SOP
 * @param {Object} feedbackData - Data feedback (sop_id, user_name, user_email, rating, comment)
 * @returns {Promise<Object>} - Response dari server dengan data feedback yang dibuat
 * @throws {Error} - Error jika pembuatan feedback gagal
 */
export const createFeedback = async (feedbackData) => {
  try {
    // Request POST untuk membuat feedback baru
    const response = await feedbackApi.post("/", feedbackData);
    return response.data;
  } catch (error) {
    // Throw error data dari response atau error object
    throw error.response?.data || error;
  }
};

/**
 * Function untuk mengambil feedback berdasarkan SOP ID
 * @param {string|number} sopId - ID dokumen SOP yang akan diambil feedbacknya
 * @returns {Promise<Object>} - Response berisi array feedback dan statistik
 * @throws {Error} - Error jika request gagal
 */
export const getFeedbackBySopId = async (sopId) => {
  try {
    // Request GET untuk feedback spesifik SOP
    const response = await feedbackApi.get(`/sop/${sopId}`);
    return response.data;
  } catch (error) {
    // Throw error data dari response atau error object
    throw error.response?.data || error;
  }
};

/**
 * Function untuk mengambil semua feedback (akses admin)
 * @returns {Promise<Array>} - Array berisi semua feedback dengan info SOP dan uploader
 * @throws {Error} - Error jika request gagal
 */
export const getAllFeedback = async () => {
  try {
    // Request GET untuk semua feedback
    const response = await feedbackApi.get("/");
    return response.data;
  } catch (error) {
    // Throw error data dari response atau error object
    throw error.response?.data || error;
  }
};

/**
 * Function untuk menghapus feedback (akses admin)
 * @param {string|number} feedbackId - ID feedback yang akan dihapus
 * @returns {Promise<Object>} - Response konfirmasi penghapusan
 * @throws {Error} - Error jika penghapusan gagal
 */
export const deleteFeedback = async (feedbackId) => {
  try {
    // Request DELETE untuk hapus feedback berdasarkan ID
    const response = await feedbackApi.delete(`/${feedbackId}`);
    return response.data;
  } catch (error) {
    // Throw error data dari response atau error object
    throw error.response?.data || error;
  }
};

// Export default instance axios untuk feedback API
export default feedbackApi;
