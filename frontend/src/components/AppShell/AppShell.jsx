import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';
import './AppShell.css';

export default function AppShell({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const plan = user?.subscription?.plan || 'free';
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  const handleLogout = () => { logout(); navigate('/'); };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/settings', label: 'Cilësimet', icon: '⚙️' },
    { to: '/pricing', label: 'Planet', icon: '💳' },
  ];

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <Link to="/dashboard" className="sidebar__logo">⚡ TaskFlow</Link>

        <nav className="sidebar__nav">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to}
              className={`sidebar__link ${location.pathname.startsWith(l.to) ? 'active' : ''}`}>
              <span>{l.icon}</span> {l.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar__bottom">
          {plan === 'free' && (
            <Link to="/pricing" className="sidebar__upgrade">
              <div className="sidebar__upgrade-icon">⚡</div>
              <div>
                <div className="sidebar__upgrade-title">Upgrade to Pro</div>
                <div className="sidebar__upgrade-sub">Workspace pa limit</div>
              </div>
            </Link>
          )}

          <div className="sidebar__user" onClick={() => setMenuOpen(!menuOpen)}>
            {user?.avatar
              ? <img src={user.avatar} className="avatar avatar-sm" alt={user.name} />
              : <div className="avatar avatar-sm">{initials}</div>
            }
            <div className="sidebar__user-info">
              <div className="sidebar__user-name">{user?.name}</div>
              <div className={`badge badge-indigo plan-${plan}`}>{plan}</div>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--text-subtle)' }}>⋯</span>
          </div>

          {menuOpen && (
            <div className="sidebar__user-menu">
              <Link to="/settings" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                ⚙️ Cilësimet
              </Link>
              <button className="dropdown-item danger" onClick={handleLogout}>
                🚪 Dilni
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <main className="app-main">{children}</main>
    </div>
  );
}
