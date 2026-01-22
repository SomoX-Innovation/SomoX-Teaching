import { useState, useEffect } from 'react';
import { FaChartLine, FaUsers, FaGraduationCap, FaVideo, FaMoneyBillWave, FaSpinner, FaTasks, FaBook, FaChalkboardTeacher } from 'react-icons/fa';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { usersService, coursesService, recordingsService, paymentsService, tasksService, blogService } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
import './OrganizationAnalytics.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const OrganizationAnalytics = () => {
  const { getOrganizationId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    users: { total: 0, students: 0, teachers: 0, admins: 0, active: 0, thisWeek: 0, thisMonth: 0 },
    courses: { total: 0, active: 0, draft: 0, thisMonth: 0 },
    recordings: { total: 0, thisMonth: 0, active: 0 },
    tasks: { total: 0, pending: 0, completed: 0, inProgress: 0 },
    blogPosts: { total: 0, published: 0, draft: 0 },
    payments: { total: 0, thisMonth: 0, revenue: 0, thisMonthRevenue: 0 }
  });
  const [chartData, setChartData] = useState({
    userGrowth: null,
    revenueTrends: null
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  // Prepare user growth chart data (last 6 months)
  const prepareUserGrowthChart = (users) => {
    const now = new Date();
    const months = [];
    const userCounts = [];
    const studentCounts = [];
    const teacherCounts = [];

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      months.push(monthLabel);

      // Count users created up to this month
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const usersUpToMonth = users.filter(u => {
        const userDate = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt || 0);
        return userDate <= monthEnd;
      });
      
      userCounts.push(usersUpToMonth.length);
      studentCounts.push(usersUpToMonth.filter(u => {
        const role = u.role ? u.role.toLowerCase() : 'student';
        return role === 'student';
      }).length);
      teacherCounts.push(usersUpToMonth.filter(u => {
        const role = u.role ? u.role.toLowerCase() : '';
        return role === 'teacher' || role === 'instructor';
      }).length);
    }

    return {
      labels: months,
      datasets: [
        {
          label: 'Total Users',
          data: userCounts,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Students',
          data: studentCounts,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Teachers',
          data: teacherCounts,
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  };

  // Prepare revenue trends chart data (last 6 months)
  const prepareRevenueTrendsChart = (payments) => {
    const now = new Date();
    const months = [];
    const revenueData = [];
    const paymentCounts = [];

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      months.push(monthLabel);

      // Filter payments for this month
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      
      const monthPayments = payments.filter(p => {
        const paymentDate = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt || 0);
        return paymentDate >= monthStart && paymentDate <= monthEnd;
      });

      const completedMonthPayments = monthPayments.filter(p => 
        p.status === 'completed' || p.status === 'paid'
      );

      const monthRevenue = completedMonthPayments.reduce((sum, p) => 
        sum + (parseFloat(p.amount) || 0), 0
      );

      revenueData.push(monthRevenue);
      paymentCounts.push(completedMonthPayments.length);
    }

    return {
      labels: months,
      datasets: [
        {
          label: 'Revenue ($)',
          data: revenueData,
          backgroundColor: 'rgba(20, 184, 166, 0.8)',
          borderColor: 'rgb(20, 184, 166)',
          borderWidth: 2,
          borderRadius: 4
        },
        {
          label: 'Payment Count',
          data: paymentCounts,
          backgroundColor: 'rgba(6, 182, 212, 0.6)',
          borderColor: 'rgb(6, 182, 212)',
          borderWidth: 2,
          borderRadius: 4
        }
      ]
    };
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const orgId = getOrganizationId();
      
      if (!orgId) {
        setError('Organization ID is missing');
        setLoading(false);
        return;
      }

      // Load all data with caching for faster performance
      const [allUsers, allCourses, allRecordings, allPayments, allTasks, allBlogPosts] = await Promise.all([
        usersService.getAll(1000, orgId, true).catch(() => []),
        coursesService.getAll(1000, orgId, true).catch(() => []),
        recordingsService.getAll(1000, orgId, true).catch(() => []),
        paymentsService.getAll(1000, orgId, true).catch(() => []),
        tasksService.getAll(1000, orgId, true).catch(() => []),
        blogService.getAll(1000, orgId, true).catch(() => [])
      ]);

      const now = new Date();
      const currentMonth = now.toLocaleString('default', { month: 'long', year: 'numeric' });
      const currentMonthNum = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Calculate week range (last 7 days)
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      // Calculate month range
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      // Process users
      const users = allUsers || [];
      const students = users.filter(u => {
        const role = u.role ? u.role.toLowerCase() : 'student';
        return role === 'student';
      });
      const teachers = users.filter(u => {
        const role = u.role ? u.role.toLowerCase() : '';
        return role === 'teacher' || role === 'instructor';
      });
      const admins = users.filter(u => {
        const role = u.role ? u.role.toLowerCase() : '';
        return role === 'admin';
      });
      
      // Calculate user growth
      const usersThisWeek = users.filter(u => {
        const userDate = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt || 0);
        return userDate >= weekAgo;
      }).length;
      
      const usersThisMonth = users.filter(u => {
        const userDate = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt || 0);
        return userDate >= monthAgo;
      }).length;

      // Process courses
      const courses = allCourses || [];
      const coursesThisMonth = courses.filter(c => {
        const courseDate = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt || 0);
        return courseDate.getMonth() === currentMonthNum && courseDate.getFullYear() === currentYear;
      }).length;

      // Process recordings
      const recordings = allRecordings || [];
      const recordingsThisMonth = recordings.filter(r => {
        if (r.month === currentMonth) return true;
        const recordingDate = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt || 0);
        return recordingDate.getMonth() === currentMonthNum && recordingDate.getFullYear() === currentYear;
      }).length;

      // Process payments
      const payments = allPayments || [];
      const completedPayments = payments.filter(p => p.status === 'completed' || p.status === 'paid');
      const paymentsThisMonth = payments.filter(p => {
        const paymentDate = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt || 0);
        return paymentDate.getMonth() === currentMonthNum && paymentDate.getFullYear() === currentYear;
      });
      const revenue = completedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      const thisMonthRevenue = paymentsThisMonth
        .filter(p => p.status === 'completed' || p.status === 'paid')
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

      // Process tasks
      const tasks = allTasks || [];
      const pendingTasks = tasks.filter(t => 
        t.status === 'pending' || t.status === 'not-started' || !t.status
      );
      const inProgressTasks = tasks.filter(t => t.status === 'in-progress' || t.status === 'in_progress');
      const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'done');

      // Process blog posts
      const blogPosts = allBlogPosts || [];
      const publishedPosts = blogPosts.filter(p => p.status === 'published');
      const draftPosts = blogPosts.filter(p => p.status === 'draft' || !p.status);

      // Prepare chart data
      const userGrowthData = prepareUserGrowthChart(users);
      const revenueTrendsData = prepareRevenueTrendsChart(payments);

      setChartData({
        userGrowth: userGrowthData,
        revenueTrends: revenueTrendsData
      });

      setAnalytics({
        users: {
          total: users.length,
          students: students.length,
          teachers: teachers.length,
          admins: admins.length,
          active: users.filter(u => u.status === 'active').length,
          thisWeek: usersThisWeek,
          thisMonth: usersThisMonth
        },
        courses: {
          total: courses.length,
          active: courses.filter(c => c.status === 'active' || c.status === 'published').length,
          draft: courses.filter(c => c.status === 'draft').length,
          thisMonth: coursesThisMonth
        },
        recordings: {
          total: recordings.length,
          thisMonth: recordingsThisMonth,
          active: recordings.filter(r => r.status === 'active').length
        },
        tasks: {
          total: tasks.length,
          pending: pendingTasks.length,
          completed: completedTasks.length,
          inProgress: inProgressTasks.length
        },
        blogPosts: {
          total: blogPosts.length,
          published: publishedPosts.length,
          draft: draftPosts.length
        },
        payments: {
          total: payments.length,
          thisMonth: paymentsThisMonth.length,
          revenue: revenue,
          thisMonthRevenue: thisMonthRevenue
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
        { label: 'Teachers', value: analytics.users.teachers },
        { label: 'Admins', value: analytics.users.admins },
        { label: 'Active', value: analytics.users.active },
        { label: 'This Week', value: analytics.users.thisWeek },
        { label: 'This Month', value: analytics.users.thisMonth }
      ]
    },
    {
      label: 'Total Courses',
      value: analytics.courses.total,
      icon: FaGraduationCap,
      color: 'green',
      subItems: [
        { label: 'Active', value: analytics.courses.active },
        { label: 'Draft', value: analytics.courses.draft },
        { label: 'This Month', value: analytics.courses.thisMonth }
      ]
    },
    {
      label: 'Total Recordings',
      value: analytics.recordings.total,
      icon: FaVideo,
      color: 'purple',
      subItems: [
        { label: 'Active', value: analytics.recordings.active },
        { label: 'This Month', value: analytics.recordings.thisMonth }
      ]
    },
    {
      label: 'Total Tasks',
      value: analytics.tasks.total,
      icon: FaTasks,
      color: 'orange',
      subItems: [
        { label: 'Pending', value: analytics.tasks.pending },
        { label: 'In Progress', value: analytics.tasks.inProgress },
        { label: 'Completed', value: analytics.tasks.completed }
      ]
    },
    {
      label: 'Blog Posts',
      value: analytics.blogPosts.total,
      icon: FaBook,
      color: 'indigo',
      subItems: [
        { label: 'Published', value: analytics.blogPosts.published },
        { label: 'Draft', value: analytics.blogPosts.draft }
      ]
    },
    {
      label: 'Total Revenue',
      value: `$${analytics.payments.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: FaMoneyBillWave,
      color: 'teal',
      subItems: [
        { label: 'Total Payments', value: analytics.payments.total },
        { label: 'This Month', value: analytics.payments.thisMonth },
        { label: 'This Month Revenue', value: `$${analytics.payments.thisMonthRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
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
                <h3 className="chart-title">User Growth (Last 6 Months)</h3>
                {chartData.userGrowth ? (
                  <div className="chart-container">
                    <Line
                      data={chartData.userGrowth}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                            labels: {
                              usePointStyle: true,
                              padding: 15,
                              font: {
                                size: 12
                              }
                            }
                          },
                          tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            titleFont: {
                              size: 14,
                              weight: 'bold'
                            },
                            bodyFont: {
                              size: 13
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            grid: {
                              color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                              stepSize: 1
                            }
                          },
                          x: {
                            grid: {
                              display: false
                            }
                          }
                        },
                        interaction: {
                          mode: 'nearest',
                          axis: 'x',
                          intersect: false
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="chart-placeholder">
                    <FaSpinner className="spinner" />
                    <p>Loading chart data...</p>
                  </div>
                )}
                <div className="chart-summary">
                  <div className="summary-item">
                    <span className="summary-label">Total Users:</span>
                    <span className="summary-value">{analytics.users.total}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">This Month:</span>
                    <span className="summary-value positive">+{analytics.users.thisMonth}</span>
                  </div>
                </div>
              </div>
              <div className="chart-card">
                <h3 className="chart-title">Revenue & Payments (Last 6 Months)</h3>
                {chartData.revenueTrends ? (
                  <div className="chart-container">
                    <Bar
                      data={chartData.revenueTrends}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                            labels: {
                              usePointStyle: true,
                              padding: 15,
                              font: {
                                size: 12
                              }
                            }
                          },
                          tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            callbacks: {
                              label: function(context) {
                                if (context.dataset.label === 'Revenue ($)') {
                                  return `Revenue: $${context.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                }
                                return `${context.dataset.label}: ${context.parsed.y}`;
                              }
                            },
                            titleFont: {
                              size: 14,
                              weight: 'bold'
                            },
                            bodyFont: {
                              size: 13
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            grid: {
                              color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                              callback: function(value) {
                                return '$' + value.toLocaleString();
                              }
                            }
                          },
                          x: {
                            grid: {
                              display: false
                            }
                          }
                        },
                        interaction: {
                          mode: 'nearest',
                          axis: 'x',
                          intersect: false
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="chart-placeholder">
                    <FaSpinner className="spinner" />
                    <p>Loading chart data...</p>
                  </div>
                )}
                <div className="chart-summary">
                  <div className="summary-item">
                    <span className="summary-label">Total Revenue:</span>
                    <span className="summary-value revenue">${analytics.payments.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">This Month:</span>
                    <span className="summary-value revenue">${analytics.payments.thisMonthRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
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
                    <span className="activity-value positive">{analytics.users.thisWeek}</span>
                  </div>
                  <div className="activity-item">
                    <span>New users registered this month</span>
                    <span className="activity-value positive">{analytics.users.thisMonth}</span>
                  </div>
                  <div className="activity-item">
                    <span>Courses created this month</span>
                    <span className="activity-value">{analytics.courses.thisMonth}</span>
                  </div>
                  <div className="activity-item">
                    <span>Recordings uploaded this month</span>
                    <span className="activity-value">{analytics.recordings.thisMonth}</span>
                  </div>
                  <div className="activity-item">
                    <span>Payments received this month</span>
                    <span className="activity-value">{analytics.payments.thisMonth}</span>
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
                    <span>Active Recordings</span>
                    <span className="quick-stat-value">{analytics.recordings.active}</span>
                  </div>
                  <div className="quick-stat-item">
                    <span>Pending Tasks</span>
                    <span className="quick-stat-value warning">{analytics.tasks.pending}</span>
                  </div>
                  <div className="quick-stat-item">
                    <span>In Progress Tasks</span>
                    <span className="quick-stat-value">{analytics.tasks.inProgress}</span>
                  </div>
                  <div className="quick-stat-item">
                    <span>Completed Tasks</span>
                    <span className="quick-stat-value success">{analytics.tasks.completed}</span>
                  </div>
                  <div className="quick-stat-item">
                    <span>Published Blog Posts</span>
                    <span className="quick-stat-value">{analytics.blogPosts.published}</span>
                  </div>
                  <div className="quick-stat-item">
                    <span>This Month Revenue</span>
                    <span className="quick-stat-value revenue">${analytics.payments.thisMonthRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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

