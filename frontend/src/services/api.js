import axios from "axios";

const API_URL = "http://localhost:5000/api/docs";

axios.defaults.withCredentials = true;

// Create an axios instance with default headers
const api = axios.create({
  baseURL: API_URL,
});

// Add interceptor to include token if available
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("accessToken");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

export const getDocs = async () => {
  try {
    const response = await api.get(`${API_URL}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch documents"
    );
  }
};

export const getDoc = async (id) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch document"
    );
  }
};

// export const getUserProfile = async () => {
//   try {
//     const response = await api.get(`${API_URL}/user/profile`); // Asumsikan endpoint ini
//     return response.data;
//   } catch (error) {
//     throw new Error(
//       error.response?.data?.message || "Failed to fetch user profile"
//     );
//   }
// };

// Other exports (createDoc, updateDoc, etc.) remain the same
export const createDoc = async (docData) => {
  try {
    const response = await api.post(`${API_URL}/`, docData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to create document"
    );
  }
};

export const updateDoc = async (id, docData) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, docData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to update document"
    );
  }
};

export const publishDoc = async (id) => {
  try {
    const response = await api.put(`${API_URL}/publish/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to publish document"
    );
  }
};

export const unpublishDoc = async (id) => {
  try {
    const response = await api.put(`${API_URL}/unpublish/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to unpublish document"
    );
  }
};

export const deleteDoc = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to delete document"
    );
  }
};
