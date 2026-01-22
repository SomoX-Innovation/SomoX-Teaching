import { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaGraduationCap, 
  FaVideo, 
  FaTasks,
  FaBook,
  FaSpinner
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { usersService, coursesService, recordingsService, tasksService, blogService } from '../../services/firebaseService';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    courses: 0,
    recordings: 0,
    tasks: 0,
    pendingTasks: 0,
    blogPosts: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

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

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load counts and recent items in parallel
      const [
        usersCount, 
        coursesCount, 
        recordingsCount, 
        tasksCount, 
        blogPostsCount, 
        recentUsers,
        recentCourses,
        recentRecordings,
        recentTasks,
        allTasks
      ] = await Promise.all([
        usersService.getCount().catch(() => 0),
        coursesService.getCount().catch(() => 0),
        recordingsService.getCount().catch(() => 0),
        tasksService.getCount().catch(() => 0),
        blogService.getCount().catch(() => 0),
        // Load recent items for activities (limit to 5 most recent)
        usersService.getAll(5).catch(() => []),
        coursesService.getAll(5).catch(() => []),
        recordingsService.getAll(5).catch(() => []),
        tasksService.getAll(5).catch(() => []),
        // Load all tasks to calculate pending count
        tasksService.getAll(1000).catch(() => [])
      ]);

      // Calculate pending tasks
      const pendingTasks = allTasks.filter(t => 
        t.status === 'in-progress' || t.status === 'not-started' || t.status === 'pending'
      ).length;

      setStats({
        users: usersCount,
        courses: coursesCount,
        recordings: recordingsCount,
        tasks: tasksCount,
        pendingTasks: pendingTasks,
        blogPosts: blogPostsCount
      });

      // Build recent activities from real data
      const activities = [];
      
      // Recent students
      recentUsers.slice(0, 2).forEach(user => {
        activities.push({
          id: `user-${user.id}`,
          type: 'user',
          message: `New ${user.role || 'student'} registered: ${user.name || user.email}`,
          time: formatTimeAgo(user.createdAt),
          action: () => navigate('/teacher/users'),
          timestamp: user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt || 0)
        });
      });

      // Recent classes
      recentCourses.slice(0, 1).forEach(course => {
        activities.push({
          id: `course-${course.id}`,
          type: 'course',
          message: `Class ${course.status === 'published' ? 'published' : 'created'}: ${course.title || course.name || 'Untitled'}`,
          time: formatTimeAgo(course.createdAt || course.updatedAt),
          action: () => navigate('/teacher/courses'),
          timestamp: (course.createdAt || course.updatedAt)?.toDate ? (course.createdAt || course.updatedAt).toDate() : new Date(course.createdAt || course.updatedAt || 0)
        });
      });

      // Recent recordings
      recentRecordings.slice(0, 1).forEach(recording => {
        activities.push({
          id: `recording-${recording.id}`,
          type: 'recording',
          message: `New recording uploaded: ${recording.title || 'Untitled'}`,
          time: formatTimeAgo(recording.createdAt),
          action: () => navigate('/teacher/recordings'),
          timestamp: recording.createdAt?.toDate ? recording.createdAt.toDate() : new Date(recording.createdAt || 0)
        });
      });

      // Recent completed tasks
      const completedTasks = recentTasks.filter(t => t.status === 'completed').slice(0, 1);
      completedTasks.forEach(task => {
        activities.push({
          id: `task-${task.id}`,
          type: 'task',
          message: `Task completed: ${task.title || 'Untitled'}`,
          time: formatTimeAgo(task.updatedAt || task.createdAt),
          action: () => navigate('/teacher/tasks'),
          timestamp: (task.updatedAt || task.createdAt)?.toDate ? (task.updatedAt || task.createdAt).toDate() : new Date(task.updatedAt || task.createdAt || 0)
        });
      });

      // Teachers don't have access to payments, so skip payment activities

      // Sort activities by timestamp (most recent first) and limit to 5
      activities.sort((a, b) => b.timestamp - a.timestamp);
      setRecentActivities(activities.slice(0, 5));

    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const dashboardStats = [
    {
      label: 'Total Students',
      value: stats.users.toLocaleString(),
      icon: FaUsers,
      color: 'blue'
    },
    {
      label: 'Total Classes',
      value: stats.courses.toLocaleString(),
      icon: FaGraduationCap,
      color: 'green'
    },
    {
      label: 'Total Recordings',
      value: stats.recordings.toLocaleString(),
      icon: FaVideo,
      color: 'purple'
    },
    {
      label: 'Pending Tasks',
      value: stats.pendingTasks.toLocaleString(),
      icon: FaTasks,
      color: 'orange'
    },
    {
      label: 'Blog Posts',
      value: stats.blogPosts.toLocaleString(),
      icon: FaBook,
      color: 'pink'
    },
  ];

  if (loading) {
    return (
      <div className="teacher-dashboard-container">
        <div className="teacher-dashboard-card">
          <div className="loading-state" style={{ textAlign: 'center', padding: '3rem' }}>
            <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite', fontSize: '2rem', color: 'var(--primary)' }} />
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard-container">
      <div className="teacher-dashboard-card">
        {/* Header */}
        <div className="teacher-dashboard-header">
          <div className="header-content">
            <h2 className="teacher-dashboard-title">Teacher Dashboard</h2>
            <p className="teacher-dashboard-subtitle">Welcome back! Here's what's happening today.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="teacher-stats-grid">
          {dashboardStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="teacher-stat-card">
                <div className="stat-header">
                  <div className={`stat-icon-wrapper stat-${stat.color}`}>
                    <IconComponent className="stat-icon" />
                  </div>
                  <div className="stat-value">{stat.value}</div>
                </div>
                <div className="stat-body">
                  <div className="stat-label">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="teacher-content-grid">
          {/* Recent Activities */}
          <div className="teacher-card">
            <div className="teacher-card-header">
              <h3 className="teacher-card-title">Recent Activities</h3>
              <button className="view-all-btn">View All</button>
            </div>
            <div className="activities-list">
              {recentActivities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <p>No recent activities</p>
                </div>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="activity-item" onClick={activity.action} style={{ cursor: 'pointer' }}>
                    <div className={`activity-icon activity-${activity.type}`}>
                      {activity.type === 'user' && <FaUsers />}
                      {activity.type === 'course' && <FaGraduationCap />}
                      {activity.type === 'recording' && <FaVideo />}
                      {activity.type === 'task' && <FaTasks />}
                    </div>
                    <div className="activity-content">
                      <p className="activity-message">{activity.message}</p>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="teacher-card">
            <div className="teacher-card-header">
              <h3 className="teacher-card-title">Quick Actions</h3>
            </div>
            <div className="quick-actions-grid">
              <button className="quick-action-btn" onClick={() => navigate('/teacher/users')}>
                <FaUsers className="action-icon" />
                <span>Manage Students</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/teacher/courses')}>
                <FaGraduationCap className="action-icon" />
                <span>Manage Classes</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/teacher/recordings')}>
                <FaVideo className="action-icon" />
                <span>Manage Recordings</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/teacher/blog')}>
                <FaBook className="action-icon" />
                <span>Manage Blog</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/teacher/tasks')}>
                <FaTasks className="action-icon" />
                <span>Manage Tasks</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;

