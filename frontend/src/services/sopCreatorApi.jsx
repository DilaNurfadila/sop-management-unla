// API service untuk SOP Creator Assignment features
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/sop-creator";

// Configure axios untuk menggunakan cookies
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Mengambil daftar pengguna dalam unit yang sama dengan admin
 * @returns {Promise} Response dengan daftar user dalam unit
 */
export const getUsersByAdminUnit = async () => {
  try {
    const response = await apiClient.get("/users");
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching users by admin unit:", error);
    throw error;
  }
};

/**
 * Menugaskan pengguna sebagai creator SOP
 * @param {Object} assignmentData - Data penugasan
 * @param {number} assignmentData.assigned_to - ID user yang ditugaskan
 * @param {string} assignmentData.notes - Catatan tugas (wajib)
 * @param {string} assignmentData.due_date - Tanggal deadline (YYYY-MM-DD, opsional)
 * @returns {Promise} Response dengan data penugasan yang dibuat
 */
export const assignSopCreator = async (assignmentData) => {
  try {
    const response = await apiClient.post("/assign", assignmentData);
    return response.data;
  } catch (error) {
    console.error("❌ Error assigning SOP creator:", error);
    throw error;
  }
};

/**
 * Mengambil daftar penugasan yang dibuat oleh admin yang login
 * @returns {Promise} Response dengan daftar penugasan yang dibuat
 */
export const getAssignmentsByAdmin = async () => {
  try {
    const response = await apiClient.get("/assignments/created");
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching assignments by admin:", error);
    throw error;
  }
};

/**
 * Mengambil daftar penugasan untuk user yang login
 * @returns {Promise} Response dengan daftar penugasan untuk user
 */
export const getAssignmentsForUser = async () => {
  try {
    const response = await apiClient.get("/assignments/mine");
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching user assignments:", error);
    throw error;
  }
};

/**
 * Mengupdate status penugasan
 * @param {number} assignmentId - ID penugasan
 * @param {Object} statusData - Data status baru
 * @param {string} statusData.status - Status baru (pending|accepted|rejected|in_progress|completed)
 * @param {string} statusData.response - Response text (opsional)
 * @returns {Promise} Response konfirmasi update
 */
export const updateAssignmentStatus = async (assignmentId, statusData) => {
  try {
    const response = await apiClient.put(
      `/assignments/${assignmentId}/status`,
      statusData
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error updating assignment status:", error);
    throw error;
  }
};

/**
 * Menghapus penugasan (hanya oleh admin yang membuat)
 * @param {number} assignmentId - ID penugasan yang akan dihapus
 * @returns {Promise} Response konfirmasi penghapusan
 */
export const deleteAssignment = async (assignmentId) => {
  try {
    const response = await apiClient.delete(`/assignments/${assignmentId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error deleting assignment:", error);
    throw error;
  }
};

/**
 * Mengambil daftar SOP yang sudah disahkan berdasarkan unit kerja admin
 * @returns {Promise} Response dengan daftar SOP yang sudah approved dari unit yang sama
 */
export const getApprovedSopsByAdminUnit = async () => {
  try {
    const response = await apiClient.get("/approved-sops");
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching approved SOPs by admin unit:", error);
    throw error;
  }
};

// Export semua fungsi
export default {
  getUsersByAdminUnit,
  assignSopCreator,
  getAssignmentsByAdmin,
  getAssignmentsForUser,
  updateAssignmentStatus,
  deleteAssignment,
  getApprovedSopsByAdminUnit,
};
