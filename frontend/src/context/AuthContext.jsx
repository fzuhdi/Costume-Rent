import { createContext, useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi, getCurrentUser, logout as logoutApi } from '../api/authApi';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {

    const initAuth = async () => {
      // With HTTP-only cookies, we can just try to fetch the current user
      // If the cookie is present and valid, it will succeed.
      try {
        const response = await getCurrentUser();
        setUser(response.data);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('user:v1');
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (username, password) => {
    const response = await loginApi(username, password);
    const { user: userData } = response.data;
    localStorage.setItem('user:v1', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      localStorage.removeItem('user:v1');
      localStorage.removeItem('token:v1');
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    }
  }, [navigate]);

  const contextValue = useMemo(() => ({
    user, loading, isAuthenticated, login, logout
  }), [user, loading, isAuthenticated, login, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
