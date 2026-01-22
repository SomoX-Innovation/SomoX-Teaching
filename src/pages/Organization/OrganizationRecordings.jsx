import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaVideo, FaSearch, FaPlus, FaEdit, FaTrash, FaDownload, FaSpinner, FaCalendar, FaUsers, FaGraduationCap } from 'react-icons/fa';
import { recordingsService, batchesService, coursesService } from '../../services/firebaseService';
import './OrganizationRecordings.css';

const OrganizationRecordings = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterBatch, setFilterBatch] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    month: '',
    date: '',
    duration: '',
    videoUrl: '',
    topics: '',
    status: 'active',
    batchIds: [] // Array of batch IDs that can access this recording
  });

  useEffect(() => {
    loadRecordings();
    loadBatches();
    loadCourses();
  }, []);

  const loadBatches = async () => {
    try {
      const data = await batchesService.getAll();
      setBatches(data || []); // Load ALL batches (not just active)
    } catch (err) {
      console.error('Error loading batches:', err);
    }
  };

  const loadCourses = async () => {
    try {
      const data = await coursesService.getAll();
      setCourses(data || []);
    } catch (err) {
      console.error('Error loading courses:', err);
    }
  };

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
    
    // Batch filter: show all if 'all' selected
    if (filterBatch === 'all') {
      return matchesSearch && matchesMonth;
    }
    
    // When a specific batch is selected, show recordings that:
    // 1. Have the selected batch in their batchIds array, OR
    // 2. Have no batchIds (accessible to all batches)
    const hasBatchAccess = recording.batchIds && recording.batchIds.length > 0 
      ? recording.batchIds.includes(filterBatch)
      : true; // No batchIds means accessible to all batches
    
    return matchesSearch && matchesMonth && hasBatchAccess;
  });

  const handleAddRecording = async () => {
    try {
      setError(null);
      
      // Validate batch selection
      if (!formData.batchIds || formData.batchIds.length === 0) {
        setError('Please select at least one batch for this recording.');
        return;
      }
      
      const topicsArray = formData.topics.split(',').map(t => t.trim()).filter(t => t);
      await recordingsService.create({
        ...formData,
        topics: topicsArray,
        batchIds: formData.batchIds || [] // Include batch IDs
      });
      await loadRecordings();
      setShowAddModal(false);
      resetForm();
      toast.success('Recording created successfully!');
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
      status: recording.status || 'active',
      batchIds: recording.batchIds || []
    });
    setShowEditModal(true);
  };

  const handleUpdateRecording = async () => {
    try {
      setError(null);
      const topicsArray = formData.topics.split(',').map(t => t.trim()).filter(t => t);
      await recordingsService.update(selectedRecording.id, {
        ...formData,
        topics: topicsArray,
        batchIds: formData.batchIds || []
      });
      await loadRecordings();
      setShowEditModal(false);
      setSelectedRecording(null);
      resetForm();
      toast.success('Recording updated successfully!');
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
      status: 'active',
      batchIds: []
    });
  };

  const handleBatchToggle = (batchId) => {
    const currentBatchIds = formData.batchIds || [];
    if (currentBatchIds.includes(batchId)) {
      setFormData({
        ...formData,
        batchIds: currentBatchIds.filter(id => id !== batchId)
      });
    } else {
      setFormData({
        ...formData,
        batchIds: [...currentBatchIds, batchId]
      });
    }
  };

  const getBatchNames = (batchIds) => {
    if (!batchIds || batchIds.length === 0) return 'All batches';
    return batchIds.map(id => {
      const batch = batches.find(b => b.id === id);
      return batch ? batch.number : 'Unknown';
    }).join(', ');
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course?.title || 'Unknown Course';
  };

  const handleBatchClick = (batchId) => {
    // Reset form and pre-select the clicked batch
    resetForm();
    setFormData(prev => ({
      ...prev,
      batchIds: [batchId]
    }));
    setShowAddModal(true);
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
    <div className="organization-recordings-container">
      <div className="organization-recordings-card">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {/* Header */}
        <div className="organization-recordings-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaVideo className="header-icon" />
            </div>
            <div>
              <h1 className="organization-recordings-title">Recordings Management</h1>
              <p className="organization-recordings-subtitle">Manage all session recordings and videos</p>
            </div>
          </div>
          <button className="add-recording-btn" onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}>
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

        {/* Batches List Section */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Batches
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Click on a batch to add a recording
            </p>
          </div>
          {batches.length === 0 ? (
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center', 
              background: '#f9fafb', 
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb'
            }}>
              <FaUsers style={{ fontSize: '2rem', color: '#9ca3af', marginBottom: '0.5rem' }} />
              <p style={{ color: '#6b7280' }}>No batches available. Create batches first.</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
              gap: '1rem' 
            }}>
              {batches.map(batch => {
                const recordingCount = recordings.filter(r => 
                  r.batchIds && r.batchIds.includes(batch.id)
                ).length;
                return (
                  <div
                    key={batch.id}
                    onClick={() => handleBatchClick(batch.id)}
                    style={{
                      padding: '1.25rem',
                      background: 'white',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.1)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '0.5rem',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.25rem'
                      }}>
                        <FaUsers />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: '600', 
                          fontSize: '1rem', 
                          color: '#111827',
                          marginBottom: '0.25rem'
                        }}>
                          {batch.number}
                        </div>
                        <div style={{ 
                          fontSize: '0.875rem', 
                          color: '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <FaGraduationCap style={{ fontSize: '0.75rem' }} />
                          {getCourseName(batch.courseId)}
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                          Recordings
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#3b82f6' }}>
                          {recordingCount}
                        </div>
                      </div>
                      <div style={{
                        padding: '0.375rem 0.75rem',
                        background: batch.status === 'active' ? '#dcfce7' : '#fee2e2',
                        color: batch.status === 'active' ? '#166534' : '#991b1b',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {batch.status || 'active'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
            <select 
              className="filter-select"
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
            >
              <option value="all">All Batches</option>
              {batches.map(batch => (
                <option key={batch.id} value={batch.id}>{batch.number}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Recordings List */}
        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spinner" />
            <p>Loading recordings...</p>
          </div>
        ) : (
          <div className="recordings-list">
            {filterBatch !== 'all' && (
              <div style={{ 
                marginBottom: '1rem', 
                padding: '0.75rem 1rem', 
                background: '#eff6ff', 
                border: '1px solid #bfdbfe', 
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#1e40af'
              }}>
                <strong>Filtering by Batch:</strong> {batches.find(b => b.id === filterBatch)?.number || 'Unknown'} 
                {' '}• Showing {filteredRecordings.length} recording{filteredRecordings.length !== 1 ? 's' : ''}
              </div>
            )}
            {filteredRecordings.length === 0 ? (
              <div className="empty-state">
                <FaVideo className="empty-icon" />
                <p>
                  {filterBatch !== 'all' 
                    ? `No recordings found for batch "${batches.find(b => b.id === filterBatch)?.number || 'Unknown'}"`
                    : 'No recordings found'}
                </p>
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
                    <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                      <strong style={{ fontSize: '0.875rem', color: '#6b7280' }}>Batches: </strong>
                      <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                        {getBatchNames(recording.batchIds)}
                      </span>
                    </div>
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
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload New Recording</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            {formData.batchIds && formData.batchIds.length === 1 && (
              <div style={{
                margin: '0 1.5rem',
                padding: '0.75rem 1rem',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#1e40af',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <FaUsers />
                <strong>Adding recording for batch:</strong> {getBatchNames(formData.batchIds)}
              </div>
            )}
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
                <label>Batch Access * (Select batches that can access this recording)</label>
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  background: '#f9fafb'
                }}>
                  {batches.length === 0 ? (
                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      No batches available. Create batches first.
                    </div>
                  ) : (
                    <>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          borderRadius: '0.375rem',
                          marginBottom: '0.25rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <input
                          type="checkbox"
                          checked={formData.batchIds?.length === 0 || formData.batchIds?.length === batches.length}
                          onChange={() => {
                            if (formData.batchIds?.length === batches.length) {
                              setFormData({...formData, batchIds: []});
                            } else {
                              setFormData({...formData, batchIds: batches.map(b => b.id)});
                            }
                          }}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            accentColor: '#3b82f6'
                          }}
                        />
                        <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '600' }}>
                          All Batches
                        </span>
                      </label>
                      <div style={{ height: '1px', background: '#e5e7eb', margin: '0.5rem 0' }} />
                      {batches.map(batch => (
                        <label
                          key={batch.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            borderRadius: '0.375rem',
                            marginBottom: '0.25rem'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <input
                            type="checkbox"
                            checked={formData.batchIds?.includes(batch.id) || false}
                            onChange={() => handleBatchToggle(batch.id)}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: '#3b82f6'
                            }}
                          />
                          <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                            {batch.number}
                          </span>
                        </label>
                      ))}
                    </>
                  )}
                </div>
                {formData.batchIds?.length > 0 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                    Selected: {getBatchNames(formData.batchIds)}
                  </div>
                )}
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                  <strong>Note:</strong> Select one or more batches. If no batches are selected, the recording will be accessible to all students.
                </div>
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
        <div className="modal-overlay">
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
              <div className="form-group">
                <label>Batch Access * (Select batches that can access this recording)</label>
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  background: '#f9fafb'
                }}>
                  {batches.length === 0 ? (
                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      No batches available. Create batches first.
                    </div>
                  ) : (
                    <>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          borderRadius: '0.375rem',
                          marginBottom: '0.25rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <input
                          type="checkbox"
                          checked={formData.batchIds?.length === 0 || formData.batchIds?.length === batches.length}
                          onChange={() => {
                            if (formData.batchIds?.length === batches.length) {
                              setFormData({...formData, batchIds: []});
                            } else {
                              setFormData({...formData, batchIds: batches.map(b => b.id)});
                            }
                          }}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            accentColor: '#3b82f6'
                          }}
                        />
                        <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '600' }}>
                          All Batches
                        </span>
                      </label>
                      <div style={{ height: '1px', background: '#e5e7eb', margin: '0.5rem 0' }} />
                      {batches.map(batch => (
                        <label
                          key={batch.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            borderRadius: '0.375rem',
                            marginBottom: '0.25rem'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <input
                            type="checkbox"
                            checked={formData.batchIds?.includes(batch.id) || false}
                            onChange={() => handleBatchToggle(batch.id)}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: '#3b82f6'
                            }}
                          />
                          <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                            {batch.number}
                          </span>
                        </label>
                      ))}
                    </>
                  )}
                </div>
                {formData.batchIds?.length > 0 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                    Selected: {getBatchNames(formData.batchIds)}
                  </div>
                )}
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                  <strong>Note:</strong> Select one or more batches. If no batches are selected, the recording will be accessible to all students.
                </div>
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

export default OrganizationRecordings;
