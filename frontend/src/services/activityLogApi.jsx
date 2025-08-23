import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Konfigurasi axios dengan credentials
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Mengambil semua log aktivitas dengan filter dan pagination
export const getAllLogs = async (params = {}) => {
  try {
    const response = await api.get("/activities", { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Gagal mengambil riwayat aktivitas");
  }
};

// Mengambil log aktivitas berdasarkan ID
export const getLogById = async (id) => {
  try {
    const response = await api.get(`/activities/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Gagal mengambil detail log aktivitas");
  }
};

// Mencari log aktivitas berdasarkan kata kunci
export const searchLogs = async (keyword, params = {}) => {
  try {
    const response = await api.get("/activities/search", {
      params: { q: keyword, ...params }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Gagal mencari riwayat aktivitas");
  }
};

// Mendapatkan statistik aktivitas
export const getActivityStats = async (days = 7) => {
  try {
    const response = await api.get("/activities/stats", {
      params: { days }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Gagal mengambil statistik aktivitas");
  }
};

// Membuat log aktivitas manual (untuk testing)
export const createLog = async (logData) => {
  try {
    const response = await api.post("/activities", logData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Gagal membuat log aktivitas");
  }
};

// Menghapus log lama (cleanup)
export const cleanupOldLogs = async (days = 90) => {
  try {
    const response = await api.post("/activities/cleanup", { days });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Gagal melakukan cleanup log");
  }
};

// Mengambil aktivitas user tertentu
export const getUserActivities = async (userId, params = {}) => {
  try {
    const response = await api.get(`/activities/user/${userId}`, { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Gagal mengambil aktivitas user");
  }
};
