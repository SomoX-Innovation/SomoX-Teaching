import { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaGraduationCap, 
  FaVideo, 
  FaTasks,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaCalendar,
  FaBook,
  FaMoneyBillWave,
  FaSpinner
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { usersService, coursesService, recordingsService, tasksService, blogService, paymentsService } from '../../services/firebaseService';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    courses: 0,
    recordings: 0,
    tasks: 0,
    blogPosts: 0,
    revenue: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Use optimized count queries and only load payments for revenue calculation
      const [usersCount, coursesCount, recordingsCount, tasksCount, blogPostsCount, completedPayments] = await Promise.all([
        usersService.getCount().catch(() => 0),
        coursesService.getCount().catch(() => 0),
        recordingsService.getCount().catch(() => 0),
        tasksService.getCount().catch(() => 0),
        blogService.getCount().catch(() => 0),
        // Only load completed payments for revenue calculation (much smaller dataset)
        paymentsService.getByStatus('completed', 1000).catch(() => [])
      ]);

      const revenue = completedPayments
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

      setStats({
        users: usersCount,
        courses: coursesCount,
        recordings: recordingsCount,
        tasks: tasksCount,
        blogPosts: blogPostsCount,
        revenue: revenue
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const dashboardStats = [
    {
      label: 'Total Users',
      value: stats.users.toLocaleString(),
      change: '+12%',
      trend: 'up',
      icon: FaUsers,
      color: 'blue'
    },
    {
      label: 'Active Courses',
      value: stats.courses.toLocaleString(),
      change: '+5',
      trend: 'up',
      icon: FaGraduationCap,
      color: 'green'
    },
    {
      label: 'Total Recordings',
      value: stats.recordings.toLocaleString(),
      change: '+23',
      trend: 'up',
      icon: FaVideo,
      color: 'purple'
    },
    {
      label: 'Pending Tasks',
      value: stats.tasks.toLocaleString(),
      change: '-8',
      trend: 'down',
      icon: FaTasks,
      color: 'orange'
    },
    {
      label: 'Blog Posts',
      value: stats.blogPosts.toLocaleString(),
      change: '+4',
      trend: 'up',
      icon: FaBook,
      color: 'pink'
    },
    {
      label: 'Revenue',
      value: `$${(stats.revenue / 1000).toFixed(1)}K`,
      change: '+18%',
      trend: 'up',
      icon: FaMoneyBillWave,
      color: 'teal'
    }
  ];

  const recentActivities = [
    { id: 1, type: 'user', message: 'New student registered', time: '2 minutes ago', action: () => navigate('/admin/users') },
    { id: 2, type: 'course', message: 'Course published', time: '15 minutes ago', action: () => navigate('/admin/courses') },
    { id: 3, type: 'recording', message: 'New recording uploaded', time: '1 hour ago', action: () => navigate('/admin/recordings') },
    { id: 4, type: 'task', message: 'Task completed', time: '2 hours ago', action: () => navigate('/admin/tasks') },
    { id: 5, type: 'payment', message: `Payment received: $${stats.revenue.toFixed(2)}`, time: '3 hours ago', action: () => navigate('/admin/payments') }
  ];

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <div className="admin-dashboard-card">
          <div className="loading-state" style={{ textAlign: 'center', padding: '3rem' }}>
            <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite', fontSize: '2rem', color: 'var(--primary)' }} />
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-card">
        {/* Header */}
        <div className="admin-dashboard-header">
          <div className="header-content">
            <h2 className="admin-dashboard-title">Admin Dashboard</h2>
            <p className="admin-dashboard-subtitle">Welcome back! Here's what's happening today.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="admin-stats-grid">
          {dashboardStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="admin-stat-card">
                <div className="stat-header">
                  <div className={`stat-icon-wrapper stat-${stat.color}`}>
                    <IconComponent className="stat-icon" />
                  </div>
                  <div className={`stat-trend stat-trend-${stat.trend}`}>
                    {stat.trend === 'up' ? <FaArrowUp /> : <FaArrowDown />}
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div className="stat-body">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="admin-content-grid">
          {/* Recent Activities */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">Recent Activities</h3>
              <button className="view-all-btn">View All</button>
            </div>
            <div className="activities-list">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="activity-item" onClick={activity.action} style={{ cursor: 'pointer' }}>
                  <div className={`activity-icon activity-${activity.type}`}>
                    {activity.type === 'user' && <FaUsers />}
                    {activity.type === 'course' && <FaGraduationCap />}
                    {activity.type === 'recording' && <FaVideo />}
                    {activity.type === 'task' && <FaTasks />}
                    {activity.type === 'payment' && <FaMoneyBillWave />}
                  </div>
                  <div className="activity-content">
                    <p className="activity-message">{activity.message}</p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">Quick Actions</h3>
            </div>
            <div className="quick-actions-grid">
              <button className="quick-action-btn" onClick={() => navigate('/admin/users')}>
                <FaUsers className="action-icon" />
                <span>Manage Users</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/admin/courses')}>
                <FaGraduationCap className="action-icon" />
                <span>Manage Courses</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/admin/recordings')}>
                <FaVideo className="action-icon" />
                <span>Manage Recordings</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/admin/blog')}>
                <FaBook className="action-icon" />
                <span>Manage Blog</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/admin/tasks')}>
                <FaTasks className="action-icon" />
                <span>Manage Tasks</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/admin/analytics')}>
                <FaChartLine className="action-icon" />
                <span>View Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

