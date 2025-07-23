import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

/**
 * Format ISO date to Indonesian locale
 * @param {string} dateString - ISO date (e.g., "2025-05-24T17:00:00.000Z")
 * @returns {string} Formatted date (e.g., "24 Mei 2025")
 */
export const dateFormatter = (dateString) => {
  if (!dateString) return "";
  try {
    return format(parseISO(dateString), "d MMMM yyyy", { locale: id });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString; // Return original if error
  }
};

export const dateFormatterDB = (dateString) => {
  if (!dateString) return "";
  try {
    return format(parseISO(dateString), "yyyy-MM-dd", { locale: id });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString; // Return original if error
  }
};
