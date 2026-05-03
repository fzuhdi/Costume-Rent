import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import { NotificationProvider } from './context/NotificationContext';
import { SettingsProvider } from './context/SettingsContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import CataloguePage from './pages/CataloguePage';
import CatalogueDetailPage from './pages/CatalogueDetailPage';
import CatalogueFormPage from './pages/CatalogueFormPage';
import RentFormPage from './pages/RentFormPage';
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
        <Route path="/" element={<Navigate to="/catalogue" replace />} />
        <Route path="/catalogue" element={<CataloguePage />} />
        <Route path="/catalogue/:id" element={<CatalogueDetailPage />} />
        <Route path="/catalogue/new" element={<CatalogueFormPage />} />
        <Route path="/catalogue/:id/edit" element={<CatalogueFormPage />} />
        <Route path="/rents" element={<RentHistoryPage />} />
        <Route path="/rents/new" element={<RentFormPage />} />
        <Route path="/rents/:id" element={<RentDetailPage />} />
        <Route path="/rents/:id/edit" element={<RentFormPage />} />
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
