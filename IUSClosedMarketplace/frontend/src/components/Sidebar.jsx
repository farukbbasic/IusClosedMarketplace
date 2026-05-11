import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import Icon from './Icon';

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout, isAdmin, isSeller } = useAuth();

  const navItems = [
    { to: '/', label: 'Browse', icon: 'home', show: true },
    { to: '/my-listings', label: 'My Items', icon: 'package', show: isSeller },
    { to: '/favorites', label: 'Saved', icon: 'heart', show: true },
    { to: '/messages', label: 'Messages', icon: 'messageSquare', show: true },
    { to: '/transactions', label: 'Transactions', icon: 'fileText', show: true },
    { divider: true, show: isAdmin },
    { label: 'Admin', section: true, show: isAdmin },
    { to: '/admin/dashboard', label: 'Dashboard', icon: 'barChart2', show: isAdmin },
    { to: '/admin/users', label: 'Users', icon: 'users', show: isAdmin },
    { to: '/admin/reports', label: 'Reports', icon: 'flag', show: isAdmin },
    { to: '/admin/analytics', label: 'Analytics', icon: 'trendingUp', show: isAdmin },
  ];

  return (
    <div className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
      <div className="sidebar-brand">
        {collapsed ? (
          <>
            <img src="/ius-logo-buyuk_0.png" alt="IUS" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <button className="sidebar-toggle" onClick={onToggle} title="Expand sidebar" style={{ marginTop: 6 }}>
              <Icon name="chevronRight" size={16} />
            </button>
          </>
        ) : (
          <>
            <div className="sidebar-brand-logo">
              <img src="/ius-logo-buyuk_0.png" alt="IUS Logo" style={{ width: 68, height: 68, objectFit: 'contain' }} />
              <span className="sidebar-brand-sub">Closed Marketplace</span>
            </div>
            <button className="sidebar-toggle" onClick={onToggle} title="Collapse sidebar">
              <Icon name="chevronLeft" size={16} />
            </button>
          </>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.filter((i) => i.show).map((item, idx) => {
          if (item.divider) {
            return <div key={`div-${idx}`} className="nav-divider" />;
          }
          if (item.section) {
            return <div key={`sec-${idx}`} className="sidebar-section-label">{item.label}</div>;
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-icon">
                <Icon name={item.icon} size={16} />
              </span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {collapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div className="user-avatar" title={user?.name}>
              {user?.name?.split(' ').map((n) => n[0]).join('') || '?'}
            </div>
            <button className="logout-btn" onClick={logout} title="Sign out">
              <Icon name="logOut" size={15} />
            </button>
          </div>
        ) : (
          <div className="user-card">
            <div className="user-avatar">
              {user?.name?.split(' ').map((n) => n[0]).join('') || '?'}
            </div>
            <div className="user-info">
              <div className="name">{user?.name}</div>
              <div className="role">{user?.role}</div>
            </div>
            <button className="logout-btn" onClick={logout} title="Sign out">
              <Icon name="logOut" size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
