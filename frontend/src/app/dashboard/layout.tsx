"use client";

import { BackendStatusIndicator } from '@/components/BackendStatusIndicator';
import { BreadcrumbHeader } from '@/components/BreadcrumbHeader';
import { GuestBanner, GuestModeIndicator } from '@/components/GuestBanner';
import DesktopSidebar from '@/components/Sidebar';
import { ModeToggle } from '@/components/ThemeToggle';
import { Separator } from '@/components/ui/separator';
import { useUnifiedAuth } from '@/contexts/AuthContext';
import { useBackendHealth } from '@/hooks/useBackendHealth';
import { useUserBalance } from '@/hooks/useUserBalance';
import { SignedIn, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, error } = useUnifiedAuth();
  const { balance } = useUserBalance();
  const { status: backendStatus, isChecking: isCheckingBackend, checkHealth } = useBackendHealth({
    autoCheck: isAuthenticated && !isLoading,
    checkInterval: 30000, // Check every 30 seconds
  });
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated or if there's an auth error (expired session, etc.)
    if (!isLoading && (!isAuthenticated || error)) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, error, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Show backend status if backend is not healthy
  if (backendStatus && !backendStatus.isHealthy && (backendStatus.status === 'starting' || backendStatus.status === 'timeout')) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <div className="max-w-md w-full">
          <BackendStatusIndicator
            status={backendStatus}
            isChecking={isCheckingBackend}
            onRetry={checkHealth}
            showProgress={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-screen'>
        <DesktopSidebar />
        <div className='flex flex-col flex-1 min-h-screen'>
            <header className='flex items-center justify-between px-6 py-4 h-[50px] container'>
                <BreadcrumbHeader />
                <div className='gap-2 flex items-center'>
                    {/* Show compact backend status if there are issues */}
                    {backendStatus && !backendStatus.isHealthy && backendStatus.status !== 'starting' && backendStatus.status !== 'timeout' && (
                        <BackendStatusIndicator
                            status={backendStatus}
                            isChecking={isCheckingBackend}
                            onRetry={checkHealth}
                            compact={true}
                        />
                    )}
                    {user?.isGuest && (
                        <GuestModeIndicator
                            credits={balance}
                            compact={true}
                        />
                    )}
                    <ModeToggle />
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                </div>
            </header>
            <Separator />

            {/* Guest Banner */}
            {user?.isGuest && balance !== undefined && (
                <div className="px-6 py-2">
                    <GuestBanner credits={balance} />
                </div>
            )}

            <div className='overflow-auto'>
                <div className='flex-1 container py-4 text-accent-foreground'>
                    {children}
                </div>
            </div>
        </div>
    </div>
  )
}
