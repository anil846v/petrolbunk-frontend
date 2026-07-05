import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Settings, BookOpen, Fuel,
  HandCoins, FileBarChart2, ChevronDown,
  ChevronLeft, ChevronRight, Circle,
} from 'lucide-react';
import logo from '../../assets/logo.png';

const menuItems = [
  {
    label: 'Dashboard',
    icon:  LayoutDashboard,
    path:  '/admin/dashboard',
  },
  {
    label: 'Transactions',
    icon:  BookOpen,
    children: [
      { label: "Today's Entry", path: '/admin/transactions/todays-entry' },
      { label: 'Day Book',      path: '/admin/transactions/daybook' },
    ],
  },
  {
    label: 'Loans',
    icon:  HandCoins,
    children: [
      { label: 'Loan Accounts', path: '/admin/loans' },
      { label: 'Payments',      path: '/admin/loans/payments' },
    ],
  },
  {
    label: 'Reports',
    icon:  FileBarChart2,
    children: [
      { label: 'Monthly Report', path: '/admin/reports/monthly-report' },
    ],
  },
  {
    label: 'Master',
    icon:  Settings,
    children: [
      { label: 'Categories', path: '/admin/master/categories' },
      { label: 'Users',      path: '/admin/master/users' },
      { label: 'Vendors',    path: '/admin/master/vendors' },
      { label: 'Fuel Types', path: '/admin/master/fuel-types' },
    ],
  },
];

// Returns the label of the parent group whose child matches the current path
function activeGroup(pathname) {
  const match = menuItems.find((item) =>
    item.children?.some((child) => pathname.startsWith(child.path))
  );
  return match?.label ?? null;
}

export default function SideMenu({ collapsed, setCollapsed }) {
  const location = useLocation();

  // Initialise open group to whatever the current route belongs to
  const [openMenu, setOpenMenu] = useState(() => activeGroup(location.pathname));

  // Auto-expand the parent group whenever the route changes
  useEffect(() => {
    if (collapsed) return;
    const group = activeGroup(location.pathname);
    if (group) setOpenMenu(group);
  }, [location.pathname, collapsed]);

  const toggleMenu = (label) => {
    if (collapsed) return;
    setOpenMenu((prev) => (prev === label ? null : label));
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo + toggle */}
      <div className="sidebar-logo">
        {!collapsed && (
          <div className="sidebar-logo-brand">
            <img src={logo} alt="Petrol Bunk" className="sidebar-logo-img" />
            <span>Petrol Bunk</span>
          </div>
        )}
        <button
          className="sidebar-toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Menu */}
      <nav className="sidebar-menu" aria-label="Main navigation">
        {menuItems.map((item) => (
          <div key={item.label} className="sidebar-group">
            {!item.children ? (
              <NavLink
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              >
                <div className="sidebar-left">
                  <item.icon size={19} />
                  {!collapsed && <span>{item.label}</span>}
                </div>
              </NavLink>
            ) : (
              <>
                <div
                  className={`sidebar-item ${openMenu === item.label && !collapsed ? 'expanded' : ''}`}
                  title={collapsed ? item.label : undefined}
                  onClick={() => toggleMenu(item.label)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && toggleMenu(item.label)}
                >
                  <div className="sidebar-left">
                    <item.icon size={19} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown
                      size={16}
                      className={`chevron ${openMenu === item.label ? 'rotated' : ''}`}
                    />
                  )}
                </div>

                {!collapsed && (
                  <div className={`sidebar-submenu ${openMenu === item.label ? 'open' : ''}`}>
                    <div className="sidebar-submenu-inner">
                      {item.children.map((sub) => (
                        <NavLink
                          key={sub.path}
                          to={sub.path}
                          className={({ isActive }) => `sidebar-sublink ${isActive ? 'active' : ''}`}
                        >
                          <Circle size={6} className="sub-dot" />
                          {sub.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
