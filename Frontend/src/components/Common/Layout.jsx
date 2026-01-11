import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define navigation items based on user role
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'analyst', 'user', 'viewer'] },
    { path: '/attacks', label: 'Attacks', icon: '⚔️', roles: ['admin', 'analyst', 'user', 'viewer'] },
    { path: '/search', label: 'Search', icon: '🔍', roles: ['admin', 'analyst', 'user', 'viewer'] },
    { path: '/check-ip', label: 'Check IP', icon: '🔍', roles: ['admin', 'analyst', 'user'] },
    { path: '/sources', label: 'Threat Intel', icon: '🕵️', roles: ['admin', 'analyst'] },
    // Only admin can manage users
    ...(user?.role === 'admin' ? [{ path: '/users', label: 'Users', icon: '👥', roles: ['admin'] }] : []),
  ].filter(item => item.roles && item.roles.includes(user?.role));

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>🛡️ Cybercrime Tracker</h1>
        </div>
        <div className="navbar-user">
          <span className="user-info">
            {user?.username || user?.email} ({user?.role})
          </span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <div className="layout-content">
        <aside className="sidebar">
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

