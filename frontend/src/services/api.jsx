// Import axios untuk HTTP requests
import axios from "axios";
import { installAuthInterceptors } from "./authClient";

// Base URL untuk API endpoints dokumen SOP
const API_URL = "http://localhost:5000/api/docs";

// Enable credentials (cookies) untuk semua axios requests
// Diperlukan untuk authentication menggunakan HTTP-only cookies
axios.defaults.withCredentials = true;
installAuthInterceptors();

// Buat instance axios dengan konfigurasi default
const api = axios.create({
  baseURL: API_URL,
});

/**
 * Function untuk mengambil semua dokumen SOP
 * @returns {Promise<Array>} - Array berisi semua dokumen SOP
 * @throws {Error} - Error jika request gagal
 */
export const getDocs = async () => {
  try {
    // Request GET ke endpoint untuk semua dokumen
    const response = await api.get(`${API_URL}`);
    return response.data;
  } catch (error) {
    // Handle error dengan message yang user-friendly
    throw new Error(
      error.response?.data?.message || "Failed to fetch documents"
    );
  }
};

/**
 * Function untuk mengambil satu dokumen SOP berdasarkan ID
 * @param {string|number} id - ID dokumen yang akan diambil
 * @returns {Promise<Object>} - Object dokumen SOP
 * @throws {Error} - Error jika dokumen tidak ditemukan atau request gagal
 */
export const getDoc = async (id) => {
  try {
    // Request GET ke endpoint dengan parameter ID
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    // Handle error dengan message yang sesuai
    throw new Error(
      error.response?.data?.message || "Failed to fetch document"
    );
  }
};

// Catatan: Function getUserProfile di-comment karena tidak digunakan saat ini
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

/**
 * Function untuk membuat dokumen SOP baru
 * @param {Object} docData - Data dokumen SOP yang akan dibuat
 * @returns {Promise<Object>} - Response dari server dengan data dokumen baru
 * @throws {Error} - Error jika pembuatan dokumen gagal
 */
export const createDoc = async (docData) => {
  try {
    // Request POST untuk membuat dokumen baru
    const response = await api.post(`${API_URL}/`, docData);
    return response.data;
  } catch (error) {
    // Handle error dengan message yang spesifik untuk create operation
    throw new Error(
      error.response?.data?.message || "Failed to create document"
    );
  }
};

/**
 * Function untuk mengupdate dokumen SOP yang sudah ada
 * @param {string|number} id - ID dokumen yang akan diupdate
 * @param {Object} docData - Data baru untuk dokumen SOP
 * @returns {Promise<Object>} - Response dari server dengan data dokumen yang diupdate
 * @throws {Error} - Error jika update dokumen gagal
 */
export const updateDoc = async (id, docData) => {
  try {
    // Request PUT untuk update dokumen berdasarkan ID
    const response = await api.put(`${API_URL}/${id}`, docData);
    return response.data;
  } catch (error) {
    // Handle error dengan message yang spesifik untuk update operation
    throw new Error(
      error.response?.data?.message || "Failed to update document"
    );
  }
};

/**
 * Function untuk mempublikasi dokumen SOP (ubah status dari draft ke published)
 * @param {string|number} id - ID dokumen yang akan dipublikasi
 * @returns {Promise<Object>} - Response dari server dengan status dokumen yang diupdate
 * @throws {Error} - Error jika publish dokumen gagal
 */
export const publishDoc = async (id) => {
  try {
    // Request PUT ke endpoint publish dengan ID dokumen
    const response = await api.put(`${API_URL}/publish/${id}`);
    return response.data;
  } catch (error) {
    // Handle error dengan message yang spesifik untuk publish operation
    throw new Error(
      error.response?.data?.message || "Failed to publish document"
    );
  }
};

/**
 * Function untuk unpublish dokumen SOP (kembali dari published ke draft)
 * @param {string|number} id - ID dokumen yang akan di-unpublish
 * @returns {Promise<Object>} - Response dari server dengan status dokumen yang diupdate
 * @throws {Error} - Error jika unpublish dokumen gagal
 */
export const unpublishDoc = async (id) => {
  try {
    // Request PUT ke endpoint unpublish dengan ID dokumen
    const response = await api.put(`${API_URL}/unpublish/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to unpublish document"
    );
  }
};

export const deleteDoc = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to delete document"
    );
  }
};
