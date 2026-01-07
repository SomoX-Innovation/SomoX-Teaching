import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaHome, 
  FaChevronRight, 
  FaPlay, 
  FaCalendar, 
  FaGraduationCap,
  FaCheckCircle,
  FaClock,
  FaSpinner
} from 'react-icons/fa';
import { recordingsService } from '../../services/firebaseService';
import './SessionRecordings.css';

const SessionRecordings = () => {
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState([]);
  const [stats, setStats] = useState({
    totalMonths: 0,
    available: 0,
    upcoming: 0
  });

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      const recordings = await recordingsService.getAll();
      
      // Group recordings by month
      const monthMap = new Map();
      recordings.forEach(recording => {
        if (recording.month) {
          if (!monthMap.has(recording.month)) {
            monthMap.set(recording.month, {
              id: recording.month,
              name: formatMonthName(recording.month),
              status: recording.status === 'active' ? 'available' : 'upcoming',
              description: recording.status === 'active' 
                ? 'Click to view sessions from ' + formatMonthName(recording.month)
                : 'Sessions will be available in ' + formatMonthName(recording.month),
              link: recording.status === 'active' 
                ? `/dashboard/student-session-recording/${encodeURIComponent(recording.month)}`
                : null
            });
          }
        }
      });

      const monthsList = Array.from(monthMap.values()).sort((a, b) => {
        // Sort by month ID (e.g., "2025-November" comes before "2025-December")
        return b.id.localeCompare(a.id);
      });

      setMonths(monthsList);
      
      const available = monthsList.filter(m => m.status === 'available').length;
      setStats({
        totalMonths: monthsList.length,
        available,
        upcoming: monthsList.length - available
      });
    } catch (error) {
      console.error('Error loading recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonthName = (monthId) => {
    // Format "2025-November" to "November 2025"
    const parts = monthId.split('-');
    if (parts.length === 2) {
      return `${parts[1]} ${parts[0]}`;
    }
    return monthId;
  };

  const statsCards = [
    {
      label: 'Total Months',
      value: stats.totalMonths.toString(),
      icon: FaCalendar,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      label: 'Available Now',
      value: stats.available.toString(),
      icon: FaPlay,
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
      <div className="session-recordings-container">
        <div className="session-recordings-card">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite', fontSize: '2rem', color: 'var(--primary)' }} />
            <p>Loading recordings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="session-recordings-container">
      <div className="session-recordings-card">
        {/* Header */}
        <div className="session-header">
          <div className="session-header-content">
            <div className="session-icon-wrapper">
              <FaPlay className="session-icon" />
            </div>
            <div className="session-title-group">
              <h1 className="session-title">Session Recordings</h1>
              <p className="session-subtitle">
                <FaGraduationCap className="subtitle-icon" />
                Access your learning sessions
              </p>
            </div>
          </div>
          
          {/* Breadcrumb */}
          <nav className="session-breadcrumb" aria-label="Breadcrumb">
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
                  <span className="breadcrumb-text">Student-session-recording</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Stats Cards */}
        <div className="session-stats-grid">
          {statsCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="session-stat-card">
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

        {/* Months Grid */}
        <div className="session-scroll-container">
          {months.length === 0 ? (
            <div className="session-empty-state">
              <FaPlay className="empty-icon" />
              <p className="empty-message">No recordings available yet.</p>
            </div>
          ) : (
            <div className="session-months-grid">
              {months.map((month) => {
                const isAvailable = month.status === 'available';
                const MonthCard = isAvailable ? Link : 'div';
                const cardProps = isAvailable 
                  ? { to: month.link, className: 'month-card month-card-link' }
                  : { className: 'month-card month-card-disabled' };

                return (
                  <MonthCard key={month.id} {...cardProps}>
                    <div className="month-card-content">
                      <div className="month-icon-wrapper">
                        <FaPlay className="month-icon" />
                      </div>
                      <h3 className="month-title">
                        <FaCalendar className="month-title-icon" />
                        {month.name}
                      </h3>
                      {isAvailable ? (
                        <div className="month-badge month-badge-available">
                          <FaCheckCircle className="badge-icon" />
                          Available Now
                        </div>
                      ) : (
                        <div className="month-badge month-badge-upcoming">
                          <FaClock className="badge-icon" />
                          Coming Soon
                        </div>
                      )}
                      <p className="month-description">{month.description}</p>
                    </div>
                  </MonthCard>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionRecordings;
