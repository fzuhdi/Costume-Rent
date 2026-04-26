import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { getSettings, updateSettings as updateSettingsApi, uploadLogo as uploadLogoApi } from '../api/settingsApi';

export const SettingsContext = createContext(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    app_name: 'Costume Rental',
    app_tagline: 'Inventory & Rental Management',
    app_logo: '',
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (data) => {
    const response = await updateSettingsApi(data);
    setSettings(response.data);
    return response.data;
  };

  const uploadLogo = async (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await uploadLogoApi(formData);
    setSettings((prev) => ({ ...prev, app_logo: response.data.path }));
    return response.data.path;
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, fetchSettings, updateSettings, uploadLogo }}>
      {children}
    </SettingsContext.Provider>
  );
};