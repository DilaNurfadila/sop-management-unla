/**
 * Service: api
 *
 * Axios instance untuk panggilan API ke backend.
 * Catatan:
 * - Menggunakan withCredentials untuk cookie-based auth
 * - Base URL disesuaikan via VITE_API_URL atau default localhost
 */
// Import axios untuk HTTP requests
import axios from "axios";
import { installAuthInterceptors, forceLogout } from "./authClient";

// Base URL untuk API endpoints dokumen SOP
const API_URL = "http://localhost:5000/api/docs";

// Enable credentials (cookies) untuk semua axios requests
// Diperlukan untuk authentication menggunakan HTTP-only cookies
axios.defaults.withCredentials = true;
installAuthInterceptors();

// Buat instance axios dengan konfigurasi default
const api = axios.create({
  baseURL: "http://localhost:5000/api", // Base URL yang lebih general untuk semua endpoints
  withCredentials: true,
});

// Pasang interceptor juga pada instance `api` agar 401 dari instance ini memicu auto-logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";
    const skip = error?.config?.__skipAuthInterceptor === true;
    const isLogoutCall =
      typeof url === "string" && url.includes("/auth/logout");
    if (status === 401 && !skip && !isLogoutCall) {
      await forceLogout();
    }
    return Promise.reject(error);
  }
);

/**
 * Function untuk mengambil semua dokumen SOP
 * @returns {Promise<Array>} - Array berisi semua dokumen SOP
 * @throws {Error} - Error jika request gagal
 */
export const getDocs = async () => {
  try {
    // Request GET ke endpoint untuk semua dokumen
    const response = await api.get("/docs");
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
    const response = await api.get(`/docs/${id}`);
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
    const response = await api.post("/docs/", docData);
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
    const response = await api.put(`/docs/${id}`, docData);
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
    const response = await api.put(`/docs/unpublish/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to unpublish document"
    );
  }
};

export const deleteDoc = async (id) => {
  try {
    const response = await api.delete(`/docs/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to delete document"
    );
  }
};

/**
 * Function untuk mengambil SOP berdasarkan unit kerja pengguna yang login
 * @returns {Promise<Object>} - Response dengan data SOP sesuai unit user
 * @throws {Error} - Error jika request gagal
 */
export const getSopByUserUnit = async () => {
  try {
    const response = await api.get("/docs/my-unit");
    return response.data;
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401) {
      // Hard fail: clear session and redirect to login
      try {
        const { forceLogout } = await import("./authClient");
        await forceLogout();
      } catch (e) {
        // Log error to aid debugging instead of silently ignoring
        console.error("forceLogout failed:", e);
      }
      throw new Error("Akses ditolak, sesi berakhir. Silakan login kembali.");
    }
    throw new Error(
      error.response?.data?.message ||
        "Failed to fetch SOP documents by user unit"
    );
  }
};

/**
 * Function untuk mengambil SOP berdasarkan unit tertentu
 * @param {string|number} unitId - ID unit kerja
 * @returns {Promise<Object>} - Response dengan data SOP sesuai unit
 * @throws {Error} - Error jika request gagal
 */
export const getSopByUnit = async (unitId) => {
  try {
    const response = await api.get(`/docs/by-unit/${unitId}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch SOP documents by unit"
    );
  }
};

// Export default axios instance untuk digunakan oleh komponen lain
export default api;
