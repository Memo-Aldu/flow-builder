import { getUnifiedAuthHeaders } from "@/lib/auth/unified-auth";
import { api } from "./axios";

/**
 * Unified API utility for server-side components ONLY
 * Automatically handles authentication for both Clerk and guest users
 * This file should NEVER be imported in client components
 */
export class UnifiedServerAPI {
  /**
   * Make a GET request with automatic authentication
   */
  static async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const headers = await getUnifiedAuthHeaders();

    // In serverless environments, add a timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await api.get<T>(url, {
        headers,
        params,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response.data;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`Server API GET request failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Make a POST request with automatic authentication
   */
  static async post<T>(url: string, data?: any): Promise<T> {
    const headers = await getUnifiedAuthHeaders();
    const response = await api.post<T>(url, data, { headers });
    return response.data;
  }

  /**
   * Make a PUT request with automatic authentication
   */
  static async put<T>(url: string, data?: any): Promise<T> {
    const headers = await getUnifiedAuthHeaders();
    const response = await api.put<T>(url, data, { headers });
    return response.data;
  }

  /**
   * Make a PATCH request with automatic authentication
   */
  static async patch<T>(url: string, data?: any, params?: Record<string, any>): Promise<T> {
    const headers = await getUnifiedAuthHeaders();
    const response = await api.patch<T>(url, data, { headers, params } );
    return response.data;
  }

  /**
   * Make a DELETE request with automatic authentication
   */
  static async delete<T>(url: string): Promise<T> {
    const headers = await getUnifiedAuthHeaders();
    const response = await api.delete<T>(url, { headers });
    return response.data;
  }
}

/**
 * Server-side unified API functions for common operations
 * These functions should ONLY be used in server components
 */

// Credentials
export async function getServerCredentials(
  page: number = 1,
  limit: number = 10,
  sort: string = "created_at",
  order: "asc" | "desc" = "desc"
): Promise<any[]> {
  return UnifiedServerAPI.get("/api/v1/credentials", {
    page,
    limit,
    sort,
    order,
  });
}

// Balance
export async function getServerUserBalance() {
  return UnifiedServerAPI.get("/api/v1/balances");
}

// Workflows
export async function getServerWorkflows(
  page: number = 1,
  limit: number = 10,
  sort: string = "created_at",
  order: "asc" | "desc" = "desc"
): Promise<any[]> {
  return UnifiedServerAPI.get("/api/v1/workflows", {
    page,
    limit,
    sort,
    order,
  });
}

// Current User
export async function getServerCurrentUser() {
  return UnifiedServerAPI.get("/api/v1/users/current");
}

// Executions
export async function getServerExecutions(
  page: number = 1,
  limit: number = 10,
  sort: string = "created_at",
  order: "asc" | "desc" = "desc"
) {
  return UnifiedServerAPI.get("/api/v1/executions", {
    page,
    limit,
    sort,
    order,
  });
}

// Execution Stats
export async function getServerExecutionStats(
  startDate: string,
  endDate: string
): Promise<any> {
  return UnifiedServerAPI.get("/api/v1/executions/stats", {
    start_date: startDate,
    end_date: endDate,
  });
}

// Purchases
export async function getServerPurchases(
  page: number = 1,
  limit: number = 10
) {
  return UnifiedServerAPI.get("/api/v1/purchases", {
    page,
    limit,
  });
}
