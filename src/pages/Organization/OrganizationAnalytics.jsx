import { useState, useEffect } from 'react';
import { FaChartLine, FaUsers, FaGraduationCap, FaVideo, FaMoneyBillWave, FaSpinner } from 'react-icons/fa';
import { usersService, coursesService, recordingsService, paymentsService } from '../../services/firebaseService';
import './OrganizationAnalytics.css';

const OrganizationAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    users: { total: 0, students: 0, admins: 0, active: 0 },
    courses: { total: 0, active: 0, draft: 0 },
    recordings: { total: 0, thisMonth: 0 },
    payments: { total: 0, thisMonth: 0, revenue: 0 }
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [users, courses, recordings, payments] = await Promise.all([
        usersService.getAll(),
        coursesService.getAll(),
        recordingsService.getAll(),
        paymentsService.getAll()
      ]);

      const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      
      setAnalytics({
        users: {
          total: users.length,
          students: users.filter(u => u.role === 'student').length,
          admins: users.filter(u => u.role === 'admin').length,
          active: users.filter(u => u.status === 'active').length
        },
        courses: {
          total: courses.length,
          active: courses.filter(c => c.status === 'active').length,
          draft: courses.filter(c => c.status === 'draft').length
        },
        recordings: {
          total: recordings.length,
          thisMonth: recordings.filter(r => r.month === currentMonth).length
        },
        payments: {
          total: payments.length,
          thisMonth: payments.filter(p => {
            const paymentDate = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
            return paymentDate.getMonth() === new Date().getMonth() && 
                   paymentDate.getFullYear() === new Date().getFullYear();
          }).length,
          revenue: payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
        }
      });
    } catch (err) {
      setError('Failed to load analytics. Please try again.');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      label: 'Total Users',
      value: analytics.users.total,
      icon: FaUsers,
      color: 'blue',
      subItems: [
        { label: 'Students', value: analytics.users.students },
        { label: 'Admins', value: analytics.users.admins },
        { label: 'Active', value: analytics.users.active }
      ]
    },
    {
      label: 'Total Courses',
      value: analytics.courses.total,
      icon: FaGraduationCap,
      color: 'green',
      subItems: [
        { label: 'Active', value: analytics.courses.active },
        { label: 'Draft', value: analytics.courses.draft }
      ]
    },
    {
      label: 'Total Recordings',
      value: analytics.recordings.total,
      icon: FaVideo,
      color: 'purple',
      subItems: [
        { label: 'This Month', value: analytics.recordings.thisMonth }
      ]
    },
    {
      label: 'Total Revenue',
      value: `$${analytics.payments.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: FaMoneyBillWave,
      color: 'teal',
      subItems: [
        { label: 'Total Payments', value: analytics.payments.total },
        { label: 'This Month', value: analytics.payments.thisMonth }
      ]
    }
  ];

  return (
    <div className="organization-analytics-container">
      <div className="organization-analytics-card">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {/* Header */}
        <div className="organization-analytics-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaChartLine className="header-icon" />
            </div>
            <div>
              <h1 className="organization-analytics-title">Analytics & Reports</h1>
              <p className="organization-analytics-subtitle">View comprehensive analytics and insights</p>
            </div>
          </div>
          <button className="refresh-btn" onClick={loadAnalytics}>
            Refresh Data
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spinner" />
            <p>Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="analytics-stats-grid">
              {statsCards.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div key={index} className="analytics-stat-card">
                    <div className="stat-card-header">
                      <div className={`stat-icon-wrapper stat-${stat.color}`}>
                        <IconComponent className="stat-icon" />
                      </div>
                      <div className="stat-main">
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                      </div>
                    </div>
                    {stat.subItems && stat.subItems.length > 0 && (
                      <div className="stat-sub-items">
                        {stat.subItems.map((item, idx) => (
                          <div key={idx} className="stat-sub-item">
                            <span className="sub-label">{item.label}:</span>
                            <span className="sub-value">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Charts Section */}
            <div className="analytics-charts-section">
              <div className="chart-card">
                <h3 className="chart-title">User Growth</h3>
                <div className="chart-placeholder">
                  <p>Chart visualization would go here</p>
                  <p className="chart-note">Integrate with a charting library like Chart.js or Recharts</p>
                </div>
              </div>
              <div className="chart-card">
                <h3 className="chart-title">Revenue Trends</h3>
                <div className="chart-placeholder">
                  <p>Chart visualization would go here</p>
                  <p className="chart-note">Integrate with a charting library like Chart.js or Recharts</p>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="analytics-details-grid">
              <div className="details-card">
                <h3 className="details-title">Recent Activity</h3>
                <div className="activity-list">
                  <div className="activity-item">
                    <span>New users registered this week</span>
                    <span className="activity-value">{analytics.users.total}</span>
                  </div>
                  <div className="activity-item">
                    <span>Courses created this month</span>
                    <span className="activity-value">{analytics.courses.total}</span>
                  </div>
                  <div className="activity-item">
                    <span>Recordings uploaded</span>
                    <span className="activity-value">{analytics.recordings.total}</span>
                  </div>
                </div>
              </div>
              <div className="details-card">
                <h3 className="details-title">Quick Stats</h3>
                <div className="quick-stats-list">
                  <div className="quick-stat-item">
                    <span>Active Courses</span>
                    <span className="quick-stat-value">{analytics.courses.active}</span>
                  </div>
                  <div className="quick-stat-item">
                    <span>Active Users</span>
                    <span className="quick-stat-value">{analytics.users.active}</span>
                  </div>
                  <div className="quick-stat-item">
                    <span>This Month Recordings</span>
                    <span className="quick-stat-value">{analytics.recordings.thisMonth}</span>
                  </div>
                  <div className="quick-stat-item">
                    <span>This Month Payments</span>
                    <span className="quick-stat-value">{analytics.payments.thisMonth}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrganizationAnalytics;

