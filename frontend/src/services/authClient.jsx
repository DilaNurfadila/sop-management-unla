// Centralized auth helpers: token decoding, auto-logout scheduling, and axios interceptors
import axios from "axios";

// API base for auth endpoints
const AUTH_API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/auth`
  : "http://localhost:5000/api/auth";

// Decode JWT payload safely
export const decodeJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    // mark as used to satisfy linters, ignore error
    void e;
    return null;
  }
};

let logoutTimerId = null;
let isLoggingOut = false; // guard to prevent repeated logout

// Clear all local frontend auth data (sessionStorage only, token in HTTP-only cookie)
export const clearFrontendAuth = () => {
  try {
    // Hanya hapus dari sessionStorage karena itu yang digunakan untuk user data
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
  } catch (e) {
    void e;
  }
};

// Trigger backend logout (best-effort), then clear local state and redirect
export const forceLogout = async (redirectTo = "/auth/login") => {
  if (isLoggingOut) return; // already in progress
  isLoggingOut = true;
  // cancel any pending timer
  if (logoutTimerId) {
    clearTimeout(logoutTimerId);
    logoutTimerId = null;
  }

  // Use fetch to avoid axios interceptors and prevent 401 loops
  try {
    await fetch(`${AUTH_API}/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  } catch (e) {
    void e; // ignore network errors
  }

  clearFrontendAuth();

  // redirect user away from protected routes
  try {
    if (window.location.pathname !== redirectTo) {
      window.location.replace(redirectTo);
    }
  } catch (e) {
    void e;
  }
};

// Schedule auto logout based on JWT exp claim (in seconds since epoch)
export const scheduleAutoLogout = (token) => {
  if (!token) return;
  const payload = decodeJwt(token);
  if (!payload?.exp) return;

  const msUntilExpiry = payload.exp * 1000 - Date.now();
  if (msUntilExpiry <= 0) {
    // already expired
    forceLogout();
    return;
  }

  // Reset existing timer
  if (logoutTimerId) clearTimeout(logoutTimerId);
  logoutTimerId = setTimeout(() => {
    forceLogout();
  }, msUntilExpiry + 500); // small buffer
};

// Install a single global axios response interceptor to auto-logout on 401 from protected endpoints
let interceptorInstalled = false;
export const installAuthInterceptors = () => {
  if (interceptorInstalled) return;
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error?.response?.status;
      const url = error?.config?.url || "";
      const skip = error?.config?.__skipAuthInterceptor === true;
      const isLogoutCall =
        typeof url === "string" && url.includes("/auth/logout");

      // Re-enable auto-logout setelah debugging
      if (status === 401 && !skip && !isLogoutCall && !isLoggingOut) {
        console.warn("401 error detected, performing auto-logout:", url);
        await forceLogout();
      }
      return Promise.reject(error);
    }
  );
  interceptorInstalled = true;
};

// Bootstrap on app load: tidak perlu cek token karena disimpan di HTTP-only cookie
export const bootstrapAuthClient = () => {
  // Token akan dicek otomatis oleh backend melalui cookie
  // Hanya perlu install interceptors
  installAuthInterceptors();
};

export default {
  decodeJwt,
  clearFrontendAuth,
  forceLogout,
  scheduleAutoLogout,
  installAuthInterceptors,
  bootstrapAuthClient,
};
