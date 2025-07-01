"use client";

import { useUnifiedAuth } from "@/contexts/AuthContext";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface ClientAuthFallbackProps {
  children: React.ReactNode;
  serverUser: any;
}

/**
 * Client-side authentication fallback component
 * Used when server-side authentication fails but client-side might succeed
 * This is particularly useful for guest users in production environments
 */
export function ClientAuthFallback({ children, serverUser }: ClientAuthFallbackProps) {
  const { user: clientUser, isLoading: clientLoading, isAuthenticated } = useUnifiedAuth();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // If server-side auth failed but we have a guest session cookie, show fallback
    if (!serverUser && typeof window !== "undefined") {
      const hasGuestCookie = document.cookie.includes("guest_session_id=");
      if (hasGuestCookie) {
        setShowFallback(true);
      }
    }
  }, [serverUser]);

  // If server-side auth succeeded, render normally
  if (serverUser) {
    return <>{children}</>;
  }

  // If no fallback needed, show the login prompt
  if (!showFallback) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertTitle>Please log in to access the dashboard.</AlertTitle>
      </Alert>
    );
  }

  // Show loading while client-side auth is working
  if (clientLoading) {
    return (
      <div className="flex flex-1 flex-col h-full">
        <div className="flex justify-between">
          <h1 className='text-3xl font-bold'>Loading...</h1>
          <Skeleton className="w-[180px] h-[40px]" />
        </div>
        <div className="h-full py-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
          </div>
          <Skeleton className="w-full h-[300px]" />
          <Skeleton className="w-full h-[300px]" />
        </div>
      </div>
    );
  }

  // If client-side auth succeeded, render the content
  if (isAuthenticated && clientUser) {
    return <>{children}</>;
  }

  // If all auth methods failed, show login prompt
  return (
    <Alert variant="destructive">
      <AlertCircle className="w-4 h-4" />
      <AlertTitle>Please log in to access the dashboard.</AlertTitle>
    </Alert>
  );
}
