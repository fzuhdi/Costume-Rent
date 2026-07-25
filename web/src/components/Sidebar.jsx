import { NavLink } from '@/lib/router-shim';
import { LayoutDashboard, ShoppingCart, BookOpen, ClipboardList, Users, Settings, ChevronLeft, ChevronRight, Calendar, Layers } from 'lucide-react';
import { Tooltip, Button } from '@heroui/react';
import { useSidebar } from '@/context/SidebarContext';
import { useSettings } from '@/context/SettingsContext';

const navItems = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/pos', icon: ShoppingCart, label: 'POS Checkout' },
  { path: '/calendar', icon: Calendar, label: 'Kalender' },
  { path: '/admin/catalogue', icon: BookOpen, label: 'Katalog' },
  { path: '/admin/rents', icon: ClipboardList, label: 'Data Sewa' },
  { path: '/admin/clients', icon: Users, label: 'Pelanggan' },
];

const bottomItems = [
  { path: '/master-data', icon: Layers, label: 'Master Data' },
  { path: '/settings', icon: Settings, label: 'Pengaturan' },
];

const NavLinkItem = ({ item, isCollapsed }) => {
  const { closeMobile } = useSidebar();
  const { path, icon: Icon, label } = item;

  return (
    <NavLink
      to={path}
      onClick={closeMobile}
      className={({ isActive }) =>
        `flex items-center transition-all duration-200 rounded-lg group ${isCollapsed
          ? 'justify-center h-12 w-12 mx-auto'
          : 'gap-3 px-4 py-3 mx-2'
        } ${isActive
          ? 'bg-[var(--primary)]/15 text-[var(--primary)] font-semibold shadow-sm'
          : 'text-[var(--muted)] hover:bg-[var(--border)]/50 hover:text-[var(--foreground)]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isCollapsed ? (
            <Tooltip content={label} placement="right" closeDelay={0}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="transition-transform duration-200 group-hover:scale-110" />
            </Tooltip>
          ) : (
            <>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="transition-transform duration-200 group-hover:scale-110" />
              <span className="text-sm truncate">{label}</span>
            </>
          )}
        </>
      )}
    </NavLink>
  );
};

const SidebarDesktop = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { settings } = useSettings();

  return (
    <aside className={`sidebar-desktop bg-[var(--surface)] border-r border-[var(--border)] ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      {/* Sidebar Header - Center aligned for collapsed state */}
      <div className={`sidebar-header ${isCollapsed ? 'justify-center' : 'px-6'}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <img
            src={settings?.app_logo || '/kbr-logo.svg'}
            alt="Logo"
            className={`${isCollapsed ? 'w-8 h-8' : 'w-7 h-7'} object-contain flex-shrink-0`}
          />
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="text-lg font-bold text-[var(--foreground)] tracking-tight truncate">
                {settings?.app_name || 'Costume Rent'}
              </span>
              <span className="text-[10px] sm:text-xs text-[var(--muted)] tracking-tight truncate">
                {settings?.tagline || 'Inventory & Rental Management'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* --- THE EDGE TOGGLE --- */}
      {/* Placed at top-1/2 with -right-4 to sit perfectly on the border line */}
      <Button
        isIconOnly
        radius="full"
        size="sm"
        variant="bordered"
        onPress={toggleSidebar}
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-[100] bg-[var(--surface)] text-[var(--muted)] shadow-md transition-all hover:text-[var(--primary)] hover:scale-110 hover:bg-[var(--background)] group cursor-pointer min-w-8 w-8 h-8 px-0"
        aria-label="Toggle Sidebar"
      >
        {isCollapsed ? (
          <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
        ) : (
          <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
        )}
      </Button>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col justify-between py-4">
        <div className="flex flex-col gap-1.5">
          {navItems.map((item) => (
            <NavLinkItem key={item.path} item={item} isCollapsed={isCollapsed} />
          ))}
        </div>

        <div className="flex flex-col gap-1.5 border-t border-[var(--border)] pt-4">
          {bottomItems.map((item) => (
            <NavLinkItem key={item.path} item={item} isCollapsed={isCollapsed} />
          ))}
        </div>
      </nav>
    </aside>
  );
};

const SidebarMobile = () => {
  const { isMobileOpen, closeMobile } = useSidebar();
  const { settings } = useSettings();

  return (
    <>
      <button
        type="button"
        aria-label="Tutup sidebar"
        className={`mobile-overlay ${isMobileOpen ? 'open' : ''}`}
        onClick={closeMobile}
      />
      <div className={`mobile-sidebar bg-[var(--surface)] border-r border-[var(--border)] ${isMobileOpen ? 'open' : ''}`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--border)]">
          <img
            src={settings?.app_logo || '/kbr-logo.svg'}
            alt="Logo"
            className="w-7 h-7 object-contain flex-shrink-0"
          />
          <div className="flex flex-col truncate">
            <span className="text-lg font-bold text-[var(--foreground)] truncate">
              {settings?.app_name || 'Costume Rent'}
            </span>
            <span className="text-xs text-[var(--muted)] truncate">
              {settings?.tagline || 'Inventory & Rental Management'}
            </span>
          </div>
        </div>

        <nav className="flex-1 flex flex-col justify-between p-3">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLinkItem key={item.path} item={item} isCollapsed={false} />
            ))}
          </div>
          <div className="flex flex-col gap-1 border-t border-[var(--border)] pt-4">
            {bottomItems.map((item) => (
              <NavLinkItem key={item.path} item={item} isCollapsed={false} />
            ))}
          </div>
        </nav>
      </div>
    </>
  );
};

const Sidebar = () => {
  return (
    <>
      <SidebarDesktop />
      <SidebarMobile />
    </>
  );
};

export default Sidebar;
