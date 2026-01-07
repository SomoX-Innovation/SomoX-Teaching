import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaTasks, 
  FaRobot, 
  FaVideo, 
  FaChevronDown,
  FaUser,
  FaSignOutAlt
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './Sidebar.css';

const Sidebar = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const toggleSubmenu = (menu) => {
    setOpenSubmenu(openSubmenu === menu ? null : menu);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isParentActive = (paths) => {
    return paths.some(path => location.pathname.startsWith(path));
  };

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
    navigate('/');
  };

  return (
    <aside id="logo-sidebar" className="sidebar" aria-label="Sidebar">
      <div className="sidebar-content">
        {/* Logo */}
        <Link to="/dashboard" className="logo-container">
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
                <div className="user-name" title={user?.name || 'Student User'}>
                  {user?.name || 'Student User'}
                </div>
                <div className="user-role">Student</div>
              </div>
              <FaChevronDown className={`arrow-icon ${isUserMenuOpen ? 'rotate' : ''}`} />
            </button>
            {isUserMenuOpen && (
              <div className="user-dropdown fade-in">
                <Link to="/profile" className="dropdown-item">
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
              to="/dashboard" 
              className={`nav-link ${isActive('/dashboard') && !location.pathname.includes('/dashboard/') ? 'active' : ''}`}
            >
              <div className="nav-icon-wrapper">
                <FaHome className="nav-icon" />
              </div>
              <span className="nav-text">Dashboard</span>
              <div className="nav-indicator"></div>
            </Link>
          </li>

          {/* Task Management */}
          <li>
            <button
              className={`nav-link ${isParentActive(['/dashboard/student-tasks']) ? 'active' : ''}`}
              onClick={() => toggleSubmenu('tasks')}
            >
              <div className="nav-icon-wrapper">
                <FaTasks className="nav-icon" />
              </div>
              <span className="nav-text">Task Management</span>
              <FaChevronDown className={`submenu-arrow ${openSubmenu === 'tasks' ? 'rotate' : ''}`} />
            </button>
            <ul className={`submenu ${openSubmenu === 'tasks' ? 'open' : ''}`}>
              <li>
                <Link to="/dashboard/student-tasks" className="submenu-link">
                  <div className="submenu-dot"></div>
                  <span>Tasks</span>
                </Link>
              </li>
            </ul>
          </li>

          {/* AI Assistant */}
          <li>
            <Link 
              to="/dashboard/chatgpt" 
              className={`nav-link ${isActive('/dashboard/chatgpt') ? 'active' : ''}`}
            >
              <div className="nav-icon-wrapper">
                <FaRobot className="nav-icon" />
              </div>
              <span className="nav-text">AI Assistant</span>
              <span className="nav-badge">New</span>
              <div className="nav-indicator"></div>
            </Link>
          </li>

          {/* Session Recording */}
          <li>
            <button
              className={`nav-link ${isParentActive(['/dashboard/student-session-recording', '/dashboard/student-other-recording']) ? 'active' : ''}`}
              onClick={() => toggleSubmenu('recording')}
            >
              <div className="nav-icon-wrapper">
                <FaVideo className="nav-icon" />
              </div>
              <span className="nav-text">Session Recording</span>
              <FaChevronDown className={`submenu-arrow ${openSubmenu === 'recording' ? 'rotate' : ''}`} />
            </button>
            <ul className={`submenu ${openSubmenu === 'recording' ? 'open' : ''}`}>
              <li>
                <Link to="/dashboard/student-session-recording" className="submenu-link">
                  <div className="submenu-dot"></div>
                  <span>Session Recording List</span>
                </Link>
              </li>
              <li>
                <Link to="/dashboard/student-other-recording" className="submenu-link">
                  <div className="submenu-dot"></div>
                  <span>Other Recording List</span>
                </Link>
              </li>
            </ul>
          </li>

          {/* Zoom Sessions */}
          <li>
            <Link 
              to="/dashboard/zoom-sessions" 
              className={`nav-link ${isActive('/dashboard/zoom-sessions') ? 'active' : ''}`}
            >
              <div className="nav-icon-wrapper">
                <FaVideo className="nav-icon" />
              </div>
              <span className="nav-text">Zoom Sessions</span>
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

export default Sidebar;
