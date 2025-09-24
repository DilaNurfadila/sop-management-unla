// Import axios untuk HTTP requests
import axios from "axios";
import { installAuthInterceptors } from "./authClient";
import { decryptUserData, decryptData } from "../utils/cryptoUtils.jsx";

// Base URL untuk API endpoints authentication
const API_URL = "http://localhost:5000/api/auth";

// Enable credentials (cookies) untuk semua axios requests
// Diperlukan untuk authentication menggunakan HTTP-only cookies
axios.defaults.withCredentials = true;
installAuthInterceptors();

/**
 * Function untuk registrasi user baru dengan data lengkap
 * @param {Object} data - Data registrasi user (name, role, organization, position)
 * @returns {Promise<Object>} - Response dari server dengan token atau error object
 */
export const register = async (data) => {
  try {
    // Request POST untuk registrasi user dengan data lengkap
    const response = await axios.post(`${API_URL}/register`, {
      data,
    });
    // Cookie HTTP-only sudah di-set oleh backend; tidak menyimpan token di storage
    return response.data;
  } catch (error) {
    // Return error object dengan informasi yang konsisten
    return {
      error: true,
      status: error.response?.status,
      message: error.response?.data?.message || "Failed to register",
    };
  }
};

/**
 * Function untuk registrasi user dengan password
 * @param {Object} userData - Data user untuk registrasi
 * @param {string} userData.name - Nama lengkap user
 * @param {string} userData.email - Email user
 * @param {string} userData.password - Password user
 * @param {string} userData.position - Posisi/jabatan user
 * @param {string} userData.unit - Unit kerja user
 * @returns {Promise<Object>} - Response dari server atau error object
 */
export const registerUser = async (userData) => {
  try {
    // Request POST untuk registrasi user dengan password
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error) {
    console.error("Registration API error:", error);
    // Throw error dengan message yang jelas
    const errorMessage =
      error.response?.data?.message || "Terjadi kesalahan saat registrasi";
    throw new Error(errorMessage);
  }
};

/**
 * Function untuk logout user dan hapus session/token
 * @returns {Promise<Object>} - Response dari server atau error object
 */
export const logout = async () => {
  try {
    // Request POST untuk logout dan clear cookie token
    const response = await axios.post(`${API_URL}/logout`);
    return response.data;
  } catch (error) {
    // Return error object dengan informasi yang konsisten
    return {
      error: true,
      status: error.response?.status,
      message: error.response?.data?.message || "Failed to logout",
    };
  }
};

/**
 * Function untuk login dengan email dan password
 * @param {string} email - Email address user
 * @param {string} password - Password user
 * @returns {Promise<Object>} - Response dari server dengan token atau error object
 */
export const loginWithPassword = async (email, password) => {
  try {
    // Request POST untuk login dengan email dan password
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password,
    });
    // Cookie HTTP-only sudah di-set oleh backend; tidak menyimpan token di storage
    return response.data;
  } catch (error) {
    // Return error object dengan informasi yang konsisten
    return {
      error: true,
      status: error.response?.status,
      message: error.response?.data?.message || "Failed to login",
    };
  }
};

/**
 * Function untuk request forgot password
 * @param {string} email - Email address user yang lupa password
 * @returns {Promise<Object>} - Response dari server atau error object
 */
export const forgotPassword = async (email) => {
  try {
    // Request POST untuk forgot password
    const response = await axios.post(`${API_URL}/forgot-password`, { email });
    return response.data;
  } catch (error) {
    // Return error object dengan informasi yang konsisten
    return {
      error: true,
      status: error.response?.status,
      message: error.response?.data?.message || "Failed to send reset email",
    };
  }
};

/**
 * Function untuk reset password dengan token
 * @param {string} token - Reset token dari email
 * @param {string} email - Email address user
 * @param {string} newPassword - Password baru
 * @returns {Promise<Object>} - Response dari server atau error object
 */
export const resetPassword = async (token, email, newPassword) => {
  try {
    // Request POST untuk reset password
    const response = await axios.post(`${API_URL}/reset-password`, {
      token,
      email,
      newPassword,
    });
    return response.data;
  } catch (error) {
    // Return error object dengan informasi yang konsisten
    return {
      error: true,
      status: error.response?.status,
      message: error.response?.data?.message || "Failed to reset password",
    };
  }
};

/**
 * Ambil user saat ini dari backend (berdasarkan cookie token)
 * Mengembalikan object user yang sudah didekripsi, termasuk unit_name jika tersedia.
 */
export const getCurrentUser = async () => {
  try {
    const response = await axios.get(`${API_URL}/me`);
    const encUser = response.data?.user;
    if (!encUser) return null;

    // Gunakan util untuk mendekripsi field umum
    const user = decryptUserData(encUser);
    // Tambahkan unit_name jika ada
    if (encUser.unit_name) {
      try {
        user.unit_name = decryptData(encUser.unit_name);
      } catch (e) {
        void e;
        user.unit_name = encUser.unit_name;
      }
    }
    return user;
  } catch (error) {
    // Jika 401 berarti tidak terautentikasi
    if (error?.response?.status === 401) return null;
    throw new Error(
      error.response?.data?.message || "Gagal mengambil user saat ini"
    );
  }
};
