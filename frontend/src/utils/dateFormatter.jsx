// Import function format dan parseISO dari date-fns untuk formatting tanggal
import { format, parseISO } from "date-fns";
// Import locale Indonesia untuk formatting dalam bahasa Indonesia
import { id } from "date-fns/locale";

/**
 * Format ISO date string ke format tanggal Indonesia
 * Mengubah format ISO date menjadi format yang mudah dibaca dalam bahasa Indonesia
 * @param {string} dateString - String tanggal ISO (e.g., "2025-05-24T17:00:00.000Z")
 * @returns {string} Tanggal yang diformat (e.g., "24 Mei 2025")
 */
export const dateFormatter = (dateString) => {
  // Validasi input - return empty string jika tidak ada input
  if (!dateString) return "";
  try {
    // Parse ISO string dan format ke "d MMMM yyyy" dengan locale Indonesia
    return format(parseISO(dateString), "d MMMM yyyy", { locale: id });
  } catch (error) {
    // Log error dan return string original jika parsing gagal
    console.error("Error formatting date:", error);
    return dateString; // Return original if error
  }
};

/**
 * Format ISO date string ke format database (YYYY-MM-DD)
 * Mengubah format ISO date menjadi format yang sesuai untuk database
 * @param {string} dateString - String tanggal ISO
 * @returns {string} Tanggal dalam format database (e.g., "2025-05-24")
 */
export const dateFormatterDB = (dateString) => {
  // Validasi input
  if (!dateString) return "";
  try {
    // Parse ISO string dan format ke "yyyy-MM-dd" untuk database
    return format(parseISO(dateString), "yyyy-MM-dd", { locale: id });
  } catch (error) {
    // Log error dan return string original jika parsing gagal
    console.error("Error formatting date:", error);
    return dateString; // Return original if error
  }
};

/**
 * Format ISO date string ke format tanggal dan waktu Indonesia
 * Mengubah format ISO date menjadi format tanggal + waktu yang mudah dibaca
 * @param {string} dateString - String tanggal ISO (e.g., "2025-05-24T17:00:00.000Z")
 * @returns {string} Tanggal dan waktu yang diformat (e.g., "24 Mei 2025, 17:00")
 */
export const formatDateTime = (dateString) => {
  // Validasi input
  if (!dateString) return "";
  try {
    // Parse ISO string dan format ke "d MMMM yyyy, HH:mm" dengan locale Indonesia
    return format(parseISO(dateString), "d MMMM yyyy, HH:mm", { locale: id });
  } catch (error) {
    // Log error dan return string original jika parsing gagal
    console.error("Error formatting date:", error);
    return dateString; // Return original if error
  }
};
