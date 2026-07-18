import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useSidebar } from '../context/SidebarContext';
import NotificationBell from './NotificationBell';
import { LogOut, Sun, Moon, Menu, ChevronRight, User, Settings } from 'lucide-react';
import { Avatar, useTheme, Button, Popover, PopoverTrigger, PopoverContent } from '@heroui/react';

const getCookie = (name) => {
  const prefix = `${name}=`;
  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length) || '';
};

const persistTheme = (nextTheme) => {
  localStorage.setItem('heroui-theme', nextTheme);
  document.cookie = `heroui-theme=${encodeURIComponent(nextTheme)}; path=/; SameSite=Lax`;
  document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  document.documentElement.classList.toggle('light', nextTheme !== 'dark');
  document.documentElement.setAttribute('data-theme', nextTheme);
};

const NavbarComponent = () => {
  const { user, logout } = useAuth();
  const { isCollapsed, openMobile } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { count } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('heroui-theme') || decodeURIComponent(getCookie('heroui-theme'));
    if (savedTheme === 'dark' || savedTheme === 'light') {
      persistTheme(savedTheme);
      setTheme(savedTheme);
    }
  }, [setTheme]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleThemeToggle = () => {
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : theme;
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    persistTheme(nextTheme);
    setTheme(nextTheme);
  };

  const currentPath = location.pathname.split('/').filter(Boolean)[0] || 'Dashboard';
  const formattedPath = currentPath.charAt(0).toUpperCase() + currentPath.slice(1);

  return (
    <nav className={`navbar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      
      <header className="navbar-header">
        
        {/* LEFT: Hamburger (Mobile) & Breadcrumbs (Desktop) */}
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            variant="light"
            className="md:hidden text-[var(--muted)]"
            onPress={openMobile}
            aria-label="Buka menu navigasi"
          >
            <Menu size={22} />
          </Button>
          <div className="hidden md:flex items-center gap-2 text-sm ml-2">
            <span className="text-[var(--muted)]">App</span>
            <ChevronRight size={14} className="text-[var(--muted)]" />
            <span className="font-semibold text-[var(--foreground)]">{formattedPath}</span>
          </div>
        </div>

        {/* RIGHT: Theme -> Notification -> Profile */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          {/* THEME TOGGLE - Standardized to w-10 h-10 */}
          <Button 
            isIconOnly
            variant="light"
            radius="full"
            onPress={handleThemeToggle}
            className="w-10 h-10 text-[var(--muted)]"
            aria-label={theme === 'light' ? 'Beralih ke mode gelap' : 'Beralih ke mode terang'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </Button>

          <NotificationBell count={count} />

          <div className="h-6 w-[1px] bg-[var(--border)] mx-1 hidden sm:block" />

          {/* PROFILE DROPDOWN */}
          <Popover placement="bottom-end">
            <PopoverTrigger>
              <button
                type="button"
                className="flex items-center gap-3 bg-transparent border-none p-0 cursor-pointer outline-none hover:opacity-80 transition-opacity"
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
            </PopoverTrigger>
            <PopoverContent className="p-0 border border-[var(--border)] shadow-xl overflow-hidden rounded-xl">
              <div className="w-60 bg-[var(--surface)] flex flex-col">
                <div className="flex flex-col gap-1 p-4 border-b border-[var(--border)] bg-[var(--border)]/10">
                  <p className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-widest">Logged in as</p>
                  <p className="text-sm font-semibold truncate text-[var(--foreground)]">
                    {user?.username || 'admin'}
                  </p>
                </div>
                <div className="flex flex-col p-1">
                  <Button
                    variant="light"
                    radius="md"
                    onPress={() => navigate('/profile')}
                    className="w-full justify-start gap-3 px-3 h-10 data-[hover=true]:bg-[var(--border)]/30"
                  >
                    <User size={18} className="text-[var(--muted)]" />
                    Profil Saya
                  </Button>
                  <Button
                    variant="light"
                    radius="md"
                    onPress={() => navigate('/settings')}
                    className="w-full justify-start gap-3 px-3 h-10 data-[hover=true]:bg-[var(--border)]/30"
                  >
                    <Settings size={18} className="text-[var(--muted)]" />
                    Pengaturan
                  </Button>
                  <Button
                    color="danger"
                    variant="light"
                    radius="md"
                    onPress={handleLogout}
                    className="w-full justify-start gap-3 px-3 h-10"
                  >
                    <LogOut size={18} />
                    Logout
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>
    </nav>
  );
};

export default NavbarComponent;
