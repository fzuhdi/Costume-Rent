import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import { useSettings } from './context/SettingsContext';
import './styles/global.css';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    document.title = settings.app_name || 'Costume Rental';
  }, [settings]);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Navbar />
      <div className="app-content">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/catalogue" element={<CataloguePage />} />
            <Route path="/catalogue/:id" element={<CatalogueDetailPage />} />
            <Route path="/catalogue/new" element={<CatalogueFormPage />} />
            <Route path="/catalogue/:id/edit" element={<CatalogueFormPage />} />
            <Route path="/rents" element={<RentHistoryPage />} />
            <Route path="/rents/new" element={<RentFormPage />} />
            <Route path="/rents/:id" element={<RentDetailPage />} />
            <Route path="/rents/:id/edit" element={<RentFormPage />} />
            <Route path="/clients" element={<ClientListPage />} />
            <Route path="/clients/:id" element={<ClientDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
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
            <AppRoutes />
          </NotificationProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;