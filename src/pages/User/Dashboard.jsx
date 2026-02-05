import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaHome, 
  FaTasks, 
  FaVideo, 
  FaCalendar,
  FaCheckCircle,
  FaClock,
  FaSpinner,
  FaArrowRight,
  FaPlay,
  FaMoneyBillWave,
  FaLock,
  FaExclamationCircle,
  FaChalkboardTeacher
} from 'react-icons/fa';
import { tasksService, recordingsService, zoomSessionsService, paymentsService, usersService } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalRecordings: 0,
    upcomingSessions: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState({
    currentMonthPaid: false,
    currentMonth: ''
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load user data first to get batchIds
      let userBatches = [];
      if (user?.uid) {
        try {
          const userDoc = await usersService.getById(user.uid);
          userBatches = userDoc.batchIds || [];
        } catch (err) {
          console.error('Error loading user batches:', err);
        }
      }
      
      // Load ALL necessary data to get accurate counts
      // Load all user's tasks for accurate stats
      // Load all recordings to get accurate count (filtered by batchIds)
      // Load upcoming sessions (already filtered server-side)
      // Load user payments for payment status check
      const [allTasks, allRecordings, sessions, payments] = await Promise.all([
        user?.uid ? tasksService.getByUser(user.uid, 1000).catch(() => []) : Promise.resolve([]),
        // Load all recordings to get accurate count (use higher limit for real data)
        recordingsService.getAll(1000).catch(() => []),
        // Already filtered to upcoming, limit to 10 for display
        zoomSessionsService.getUpcoming(10).catch(() => []),
        user?.uid ? paymentsService.getByUser(user.uid, 100).catch(() => []) : Promise.resolve([])
      ]);

      // Calculate accurate task stats from ALL tasks
      const completedTasks = allTasks.filter(t => t.status === 'completed').length;
      const pendingTasks = allTasks.filter(t => t.status === 'in-progress' || t.status === 'not-started').length;
      
      // Filter accessible recordings from ALL recordings
      // Recordings without batchIds are accessible to all users
      // Recordings with batchIds are only accessible if user's batches match
      const accessibleRecordings = allRecordings.filter(recording => {
        // If recording has no batchIds or empty batchIds array, it's accessible to all
        if (!recording.batchIds || recording.batchIds.length === 0) {
          return true;
        }
        // If user has no batches, they can only see recordings without batch restrictions
        if (!userBatches || userBatches.length === 0) {
          return false;
        }
        // Check if user's batches overlap with recording's batches
        return userBatches.some(batchId => recording.batchIds.includes(batchId));
      });

      // Set accurate stats from real data
      setStats({
        totalTasks: allTasks.length,
        completedTasks,
        pendingTasks,
        totalRecordings: accessibleRecordings.length,
        upcomingSessions: sessions.length
      });

      // Get recent tasks (last 5) - tasks are already sorted by createdAt desc
      // Sort by assignedDate if available, otherwise use createdAt
      const sortedTasks = [...allTasks].sort((a, b) => {
        const dateA = a.assignedDate?.toDate ? a.assignedDate.toDate() : 
                     (a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.assignedDate || a.createdAt || 0));
        const dateB = b.assignedDate?.toDate ? b.assignedDate.toDate() : 
                     (b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.assignedDate || b.createdAt || 0));
        return dateB - dateA;
      });
      setRecentTasks(sortedTasks.slice(0, 5));

      // Get upcoming sessions (next 3) - already sorted
      setUpcomingSessions(sessions.slice(0, 3));

      // Check payment status for current month
      const now = new Date();
      const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
      const currentYear = now.getFullYear().toString();
      
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const currentMonthName = monthNames[now.getMonth()];
      
      const hasPaid = payments.some(payment => {
        return payment.status === 'completed' && 
               payment.year === currentYear && 
               payment.month === currentMonth;
      });

      setPaymentStatus({
        currentMonthPaid: hasPaid,
        currentMonth: `${currentMonthName} ${currentYear}`
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getTaskStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle style={{ color: '#10b981' }} />;
      case 'in-progress':
        return <FaClock style={{ color: '#f59e0b' }} />;
      default:
        return <FaExclamationCircle style={{ color: '#ef4444' }} />;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-card">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite', fontSize: '2rem', color: 'var(--primary)' }} />
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <h2 className="dashboard-title gradient-text">Dashboard</h2>
            <p className="dashboard-subtitle">Welcome back, {user?.name || 'Student'}!</p>
          </div>
          
          {/* Breadcrumb */}
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb-list">
              <li className="breadcrumb-item">
                <div className="breadcrumb-content">
                  <FaHome className="breadcrumb-icon" />
                  <span className="breadcrumb-text">Dashboard</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Payment Status Alert */}
        {!paymentStatus.currentMonthPaid && (
          <div style={{
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            background: '#fef2f2',
            border: '2px solid #fecaca',
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <FaLock style={{ fontSize: '1.5rem', color: '#ef4444', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#991b1b', marginBottom: '0.25rem' }}>
                Payment Required
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#7f1d1d', margin: 0 }}>
                Complete payment for <strong>{paymentStatus.currentMonth}</strong> to access all features including recordings and AI Assistant.
              </p>
            </div>
          </div>
        )}

        {/* Divide class tutes - separate button */}
        <Link to="/dashboard/my-tutor" className="dashboard-divide-tutes-btn">
          <FaChalkboardTeacher className="divide-tutes-icon" />
          <span>Divide class tutes</span>
          <FaArrowRight className="divide-tutes-arrow" />
        </Link>

        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon-wrapper blue">
              <FaTasks className="stat-icon" />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalTasks}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper green">
              <FaCheckCircle className="stat-icon" />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.completedTasks}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper orange">
              <FaClock className="stat-icon" />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.pendingTasks}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper purple">
              <FaVideo className="stat-icon" />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalRecordings}</div>
              <div className="stat-label">Recordings</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper pink">
              <FaCalendar className="stat-icon" />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.upcomingSessions}</div>
              <div className="stat-label">Upcoming Sessions</div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
          {/* Recent Tasks */}
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Recent Tasks</h3>
              <Link 
                to="/dashboard/student-tasks" 
                style={{ 
                  fontSize: '0.875rem', 
                  color: '#3b82f6', 
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                View All
                <FaArrowRight style={{ fontSize: '0.75rem' }} />
              </Link>
            </div>
            {recentTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <FaTasks style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ fontSize: '0.875rem' }}>No tasks assigned yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentTasks.map((task) => (
                  <div 
                    key={task.id}
                    style={{
                      padding: '0.75rem',
                      background: '#f9fafb',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    {getTaskStatusIcon(task.status)}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '500', 
                        color: '#111827',
                        margin: 0,
                        marginBottom: '0.25rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {task.title}
                      </h4>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: '#6b7280',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {task.status === 'completed' ? 'Completed' : task.status === 'in-progress' ? 'In Progress' : 'Not Started'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Sessions */}
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Upcoming Sessions</h3>
              <Link 
                to="/dashboard/zoom-sessions" 
                style={{ 
                  fontSize: '0.875rem', 
                  color: '#3b82f6', 
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                View All
                <FaArrowRight style={{ fontSize: '0.75rem' }} />
              </Link>
            </div>
            {upcomingSessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <FaCalendar style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ fontSize: '0.875rem' }}>No upcoming sessions</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {upcomingSessions.map((session) => (
                  <div 
                    key={session.id}
                    style={{
                      padding: '0.75rem',
                      background: '#f9fafb',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <h4 style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '500', 
                      color: '#111827',
                      margin: 0,
                      marginBottom: '0.5rem'
                    }}>
                      {session.title}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                      {session.date && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaCalendar />
                          <span>{session.date}</span>
                        </div>
                      )}
                      {session.time && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaClock />
                          <span>{session.time}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>Quick Links</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Link 
              to="/dashboard/student-session-recording"
              style={{
                padding: '1rem 1.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '0.75rem',
                color: 'white',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'transform 0.2s',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <FaVideo style={{ fontSize: '1.25rem' }} />
              <span style={{ fontWeight: '500' }}>Session Recordings</span>
            </Link>
            <Link 
              to="/dashboard/student-tasks"
              style={{
                padding: '1rem 1.5rem',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '0.75rem',
                color: 'white',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'transform 0.2s',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <FaTasks style={{ fontSize: '1.25rem' }} />
              <span style={{ fontWeight: '500' }}>My Tasks</span>
            </Link>
            <Link 
              to="/dashboard/chatgpt"
              style={{
                padding: '1rem 1.5rem',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                borderRadius: '0.75rem',
                color: 'white',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'transform 0.2s',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <FaPlay style={{ fontSize: '1.25rem' }} />
              <span style={{ fontWeight: '500' }}>AI Assistant</span>
            </Link>
            <Link 
              to="/dashboard/zoom-sessions"
              style={{
                padding: '1rem 1.5rem',
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                borderRadius: '0.75rem',
                color: 'white',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'transform 0.2s',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <FaCalendar style={{ fontSize: '1.25rem' }} />
              <span style={{ fontWeight: '500' }}>Zoom Sessions</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
