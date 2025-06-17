import { api, getAuthOrGuestHeaders } from "./axios";

/**
 * Client-side unified API utility
 * Uses the axios interceptor for automatic authentication
 */
export class UnifiedClientAPI {
  /**
   * Make a GET request with automatic authentication
   */
  static async get<T>(url: string, params?: Record<string, any>, token?: string): Promise<T> {
    const headers = token ? getAuthOrGuestHeaders(token) : {};
    const response = await api.get<T>(url, { headers, params });
    return response.data;
  }

  /**
   * Make a POST request with automatic authentication
   */
  static async post<T>(url: string, data?: any, token?: string): Promise<T> {
    const headers = token ? getAuthOrGuestHeaders(token) : {};
    const response = await api.post<T>(url, data, { headers });
    return response.data;
  }

  /**
   * Make a PUT request with automatic authentication
   */
  static async put<T>(url: string, data?: any, token?: string): Promise<T> {
    const headers = token ? getAuthOrGuestHeaders(token) : {};
    const response = await api.put<T>(url, data, { headers });
    return response.data;
  }

  /**
   * Make a PATCH request with automatic authentication
   */
  static async patch<T>(url: string, data?: any, params?: Record<string, any>, token?: string): Promise<T> {
    const headers = token ? getAuthOrGuestHeaders(token) : {};
    const response = await api.patch<T>(url, data, { headers, params });
    return response.data;
  }

  /**
   * Make a DELETE request with automatic authentication
   */
  static async delete<T>(url: string, token?: string): Promise<T> {
    const headers = token ? getAuthOrGuestHeaders(token) : {};
    const response = await api.delete<T>(url, { headers });
    return response.data;
  }
}


