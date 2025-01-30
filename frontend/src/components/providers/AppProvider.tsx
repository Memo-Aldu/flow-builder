"use client";

import { ThemeProvider } from 'next-themes';
import React from 'react'

type AppProviderProps = {
    children: React.ReactNode
}

export const AppProvider = ({ children }: AppProviderProps ) => {
  return (
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
        {children}
    </ThemeProvider>
  )
}
