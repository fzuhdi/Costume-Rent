import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';
import NotificationBell from './NotificationBell';
import { LogOut, User, Sun, Moon } from 'lucide-react';
import { Button, Navbar, useTheme } from '@heroui/react';

const NavbarComponent = () => {
  const { user, logout } = useAuth();
  const { count } = useNotification();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Navbar isBordered className="bg-[var(--surface)] border-[var(--border)]" maxWidth="full">
      <Navbar.Brand>
        <Link to="/catalogue">
          {settings.app_logo ? (
            <img src={settings.app_logo} alt={settings.app_name} className="h-10 w-auto" />
          ) : (
            <span className="text-xl font-bold text-[var(--primary)]">{settings.app_name}</span>
          )}
        </Link>
      </Navbar.Brand>
      <Navbar.Content justify="end">
        <Navbar.Item>
          <NotificationBell count={count} />
        </Navbar.Item>
        <Navbar.Item>
          <Button
            isIconOnly
            variant="ghost"
            onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </Button>
        </Navbar.Item>
        <Navbar.Item>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <User size={18} />
              <span>{user?.name || 'Admin'}</span>
            </div>
            <Button variant="bordered" size="sm" onPress={handleLogout}>
              <LogOut size={16} />
              Logout
            </Button>
          </div>
        </Navbar.Item>
      </Navbar.Content>
    </Navbar>
  );
};

export default NavbarComponent;