"use client";

import { AuthProvider } from '@/context/AuthContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { Toast } from '@heroui/react';
import { useEffect } from 'react';

export function Providers({ children }) {
  useEffect(() => {
    let theme = localStorage.getItem('heroui-theme') || (document.cookie.match(/(?:^|;)\s*heroui-theme=([^;]*)/)?.[1] || '');
    if (!theme) {
      theme = 'light';
      localStorage.setItem('heroui-theme', 'light');
      document.cookie = `heroui-theme=light; path=/; SameSite=Lax`;
    }
    if (theme === 'dark' || theme === 'light') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.classList.toggle('light', theme !== 'dark');
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, []);

  return (
    <AuthProvider>
      <SettingsProvider>
        <NotificationProvider>
          <SidebarProvider>
            <Toast.Provider placement="top-center" />
            {children}
          </SidebarProvider>
        </NotificationProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
