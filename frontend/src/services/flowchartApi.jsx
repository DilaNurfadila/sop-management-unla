import axios from "axios";
import { installAuthInterceptors } from "./authClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;
const flowchartApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
installAuthInterceptors(flowchartApi);

// SOP Documents
export const getSopDocuments = async () => {
  try {
    const response = await flowchartApi.get("/docs");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal mengambil data SOP Documents"
    );
  }
};

export const getSopDocumentById = async (sopId) => {
  try {
    const response = await flowchartApi.get(`/docs/${sopId}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal mengambil data SOP Document"
    );
  }
};

export const createSopDocument = async (sopData) => {
  try {
    const response = await flowchartApi.post("/docs", sopData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal membuat SOP Document baru"
    );
  }
};

export const updateSopDocument = async (sopId, sopData) => {
  try {
    const response = await flowchartApi.put(`/docs/${sopId}`, sopData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal mengupdate SOP Document"
    );
  }
};

export const deleteSopDocument = async (sopId) => {
  try {
    const response = await flowchartApi.delete(`/docs/${sopId}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal menghapus SOP Document"
    );
  }
};

// SOP Activities
export const getSopActivities = async (sopDocId) => {
  try {
    const response = await flowchartApi.get(
      `/sop-activities?sop_doc_id=${sopDocId}`
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal mengambil data SOP Activities"
    );
  }
};

export const createActivity = async (activityData) => {
  try {
    const response = await flowchartApi.post("/sop-activities", activityData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal membuat Activity baru"
    );
  }
};

export const updateActivity = async (activityId, activityData) => {
  try {
    const response = await flowchartApi.put(
      `/sop-activities/${activityId}`,
      activityData
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal mengupdate Activity"
    );
  }
};

export const deleteActivity = async (activityId) => {
  try {
    const response = await flowchartApi.delete(`/sop-activities/${activityId}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal menghapus Activity"
    );
  }
};

// SOP Responsible Persons
export const getSopResponsiblePersons = async (sopDocId) => {
  try {
    const response = await flowchartApi.get(
      `/sop-responsible-person?sop_doc_id=${sopDocId}`
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        "Gagal mengambil data Responsible Persons"
    );
  }
};

export const createResponsiblePerson = async (personData) => {
  try {
    const response = await flowchartApi.post(
      "/sop-responsible-person",
      personData
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal membuat Responsible Person baru"
    );
  }
};

export const updateResponsiblePerson = async (personId, personData) => {
  try {
    const response = await flowchartApi.put(
      `/sop-responsible-person/${personId}`,
      personData
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal mengupdate Responsible Person"
    );
  }
};

export const deleteResponsiblePerson = async (personId) => {
  try {
    const response = await flowchartApi.delete(
      `/sop-responsible-person/${personId}`
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal menghapus Responsible Person"
    );
  }
};

// SOP Visualization
export const getSopVisualizations = async (sopDocId = null) => {
  try {
    let url = "/sop-visualization";
    if (sopDocId) {
      url += `?sop_doc_id=${sopDocId}`;
    }
    const response = await flowchartApi.get(url);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal mengambil data Visualization"
    );
  }
};

export const saveSop = async (sopData) => {
  try {
    const response = await flowchartApi.post("/sop-visualization", {
      item_id: sopData.item_id,
      col_id: sopData.col_id,
      status: sopData.status,
      return_to_activity_id: sopData.return_to_activity_id,
      kelengkapan: sopData.kelengkapan,
      waktu: sopData.waktu,
      output: sopData.output,
      keterangan: sopData.keterangan,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal menyimpan data visualization"
    );
  }
};

export const updateSop = async (key, sopData) => {
  try {
    const response = await flowchartApi.put(`/sop-visualization/${key}`, {
      status: sopData.status,
      return_to_activity_id: sopData.return_to_activity_id,
      kelengkapan: sopData.kelengkapan,
      waktu: sopData.waktu,
      output: sopData.output,
      keterangan: sopData.keterangan,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal mengupdate data visualization"
    );
  }
};

export const deleteSop = async (key) => {
  try {
    const response = await flowchartApi.delete(`/sop-visualization/${key}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal menghapus data visualization"
    );
  }
};

export const saveBulkVisualizations = async (visualizations, sopDocId) => {
  try {
    const response = await flowchartApi.post("/sop-visualization/bulk", {
      visualizations,
      sop_doc_id: sopDocId,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal menyimpan data visualization"
    );
  }
};

export const clearAllVisualizations = async (sopDocId) => {
  try {
    const response = await flowchartApi.delete(
      `/sop-visualization/clear/${sopDocId}`
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        "Gagal menghapus semua data visualization"
    );
  }
};

// Users
export const getAvailableUsers = async () => {
  try {
    const response = await flowchartApi.get("/users");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Gagal mengambil data users"
    );
  }
};

// Alias functions untuk kompatibilitas
export const getSopNames = getSopDocuments;
export const createSop = createSopDocument;
export const deleteSopDoc = deleteSopDocument;

export const getItems = getSopActivities;
export const createItem = createActivity;
export const updateItem = updateActivity;
export const deleteItem = deleteActivity;

export const getCols = getSopResponsiblePersons;
export const createCol = createResponsiblePerson;
export const updateCol = updateResponsiblePerson;
export const deleteCol = deleteResponsiblePerson;

export const getSops = getSopVisualizations;
export const saveSopsBulk = saveBulkVisualizations;
export const clearAllSops = clearAllVisualizations;

// Default export
export default {
  // SOP Documents
  getSopDocuments,
  getSopDocumentById,
  createSopDocument,
  updateSopDocument,
  deleteSopDocument,

  // SOP Activities
  getSopActivities,
  createActivity,
  updateActivity,
  deleteActivity,

  // SOP Responsible Persons
  getSopResponsiblePersons,
  createResponsiblePerson,
  updateResponsiblePerson,
  deleteResponsiblePerson,

  // SOP Visualization
  getSopVisualizations,
  saveSop,
  updateSop,
  deleteSop,
  saveBulkVisualizations,
  clearAllVisualizations,

  // Users
  getAvailableUsers,

  // Alias untuk kompatibilitas
  getSopNames: getSopDocuments,
  createSop: createSopDocument,
  // deleteSop: deleteSopDocument, // Removed duplicate key

  getItems: getSopActivities,
  createItem: createActivity,
  updateItem: updateActivity,
  deleteItem: deleteActivity,

  getCols: getSopResponsiblePersons,
  createCol: createResponsiblePerson,
  updateCol: updateResponsiblePerson,
  deleteCol: deleteResponsiblePerson,

  getSops: getSopVisualizations,
  // updateSop, // Removed duplicate key
  // deleteSop, // Removed duplicate key
  saveBulkSops: saveBulkVisualizations,
  clearAllSops: clearAllVisualizations,
};
