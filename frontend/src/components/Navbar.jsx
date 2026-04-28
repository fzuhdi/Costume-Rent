import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';
import NotificationBell from './NotificationBell';
import { LogOut, User, Sun, Moon } from 'lucide-react';
import { Button, useTheme } from '@heroui/react';

const NavbarComponent = () => {
  const { user, logout } = useAuth();
  const { count } = useNotification();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-lg">
      <header className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <span className="sr-only">Menu</span>
            {isMenuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <div className="flex items-center gap-3">
            <Link to="/catalogue">
              {settings.app_logo ? (
                <img src={settings.app_logo} alt={settings.app_name} className="h-10 w-auto" />
              ) : (
                <span className="text-xl font-bold text-[var(--primary)]">{settings.app_name}</span>
              )}
            </Link>
          </div>
        </div>
        <ul className="hidden items-center gap-4 md:flex">
          <li>
            <Link to="/catalogue" className="text-[var(--foreground)] hover:text-[var(--primary)]">
              Catalogue
            </Link>
          </li>
          <li>
            <Link to="/rents" className="text-[var(--foreground)] hover:text-[var(--primary)]">
              Rents
            </Link>
          </li>
          <li>
            <Link to="/clients" className="text-[var(--foreground)] hover:text-[var(--primary)]">
              Clients
            </Link>
          </li>
        </ul>
        <div className="hidden items-center gap-4 md:flex">
          <NotificationBell count={count} />
          <Button
            isIconOnly
            variant="ghost"
            onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </Button>
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <User size={18} />
            <span>{user?.name || 'Admin'}</span>
          </div>
          <Button variant="bordered" size="sm" onPress={handleLogout}>
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </header>
      {isMenuOpen && (
        <div className="border-t border-[var(--border)] md:hidden">
          <ul className="flex flex-col gap-2 p-4">
            <li>
              <Link to="/catalogue" className="block py-2 text-[var(--foreground)]" onClick={() => setIsMenuOpen(false)}>
                Catalogue
              </Link>
            </li>
            <li>
              <Link to="/rents" className="block py-2 text-[var(--foreground)]" onClick={() => setIsMenuOpen(false)}>
                Rents
              </Link>
            </li>
            <li>
              <Link to="/clients" className="block py-2 text-[var(--foreground)]" onClick={() => setIsMenuOpen(false)}>
                Clients
              </Link>
            </li>
            <li className="mt-4 flex flex-col gap-2 border-t border-[var(--border)] pt-4">
              <NotificationBell count={count} />
              <Button variant="bordered" size="sm" onPress={handleLogout} className="w-full">
                <LogOut size={16} />
                Logout
              </Button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default NavbarComponent;