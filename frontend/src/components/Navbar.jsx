import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useSidebar } from '../context/SidebarContext';
import NotificationBell from './NotificationBell';
import { LogOut, Sun, Moon, Menu, ChevronRight, User, Settings } from 'lucide-react';
import { Avatar, useTheme } from '@heroui/react';

const NavbarComponent = () => {
  const { user, logout } = useAuth();
  const { isCollapsed, openMobile } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { count } = useNotification();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const currentPath = location.pathname.split('/').filter(Boolean)[0] || 'Dashboard';
  const formattedPath = currentPath.charAt(0).toUpperCase() + currentPath.slice(1);

  return (
    <nav className="fixed top-0 right-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md transition-all duration-300 w-full pl-0 md:pl-[var(--sidebar-width)]"
      style={{ paddingLeft: isCollapsed ? 'var(--sidebar-width-collapsed)' : undefined }}>
      
      <header className="flex h-[var(--navbar-height)] items-center justify-between px-4 sm:px-8 relative">
        
        {/* LEFT: Hamburger (Mobile) & Breadcrumbs (Desktop) */}
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 text-[var(--muted)]"
            onClick={openMobile}
            aria-label="Buka menu navigasi"
          >
            <Menu size={22} />
          </button>
          <div className="hidden md:flex items-center gap-2 text-sm ml-2">
            <span className="text-[var(--muted)]">App</span>
            <ChevronRight size={14} className="text-[var(--muted)]" />
            <span className="font-semibold text-[var(--foreground)]">{formattedPath}</span>
          </div>
        </div>

        {/* RIGHT: Theme -> Notification -> Profile */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          {/* THEME TOGGLE - Standardized to w-10 h-10 */}
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="w-10 h-10 flex items-center justify-center text-[var(--muted)] hover:bg-[var(--border)]/50 rounded-full transition-all"
            aria-label={theme === 'light' ? 'Beralih ke mode gelap' : 'Beralih ke mode terang'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <NotificationBell count={count} />

          <div className="h-6 w-[1px] bg-[var(--border)] mx-1 hidden sm:block" />

          {/* PROFILE DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 hover:bg-[var(--border)]/40 p-1.5 rounded-lg transition-all outline-none"
              aria-label={`Profil ${user?.name || 'Admin'}`}
            >
              <div className="hidden lg:flex flex-col items-end text-right">
                <span className="text-xs font-bold leading-none text-[var(--foreground)]">
                  {user?.name || 'Admin Tari'}
                </span>
                <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider mt-1 font-medium">
                  Super Admin
                </span>
              </div>
              <Avatar size="sm" color="primary" className="ring-2 ring-primary/30 cursor-pointer">
                <Avatar.Fallback>{user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || "AT"}</Avatar.Fallback>
              </Avatar>
            </button>

            {/* DROPDOWN MENU ITEMS */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-[100] py-2 animate-in fade-in zoom-in duration-150 origin-top-right overflow-hidden">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-[var(--border)] mb-1">
                  <p className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-widest">Logged in as</p>
                  <p className="text-sm font-semibold truncate text-[var(--foreground)]">
                    {user?.email || 'admin@costume.rent'}
                  </p>
                </div>
                
                {/* Actions */}
                <button 
                  onClick={() => { navigate('/profile'); setIsProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--border)]/50 transition-colors text-left"
                >
                  <User size={18} className="text-[var(--muted)]" />
                  Profil Saya
                </button>

                <button 
                  onClick={() => { navigate('/settings'); setIsProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--border)]/50 transition-colors text-left"
                >
                  <Settings size={18} className="text-[var(--muted)]" />
                  Pengaturan
                </button>
                
                <div className="h-[1px] bg-[var(--border)] my-1" />

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </nav>
  );
};

export default NavbarComponent;
