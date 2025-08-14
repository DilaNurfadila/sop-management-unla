// Import axios untuk HTTP requests
import axios from "axios";

// Base URL untuk API endpoints user management
const API_URL = "http://localhost:5000/api/users";

/**
 * Function untuk mengambil semua data user
 * @returns {Promise<Array>} - Array berisi semua user
 * @throws {Error} - Error jika request gagal
 */
export const getUsers = async () => {
  try {
    // Request GET untuk semua user
    const response = await axios.get(`${API_URL}`);
    return response.data;
  } catch (error) {
    // Handle error dengan message yang user-friendly
    throw new Error(error.response?.data?.message || "Failed to fetch users");
  }
};

/**
 * Function untuk mengambil data user berdasarkan ID
 * @param {string|number} id - ID user yang akan diambil
 * @returns {Promise<Object>} - Object data user
 * @throws {Error} - Error jika user tidak ditemukan atau request gagal
 */
export const getUser = async (id) => {
  try {
    // Request GET untuk user spesifik berdasarkan ID
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    // Handle error dengan message yang sesuai
    throw new Error(error.response?.data?.message || "Failed to fetch user");
  }
};

/**
 * Function untuk mengambil data user berdasarkan email
 * @param {string} email - Email user yang akan diambil
 * @returns {Promise<Object>} - Object data user
 * @throws {Error} - Error jika user tidak ditemukan atau request gagal
 */
export const getUserByEmail = async (email) => {
  try {
    // Request GET untuk user spesifik berdasarkan email
    const response = await axios.get(`${API_URL}/${email}`);
    return response.data;
  } catch (error) {
    // Handle error dengan message yang sesuai
    throw new Error(error.response?.data?.message || "Failed to fetch user");
  }
};

// Catatan: Function getUserProfile di-comment karena tidak digunakan saat ini
// Function ini adalah template untuk mendapatkan profile user yang sedang login
// export const getUserProfile = async () => {
//   try {
//     const response = await api.get(`${API_URL}/user/profile`); // Asumsikan endpoint ini
//     return response.data;
//   } catch (error) {
//     throw new Error(
//       error.response?.data?.message || "Failed to fetch user profile"
//     );
//   }
// };

// Catatan: Function createDoc di-comment karena tidak digunakan untuk user API
// Function ini adalah template untuk membuat document jika diperlukan di masa depan
// export const createDoc = async (docData) => {
//   try {
//     const response = await api.post(`${API_URL}/`, docData);
//     return response.data;
//   } catch (error) {
//     throw new Error(
//       error.response?.data?.message || "Failed to create document"
//     );
//   }
// };

// export const updateDoc = async (id, docData) => {
//   try {
//     const response = await api.put(`${API_URL}/${id}`, docData);
//     return response.data;
//   } catch (error) {
//     throw new Error(
//       error.response?.data?.message || "Failed to update document"
//     );
//   }
// };

// export const deleteDoc = async (id) => {
//   try {
//     const response = await api.delete(`${API_URL}/${id}`);
//     return response.data;
//   } catch (error) {
//     throw new Error(
//       error.response?.data?.message || "Failed to delete document"
//     );
//   }
// };
