import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Service untuk admin management
 * Menggunakan endpoint yang sudah ada di userRoutes dengan prefix /admin
 */

// Konfigurasi axios dengan credentials
const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/users/admin`,
  withCredentials: true,
});

/**
 * Mendapatkan semua pengguna (khusus admin)
 */
export const getAllUsers = async () => {
  try {
    const response = await adminApi.get("/all");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Gagal mengambil data pengguna" };
  }
};

/**
 * Mendapatkan statistik pengguna (khusus admin)
 */
export const getUserStats = async () => {
  try {
    const response = await adminApi.get("/stats");
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || { message: "Gagal mengambil statistik pengguna" }
    );
  }
};

/**
 * Mencari pengguna berdasarkan query (khusus admin)
 */
export const searchUsers = async (query) => {
  try {
    const response = await adminApi.get("/search", {
      params: { query },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Gagal mencari pengguna" };
  }
};

/**
 * Menghapus pengguna berdasarkan ID (khusus admin)
 */
export const deleteUser = async (userId) => {
  try {
    const response = await adminApi.delete(`/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Gagal menghapus pengguna" };
  }
};

/**
 * Mengubah role pengguna (khusus admin)
 */
export const updateUserRole = async (userId, role) => {
  try {
    const response = await adminApi.put(`/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Gagal mengubah role pengguna" };
  }
};

export default {
  getAllUsers,
  getUserStats,
  searchUsers,
  deleteUser,
  updateUserRole,
};
