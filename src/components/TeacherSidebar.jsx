import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaUsers, 
  FaGraduationCap,
  FaVideo,
  FaTasks,
  FaChevronDown,
  FaUser,
  FaSignOutAlt,
  FaBook
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './Sidebar.css';

const TeacherSidebar = () => {
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
    <aside id="logo-sidebar" className="sidebar" aria-label="Teacher Sidebar">
      <div className="sidebar-content">
        {/* Logo */}
        <Link to="/teacher/dashboard" className="logo-container">
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
                <div className="user-name" title={user?.name || 'Teacher'}>
                  {user?.name || 'Teacher'}
                </div>
                <div className="user-role">Teacher</div>
              </div>
              <FaChevronDown className={`arrow-icon ${isUserMenuOpen ? 'rotate' : ''}`} />
            </button>
            {isUserMenuOpen && (
              <div className="user-dropdown fade-in">
                <Link to="/teacher/profile" className="dropdown-item">
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
              to="/teacher/dashboard" 
              className={`nav-link ${isActive('/teacher/dashboard') ? 'active' : ''}`}
            >
              <div className="nav-icon-wrapper">
                <FaHome className="nav-icon" />
              </div>
              <span className="nav-text">Dashboard</span>
              <div className="nav-indicator"></div>
            </Link>
          </li>

          {/* Students Management */}
          <li>
            <Link 
              to="/teacher/users" 
              className={`nav-link ${isActive('/teacher/users') ? 'active' : ''}`}
            >
              <div className="nav-icon-wrapper">
                <FaUsers className="nav-icon" />
              </div>
              <span className="nav-text">Students</span>
              <div className="nav-indicator"></div>
            </Link>
          </li>

          {/* Classes Management */}
          <li>
            <Link 
              to="/teacher/courses" 
              className={`nav-link ${isActive('/teacher/courses') ? 'active' : ''}`}
            >
              <div className="nav-icon-wrapper">
                <FaGraduationCap className="nav-icon" />
              </div>
              <span className="nav-text">Classes</span>
              <div className="nav-indicator"></div>
            </Link>
          </li>

          {/* Session Recordings */}
          <li>
            <Link 
              to="/teacher/recordings" 
              className={`nav-link ${isActive('/teacher/recordings') ? 'active' : ''}`}
            >
              <div className="nav-icon-wrapper">
                <FaVideo className="nav-icon" />
              </div>
              <span className="nav-text">Recordings</span>
              <div className="nav-indicator"></div>
            </Link>
          </li>

          {/* Tasks Management */}
          <li>
            <Link 
              to="/teacher/tasks" 
              className={`nav-link ${isActive('/teacher/tasks') ? 'active' : ''}`}
            >
              <div className="nav-icon-wrapper">
                <FaTasks className="nav-icon" />
              </div>
              <span className="nav-text">Tasks</span>
              <div className="nav-indicator"></div>
            </Link>
          </li>

          {/* Blog Management */}
          <li>
            <button
              className={`nav-link ${isParentActive(['/teacher/blog']) ? 'active' : ''}`}
              onClick={() => toggleSubmenu('blog')}
            >
              <div className="nav-icon-wrapper">
                <FaBook className="nav-icon" />
              </div>
              <span className="nav-text">Blog</span>
              <FaChevronDown className={`submenu-arrow ${openSubmenu === 'blog' ? 'rotate' : ''}`} />
            </button>
            <ul className={`submenu ${openSubmenu === 'blog' ? 'open' : ''}`}>
              <li>
                <Link to="/teacher/blog" className="submenu-link">
                  <div className="submenu-dot"></div>
                  <span>All Posts</span>
                </Link>
              </li>
              <li>
                <Link to="/teacher/blog/create" className="submenu-link">
                  <div className="submenu-dot"></div>
                  <span>Create Post</span>
                </Link>
              </li>
            </ul>
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

export default TeacherSidebar;
