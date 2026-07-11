import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import { NotificationProvider } from './context/NotificationContext';
import { SettingsProvider } from './context/SettingsContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomTabs from './components/BottomTabs';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import CalendarPage from './pages/CalendarPage';
import CataloguePage from './pages/CataloguePage';
import CatalogueDetailPage from './pages/CatalogueDetailPage';
import CatalogueFormPage from './pages/CatalogueFormPage';
import RentHistoryPage from './pages/RentHistoryPage';
import RentDetailPage from './pages/RentDetailPage';
import ClientListPage from './pages/ClientListPage';
import ClientDetailPage from './pages/ClientDetailPage';
import ClientFormPage from './pages/ClientFormPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import { useSettings } from './context/SettingsContext';
import FullScreenSpinner from './components/FullScreenSpinner';
import { Spinner } from '@heroui/react';

const AppRoutes = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();

  useEffect(() => {
    const getCookie = (name) => {
      const prefix = `${name}=`;
      return document.cookie
        .split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(prefix))
        ?.slice(prefix.length) || '';
    };

    const enforceStoredTheme = () => {
      const storedTheme = localStorage.getItem('heroui-theme') || decodeURIComponent(getCookie('heroui-theme'));
      if (storedTheme !== 'dark' && storedTheme !== 'light') {
        return;
      }
      if (document.documentElement.classList.contains('dark') !== (storedTheme === 'dark')) {
        document.documentElement.classList.toggle('dark', storedTheme === 'dark');
      }
      if (document.documentElement.classList.contains('light') !== (storedTheme !== 'dark')) {
        document.documentElement.classList.toggle('light', storedTheme !== 'dark');
      }
      if (document.documentElement.getAttribute('data-theme') !== storedTheme) {
        document.documentElement.setAttribute('data-theme', storedTheme);
      }
    };

    enforceStoredTheme();
    const observer = new MutationObserver(enforceStoredTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const hasReferencedLabel = (element) => {
      const ids = element.getAttribute('aria-labelledby')?.split(/\s+/).filter(Boolean) || [];
      return ids.some((id) => document.getElementById(id)?.textContent?.trim());
    };

    const markDecorativeImages = () => {
      document
        .querySelectorAll('span[aria-label]:not([role]), span[aria-labelledby]:not([role])')
        .forEach((span) => {
          span.removeAttribute('aria-label');
          span.removeAttribute('aria-labelledby');
        });

      document
        .querySelectorAll('svg:not([aria-label]):not([aria-labelledby])')
        .forEach((svg) => {
          if (!svg.querySelector('title')) {
            svg.setAttribute('aria-hidden', 'true');
          }
        });

      document.querySelectorAll('[role="img"]').forEach((image) => {
        const hasLabel = image.getAttribute('aria-label')?.trim()
          || image.getAttribute('title')?.trim()
          || hasReferencedLabel(image);

        if (!hasLabel && !image.textContent?.trim()) {
          image.removeAttribute('aria-labelledby');
          image.setAttribute('aria-hidden', 'true');
        }
      });
    };

    markDecorativeImages();
    const observer = new MutationObserver(markDecorativeImages);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['aria-label', 'aria-labelledby', 'role'],
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.title = settings.app_name || 'Costume Rental';
  }, [settings]);

  if (authLoading || settingsLoading) {
    return <FullScreenSpinner />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AuthenticatedLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pos" element={<POSPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/catalogue" element={<CataloguePage />} />
        <Route path="/catalogue/:id" element={<CatalogueDetailPage />} />
        <Route path="/catalogue/new" element={<CatalogueFormPage />} />
        <Route path="/catalogue/:id/edit" element={<CatalogueFormPage />} />
        <Route path="/rents" element={<RentHistoryPage />} />
        <Route path="/rents/:id" element={<RentDetailPage />} />
        <Route path="/clients" element={<ClientListPage />} />
        <Route path="/clients/new" element={<ClientFormPage />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={isAuthenticated ? <NotFoundPage /> : <Navigate to="/login" replace />} />
    </Routes>
  );
};

const AuthenticatedLayout = () => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="app-layout">
      <Navbar />
      <div className="app-content">
        <Sidebar />
        <main className={`main-content ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Outlet />
        </main>
      </div>
      <BottomTabs />
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <NotificationProvider>
            <SidebarProvider>
              <AppRoutes />
            </SidebarProvider>
          </NotificationProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
