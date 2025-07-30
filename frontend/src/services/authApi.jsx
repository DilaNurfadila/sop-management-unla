import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

axios.defaults.withCredentials = true;

// Update all API calls to use authAxios instead of axios
export const requestOtp = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/request-otp`, { email });
    return response.data;
  } catch (error) {
    return {
      error: true,
      status: error.response?.status,
      message: error.response?.data?.message || "Failed to request OTP",
    };
  }
};

export const verifyOtp = async (email, access_code) => {
  try {
    const response = await axios.post(`${API_URL}/verify-otp`, {
      email,
      access_code,
    });
    return response.data;
  } catch (error) {
    return {
      error: true,
      status: error.response?.status,
      message: error.response?.data?.message || "Failed to verify otp",
    };
  }
};

export const register = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      data,
    });
    return response.data;
  } catch (error) {
    return {
      error: true,
      status: error.response?.status,
      message: error.response?.data?.message || "Failed to register",
    };
  }
};

export const logout = async () => {
  try {
    const response = await axios.post(`${API_URL}/logout`);
    return response.data;
  } catch (error) {
    return {
      error: true,
      status: error.response?.status,
      message: error.response?.data?.message || "Failed to logout",
    };
  }
};
