import axios from "axios";

// Create a public API instance (no authentication required)
const publicApi = axios.create({
  baseURL: "http://localhost:5000/api/docs",
  withCredentials: false, // No credentials needed for public endpoints
});

// Get published documents (public access)
export const getPublishedDocs = async () => {
  try {
    const response = await publicApi.get("/public/published");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching published documents:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch published documents"
    );
  }
};

// Get published document by ID (public access)
export const getPublishedDoc = async (id) => {
  try {
    const allPublished = await getPublishedDocs();
    return allPublished.find((doc) => doc.id === parseInt(id));
  } catch (error) {
    console.error("Error fetching published document:", error);
    throw new Error("Failed to fetch published document");
  }
};
