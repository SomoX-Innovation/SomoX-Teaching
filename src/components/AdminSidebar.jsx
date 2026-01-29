import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaUsers, 
  FaGraduationCap,
  FaClipboardCheck,
  FaChartBar,
  FaVideo,
  FaTasks,
  FaRobot,
  FaChevronDown,
  FaUser,
  FaSignOutAlt,
  FaCog,
  FaBook,
  FaMoneyBillWave,
  FaFileInvoiceDollar
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './Sidebar.css';

const AdminSidebar = () => {
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
    <aside id="logo-sidebar" className="sidebar" aria-label="Admin Sidebar">
      <div className="sidebar-content">
        {/* Logo */}
        <Link to="/organization/dashboard" className="logo-container">
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
                <div className="user-name" title={user?.name || 'Admin User'}>
                  {user?.name || 'Admin User'}
                </div>
                <div className="user-role">Administrator</div>
              </div>
              <FaChevronDown className={`arrow-icon ${isUserMenuOpen ? 'rotate' : ''}`} />
            </button>
            {isUserMenuOpen && (
              <div className="user-dropdown fade-in">
                <Link to="/organization/profile" className="dropdown-item">
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
              to="/organization/dashboard" 
              className={`nav-link ${isActive('/organization/dashboard') ? 'active' : ''}`}
            >
              <div className="nav-icon-wrapper">
                <FaHome className="nav-icon" />
              </div>
              <span className="nav-text">Dashboard</span>
              <div className="nav-indicator"></div>
            </Link>
          </li>

          {/* Users Management */}
          <li>
            <Link 
              to="/organization/users" 
              className={`nav-link ${isActive('/organization/users') ? 'active' : ''}`}
            >
              <div className="nav-icon-wrapper">
                <FaUsers className="nav-icon" />
              </div>
              <span className="nav-text">Users</span>
              <div className="nav-indicator"></div>
            </Link>
          </li>

          {/* Classes Management */}
          <li>
            <Link 
              to="/organization/courses" 
              className={`nav-link ${isActive('/organization/courses') ? 'active' : ''}`}
            >
              <div className="nav-icon-wrapper">
                <FaGraduationCap className="nav-icon" />
              </div>
              <span className="nav-text">Classes</span>
              <div className="nav-indicator"></div>
            </Link>
          </li>

          {/* Student Attendance */}
          <li>
            <Link 
              to="/organization/attendance" 
              className={`nav-link ${isActive('/organization/attendance') ? 'active' : ''}`}
            >
              <div className="nav-icon-wrapper">
                <FaClipboardCheck className="nav-icon" />
              </div>
              <span className="nav-text">Attendance</span>
              <div className="nav-indicator"></div>
            </Link>
          </li>

          {/* Session Recordings */}
          <li>
            <Link 
              to="/organization/recordings" 
              className={`nav-link ${isActive('/organization/recordings') ? 'active' : ''}`}
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
              to="/organization/tasks" 
              className={`nav-link ${isActive('/organization/tasks') ? 'active' : ''}`}
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
              className={`nav-link ${isParentActive(['/organization/blog']) ? 'active' : ''}`}
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
                <Link to="/organization/blog" className="submenu-link">
                  <div className="submenu-dot"></div>
                  <span>All Posts</span>
                </Link>
              </li>
              <li>
                <Link to="/organization/blog/create" className="submenu-link">
                  <div className="submenu-dot"></div>
                  <span>Create Post</span>
                </Link>
              </li>
            </ul>
          </li>

          {/* Analytics */}
          <li>
            <Link 
              to="/organization/analytics" 
              className={`nav-link ${isActive('/organization/analytics') ? 'active' : ''}`}
            >
              <div className="nav-icon-wrapper">
                <FaChartBar className="nav-icon" />
              </div>
              <span className="nav-text">Analytics</span>
              <div className="nav-indicator"></div>
            </Link>
          </li>

          {/* Payments */}
          <li>
            <Link 
              to="/organization/payments" 
              className={`nav-link ${isActive('/organization/payments') ? 'active' : ''}`}
            >
              <div className="nav-icon-wrapper">
                <FaMoneyBillWave className="nav-icon" />
              </div>
              <span className="nav-text">Payments</span>
              <div className="nav-indicator"></div>
            </Link>
          </li>

          {/* Payroll */}
          <li>
            <Link 
              to="/organization/payroll" 
              className={`nav-link ${isActive('/organization/payroll') ? 'active' : ''}`}
            >
              <div className="nav-icon-wrapper">
                <FaFileInvoiceDollar className="nav-icon" />
              </div>
              <span className="nav-text">Payroll</span>
              <div className="nav-indicator"></div>
            </Link>
          </li>

          {/* Settings */}
          <li>
            <Link 
              to="/organization/settings" 
              className={`nav-link ${isActive('/organization/settings') ? 'active' : ''}`}
            >
              <div className="nav-icon-wrapper">
                <FaCog className="nav-icon" />
              </div>
              <span className="nav-text">Settings</span>
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

export default AdminSidebar;

