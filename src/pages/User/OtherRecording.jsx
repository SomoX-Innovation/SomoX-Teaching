import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaHome, 
  FaChevronRight, 
  FaVideo,
  FaPlay,
  FaSpinner,
  FaExternalLinkAlt,
  FaList,
  FaLock
} from 'react-icons/fa';
import { recordingsService, usersService, paymentsService } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
import './OtherRecording.css';

const OtherRecording = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recordings, setRecordings] = useState([]);
  const [userBatches, setUserBatches] = useState([]);
  const [userPayments, setUserPayments] = useState([]);

  useEffect(() => {
    if (user) {
      loadUserBatches();
      loadUserPayments();
    }
  }, [user]);

  useEffect(() => {
    if (userBatches.length > 0 || user?.role === 'admin') {
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
    if (user?.role === 'admin') return true;
    if (!monthString) return true; // Recordings without month are accessible
    
    const parts = monthString.split('-');
    if (parts.length !== 2) return true;
    
    const year = parts[0];
    const monthName = parts[1];
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthNumber = (monthNames.indexOf(monthName) + 1).toString().padStart(2, '0');
    
    return userPayments.some(payment => {
      return payment.status === 'completed' && 
             payment.year === year && 
             payment.month === monthNumber;
    });
  };

  const hasAccessToRecording = (recording) => {
    // Admins can see all recordings
    if (user?.role === 'admin') return true;
    
    // Check payment for month-based recordings
    if (recording.month && !hasPaidForMonth(recording.month)) {
      return false;
    }
    
    // If recording has no batchIds, it's accessible to all
    if (!recording.batchIds || recording.batchIds.length === 0) return true;
    
    // Check if user's batches overlap with recording's batches
    return userBatches.some(batchId => recording.batchIds.includes(batchId));
  };

  const loadRecordings = async () => {
    try {
      setLoading(true);
      const allRecordings = await recordingsService.getAll();
      
      // Filter: Show recordings that don't have a month field (other recordings)
      // OR recordings that have month but are marked as "other" type
      const otherRecordings = allRecordings.filter(recording => {
        // Include recordings without month field
        if (!recording.month) return true;
        // Include recordings marked as "other" type
        if (recording.type && recording.type.toLowerCase().includes('other')) return true;
        return false;
      });
      
      // Filter by batch access and payment
      const accessibleRecordings = otherRecordings.filter(hasAccessToRecording);
      
      const recordingsList = accessibleRecordings.map(recording => ({
        id: recording.id,
        title: recording.title || 'Untitled Recording',
        description: recording.description || '',
        videoUrl: recording.videoUrl || '',
        duration: recording.duration || 'N/A',
        date: recording.date || '',
        topics: Array.isArray(recording.topics) ? recording.topics : 
               (recording.topics ? recording.topics.split(',').map(t => t.trim()) : []),
        status: recording.status || 'active',
        readyToWatch: recording.status === 'active' && !!recording.videoUrl && 
                     (!recording.month || hasPaidForMonth(recording.month))
      }));

      setRecordings(recordingsList);
    } catch (error) {
      console.error('Error loading recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWatchNow = (recording) => {
    if (!recording.readyToWatch) {
      if (recording.month && !hasPaidForMonth(recording.month)) {
        toast.warning('Payment required to access this recording. Please contact the administrator.');
      } else {
        toast.info('This recording is not available yet.');
      }
      return;
    }
    
    if (recording.videoUrl) {
      window.open(recording.videoUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="other-recording-container">
        <div className="other-recording-card">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite', fontSize: '2rem', color: 'var(--primary)' }} />
            <p>Loading recordings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="other-recording-container">
      <div className="other-recording-card">
        {/* Header */}
        <div className="other-recording-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaVideo className="header-icon" />
            </div>
            <div>
              <h2 className="other-recording-title">Other Recordings</h2>
              <p className="other-recording-subtitle">Additional learning resources and recordings</p>
            </div>
          </div>
          
          {/* Breadcrumb */}
          <nav className="other-recording-breadcrumb" aria-label="Breadcrumb">
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
                  <span className="breadcrumb-text">Student-other-recording</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            padding: '1rem',
            background: 'white',
            borderRadius: '0.75rem',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#3b82f6' }}>
              {recordings.length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Total Recordings
            </div>
          </div>
          <div style={{
            padding: '1rem',
            background: 'white',
            borderRadius: '0.75rem',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#10b981' }}>
              {recordings.filter(r => r.readyToWatch).length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Available
            </div>
          </div>
        </div>

        {/* Recordings Grid */}
        <div className="other-recording-scroll-container">
          {recordings.length === 0 ? (
            <div className="other-recording-empty-state">
              <div className="empty-state-icon">
                <FaVideo />
              </div>
              <p className="empty-state-message">No other recordings available.</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '1.5rem' 
            }}>
              {recordings.map((recording) => (
                <div 
                  key={recording.id} 
                  style={{
                    background: 'white',
                    borderRadius: '0.75rem',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '0.5rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <FaVideo />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ 
                          fontSize: '1rem', 
                          fontWeight: '600', 
                          color: '#111827',
                          margin: 0,
                          marginBottom: '0.25rem'
                        }}>
                          {recording.title}
                        </h3>
                        {recording.date && (
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                            {formatDate(recording.date)}
                          </p>
                        )}
                      </div>
                    </div>

                    {recording.description && (
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: '#6b7280', 
                        marginBottom: '1rem',
                        lineHeight: '1.5'
                      }}>
                        {recording.description}
                      </p>
                    )}

                    {recording.topics && recording.topics.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          marginBottom: '0.5rem',
                          fontSize: '0.875rem',
                          color: '#374151',
                          fontWeight: '500'
                        }}>
                          <FaList />
                          <span>Topics</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {recording.topics.map((topic, idx) => (
                            <span 
                              key={idx}
                              style={{
                                padding: '0.25rem 0.75rem',
                                background: '#eff6ff',
                                color: '#1e40af',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem'
                              }}
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        Duration: {recording.duration}
                      </div>
                      {!recording.readyToWatch && recording.month && !hasPaidForMonth(recording.month) && (
                        <FaLock style={{ color: '#ef4444', fontSize: '0.875rem' }} />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleWatchNow(recording)}
                      disabled={!recording.readyToWatch}
                      style={{
                        width: '100%',
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: recording.readyToWatch 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                          : '#e5e7eb',
                        color: recording.readyToWatch ? 'white' : '#9ca3af',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: recording.readyToWatch ? 'pointer' : 'not-allowed',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (recording.readyToWatch) {
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <FaPlay />
                      {recording.readyToWatch ? 'Watch on Google Drive' : 'Not Available'}
                      {recording.readyToWatch && <FaExternalLinkAlt style={{ fontSize: '0.75rem' }} />}
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

export default OtherRecording;
