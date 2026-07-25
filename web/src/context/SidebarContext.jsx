import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
};

export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('sidebar-collapsed:v1');
        if (saved) setIsCollapsed(JSON.parse(saved));
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed:v1', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  const toggleSidebar = useCallback(() => setIsCollapsed((prev) => !prev), []);
  const openMobile = useCallback(() => setIsMobileOpen(true), []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);

  const contextValue = useMemo(() => ({
    isCollapsed, toggleSidebar, isMobileOpen, openMobile, closeMobile
  }), [isCollapsed, toggleSidebar, isMobileOpen, openMobile, closeMobile]);

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
};
