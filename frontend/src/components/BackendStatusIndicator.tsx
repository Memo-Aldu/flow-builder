"use client";

import { HealthStatus } from "@/lib/api/health";
import { AlertCircle, CheckCircle, Clock, Loader2, Server, Wifi } from "lucide-react";
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

interface BackendStatusIndicatorProps {
  status: HealthStatus | null;
  isChecking: boolean;
  onRetry?: () => void;
  showProgress?: boolean;
  compact?: boolean;
}

export function BackendStatusIndicator({
  status,
  isChecking,
  onRetry,
  showProgress = false,
  compact = false,
}: BackendStatusIndicatorProps) {
  if (!status && !isChecking) {
    return null;
  }

  const getStatusIcon = () => {
    if (isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    switch (status?.status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'starting':
      case 'timeout':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Server className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    if (isChecking) {
      return "Checking backend status...";
    }

    switch (status?.status) {
      case 'healthy':
        return `Backend is ready${status.responseTime ? ` (${status.responseTime}ms)` : ''}`;
      case 'starting':
        return "Backend is starting up, please wait...";
      case 'timeout':
        return "Backend is taking longer than usual to respond...";
      case 'unhealthy':
        return "Backend is experiencing issues";
      case 'error':
        return status.error ?? "Failed to connect to backend";
      default:
        return "Unknown status";
    }
  };

  const getVariant = () => {
    if (isChecking) return "default";
    
    switch (status?.status) {
      case 'healthy':
        return "default";
      case 'starting':
      case 'timeout':
        return "default";
      case 'unhealthy':
      case 'error':
        return "destructive";
      default:
        return "default";
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {getStatusIcon()}
        <span className="text-muted-foreground">{getStatusMessage()}</span>
      </div>
    );
  }

  return (
    <Alert variant={getVariant()}>
      {getStatusIcon()}
      <AlertTitle className="flex items-center gap-2">
        <Wifi className="h-4 w-4" />
        Backend Status
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          <p>{getStatusMessage()}</p>
          
          {showProgress && (status?.status === 'starting' || status?.status === 'timeout') && (
            <div className="space-y-1">
              <Progress value={undefined} className="w-full" />
              <p className="text-xs text-muted-foreground">
                This may take up to 60 seconds for the first request...
              </p>
            </div>
          )}
          
          {status?.responseTime && (
            <p className="text-xs text-muted-foreground">
              Response time: {status.responseTime}ms
            </p>
          )}
          
          {onRetry && (status?.status === 'error' || status?.status === 'unhealthy') && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              disabled={isChecking}
              className="mt-2"
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Checking...
                </>
              ) : (
                'Retry'
              )}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
