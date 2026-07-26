import { NavLink } from '@/lib/router-shim';
import { LayoutDashboard, ShoppingCart, BookOpen, ClipboardList } from 'lucide-react';

const tabs = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dash' },
  { path: '/admin/pos', icon: ShoppingCart, label: 'POS' },
  { path: '/admin/catalogue', icon: BookOpen, label: 'Katalog' },
  { path: '/admin/rents', icon: ClipboardList, label: 'Sewa' },
];

const BottomTabs = () => {
  return (
    <nav
      data-slot="bottom-tabs"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--surface)]/95 border-t border-[var(--border)] flex items-center justify-around px-2 py-1 backdrop-blur-md"
      style={{ height: 'var(--navbar-height)' }}
    >
      {tabs.map(({ path, icon: Icon, label }) => (
        <NavLink
          key={path}
          to={path}
          aria-label={label}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-all duration-200 ${
              isActive 
                ? 'text-[var(--primary)]' 
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden="true"
                className="transition-all duration-200"
              />
              <span className={`text-[10px] font-medium leading-tight ${isActive ? 'font-semibold' : ''}`}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomTabs;
