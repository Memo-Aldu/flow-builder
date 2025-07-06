"use client";

import { Logo } from '@/components/Logo';
import { ModeToggle } from '@/components/ThemeToggle';
import { Separator } from '@/components/ui/separator';
import { useUnifiedAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

const layout = ({ children }: { children: React.ReactNode }) => {
  const { isLoading, isAuthenticated, error } = useUnifiedAuth();
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
  if (!isAuthenticated || error) {
    return null;
  }

  return (
    <div className='flex flex-col w-full h-screen'>
        {children}
        <Separator />
        <footer className="flex items-center justify-between p-2">
            <Logo iconSize={16} fontSize='text-xl' />
            <ModeToggle />
        </footer>
    </div>
  )
}

export default layout
