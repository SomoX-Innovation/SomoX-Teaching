import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaUsers, FaSearch, FaPlus, FaEdit, FaTrash, FaSpinner, FaGraduationCap } from 'react-icons/fa';
import { batchesService, coursesService } from '../../services/firebaseService';
import './AdminBatches.css';

const AdminBatches = () => {
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [formData, setFormData] = useState({
    number: '',
    courseId: '',
    status: 'active'
  });

  useEffect(() => {
    loadData();
  }, []);

  // Reload courses when modal opens to ensure fresh data
  useEffect(() => {
    if (showAddModal || showEditModal) {
      const reloadCourses = async () => {
        try {
          const coursesData = await coursesService.getAll();
          const activeCourses = coursesData?.filter(c => c.status === 'active') || [];
          setCourses(activeCourses.length > 0 ? activeCourses : (coursesData || []));
        } catch (err) {
          console.error('Error reloading courses:', err);
        }
      };
      reloadCourses();
    }
  }, [showAddModal, showEditModal]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [batchesData, coursesData] = await Promise.all([
        batchesService.getAll(),
        coursesService.getAll()
      ]);
      setBatches(batchesData || []);
      // Filter to only show active courses, or all if none are active
      const activeCourses = coursesData?.filter(c => c.status === 'active') || [];
      setCourses(activeCourses.length > 0 ? activeCourses : (coursesData || []));
      console.log('Loaded courses:', coursesData?.length || 0, 'Active courses:', activeCourses.length);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
      setBatches([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getCourseName(batch.courseId)?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || batch.status === filterStatus;
    const matchesCourse = filterCourse === 'all' || batch.courseId === filterCourse;
    return matchesSearch && matchesStatus && matchesCourse;
  });

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course?.title || 'Unknown Course';
  };

  const handleAddBatch = async () => {
    try {
      setError(null);
      
      if (!formData.number || !formData.courseId) {
        setError('Batch number and course are required.');
        return;
      }

      // Check if batch number already exists
      const existingBatch = batches.find(b => b.number === formData.number);
      if (existingBatch) {
        setError('Batch number already exists. Please use a different number.');
        return;
      }

      await batchesService.create(formData);
      await loadData();
      setShowAddModal(false);
      resetForm();
      toast.success('Batch created successfully!');
    } catch (err) {
      setError(err.message || 'Failed to create batch. Please try again.');
      console.error('Error creating batch:', err);
    }
  };

  const handleEditBatch = (batch) => {
    setSelectedBatch(batch);
    setFormData({
      number: batch.number || '',
      courseId: batch.courseId || '',
      status: batch.status || 'active'
    });
    setShowEditModal(true);
  };

  const handleUpdateBatch = async () => {
    try {
      setError(null);
      
      if (!formData.number || !formData.courseId) {
        setError('Batch number and course are required.');
        return;
      }

      // Check if batch number already exists (excluding current batch)
      const existingBatch = batches.find(b => b.number === formData.number && b.id !== selectedBatch.id);
      if (existingBatch) {
        setError('Batch number already exists. Please use a different number.');
        return;
      }

      await batchesService.update(selectedBatch.id, formData);
      await loadData();
      setShowEditModal(false);
      setSelectedBatch(null);
      resetForm();
      toast.success('Batch updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update batch. Please try again.');
      console.error('Error updating batch:', err);
    }
  };

  const handleDeleteBatch = async (id) => {
    if (window.confirm('Are you sure you want to delete this batch? This will remove batch assignments from students.')) {
      try {
        setError(null);
        await batchesService.delete(id);
        await loadData();
        toast.success('Batch deleted successfully!');
      } catch (err) {
        setError('Failed to delete batch. Please try again.');
        console.error('Error deleting batch:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      number: '',
      courseId: '',
      status: 'active'
    });
  };

  const stats = {
    total: batches.length,
    active: batches.filter(b => b.status === 'active').length,
    inactive: batches.filter(b => b.status === 'inactive').length
  };

  return (
    <div className="admin-batches-container">
      <div className="admin-batches-card">
        {error && (
          <div className="error-message" style={{ 
            padding: '1rem', 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: '#ef4444', 
            borderRadius: '0.5rem', 
            marginBottom: '1rem' 
          }}>
            {error}
          </div>
        )}
        
        {/* Header */}
        <div className="admin-batches-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaUsers className="header-icon" />
            </div>
            <div>
              <h1 className="admin-batches-title">Batches Management</h1>
              <p className="admin-batches-subtitle">Manage batches and their course assignments</p>
            </div>
          </div>
          <button className="add-batch-btn" onClick={() => setShowAddModal(true)}>
            <FaPlus className="btn-icon" />
            Add Batch
          </button>
        </div>

        {/* Stats Cards */}
        <div className="batches-stats-grid">
          <div className="batches-stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Batches</div>
          </div>
          <div className="batches-stat-card">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active Batches</div>
          </div>
          <div className="batches-stat-card">
            <div className="stat-value">{stats.inactive}</div>
            <div className="stat-label">Inactive Batches</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="batches-toolbar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search batches by number or course..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <div className="filter-item">
              <select 
                className="filter-select"
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>
            <div className="filter-item">
              <select 
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="batches-table-container">
          {loading ? (
            <div className="loading-state" style={{ 
              textAlign: 'center', 
              padding: '3rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <FaSpinner className="spinner" style={{ 
                animation: 'spin 1s linear infinite',
                fontSize: '2rem',
                color: 'var(--primary)'
              }} />
              <p>Loading batches...</p>
            </div>
          ) : (
            <table className="batches-table">
              <thead>
                <tr>
                  <th>Batch Number</th>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      No batches found
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((batch) => (
                    <tr key={batch.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaUsers style={{ color: '#6b7280' }} />
                          <strong>{batch.number}</strong>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaGraduationCap style={{ color: '#6b7280' }} />
                          {getCourseName(batch.courseId)}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge status-${batch.status || 'active'}`}>
                          {batch.status || 'active'}
                        </span>
                      </td>
                      <td>
                        {batch.createdAt?.toDate ? batch.createdAt.toDate().toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn edit-btn" 
                            title="Edit"
                            onClick={() => handleEditBatch(batch)}
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="action-btn delete-btn" 
                            title="Delete"
                            onClick={() => handleDeleteBatch(batch.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Batch Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Batch</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Batch Number *</label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                  placeholder="e.g., Batch-001, 2024-Q1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Course *</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                  required
                  disabled={courses.length === 0}
                >
                  <option value="">{courses.length === 0 ? 'No courses available' : 'Select a course'}</option>
                  {courses.length === 0 ? (
                    <option value="" disabled>Create a course first in Admin → Courses</option>
                  ) : (
                    courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title || course.id}</option>
                    ))
                  )}
                </select>
                {courses.length === 0 && (
                  <small style={{ color: '#ef4444', marginTop: '0.5rem', display: 'block' }}>
                    ⚠️ No courses found. Please create a course first in <strong>Admin → Courses</strong>.
                  </small>
                )}
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
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddBatch} disabled={courses.length === 0}>Add Batch</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Batch Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Batch</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Batch Number *</label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Course *</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                  required
                >
                  <option value="">Select a course</option>
                  {courses.length === 0 ? (
                    <option value="" disabled>No courses available. Create a course first.</option>
                  ) : (
                    courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title || course.id}</option>
                    ))
                  )}
                </select>
                {courses.length === 0 && (
                  <small style={{ color: '#ef4444', marginTop: '0.5rem', display: 'block' }}>
                    No courses found. Please create a course first in Admin → Courses.
                  </small>
                )}
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
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleUpdateBatch}>Update Batch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBatches;
