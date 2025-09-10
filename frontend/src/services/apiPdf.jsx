// Import axios untuk HTTP requests
import axios from "axios";
import { installAuthInterceptors } from "./authClient";

// Buat instance axios khusus untuk operasi PDF/file dokumen SOP
const api = axios.create({
  baseURL: "http://localhost:5000/api/docs", // Base URL untuk API dokumen (DIPERBAIKI: docs -> documents)
  withCredentials: true, // Enable cookies untuk authentication
});

// Ensure global 401 handling
installAuthInterceptors();

// Tidak perlu Authorization header; gunakan cookie HTTP-only

/**
 * Function untuk mengambil semua dokumen PDF SOP
 * @returns {Promise<Array>} - Array berisi semua dokumen SOP
 * @throws {Error} - Error jika request gagal
 */
export const getDocsPdf = async () => {
  try {
    // Request GET untuk semua dokumen
    const response = await api.get("/");
    // Pastikan response berupa array, jika tidak return array kosong
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch documents"
    );
  }
};

/**
 * Function untuk mengakses/view dokumen SOP dengan logging aktivitas
 * @param {number} docId - ID dokumen SOP
 * @returns {Promise<Object>} - Data dokumen dengan URL
 * @throws {Error} - Error jika request gagal
 */
export const viewDocPdf = async (docId) => {
  try {
    const response = await api.get(`/view/${docId}`);
    return response.data;
  } catch (error) {
    console.error("Error viewing document:", error);
    throw new Error(error.response?.data?.message || "Failed to view document");
  }
};

/**
 * Function untuk mengambil hanya dokumen yang sudah dipublikasi (untuk tampilan publik)
 * @returns {Promise<Array>} - Array berisi dokumen dengan status 'published'
 * @throws {Error} - Error jika request gagal
 */
export const getPublishedDocs = async () => {
  try {
    // Ambil semua dokumen terlebih dahulu
    const allDocs = await getDocsPdf();
    // Filter hanya dokumen dengan status 'published'
    return allDocs.filter((doc) => doc.status === "published");
  } catch (error) {
    console.error("Error fetching published documents:", error);
    throw new Error("Failed to fetch published documents");
  }
};

/**
 * Function alias untuk kompatibilitas dengan code lama
 * @returns {Promise<Array>} - Sama dengan getDocsPdf()
 */
export const getUploadedFiles = async () => {
  return getDocsPdf();
};

/**
 * Function untuk mengambil satu dokumen PDF berdasarkan ID
 * @param {string|number} id - ID dokumen yang akan diambil
 * @returns {Promise<Object>} - Object dokumen SOP
 * @throws {Error} - Error jika dokumen tidak ditemukan atau request gagal
 */
export const getDocPdf = async (id) => {
  try {
    // Request GET untuk dokumen spesifik berdasarkan ID
    const response = await api.get(`/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch document"
    );
  }
};

/**
 * Function untuk upload file PDF dan membuat dokumen SOP baru
 * @param {File} file - File PDF yang akan diupload
 * @param {Object} metadata - Metadata dokumen (code, title, organization, dll)
 * @returns {Promise<Object>} - Response dari server dengan data dokumen yang dibuat
 * @throws {Error} - Error jika upload gagal
 */
// Upload file endpoint tidak digunakan; fungsi dihapus

// Update document
export const updateDocPdf = async (id, docData) => {
  try {
    const response = await api.put(`/${id}`, docData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to update document"
    );
  }
};

// Update file with optional file replacement
// Endpoint update-file tidak digunakan; fungsi dihapus

// Publish document
export const publishDocPdf = async (id) => {
  try {
    const response = await api.put(`/publish/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to publish document"
    );
  }
};

// Unpublish document
export const unpublishDocPdf = async (id) => {
  try {
    const response = await api.put(`/unpublish/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to unpublish document"
    );
  }
};

// Delete document
export const deleteUploadedFile = async (id) => {
  try {
    const response = await api.delete(`/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting document:", error);
    throw new Error(
      error.response?.data?.message || "Failed to delete document"
    );
  }
};

// Update document status
export const updateDocPdfStatus = async (id, status) => {
  try {
    const endpoint =
      status === "published" ? `/publish/${id}` : `/unpublish/${id}`;
    const response = await api.put(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error updating document status:", error);
    throw new Error(
      error.response?.data?.message || "Failed to update document status"
    );
  }
};

// Approve SOP document dan generate SOP Code
export const approveSopDocument = async (id, userId) => {
  try {
    const response = await axios.post(
      `http://localhost:5000/api/sop-documents/${id}/approve`,
      {
        user_id: userId,
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error approving SOP document:", error);
    throw new Error(
      error.response?.data?.message || "Failed to approve SOP document"
    );
  }
};

// Update version SOP (major/minor)
export const updateSopVersion = async (id, versionType) => {
  try {
    const response = await axios.patch(
      `http://localhost:5000/api/sop-documents/${id}/version`,
      {
        versionType: versionType,
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating SOP version:", error);
    throw new Error(
      error.response?.data?.message || "Failed to update SOP version"
    );
  }
};

// Create document (for compatibility)
export const createDocPdf = async (docData) => {
  try {
    const response = await api.post("/", docData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to create document"
    );
  }
};

/**
 * Function untuk mengajukan SOP untuk pemeriksaan
 * @param {number} sopId - ID SOP yang akan diajukan untuk pemeriksaan
 * @returns {Promise<Object>} - Response dari server
 * @throws {Error} - Error jika request gagal
 */
export const submitSopForReview = async (sopId) => {
  try {
    const response = await api.put(`/submit-review/${sopId}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to submit SOP for review"
    );
  }
};

/**
 * Function untuk mengambil content SOP (data form yang sudah diisi)
 * @param {number} sopId - ID SOP yang akan diambil contentnya
 * @returns {Promise<Object>} - Data content SOP
 * @throws {Error} - Error jika request gagal
 */
export const getSopContent = async (sopId) => {
  try {
    const response = await api.get(`/content/${sopId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching SOP content:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch SOP content"
    );
  }
};
