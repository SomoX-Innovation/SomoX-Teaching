import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaBuilding,
  FaChevronDown,
  FaUser,
  FaSignOutAlt
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './Sidebar.css';

const SuperAdminSidebar = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
    navigate('/');
  };

  return (
    <aside id="logo-sidebar" className="sidebar" aria-label="Super Admin Sidebar">
      <div className="sidebar-content">
        {/* Logo */}
        <Link to="/superadmin/dashboard" className="logo-container">
          <div className="logo-wrapper">
            <img 
              src="/assets/logo.png" 
              alt="Somox Learning Logo" 
              className="logo-image"
            />
            <div className="logo-glow"></div>
          </div>
        </Link>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Navigation Menu */}
        <ul className="nav-menu">
          {/* User Profile Section */}
          <li className="user-profile-section">
            <button 
              className="user-profile-button"
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <div className="avatar-container">
                <img 
                  src="/assets/profile.svg" 
                  alt="Profile" 
                  className="user-avatar"
                />
                <div className="avatar-status"></div>
              </div>
              <div className="user-info">
                <div className="user-name" title={user?.name || 'Super Admin'}>
                  {user?.name || 'Super Admin'}
                </div>
                <div className="user-role">Super Administrator</div>
              </div>
              <FaChevronDown className={`arrow-icon ${isUserMenuOpen ? 'rotate' : ''}`} />
            </button>
            {isUserMenuOpen && (
              <div className="user-dropdown fade-in">
                <Link to="/superadmin/profile" className="dropdown-item">
                  <FaUser className="dropdown-icon" />
                  <span>Profile</span>
                </Link>
                <button 
                  type="button"
                  className="dropdown-item"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt className="dropdown-icon" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </li>

          {/* Dashboard */}
          <li>
            <Link 
              to="/superadmin/dashboard" 
              className={`nav-link ${isActive('/superadmin/dashboard') ? 'active' : ''}`}
            >
              <div className="nav-icon-wrapper">
                <FaHome className="nav-icon" />
              </div>
              <span className="nav-text">Dashboard</span>
              <div className="nav-indicator"></div>
            </Link>
          </li>

          {/* Organizations Management */}
          <li>
            <Link 
              to="/superadmin/organizations" 
              className={`nav-link ${isActive('/superadmin/organizations') ? 'active' : ''}`}
            >
              <div className="nav-icon-wrapper">
                <FaBuilding className="nav-icon" />
              </div>
              <span className="nav-text">Organizations</span>
              <div className="nav-indicator"></div>
            </Link>
          </li>

        </ul>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="footer-info">
            <div className="footer-text">Version 1.0.0</div>
            <div className="footer-text secondary">© 2026 Somox Learning</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SuperAdminSidebar;
