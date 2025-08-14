// Import axios untuk HTTP requests
import axios from "axios";

/**
 * Buat instance axios untuk public API (tanpa authentication)
 * Digunakan untuk endpoint yang bisa diakses tanpa login
 */
const publicApi = axios.create({
  baseURL: "http://localhost:5000/api/docs", // Base URL untuk API dokumen
  withCredentials: false, // Tidak perlu credentials untuk public endpoints
});

/**
 * Function untuk mengambil dokumen SOP yang sudah dipublikasi (akses publik)
 * @returns {Promise<Array>} - Array berisi dokumen dengan status 'published'
 * @throws {Error} - Error jika request gagal
 */
export const getPublishedDocs = async () => {
  try {
    // Request GET ke endpoint public untuk dokumen published
    const response = await publicApi.get("/public/published");
    // Pastikan response berupa array, jika tidak return array kosong
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching published documents:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch published documents"
    );
  }
};

/**
 * Function untuk mengambil satu dokumen published berdasarkan ID (akses publik)
 * @param {string|number} id - ID dokumen yang akan diambil
 * @returns {Promise<Object|undefined>} - Object dokumen atau undefined jika tidak ditemukan
 * @throws {Error} - Error jika request gagal
 */
export const getPublishedDoc = async (id) => {
  try {
    // Ambil semua dokumen published terlebih dahulu
    const allPublished = await getPublishedDocs();
    // Cari dokumen berdasarkan ID dengan convert id ke integer
    return allPublished.find((doc) => doc.id === parseInt(id));
  } catch (error) {
    console.error("Error fetching published document:", error);
    throw new Error("Failed to fetch published document");
  }
};
