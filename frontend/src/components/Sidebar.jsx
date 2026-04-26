import { NavLink, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  ClipboardList, 
  Users, 
  Settings,
  Layers
} from 'lucide-react';
import './Sidebar.css';

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
    <aside className="sidebar">
      <div className="sidebar-header">
        <Layers size={28} className="sidebar-icon" />
        <span className="sidebar-title">Costume Rent</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        <div className="nav-section nav-section-bottom">
          {bottomItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
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