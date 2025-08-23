// Import axios untuk HTTP requests
import axios from "axios";
import { installAuthInterceptors } from "./authClient";

// Base URL untuk API endpoints authentication
const API_URL = "http://localhost:5000/api/auth";

// Enable credentials (cookies) untuk semua axios requests
// Diperlukan untuk authentication menggunakan HTTP-only cookies
axios.defaults.withCredentials = true;
installAuthInterceptors();

/**
 * Function untuk request OTP ke email user
 * @param {string} email - Email address user yang akan menerima OTP
 * @returns {Promise<Object>} - Response dari server atau error object
 */
export const requestOtp = async (email) => {
  try {
    // Request POST untuk generate dan kirim OTP ke email
    const response = await axios.post(`${API_URL}/request-otp`, { email });
    return response.data;
  } catch (error) {
    // Return error object dengan informasi yang konsisten
    return {
      error: true,
      status: error.response?.status,
      message: error.response?.data?.message || "Failed to request OTP",
    };
  }
};

/**
 * Function untuk verifikasi OTP yang dimasukkan user
 * @param {string} email - Email address user
 * @param {string} access_code - Kode OTP 6 digit yang dimasukkan user
 * @returns {Promise<Object>} - Response dari server dengan token atau error object
 */
export const verifyOtp = async (email, access_code) => {
  try {
    // Request POST untuk verifikasi OTP
    const response = await axios.post(`${API_URL}/verify-otp`, {
      email,
      access_code,
    });
    // Cookie HTTP-only sudah di-set oleh backend; tidak menyimpan token di storage
    return response.data;
  } catch (error) {
    // Return error object dengan informasi yang konsisten
    return {
      error: true,
      status: error.response?.status,
      message: error.response?.data?.message || "Failed to verify otp",
    };
  }
};

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
