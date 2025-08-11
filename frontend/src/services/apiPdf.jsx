import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api/docs",
  withCredentials: true,
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Get all documents
export const getDocsPdf = async () => {
  try {
    const response = await api.get("/");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch documents"
    );
  }
};

// Get published documents only (for public display)
export const getPublishedDocs = async () => {
  try {
    const allDocs = await getDocsPdf();
    return allDocs.filter((doc) => doc.status === "published");
  } catch (error) {
    console.error("Error fetching published documents:", error);
    throw new Error("Failed to fetch published documents");
  }
};

// Alternative name for compatibility
export const getUploadedFiles = async () => {
  return getDocsPdf();
};

// Get single document by ID
export const getDocPdf = async (id) => {
  try {
    const response = await api.get(`/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch document"
    );
  }
};

// Upload file and create document
export const uploadFile = async (file, metadata) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("code", metadata.code);
    formData.append("title", metadata.title);
    formData.append("organization", metadata.organization || "");
    formData.append("effective_date", metadata.effective_date || "");
    formData.append("version", metadata.version || "");

    const response = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Upload error:", error);
    throw new Error(
      error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to upload file"
    );
  }
};

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
export const updateFile = async (id, file, metadata) => {
  try {
    const formData = new FormData();

    if (file) {
      formData.append("file", file);
    }

    formData.append("code", metadata.code);
    formData.append("title", metadata.title);
    formData.append("organization", metadata.organization || "");
    formData.append("effective_date", metadata.sop_applicable || "");
    formData.append("version", metadata.version || "");

    const response = await api.put(`/update-file/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Update error:", error);
    throw new Error(
      error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to update file"
    );
  }
};

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
