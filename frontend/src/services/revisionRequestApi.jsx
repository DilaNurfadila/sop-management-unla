import api from "./api";

// Service for Revision Request operations
const revisionRequestApi = {
  // Submit revision request for a SOP document
  submitRevisionRequest: async (sopId, reason) => {
    try {
      const response = await api.post(`/revision-requests/${sopId}/request`, {
        request_reason: reason,
      });

      return response.data;
    } catch (error) {
      console.error("Error submitting revision request:", error);
      throw error;
    }
  },

  // Get pending revision requests (admin only)
  getPendingRevisionRequests: async () => {
    try {
      const response = await api.get("/revision-requests/pending");
      return response.data.data || []; // Extract the actual data array, fallback to empty array
    } catch (error) {
      console.error("Error fetching pending revision requests:", error);
      throw error;
    }
  },

  // Get revision request history for a specific SOP
  getRevisionRequestHistory: async (sopId) => {
    try {
      const response = await api.get(`/revision-requests/${sopId}/history`);
      return response.data.data || []; // Extract the actual data array, fallback to empty array
    } catch (error) {
      console.error("Error fetching revision request history:", error);
      throw error;
    }
  },

  // Approve revision request (admin only)
  approveRevisionRequest: async (requestId, adminNotes = "") => {
    try {
      const response = await api.put(
        `/revision-requests/${requestId}/approve`,
        {
          admin_notes: adminNotes,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error approving revision request:", error);
      throw error;
    }
  },

  // Reject revision request (admin only)
  rejectRevisionRequest: async (requestId, adminNotes = "") => {
    try {
      const response = await api.put(`/revision-requests/${requestId}/reject`, {
        admin_notes: adminNotes,
      });

      return response.data;
    } catch (error) {
      console.error("Error rejecting revision request:", error);
      throw error;
    }
  },
};

export default revisionRequestApi;
