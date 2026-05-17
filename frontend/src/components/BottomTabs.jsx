import { NavLink } from 'react-router-dom';
import { BookOpen, ClipboardList, Users } from 'lucide-react';

const tabs = [
  { path: '/catalogue', icon: BookOpen, label: 'Katalog' },
  { path: '/rents', icon: ClipboardList, label: 'Peminjaman' },
  { path: '/clients', icon: Users, label: 'Klien' },
];

const BottomTabs = () => {
  return (
    <nav
      data-slot="bottom-tabs"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md px-2 py-1 safe-area-pb"
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
                ? 'active text-[var(--primary)]'
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
              <span
                className={`text-[10px] font-medium leading-tight ${
                  isActive ? 'font-semibold' : ''
                }`}
              >
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
