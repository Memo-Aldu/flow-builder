"use client";

import { HealthCheckService, HealthStatus } from "@/lib/api/health";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseBackendHealthOptions {
  autoCheck?: boolean;
  checkInterval?: number;
  onStatusChange?: (status: HealthStatus) => void;
}

interface UseBackendHealthReturn {
  status: HealthStatus | null;
  isChecking: boolean;
  checkHealth: () => Promise<void>;
  waitForHealthy: () => Promise<void>;
  warmUp: () => Promise<void>;
}

export function useBackendHealth(options: UseBackendHealthOptions = {}): UseBackendHealthReturn {
  const { autoCheck = false, checkInterval = 30000, onStatusChange } = options;

  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const lastCheckTime = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkHealth = useCallback(async () => {
    const now = Date.now();

    // Prevent excessive calls - minimum 5 seconds between checks
    if (now - lastCheckTime.current < 5000) {
      return;
    }

    lastCheckTime.current = now;
    setIsChecking(true);

    try {
      const healthStatus = await HealthCheckService.checkHealth();
      setStatus(healthStatus);
      if (onStatusChange) {
        onStatusChange(healthStatus);
      }
    } catch (error) {
      const errorStatus: HealthStatus = {
        isHealthy: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      setStatus(errorStatus);
      if (onStatusChange) {
        onStatusChange(errorStatus);
      }
    } finally {
      setIsChecking(false);
    }
  }, [onStatusChange]);

  const waitForHealthy = useCallback(async () => {
    setIsChecking(true);
    try {
      const healthStatus = await HealthCheckService.waitForHealthy(60000, (status) => {
        setStatus(status);
        if (onStatusChange) {
          onStatusChange(status);
        }
      });
      setStatus(healthStatus);
    } finally {
      setIsChecking(false);
    }
  }, [onStatusChange]);

  const warmUp = useCallback(async () => {
    await HealthCheckService.warmUp();
  }, []);

  // Auto-check on mount and interval
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (autoCheck) {
      // Initial check
      checkHealth();

      // Set up interval for periodic checks
      if (checkInterval > 0) {
        intervalRef.current = setInterval(() => {
          checkHealth();
        }, checkInterval);
      }
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoCheck, checkInterval]);
  return {
    status,
    isChecking,
    checkHealth,
    waitForHealthy,
    warmUp,
  };
}
