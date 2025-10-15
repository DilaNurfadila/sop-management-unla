/**
 * Service: authClient
 *
 * Tanggung jawab:
 * - Bootstrap auth di frontend: axios response interceptors (auto-logout 401)
 * - Manajemen sesi: decode JWT, schedule auto-logout, session watcher (ping /auth/me)
 * - State lokal: simpan/bersihkan data user/token di storage
 * - Navigasi aman: forceLogout dengan redirect ke halaman login publik
 *
 * API utama:
 * - decodeJwt(token) -> payload|null
 * - scheduleAutoLogout(token), startSessionExpiryWatcher(), stopSessionExpiryWatcher()
 * - installAuthInterceptors()
 * - clearFrontendAuth(), forceLogout(redirectTo)
 */
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
let sessionWatchId = null;
let isLoggingOut = false; // guard to prevent repeated logout

// Determine if current path is a public (unauthenticated) route
const isPublicRoutePath = (path) => {
  try {
    if (typeof path !== "string") return false;
    // Common public auth pages
    const normalized = path.toLowerCase();
    return (
      normalized === "/" ||
      normalized.startsWith("/auth/") ||
      normalized === "/auth" ||
      normalized === "/login" ||
      normalized === "/register" ||
      normalized === "/reset-password" ||
      // public SOP viewer routes
      normalized.startsWith("/sop/public/")
    );
  } catch {
    return false;
  }
};

// Clear all local frontend auth data (sessionStorage, localStorage, and any cached data)
export const clearFrontendAuth = () => {
  try {
    // Hapus dari sessionStorage
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("userData");

    // Hapus dari localStorage juga
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userData"); // Ini yang digunakan di Login.jsx
    // notificationSettings dihapus (fitur notifikasi frontend sudah dihapus)

    // Clear semua keys yang mengandung token atau user
    Object.keys(localStorage).forEach((key) => {
      if (
        key.includes("token") ||
        key.includes("user") ||
        key.includes("auth")
      ) {
        localStorage.removeItem(key);
      }
    });

    Object.keys(sessionStorage).forEach((key) => {
      if (
        key.includes("token") ||
        key.includes("user") ||
        key.includes("auth")
      ) {
        sessionStorage.removeItem(key);
      }
    });

    return true;
  } catch (e) {
    console.error("❌ Error clearing storage:", e);
    return false;
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
  // stop session watcher
  if (sessionWatchId) {
    clearInterval(sessionWatchId);
    sessionWatchId = null;
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

// Periodically check session validity to auto-logout on expiry even when idle
export const startSessionExpiryWatcher = (intervalMs = 120000) => {
  if (sessionWatchId) return; // already started
  const ping = async () => {
    if (isLoggingOut) return;
    // Skip ping on public pages to avoid 401 noise after logout
    try {
      if (
        typeof window !== "undefined" &&
        isPublicRoutePath(window.location.pathname)
      ) {
        return;
      }
    } catch {
      // ignore
    }
    try {
      const res = await fetch(`${AUTH_API}/me`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (res.status === 401) {
        await forceLogout();
      }
    } catch (e) {
      void e; // ignore network errors; next tick will retry
    }
  };
  // first ping soon after boot to catch already-expired sessions
  setTimeout(ping, 1000);
  sessionWatchId = setInterval(ping, intervalMs);
};

export const stopSessionExpiryWatcher = () => {
  if (sessionWatchId) {
    clearInterval(sessionWatchId);
    sessionWatchId = null;
  }
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
  // Mulai watcher agar auto-logout tetap berjalan saat idle
  startSessionExpiryWatcher();
};

export default {
  decodeJwt,
  clearFrontendAuth,
  forceLogout,
  scheduleAutoLogout,
  installAuthInterceptors,
  bootstrapAuthClient,
  startSessionExpiryWatcher,
  stopSessionExpiryWatcher,
};
