import axios from "axios";
import { GuestSessionManager } from "./guest";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second default timeout
});

// Add request interceptor to automatically include guest session headers
api.interceptors.request.use((config) => {
  // Check for guest session if no authorization header is present
  if (!config.headers.Authorization && !config.headers["X-Guest-Session-ID"]) {
    const guestSessionId = GuestSessionManager.getSessionId();
    if (guestSessionId) {
      config.headers["X-Guest-Session-ID"] = guestSessionId;
    }
  }
  return config;
});

// Add response interceptor to handle backend startup errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Add helpful error messages for common backend startup issues
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      error.isBackendStarting = true;
      error.userMessage = 'Backend is starting up, please wait...';
    } else if (error.response?.status === 503) {
      error.isBackendStarting = true;
      error.userMessage = 'Backend is starting up, please wait...';
    } else if (!error.response && error.code === 'ERR_NETWORK') {
      error.isBackendStarting = true;
      error.userMessage = 'Cannot connect to backend. It may be starting up...';
    }

    return Promise.reject(error);
  }
);

export const getAuthHeaders = (token: string) => {
  if (!token) {
    throw new Error("Token is required for authentication");
  }
  return { Authorization: `Bearer ${token}` };
};

export const getGuestHeaders = (sessionId?: string) => {
  const guestSessionId = sessionId ?? GuestSessionManager.getSessionId();
  if (!guestSessionId) {
    throw new Error("Guest session ID is required");
  }
  return { "X-Guest-Session-ID": guestSessionId };
};

export const getAuthOrGuestHeaders = (token?: string, guestSessionId?: string) => {
  if (token) {
    return getAuthHeaders(token);
  }
  return getGuestHeaders(guestSessionId);
};
