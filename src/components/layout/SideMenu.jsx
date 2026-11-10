import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Settings, BookOpen,
  HandCoins, FileBarChart2, ChevronDown,
  ChevronLeft, ChevronRight, Circle, X
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

export default function SideMenu({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const currentGroup = activeGroup(location.pathname);

  // Derived state: tracks user manual toggle, resets when path changes
  const [manualMenu, setManualMenu] = useState(null);
  const [prevPath, setPrevPath]     = useState(location.pathname);

  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setManualMenu(null);
  }

  const openMenu = manualMenu !== null ? manualMenu : currentGroup;

  const toggleMenu = (label) => {
    if (collapsed && !mobileOpen) return;
    setManualMenu(openMenu === label ? '' : label);
  };

  const handleLinkClick = () => {
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <aside 
      className={`sidebar ${collapsed && !mobileOpen ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Logo + toggle */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-brand">
          <img src={logo} alt="Petrol Bunk" className="sidebar-logo-img" />
          {(!collapsed || mobileOpen) && (
            <div className="flex flex-col leading-tight">
              <span className="sidebar-brand-name">Petrol Bunk</span>
              <span className="sidebar-brand-sub">IOCL Station</span>
            </div>
          )}
        </div>

        {/* Mobile close button (visible only on mobile) */}
        <button
          className="sidebar-close-btn"
          onClick={(e) => {
            e.stopPropagation();
            setMobileOpen?.(false);
          }}
          aria-label="Close navigation menu"
        >
          <X size={20} />
        </button>

        {/* Desktop collapse toggle */}
        <button
          className="sidebar-toggle-btn desktop-only"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle sidebar width"
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
                title={collapsed && !mobileOpen ? item.label : undefined}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <div className="sidebar-left">
                  <item.icon size={18} />
                  {(!collapsed || mobileOpen) && <span>{item.label}</span>}
                </div>
              </NavLink>
            ) : (
              <>
                <div
                  className={`sidebar-item ${openMenu === item.label && (!collapsed || mobileOpen) ? 'expanded' : ''}`}
                  title={collapsed && !mobileOpen ? item.label : undefined}
                  onClick={() => toggleMenu(item.label)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && toggleMenu(item.label)}
                >
                  <div className="sidebar-left">
                    <item.icon size={18} />
                    {(!collapsed || mobileOpen) && <span>{item.label}</span>}
                  </div>
                  {(!collapsed || mobileOpen) && (
                    <ChevronDown
                      size={15}
                      className={`chevron ${openMenu === item.label ? 'rotated' : ''}`}
                    />
                  )}
                </div>

                {(!collapsed || mobileOpen) && (
                  <div className={`sidebar-submenu ${openMenu === item.label ? 'open' : ''}`}>
                    <div className="sidebar-submenu-inner">
                      {item.children.map((sub) => (
                        <NavLink
                          key={sub.path}
                          to={sub.path}
                          className={({ isActive }) => `sidebar-sublink ${isActive ? 'active' : ''}`}
                          onClick={handleLinkClick}
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
