import { createContext, useState, useEffect, useCallback } from 'react';
import { getNotifications } from '../api/notificationApi';

export const NotificationContext = createContext(null);

const POLL_INTERVAL = parseInt(import.meta.env.VITE_NOTIFICATION_POLL_MS || '60000', 10);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleFocus = () => fetchNotifications();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider value={{ notifications, count, loading, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};