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

/**
 * Menonaktifkan pengguna (khusus admin)
 */
export const deactivateUser = async (userId) => {
  try {
    const response = await adminApi.put(`/${userId}/deactivate`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Gagal menonaktifkan pengguna" };
  }
};

/**
 * Mengaktifkan kembali pengguna (khusus admin)
 */
export const activateUser = async (userId) => {
  try {
    const response = await adminApi.put(`/${userId}/activate`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Gagal mengaktifkan pengguna" };
  }
};

/**
 * Membuat pengguna baru (khusus superadmin)
 */
export const createUser = async (payload) => {
  try {
    const response = await adminApi.post(`/create`, payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Gagal membuat pengguna" };
  }
};

export default {
  getAllUsers,
  getUserStats,
  searchUsers,
  updateUserRole,
  deactivateUser,
  activateUser,
  createUser,
};
