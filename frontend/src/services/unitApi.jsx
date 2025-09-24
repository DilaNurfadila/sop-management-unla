import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Konfigurasi axios dengan credentials
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Mengambil semua unit
export const getAllUnits = async () => {
  try {
    const response = await api.get("/units");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal mengambil data unit"
    );
  }
};

// Mengambil semua unit untuk registrasi (tanpa autentikasi)
export const getAllUnitsPublic = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/units/public`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal mengambil data unit"
    );
  }
};

// Mengambil unit berdasarkan ID
export const getUnitById = async (id) => {
  try {
    const response = await api.get(`/units/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal mengambil data unit"
    );
  }
};

// Membuat unit baru
export const createUnit = async (unitData) => {
  try {
    const response = await api.post("/units", unitData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Gagal membuat unit");
  }
};

// Update unit
export const updateUnit = async (id, unitData) => {
  try {
    const response = await api.put(`/units/${id}`, unitData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Gagal mengupdate unit");
  }
};

// Nonaktifkan unit
export const deactivateUnit = async (id) => {
  try {
    const response = await api.put(`/units/${id}/deactivate`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal menonaktifkan unit"
    );
  }
};

// Aktifkan kembali unit
export const activateUnit = async (id) => {
  try {
    const response = await api.put(`/units/${id}/activate`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal mengaktifkan kembali unit"
    );
  }
};

// Cari unit
export const searchUnits = async (keyword) => {
  try {
    const response = await api.get(
      `/units/search?q=${encodeURIComponent(keyword)}`
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Gagal mencari unit");
  }
};

// Mendapatkan statistik unit
export const getUnitStats = async () => {
  try {
    const response = await api.get("/units/stats");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal mengambil statistik unit"
    );
  }
};
