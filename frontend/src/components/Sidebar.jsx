import { NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ClipboardList,
  Users,
  Settings,
  Layers
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

  const navItems = [
    { path: '/catalogue', icon: BookOpen, label: 'Katalog' },
    { path: '/rents', icon: ClipboardList, label: 'Peminjaman' },
    { path: '/clients', icon: Users, label: 'Klien' },
  ];

  const bottomItems = [
    { path: '/settings', icon: Settings, label: 'Pengaturan' },
  ];

  return (
    <aside className="fixed top-[var(--navbar-height)] left-0 w-[var(--sidebar-width)] h-[calc(100vh-var(--navbar-height))] bg-[var(--surface)] border-r border-[var(--border)] flex flex-col z-90">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--border)]">
        <Layers size={28} className="text-[var(--primary)]" />
        <span className="text-lg font-bold text-[var(--foreground)]">Costume Rent</span>
      </div>

      <nav className="flex-1 flex flex-col justify-between p-3">
        <div className="flex flex-col gap-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                    : 'text-[var(--muted)] hover:bg-[var(--border)]'
                }`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          {bottomItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                    : 'text-[var(--muted)] hover:bg-[var(--border)]'
                }`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;