import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaHome, 
  FaChevronRight, 
  FaVideo, 
  FaCalendar,
  FaGraduationCap,
  FaExclamationTriangle,
  FaClock,
  FaCheckCircle,
  FaSpinner
} from 'react-icons/fa';
import { zoomSessionsService } from '../../services/firebaseService';
import './ZoomSessions.css';

const ZoomSessions = () => {
  const [filter, setFilter] = useState('all');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    ongoing: 0,
    upcoming: 0
  });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const allSessions = await zoomSessionsService.getAll();
      
      const sessionsList = allSessions.map(session => ({
        id: session.id,
        title: session.title || 'Untitled Session',
        description: session.description || '',
        status: session.status || 'ended',
        date: session.date || '',
        time: session.time || '',
        meetingId: session.meetingId || '',
        passcode: session.passcode || '',
        meetingUrl: session.meetingUrl || ''
      }));

      setSessions(sessionsList);
      
      const ongoing = sessionsList.filter(s => s.status === 'ongoing').length;
      const upcoming = sessionsList.filter(s => s.status === 'upcoming').length;
      
      setStats({
        total: sessionsList.length,
        ongoing,
        upcoming
      });
    } catch (error) {
      console.error('Error loading zoom sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Sessions' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'upcoming', label: 'Upcoming' }
  ];

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    return session.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ended':
        return <span className="session-status-badge session-status-ended">Ended</span>;
      case 'ongoing':
        return <span className="session-status-badge session-status-ongoing">Ongoing</span>;
      case 'upcoming':
        return <span className="session-status-badge session-status-upcoming">Upcoming</span>;
      default:
        return null;
    }
  };

  const statsCards = [
    {
      label: 'Total Sessions',
      value: stats.total.toString(),
      icon: FaVideo,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      label: 'Ongoing',
      value: stats.ongoing.toString(),
      icon: FaVideo,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      label: 'Upcoming',
      value: stats.upcoming.toString(),
      icon: FaClock,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    }
  ];

  if (loading) {
    return (
      <div className="zoom-sessions-container">
        <div className="zoom-sessions-card">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite', fontSize: '2rem', color: 'var(--primary)' }} />
            <p>Loading sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="zoom-sessions-container">
      <div className="zoom-sessions-card">
        {/* Header */}
        <div className="zoom-header">
          <div className="zoom-header-content">
            <div className="zoom-icon-wrapper">
              <FaVideo className="zoom-icon" />
            </div>
            <div className="zoom-title-group">
              <h1 className="zoom-title">Zoom Sessions</h1>
              <p className="zoom-subtitle">
                <FaGraduationCap className="subtitle-icon" />
                Join your scheduled learning sessions
              </p>
            </div>
          </div>
          
          {/* Breadcrumb */}
          <nav className="zoom-breadcrumb" aria-label="Breadcrumb">
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
                  <span className="breadcrumb-text">Zoom-sessions</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Stats Cards */}
        <div className="zoom-stats-grid">
          {statsCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="zoom-stat-card">
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

        {/* Filter Buttons */}
        <div className="zoom-filters">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`zoom-filter-btn ${filter === option.value ? 'active' : ''}`}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Sessions Grid */}
        <div className="zoom-scroll-container">
          {filteredSessions.length === 0 ? (
            <div className="zoom-empty-state">
              <div className="empty-state-icon">
                <FaVideo />
              </div>
              <p className="empty-state-message">No sessions available.</p>
            </div>
          ) : (
            <div className="zoom-sessions-grid">
              {filteredSessions.map((session) => (
                <div key={session.id} className="zoom-session-card">
                  <div className="session-card-header">
                    <div className="session-card-icon-wrapper">
                      <FaVideo className="session-card-icon" />
                    </div>
                    <div className="session-card-title-group">
                      <h3 className="session-card-title">{session.title}</h3>
                      {getStatusBadge(session.status)}
                    </div>
                  </div>
                  
                  <p className="session-card-description">{session.description}</p>
                  
                  <div className="session-card-details">
                    {session.date && (
                      <div className="session-detail-item">
                        <FaCalendar className="detail-icon" />
                        <span>{session.date}</span>
                      </div>
                    )}
                    {session.time && (
                      <div className="session-detail-item">
                        <FaClock className="detail-icon" />
                        <span>{session.time}</span>
                      </div>
                    )}
                  </div>
                  
                  {(session.meetingId || session.passcode) && (
                    <div className="session-meeting-info">
                      {session.meetingId && (
                        <div className="meeting-info-row">
                          <span className="meeting-info-label">Meeting ID:</span>
                          <span className="meeting-info-value">{session.meetingId}</span>
                        </div>
                      )}
                      {session.passcode && (
                        <div className="meeting-info-row">
                          <span className="meeting-info-label">Passcode:</span>
                          <span className="meeting-info-value">{session.passcode}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {session.meetingUrl && (session.status === 'ongoing' || session.status === 'upcoming') && (
                    <div className="session-join-btn-container">
                      <a 
                        href={session.meetingUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="session-join-btn"
                      >
                        Join Meeting
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZoomSessions;
