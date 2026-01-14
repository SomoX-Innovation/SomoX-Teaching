import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FaHome, 
  FaChevronRight, 
  FaVideo,
  FaPlay,
  FaCheckCircle,
  FaList,
  FaSpinner,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { recordingsService, usersService } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
import './MonthSessionRecordings.css';

const MonthSessionRecordings = () => {
  const { user } = useAuth();
  const { month } = useParams();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [userBatches, setUserBatches] = useState([]);
  const [stats, setStats] = useState({
    totalSessions: 0
  });

  const formattedMonth = month ? decodeURIComponent(month) : '';

  useEffect(() => {
    loadUserBatches();
  }, [user]);

  useEffect(() => {
    if (formattedMonth && (userBatches.length > 0 || user?.role === 'admin')) {
      loadSessions();
    }
  }, [formattedMonth, userBatches, user]);

  const loadUserBatches = async () => {
    if (!user?.uid) return;
    try {
      const userDoc = await usersService.getById(user.uid);
      setUserBatches(userDoc.batchIds || []);
    } catch (err) {
      console.error('Error loading user batches:', err);
      setUserBatches([]);
    }
  };

  const hasAccessToRecording = (recording) => {
    // Admins can see all recordings
    if (user?.role === 'admin') return true;
    
    // If recording has no batchIds, it's accessible to all
    if (!recording.batchIds || recording.batchIds.length === 0) return true;
    
    // Check if user's batches overlap with recording's batches
    return userBatches.some(batchId => recording.batchIds.includes(batchId));
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      const allRecordings = await recordingsService.getByMonth(formattedMonth);
      
      // Filter recordings by batch access
      const accessibleRecordings = allRecordings.filter(hasAccessToRecording);
      
      const sessionsList = accessibleRecordings.map(recording => ({
        id: recording.id,
        week: recording.week || 'Session',
        title: recording.title || `${formattedMonth}-${recording.week || 'Session'}`,
        type: recording.type || 'Session Recording',
        status: recording.status || 'active',
        readyToWatch: recording.status === 'active' && !!recording.videoUrl,
        topics: Array.isArray(recording.topics) ? recording.topics : 
               (recording.topics ? recording.topics.split(',').map(t => t.trim()) : []),
        videoUrl: recording.videoUrl || recording.googleDriveLink || '', // Support both videoUrl and googleDriveLink
        description: recording.description || '',
        date: recording.date || '',
        duration: recording.duration || ''
      }));

      setSessions(sessionsList);
      setStats({
        totalSessions: sessionsList.length
      });
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonthName = (monthId) => {
    const parts = monthId.split('-');
    if (parts.length === 2) {
      return `${parts[1]} ${parts[0]}`;
    }
    return monthId;
  };

  const handleWatchNow = (session) => {
    if (session.videoUrl) {
      // Open Google Drive link in new tab
      window.open(session.videoUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'active' || status === 'full-access') {
      return (
        <div className="status-badge status-full-access">
          <FaCheckCircle className="status-icon" />
          Full Access
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="month-sessions-container">
        <div className="month-sessions-card">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite', fontSize: '2rem', color: 'var(--primary)' }} />
            <p>Loading sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      label: 'Total Sessions',
      value: stats.totalSessions.toString(),
      icon: FaVideo,
      color: 'gray'
    },
    {
      label: 'Status',
      value: sessions.length > 0 && sessions[0].status === 'active' ? 'Full Access' : 'Limited',
      icon: FaCheckCircle,
      color: 'green'
    }
  ];

  return (
    <div className="month-sessions-container">
      <div className="month-sessions-card">
        {/* Header */}
        <div className="month-sessions-header">
          <div className="header-top">
            {/* Breadcrumb */}
            <nav className="month-breadcrumb" aria-label="Breadcrumb">
              <ol className="breadcrumb-list">
                <li className="breadcrumb-item">
                  <div className="breadcrumb-content">
                    <FaHome className="breadcrumb-icon" />
                    <Link to="/dashboard" className="breadcrumb-link">Dashboard</Link>
                  </div>
                </li>
                <li className="breadcrumb-item">
                  <div className="breadcrumb-content">
                    <FaChevronRight className="breadcrumb-separator" />
                    <Link to="/dashboard/student-session-recording" className="breadcrumb-link">
                      Student-session-recording
                    </Link>
                  </div>
                </li>
                <li className="breadcrumb-item">
                  <div className="breadcrumb-content">
                    <FaChevronRight className="breadcrumb-separator" />
                    <span className="breadcrumb-text">{formatMonthName(formattedMonth)}</span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>

          {/* Stats Cards */}
          <div className="month-stats-grid">
            {statsCards.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="month-stat-card">
                  <div className="stat-content">
                    <div className="stat-info">
                      <p className="stat-label">{stat.label}</p>
                      <p className={`stat-value stat-value-${stat.color}`}>{stat.value}</p>
                    </div>
                    <div className={`stat-icon-wrapper stat-icon-${stat.color}`}>
                      <IconComponent className="stat-icon" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="month-sessions-scroll">
          {sessions.length === 0 ? (
            <div className="month-empty-state">
              <FaVideo className="empty-icon" />
              <p className="empty-message">No sessions available for this month.</p>
            </div>
          ) : (
            <div className="month-sessions-grid">
              {sessions.map((session) => (
                <div key={session.id} className="month-session-card">
                  <div className="session-card-top">
                    {getStatusBadge(session.status)}
                  </div>
                  
                  <div className="session-card-content">
                    <div className="session-header">
                      <div className="session-icon-wrapper">
                        <FaVideo className="session-icon" />
                      </div>
                      <div className="session-title-group">
                        <h3 className="session-title">{session.title}</h3>
                        <div className="session-type">
                          <FaVideo className="type-icon" />
                          <span>{session.type}</span>
                        </div>
                      </div>
                    </div>
                    
                    {session.description && (
                      <p className="session-description">{session.description}</p>
                    )}

                    {session.topics && session.topics.length > 0 && (
                      <div className="session-topics-section">
                        <div className="topics-header">
                          <FaList className="topics-icon" />
                          <span className="topics-label">Topics Covered</span>
                        </div>
                        <div className="topics-list">
                          {session.topics.map((topic, index) => (
                            <div key={index} className="topic-item">
                              <div className="topic-dot"></div>
                              <p className="topic-text">{topic}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="session-card-footer">
                    <div className="session-status">
                      <span className={`status-dot ${session.readyToWatch ? 'ready' : ''}`}></span>
                      <span className="status-text">
                        {session.readyToWatch ? 'Ready to watch' : 'Not available'}
                      </span>
                    </div>
                    <button 
                      type="button" 
                      className="watch-btn"
                      onClick={() => handleWatchNow(session)}
                      disabled={!session.readyToWatch}
                    >
                      <FaPlay className="watch-icon" />
                      {session.readyToWatch ? 'Watch on Google Drive' : 'Not Available'}
                      {session.readyToWatch && <FaExternalLinkAlt style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthSessionRecordings;
