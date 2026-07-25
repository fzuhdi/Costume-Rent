"use client";

import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import BottomTabs from '@/components/BottomTabs';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import FullScreenSpinner from '@/components/FullScreenSpinner';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }) {
  const { isCollapsed } = useSidebar();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { loading: settingsLoading } = useSettings();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || settingsLoading) {
    return <FullScreenSpinner />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="layout-root">
      <Navbar />
      <div className="layout-content">
        <Sidebar />
        <main className={`main-content ${isCollapsed ? 'collapsed' : 'expanded'}`}>
          {children}
        </main>
      </div>
      <BottomTabs />
    </div>
  );
}
