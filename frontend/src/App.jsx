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
import MasterDataPage from './pages/MasterDataPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import { useSettings } from './context/SettingsContext';
import FullScreenSpinner from './components/FullScreenSpinner';
import { Toast } from '@heroui/react';


const AppRoutes = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();

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

  useEffect(() => {
    document.title = settings.app_name || 'Costume Rental';
    if (settings.app_logo) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settings.app_logo;
    }
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
        <Route path="/clients/:id/edit" element={<ClientFormPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/master-data" element={<MasterDataPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={isAuthenticated ? <NotFoundPage /> : <Navigate to="/login" replace />} />
    </Routes>
  );
};

const AuthenticatedLayout = () => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="layout-root">
      <Navbar />
      <div className="layout-content">
        <Sidebar />
        <main className={`main-content ${isCollapsed ? 'collapsed' : 'expanded'}`}>
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
              <Toast.Provider placement="top-center" />
              <AppRoutes />
            </SidebarProvider>
          </NotificationProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
