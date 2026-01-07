import { useState, useEffect } from 'react';
import { FaVideo, FaSearch, FaPlus, FaEdit, FaTrash, FaDownload, FaSpinner, FaCalendar } from 'react-icons/fa';
import { recordingsService } from '../../services/firebaseService';
import './AdminRecordings.css';

const AdminRecordings = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    month: '',
    date: '',
    duration: '',
    videoUrl: '',
    topics: '',
    status: 'active'
  });

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await recordingsService.getAll();
      setRecordings(data);
    } catch (err) {
      setError('Failed to load recordings. Please try again.');
      console.error('Error loading recordings:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecordings = recordings.filter(recording => {
    const matchesSearch = recording.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recording.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = filterMonth === 'all' || recording.month === filterMonth;
    return matchesSearch && matchesMonth;
  });

  const handleAddRecording = async () => {
    try {
      setError(null);
      const topicsArray = formData.topics.split(',').map(t => t.trim()).filter(t => t);
      await recordingsService.create({
        ...formData,
        topics: topicsArray
      });
      await loadRecordings();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setError('Failed to create recording. Please try again.');
      console.error('Error creating recording:', err);
    }
  };

  const handleEditRecording = (recording) => {
    setSelectedRecording(recording);
    setFormData({
      title: recording.title || '',
      description: recording.description || '',
      month: recording.month || '',
      date: recording.date || '',
      duration: recording.duration || '',
      videoUrl: recording.videoUrl || '',
      topics: Array.isArray(recording.topics) ? recording.topics.join(', ') : recording.topics || '',
      status: recording.status || 'active'
    });
    setShowEditModal(true);
  };

  const handleUpdateRecording = async () => {
    try {
      setError(null);
      const topicsArray = formData.topics.split(',').map(t => t.trim()).filter(t => t);
      await recordingsService.update(selectedRecording.id, {
        ...formData,
        topics: topicsArray
      });
      await loadRecordings();
      setShowEditModal(false);
      setSelectedRecording(null);
      resetForm();
    } catch (err) {
      setError('Failed to update recording. Please try again.');
      console.error('Error updating recording:', err);
    }
  };

  const handleDeleteRecording = async (id) => {
    if (window.confirm('Are you sure you want to delete this recording?')) {
      try {
        setError(null);
        await recordingsService.delete(id);
        await loadRecordings();
      } catch (err) {
        setError('Failed to delete recording. Please try again.');
        console.error('Error deleting recording:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      month: '',
      date: '',
      duration: '',
      videoUrl: '',
      topics: '',
      status: 'active'
    });
  };

  const uniqueMonths = [...new Set(recordings.map(r => r.month).filter(Boolean))];
  const stats = {
    total: recordings.length,
    thisMonth: recordings.filter(r => {
      const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      return r.month === currentMonth;
    }).length,
    active: recordings.filter(r => r.status === 'active').length
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return timestamp;
  };

  return (
    <div className="admin-recordings-container">
      <div className="admin-recordings-card">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {/* Header */}
        <div className="admin-recordings-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaVideo className="header-icon" />
            </div>
            <div>
              <h1 className="admin-recordings-title">Recordings Management</h1>
              <p className="admin-recordings-subtitle">Manage all session recordings and videos</p>
            </div>
          </div>
          <button className="add-recording-btn" onClick={() => setShowAddModal(true)}>
            <FaPlus className="btn-icon" />
            Upload Recording
          </button>
        </div>

        {/* Stats */}
        <div className="recordings-stats-grid">
          <div className="recordings-stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Recordings</div>
          </div>
          <div className="recordings-stat-card">
            <div className="stat-value">{stats.thisMonth}</div>
            <div className="stat-label">This Month</div>
          </div>
          <div className="recordings-stat-card">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="recordings-toolbar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search recordings..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="filter-select"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          >
            <option value="all">All Months</option>
            {uniqueMonths.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>

        {/* Recordings List */}
        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spinner" />
            <p>Loading recordings...</p>
          </div>
        ) : (
          <div className="recordings-list">
            {filteredRecordings.length === 0 ? (
              <div className="empty-state">
                <FaVideo className="empty-icon" />
                <p>No recordings found</p>
              </div>
            ) : (
              filteredRecordings.map((recording) => (
                <div key={recording.id} className="recording-card">
                  <div className="recording-card-header">
                    <div className="recording-info">
                      <h3 className="recording-title">{recording.title || 'Untitled Recording'}</h3>
                      <div className="recording-meta">
                        <span className="recording-month">
                          <FaCalendar className="meta-icon" />
                          {recording.month || 'N/A'}
                        </span>
                        <span className="recording-date">{recording.date || formatDate(recording.createdAt)}</span>
                        <span className="recording-duration">{recording.duration || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="recording-actions">
                      <button 
                        className="action-btn view-btn"
                        title="View"
                        onClick={() => window.open(recording.videoUrl, '_blank')}
                      >
                        <FaVideo />
                      </button>
                      <button 
                        className="action-btn edit-btn"
                        title="Edit"
                        onClick={() => handleEditRecording(recording)}
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        title="Delete"
                        onClick={() => handleDeleteRecording(recording.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="recording-card-body">
                    <p className="recording-description">{recording.description || 'No description'}</p>
                    {Array.isArray(recording.topics) && recording.topics.length > 0 && (
                      <div className="recording-topics">
                        <strong>Topics:</strong>
                        <div className="topics-list">
                          {recording.topics.map((topic, idx) => (
                            <span key={idx} className="topic-tag">{topic}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Recording Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload New Recording</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter recording title"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter description"
                  rows="4"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Month</label>
                  <input
                    type="text"
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: e.target.value})}
                    placeholder="e.g., 2025-November"
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    placeholder="e.g., 2025-11-15"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    placeholder="e.g., 1h 30m"
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Video URL</label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                    placeholder="https://drive.google.com/... (Google Drive link)"
                />
              </div>
              <div className="form-group">
                <label>Topics (comma-separated)</label>
                <input
                  type="text"
                  value={formData.topics}
                  onChange={(e) => setFormData({...formData, topics: e.target.value})}
                  placeholder="Topic 1, Topic 2, Topic 3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddRecording}>Upload Recording</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Recording Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Recording</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="4"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Month</label>
                  <input
                    type="text"
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Video URL</label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Topics (comma-separated)</label>
                <input
                  type="text"
                  value={formData.topics}
                  onChange={(e) => setFormData({...formData, topics: e.target.value})}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleUpdateRecording}>Update Recording</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecordings;
