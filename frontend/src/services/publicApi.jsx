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
 * Buat instance axios untuk public flowchart API (tanpa authentication)
 */
const publicFlowchartApi = axios.create({
  baseURL: "http://localhost:5000/api", // Base URL untuk API flowchart
  withCredentials: false, // Tidak perlu credentials untuk public endpoints
});

/**
 * Function untuk mengambil dokumen SOP yang sudah dipublikasi (akses publik)
 * Mengirim token authorization jika user sudah login untuk menerapkan filter visibilitas
 * @returns {Promise<Array>} - Array berisi dokumen dengan status 'published'
 * @throws {Error} - Error jika request gagal
 */
export const getPublishedDocs = async () => {
  try {
    // Cek apakah ada token di localStorage (user sudah login)
    const token = localStorage.getItem("token");

    // Setup headers dengan token jika ada
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Request GET ke endpoint public untuk dokumen published
    const response = await publicApi.get("/public/published", { headers });
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

/**
 * Function untuk mengambil konten lengkap SOP yang sudah dipublikasi (akses publik)
 * @param {string|number} id - ID dokumen yang akan diambil
 * @returns {Promise<Object>} - Object berisi konten lengkap SOP
 * @throws {Error} - Error jika request gagal
 */
export const getPublishedSopContent = async (id) => {
  try {
    // Request GET ke endpoint public untuk konten SOP published
    const response = await publicApi.get(`/public/content/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching published SOP content:", error);

    // Handle different error types
    if (error.response?.status === 404) {
      throw new Error("SOP tidak ditemukan");
    } else if (error.response?.status === 403) {
      throw new Error("SOP belum dipublikasi");
    } else {
      throw new Error(
        error.response?.data?.message || "Gagal mengambil konten SOP"
      );
    }
  }
};

// ===============================
// PUBLIC FLOWCHART API FUNCTIONS
// ===============================

/**
 * Function untuk mengambil activities SOP yang sudah dipublikasi (akses publik)
 * @param {string|number} sop_doc_id - ID dokumen SOP
 * @returns {Promise<Array>} - Array berisi activities SOP
 * @throws {Error} - Error jika request gagal
 */
export const getPublicSopActivities = async (sop_doc_id) => {
  try {
    const response = await publicFlowchartApi.get(
      `/public/sop-activities?sop_doc_id=${sop_doc_id}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching public SOP activities:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch SOP activities"
    );
  }
};

/**
 * Function untuk mengambil responsible persons SOP yang sudah dipublikasi (akses publik)
 * @param {string|number} sop_doc_id - ID dokumen SOP
 * @returns {Promise<Array>} - Array berisi responsible persons SOP
 * @throws {Error} - Error jika request gagal
 */
export const getPublicSopResponsiblePersons = async (sop_doc_id) => {
  try {
    const response = await publicFlowchartApi.get(
      `/public/sop-responsible-person?sop_doc_id=${sop_doc_id}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching public SOP responsible persons:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch SOP responsible persons"
    );
  }
};

/**
 * Function untuk mengambil visualizations SOP yang sudah dipublikasi (akses publik)
 * @param {string|number} sop_doc_id - ID dokumen SOP
 * @returns {Promise<Array>} - Array berisi visualizations SOP
 * @throws {Error} - Error jika request gagal
 */
export const getPublicSopVisualizations = async (sop_doc_id) => {
  try {
    const response = await publicFlowchartApi.get(
      `/public/sop-visualization?sop_doc_id=${sop_doc_id}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching public SOP visualizations:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch SOP visualizations"
    );
  }
};
