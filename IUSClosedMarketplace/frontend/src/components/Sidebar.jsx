import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const { user, logout, isAdmin, isSeller } = useAuth();

  const navItems = [
    { to: '/', label: 'Browse', icon: '🏠', show: true },
    { to: '/my-listings', label: 'My Listings', icon: '📦', show: isSeller },
    { to: '/favorites', label: 'Favorites', icon: '❤️', show: true },
    { to: '/messages', label: 'Messages', icon: '💬', show: true },
    { to: '/transactions', label: 'Transactions', icon: '🧾', show: true },
    { divider: true, show: isAdmin },
    { to: '/admin/dashboard', label: 'Dashboard', icon: '📊', show: isAdmin },
    { to: '/admin/users', label: 'Users', icon: '👤', show: isAdmin },
    { to: '/admin/reports', label: 'Reports', icon: '🚩', show: isAdmin },
    { to: '/admin/analytics', label: 'Analytics', icon: '📈', show: isAdmin },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <h1>IUS Market</h1>
        <span>Closed Marketplace</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.filter((i) => i.show).map((item, idx) =>
          item.divider ? (
            <div key={`div-${idx}`} style={{ height: 1, background: 'var(--border)', margin: '8px 14px' }} />
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          )
        )}
      </nav>
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">
            {user?.name?.split(' ').map((n) => n[0]).join('') || '?'}
          </div>
          <div className="user-info">
            <div className="name">{user?.name}</div>
            <div className="role">{user?.role}</div>
          </div>
          <button className="logout-btn" onClick={logout} title="Sign out">⏻</button>
        </div>
      </div>
    </div>
  );
}
