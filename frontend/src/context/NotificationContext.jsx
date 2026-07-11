import { createContext, useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { getNotifications } from '../api/notificationApi';
import { useAuth } from './AuthContext';

export const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const response = await getNotifications();
      setNotifications(response.data.items || []);
      setCount(response.data.count || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchNotifications]);

  const contextValue = useMemo(() => ({
    notifications, count, loading, fetchNotifications
  }), [notifications, count, loading, fetchNotifications]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};