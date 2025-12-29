import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './AppHeader.css';

export const AppHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="app-header">
      <div className="app-header-left">
        <Link to="/" className="app-logo">
          <div className="app-logo-icon" aria-hidden="true" />
          <span className="app-logo-text">CTA</span>
        </Link>

        {user && (
          <nav className="app-nav" aria-label="Main navigation">
            <Link
              to="/"
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              to="/conflicts/new"
              className={`nav-link ${isActive('/conflicts/new') ? 'active' : ''}`}
            >
              New Conflict
            </Link>
          </nav>
        )}
      </div>

      <div className="app-header-right">
        {user && (
          <>
            <Link
              to="/profile"
              className="btn btn-ghost btn-sm"
              aria-label="Settings and profile"
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-sm"
              aria-label="Log out"
            >
              Log Out
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
