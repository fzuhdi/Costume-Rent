import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';
import NotificationBell from './NotificationBell';
import { LogOut, User } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { count } = useNotification();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/catalogue">
          {settings.app_logo ? (
            <img src={settings.app_logo} alt={settings.app_name} className="navbar-logo" />
          ) : (
            <span className="navbar-title">{settings.app_name}</span>
          )}
        </Link>
      </div>

      <div className="navbar-actions">
        <NotificationBell count={count} />

        <div className="navbar-user">
          <div className="user-info">
            <User size={18} />
            <span>{user?.name || 'Admin'}</span>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;