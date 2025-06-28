import { api } from "./axios";

export interface HealthStatus {
  isHealthy: boolean;
  status: 'healthy' | 'unhealthy' | 'starting' | 'timeout' | 'error';
  database?: string;
  responseTime?: number;
  error?: string;
}

export class HealthCheckService {
  private static readonly HEALTH_ENDPOINT = '/health';
  private static readonly PING_ENDPOINT = '/ping';
  private static readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private static readonly RETRY_DELAY = 2000; // 2 seconds
  private static readonly MAX_RETRIES = 3;
  private static warmUpPromise: Promise<void> | null = null;
  private static lastWarmUpTime: number = 0;

  /**
   * Check if the backend is healthy
   */
  static async checkHealth(timeoutMs: number = this.DEFAULT_TIMEOUT): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const response = await api.get(this.HEALTH_ENDPOINT, {
        timeout: timeoutMs,
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200) {
        return {
          isHealthy: true,
          status: 'healthy',
          database: response.data?.database,
          responseTime,
        };
      } else {
        return {
          isHealthy: false,
          status: 'unhealthy',
          responseTime,
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
          isHealthy: false,
          status: 'timeout',
          responseTime,
          error: 'Backend is starting up, please wait...',
        };
      }
      
      if (error.response?.status === 503) {
        return {
          isHealthy: false,
          status: 'starting',
          responseTime,
          error: 'Backend is starting up, please wait...',
        };
      }
      
      return {
        isHealthy: false,
        status: 'error',
        responseTime,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Simple ping to warm up the backend
   */
  static async ping(timeoutMs: number = 10000): Promise<boolean> {
    try {
      const response = await api.get(this.PING_ENDPOINT, {
        timeout: timeoutMs,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for the backend to become healthy with retries
   */
  static async waitForHealthy(
    maxWaitMs: number = 60000,
    onStatusUpdate?: (status: HealthStatus) => void
  ): Promise<HealthStatus> {
    const startTime = Date.now();
    let retryCount = 0;
    
    while (Date.now() - startTime < maxWaitMs && retryCount < this.MAX_RETRIES) {
      const status = await this.checkHealth(10000); // 10 second timeout per check
      
      if (onStatusUpdate) {
        onStatusUpdate(status);
      }
      
      if (status.isHealthy) {
        return status;
      }
      
      // If it's a hard error (not starting/timeout), don't retry
      if (status.status === 'error' && !status.error?.includes('starting')) {
        break;
      }
      
      retryCount++;
      
      // Wait before retrying
      if (retryCount < this.MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
    }
    
    // Final check
    return await this.checkHealth(5000);
  }

  /**
   * Warm up the backend by making a ping request
   * This should be called on app startup to trigger backend cold start
   * Prevents multiple concurrent warm-up calls
   */
  static async warmUp(): Promise<void> {
    const now = Date.now();

    // Prevent multiple warm-up calls within 5 minutes
    if (now - this.lastWarmUpTime < 300000) {
      return;
    }

    // If already warming up, return the existing promise
    if (this.warmUpPromise) {
      return this.warmUpPromise;
    }

    this.lastWarmUpTime = now;
    this.warmUpPromise = this.ping(5000)
      .then(() => {
        // Warm-up successful
      })
      .catch(() => {
        // Ignore errors, this is just to warm up
      })
      .finally(() => {
        this.warmUpPromise = null;
      });

    return this.warmUpPromise;
  }
}
