import { useState, useEffect } from 'react';
import { 
  FaBuilding, 
  FaUserShield,
  FaSpinner,
  FaArrowRight,
  FaCheckCircle,
  FaTimesCircle,
  FaUsers,
  FaChalkboardTeacher,
  FaGraduationCap
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getDocuments, clearCache } from '../../services/firebaseService';
import { usersService } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    activeOrganizations: 0,
    inactiveOrganizations: 0,
    totalAdmins: 0,
    totalTeachers: 0,
    totalStudents: 0
  });
  const [recentOrganizations, setRecentOrganizations] = useState([]);

  useEffect(() => {
    if (!isSuperAdmin()) {
      navigate('/admin/dashboard');
      return;
    }
    loadDashboardData();
  }, [isSuperAdmin, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      clearCache('organizations');
      clearCache('users');
      
      // Load organizations and users
      const [organizations, allUsers] = await Promise.all([
        getDocuments('organizations', [], { field: 'createdAt', direction: 'desc' }, 1000, false).catch(() => []),
        usersService.getAll(1000, null, false).catch(() => [])
      ]);

      // Calculate stats
      const activeOrgs = organizations.filter(org => org.status === 'active').length;
      const inactiveOrgs = organizations.filter(org => org.status === 'inactive').length;
      const admins = allUsers.filter(u => u.role?.toLowerCase() === 'admin').length;
      const teachers = allUsers.filter(u => u.role?.toLowerCase() === 'teacher').length;
      const students = allUsers.filter(u => u.role?.toLowerCase() === 'student').length;

      setStats({
        totalOrganizations: organizations.length,
        activeOrganizations: activeOrgs,
        inactiveOrganizations: inactiveOrgs,
        totalAdmins: admins,
        totalTeachers: teachers,
        totalStudents: students
      });

      // Get recent organizations (last 5)
      setRecentOrganizations(organizations.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Recently';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return new Date(timestamp).toLocaleDateString();
  };

  const statCards = [
    {
      title: 'Total Organizations',
      value: stats.totalOrganizations,
      icon: FaBuilding,
      color: '#3b82f6',
      subtitle: `${stats.activeOrganizations} active, ${stats.inactiveOrganizations} inactive`
    },
    {
      title: 'Organization Admins',
      value: stats.totalAdmins,
      icon: FaUserShield,
      color: '#10b981',
      subtitle: 'Main administrators'
    },
    {
      title: 'Teachers',
      value: stats.totalTeachers,
      icon: FaChalkboardTeacher,
      color: '#f59e0b',
      subtitle: 'Teaching staff'
    },
    {
      title: 'Students',
      value: stats.totalStudents,
      icon: FaGraduationCap,
      color: '#8b5cf6',
      subtitle: 'Total enrolled'
    }
  ];

  if (loading) {
    return (
      <div className="superadmin-dashboard-container">
        <div className="loading-state">
          <FaSpinner className="spinner" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="superadmin-dashboard-container">
      <div className="superadmin-dashboard-card">
        {/* Header */}
        <div className="superadmin-dashboard-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaBuilding className="header-icon" />
            </div>
            <div>
              <h1 className="superadmin-dashboard-title">Super Admin Dashboard</h1>
              <p className="superadmin-dashboard-subtitle">
                Welcome back, {user?.name || 'Super Admin'}. Manage all organizations and platform settings.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="superadmin-stats-grid">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="superadmin-stat-card">
                <div className="stat-header">
                  <div className="stat-icon-wrapper" style={{ background: `${stat.color}15` }}>
                    <Icon className="stat-icon" style={{ color: stat.color }} />
                  </div>
                  <div className="stat-value">{stat.value}</div>
                </div>
                <div className="stat-content">
                  <div className="stat-label">{stat.title}</div>
                  <div className="stat-subtitle">{stat.subtitle}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            <button 
              className="quick-action-card"
              onClick={() => navigate('/superadmin/organizations')}
            >
              <FaBuilding className="action-icon" />
              <div className="action-content">
                <h3>Manage Organizations</h3>
                <p>Create, edit, and manage all organizations</p>
              </div>
              <FaArrowRight className="action-arrow" />
            </button>
            <button 
              className="quick-action-card"
              onClick={() => {
                const orgsPage = document.querySelector('[href="/superadmin/organizations"]');
                if (orgsPage) {
                  navigate('/superadmin/organizations');
                  setTimeout(() => {
                    const addButton = document.querySelector('.btn-primary');
                    if (addButton) addButton.click();
                  }, 500);
                }
              }}
            >
              <FaUserShield className="action-icon" />
              <div className="action-content">
                <h3>Create Organization Admin</h3>
                <p>Register a new organization and create its admin</p>
              </div>
              <FaArrowRight className="action-arrow" />
            </button>
          </div>
        </div>

        {/* Recent Organizations */}
        <div className="recent-section">
          <div className="section-header">
            <h2 className="section-title">Recent Organizations</h2>
            <button 
              className="btn-link"
              onClick={() => navigate('/superadmin/organizations')}
            >
              View All
              <FaArrowRight style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }} />
            </button>
          </div>
          {recentOrganizations.length === 0 ? (
            <div className="empty-state">
              <FaBuilding className="empty-icon" />
              <p>No organizations yet</p>
              <button 
                className="btn-primary"
                onClick={() => navigate('/superadmin/organizations')}
              >
                Create First Organization
              </button>
            </div>
          ) : (
            <div className="organizations-list">
              {recentOrganizations.map((org) => (
                <div key={org.id} className="organization-item">
                  <div className="org-info">
                    <div className="org-name-row">
                      <FaBuilding className="org-icon-small" />
                      <div className="org-name">{org.name}</div>
                    </div>
                    <div className="org-meta">
                      <span className={`org-status status-${org.status || 'active'}`}>
                        {org.status === 'active' ? <FaCheckCircle /> : <FaTimesCircle />}
                        {org.status || 'active'}
                      </span>
                      <span className="org-date">
                        Created {formatTimeAgo(org.createdAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    className="btn-view"
                    onClick={() => navigate('/superadmin/organizations')}
                    title="View Details"
                  >
                    View Details
                    <FaArrowRight style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform Overview */}
        <div className="platform-overview">
          <h2 className="section-title">Platform Overview</h2>
          <div className="overview-grid">
            <div className="overview-card">
              <h3>Organizations</h3>
              <div className="overview-stats">
                <div className="overview-stat">
                  <span className="stat-label">Total</span>
                  <span className="stat-value">{stats.totalOrganizations}</span>
                </div>
                <div className="overview-stat">
                  <span className="stat-label">Active</span>
                  <span className="stat-value success">{stats.activeOrganizations}</span>
                </div>
                <div className="overview-stat">
                  <span className="stat-label">Inactive</span>
                  <span className="stat-value warning">{stats.inactiveOrganizations}</span>
                </div>
              </div>
            </div>
            <div className="overview-card">
              <h3>Users</h3>
              <div className="overview-stats">
                <div className="overview-stat">
                  <span className="stat-label">Admins</span>
                  <span className="stat-value">{stats.totalAdmins}</span>
                </div>
                <div className="overview-stat">
                  <span className="stat-label">Teachers</span>
                  <span className="stat-value">{stats.totalTeachers}</span>
                </div>
                <div className="overview-stat">
                  <span className="stat-label">Students</span>
                  <span className="stat-value">{stats.totalStudents}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
