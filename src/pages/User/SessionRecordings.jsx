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
  FaSpinner,
  FaLock
} from 'react-icons/fa';
import { recordingsService, usersService, paymentsService } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
import './SessionRecordings.css';

const SessionRecordings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState([]);
  const [userBatches, setUserBatches] = useState([]);
  const [userPayments, setUserPayments] = useState([]);
  const [stats, setStats] = useState({
    totalMonths: 0,
    available: 0,
    upcoming: 0
  });

  useEffect(() => {
    if (user) {
      loadUserBatches();
      loadUserPayments();
    }
  }, [user]);

  useEffect(() => {
    // Always load recordings - access control is handled in loadRecordings
    // Recordings without batchIds are accessible to all users
    // Load recordings when user is available, and reload when batches/payments change
    if (user) {
      loadRecordings();
    }
  }, [userBatches, userPayments, user]);

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

  const loadUserPayments = async () => {
    if (!user?.uid || user?.role === 'admin') return;
    try {
      const payments = await paymentsService.getByUser(user.uid);
      setUserPayments(payments || []);
    } catch (err) {
      console.error('Error loading user payments:', err);
      setUserPayments([]);
    }
  };

  // Check if student has paid for a specific month
  const hasPaidForMonth = (monthString) => {
    // Admins have access to all months
    if (user?.role === 'admin') return true;
    
    // Extract year and month from "2025-November" format
    const parts = monthString.split('-');
    if (parts.length !== 2) return false;
    
    const year = parts[0];
    const monthName = parts[1];
    
    // Convert month name to number (1-12)
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthNumber = (monthNames.indexOf(monthName) + 1).toString().padStart(2, '0');
    
    // Check if there's a completed payment for this month/year
    const hasPayment = userPayments.some(payment => {
      if (payment.status !== 'completed') return false;
      return payment.year === year && payment.month === monthNumber;
    });
    
    return hasPayment;
  };

  const hasAccessToRecording = (recording) => {
    // Admins can see all recordings
    if (user?.role === 'admin') return true;
    
    // If recording has no batchIds or empty batchIds array, it's accessible to all users
    if (!recording.batchIds || recording.batchIds.length === 0) {
      return true;
    }
    
    // If user has no batches assigned, they can only see recordings without batch restrictions
    if (!userBatches || userBatches.length === 0) {
      return false; // No batches means no access to batch-restricted recordings
    }
    
    // Check if user's batches overlap with recording's batches
    return userBatches.some(batchId => recording.batchIds.includes(batchId));
  };

  const loadRecordings = async () => {
    try {
      setLoading(true);
      const allRecordings = await recordingsService.getAll();
      
      console.log('Total recordings loaded:', allRecordings.length);
      console.log('User batches:', userBatches);
      console.log('User role:', user?.role);
      
      // Filter recordings by batch access
      // Recordings without batchIds are accessible to all users
      const accessibleRecordings = allRecordings.filter(hasAccessToRecording);
      
      console.log('Accessible recordings after filter:', accessibleRecordings.length);
      
      // Group recordings by month
      const monthMap = new Map();
      let recordingsWithoutMonth = 0;
      
      accessibleRecordings.forEach(recording => {
        if (recording.month) {
          if (!monthMap.has(recording.month)) {
            const hasPaid = hasPaidForMonth(recording.month);
            const isActive = recording.status === 'active';
            const isAvailable = isActive && (hasPaid || user?.role === 'admin');
            
            monthMap.set(recording.month, {
              id: recording.month,
              name: formatMonthName(recording.month),
              status: isAvailable ? 'available' : (hasPaid ? 'upcoming' : 'locked'),
              description: isAvailable
                ? 'Click to view sessions from ' + formatMonthName(recording.month)
                : hasPaid
                ? 'Sessions will be available in ' + formatMonthName(recording.month)
                : 'Payment required to access recordings for ' + formatMonthName(recording.month),
              link: isAvailable
                ? `/dashboard/student-session-recording/${encodeURIComponent(recording.month)}`
                : null,
              hasPaid: hasPaid
            });
          }
        } else {
          recordingsWithoutMonth++;
        }
      });
      
      if (recordingsWithoutMonth > 0) {
        console.warn(`${recordingsWithoutMonth} recordings found without month field - these won't appear in session recordings list`);
      }
      
      console.log('Months found:', monthMap.size);

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
      
      console.log('Final months list:', monthsList);
    } catch (error) {
      console.error('Error loading recordings:', error);
      setMonths([]);
      setStats({
        totalMonths: 0,
        available: 0,
        upcoming: 0
      });
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
                const isLocked = month.status === 'locked';
                const MonthCard = isAvailable ? Link : 'div';
                const cardProps = isAvailable 
                  ? { to: month.link, className: 'month-card month-card-link' }
                  : { className: isLocked ? 'month-card month-card-locked' : 'month-card month-card-disabled' };

                return (
                  <MonthCard key={month.id} {...cardProps}>
                    <div className="month-card-content">
                      <div className="month-icon-wrapper">
                        {isLocked ? (
                          <FaLock className="month-icon" style={{ color: '#ef4444' }} />
                        ) : (
                          <FaPlay className="month-icon" />
                        )}
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
                      ) : isLocked ? (
                        <div className="month-badge month-badge-locked" style={{
                          background: '#fee2e2',
                          color: '#991b1b'
                        }}>
                          <FaLock className="badge-icon" />
                          Payment Required
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
