import axios from "axios";

const API_URL = "http://localhost:5000/api/users";

export const getUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch users");
  }
};

export const getUser = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch user");
  }
};

export const getUserByEmail = async (email) => {
  try {
    const response = await axios.get(`${API_URL}/${email}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch user");
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
// export const createDoc = async (docData) => {
//   try {
//     const response = await api.post(`${API_URL}/`, docData);
//     return response.data;
//   } catch (error) {
//     throw new Error(
//       error.response?.data?.message || "Failed to create document"
//     );
//   }
// };

// export const updateDoc = async (id, docData) => {
//   try {
//     const response = await api.put(`${API_URL}/${id}`, docData);
//     return response.data;
//   } catch (error) {
//     throw new Error(
//       error.response?.data?.message || "Failed to update document"
//     );
//   }
// };

// export const deleteDoc = async (id) => {
//   try {
//     const response = await api.delete(`${API_URL}/${id}`);
//     return response.data;
//   } catch (error) {
//     throw new Error(
//       error.response?.data?.message || "Failed to delete document"
//     );
//   }
// };
