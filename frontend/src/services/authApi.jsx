// Import axios untuk HTTP requests
import axios from "axios";

// Base URL untuk API endpoints authentication
const API_URL = "http://localhost:5000/api/auth";

// Enable credentials (cookies) untuk semua axios requests
// Diperlukan untuk authentication menggunakan HTTP-only cookies
axios.defaults.withCredentials = true;

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
