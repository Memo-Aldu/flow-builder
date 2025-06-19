"use client";

import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import NextTopLoader from 'nextjs-toploader';
import React, { useState } from 'react';

// Only import DevTools in development
const ReactQueryDevtools = process.env.NODE_ENV === 'development'
  ? React.lazy(() => import('@tanstack/react-query-devtools').then(module => ({ default: module.ReactQueryDevtools })))
  : null;

type AppProviderProps = {
    children: React.ReactNode
}

export const AppProvider = ({ children }: AppProviderProps ) => {
  const [queryClient] = useState(() => new QueryClient())

  const [isMounted, setIsMounted] = useState(false)
  React.useEffect(() => {
    setIsMounted(true)
  }, [])
  if (!isMounted) {
    return null
  }
  return (
    <QueryClientProvider client={queryClient}>
      <NextTopLoader color='#3c81f6' showSpinner={false}/>
      <ThemeProvider attribute='class' defaultTheme='dark' enableSystem={false}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
      {process.env.NODE_ENV === 'development' && ReactQueryDevtools && (
        <React.Suspense fallback={null}>
          <ReactQueryDevtools />
        </React.Suspense>
      )}
    </QueryClientProvider>
  )
}
