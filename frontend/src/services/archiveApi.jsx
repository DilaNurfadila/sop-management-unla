import axios from "axios";
import { installAuthInterceptors } from "./authClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Set credentials to true for cookies
axios.defaults.withCredentials = true;
installAuthInterceptors();

// Create an axios instance with default headers
const archiveApi = axios.create({
  baseURL: `${API_URL}/archive`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Get all archived documents
export const getAllArchived = async () => {
  try {
    const response = await archiveApi.get("/");
    return response.data;
  } catch (error) {
    console.error("Archive API Error:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// Get archived versions of specific document
export const getArchivedVersions = async (sopId) => {
  try {
    const response = await archiveApi.get(`/sop/${sopId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Alias untuk backward compatibility
export const getArchivedVersionsBySopId = getArchivedVersions;

// Get specific archived document
export const getArchivedById = async (archiveId) => {
  try {
    const response = await archiveApi.get(`/${archiveId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Download archived file
export const downloadArchivedFile = async (archiveId, fileName) => {
  try {
    const response = await archiveApi.get(`/${archiveId}/download`, {
      responseType: "blob",
    });

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true, message: "File downloaded successfully" };
  } catch (error) {
    console.error("Download error:", error);
    throw error.response?.data || error;
  }
};

// Restore archived document
export const restoreDocument = async (archiveId) => {
  try {
    const response = await archiveApi.post(`/${archiveId}/restore`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Delete archived document permanently
export const deleteArchived = async (archiveId) => {
  try {
    const response = await archiveApi.delete(`/${archiveId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get archive statistics
export const getArchiveStats = async () => {
  try {
    const response = await archiveApi.get("/stats");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Service untuk mengarsipkan dokumen SOP aktif
 * @param {string} sopId - ID dokumen SOP
 * @param {string} reason - Alasan pengarsipan
 * @returns {Promise<Object>} - Response dari server
 */
export const archiveSopDocument = async (sopId, reason) => {
  try {
    const response = await archiveApi.post(`/archive-sop/${sopId}`, { reason });

    return response.data;
  } catch (error) {
    console.error("❌ Error archiving document:", error);
    console.error("Error details:", error.response?.data); // Debug log
    throw error.response?.data || error;
  }
};

export default archiveApi;
