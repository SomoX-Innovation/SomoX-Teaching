import { useState, useEffect } from 'react';
import { FaGraduationCap, FaSearch, FaPlus, FaEdit, FaTrash, FaEye, FaUsers, FaSpinner } from 'react-icons/fa';
import { coursesService } from '../../services/firebaseService';
import './AdminCourses.css';

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    duration: '',
    price: '',
    status: 'draft',
    students: 0
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await coursesService.getAll();
      setCourses(data);
    } catch (err) {
      setError('Failed to load courses. Please try again.');
      console.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAddCourse = async () => {
    try {
      setError(null);
      await coursesService.create(formData);
      await loadCourses();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setError('Failed to create course. Please try again.');
      console.error('Error creating course:', err);
    }
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title || '',
      description: course.description || '',
      instructor: course.instructor || '',
      duration: course.duration || '',
      price: course.price || '',
      status: course.status || 'draft',
      students: course.students || 0
    });
    setShowEditModal(true);
  };

  const handleUpdateCourse = async () => {
    try {
      setError(null);
      await coursesService.update(selectedCourse.id, formData);
      await loadCourses();
      setShowEditModal(false);
      setSelectedCourse(null);
      resetForm();
    } catch (err) {
      setError('Failed to update course. Please try again.');
      console.error('Error updating course:', err);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        setError(null);
        await coursesService.delete(id);
        await loadCourses();
      } catch (err) {
        setError('Failed to delete course. Please try again.');
        console.error('Error deleting course:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      instructor: '',
      duration: '',
      price: '',
      status: 'draft',
      students: 0
    });
  };

  const stats = {
    total: courses.length,
    active: courses.filter(c => c.status === 'active').length,
    draft: courses.filter(c => c.status === 'draft').length,
    totalStudents: courses.reduce((sum, c) => sum + (c.students || 0), 0)
  };

  return (
    <div className="admin-courses-container">
      <div className="admin-courses-card">
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
        <div className="admin-courses-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaGraduationCap className="header-icon" />
            </div>
            <div>
              <h1 className="admin-courses-title">Courses Management</h1>
              <p className="admin-courses-subtitle">Manage all courses, batches, and enrollments</p>
            </div>
          </div>
          <button className="add-course-btn" onClick={() => setShowAddModal(true)}>
            <FaPlus className="btn-icon" />
            Create Course
          </button>
        </div>

        {/* Stats */}
        <div className="courses-stats-grid">
          <div className="courses-stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Courses</div>
          </div>
          <div className="courses-stat-card">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active Courses</div>
          </div>
          <div className="courses-stat-card">
            <div className="stat-value">{stats.draft}</div>
            <div className="stat-label">Draft Courses</div>
          </div>
          <div className="courses-stat-card">
            <div className="stat-value">{stats.totalStudents}</div>
            <div className="stat-label">Total Students</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="courses-toolbar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search courses..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Courses Grid */}
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
            <p>Loading courses...</p>
          </div>
        ) : (
          <div className="courses-grid">
            {filteredCourses.length === 0 ? (
              <div className="empty-state">
                <FaGraduationCap className="empty-icon" />
                <p>No courses found</p>
              </div>
            ) : (
              filteredCourses.map((course) => (
                <div key={course.id} className="course-card">
                  <div className="course-card-header">
                    <div className="course-status-badge">
                      <span className={`status-badge status-${course.status || 'draft'}`}>
                        {course.status || 'draft'}
                      </span>
                    </div>
                    <div className="course-actions">
                      <button 
                        className="action-btn view-btn"
                        title="View"
                      >
                        <FaEye />
                      </button>
                      <button 
                        className="action-btn edit-btn"
                        title="Edit"
                        onClick={() => handleEditCourse(course)}
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        title="Delete"
                        onClick={() => handleDeleteCourse(course.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="course-card-body">
                    <h3 className="course-title">{course.title || 'Untitled Course'}</h3>
                    <p className="course-description">{course.description || 'No description'}</p>
                    <div className="course-meta">
                      <div className="course-meta-item">
                        <FaGraduationCap className="meta-icon" />
                        <span>{course.instructor || 'TBA'}</span>
                      </div>
                      <div className="course-meta-item">
                        <FaUsers className="meta-icon" />
                        <span>{course.students || 0} students</span>
                      </div>
                    </div>
                  </div>
                  <div className="course-card-footer">
                    <div className="course-info">
                      <span className="course-duration">{course.duration || 'N/A'}</span>
                      <span className="course-price">{course.price || 'Free'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Course</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Course Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter course title"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter course description"
                  rows="4"
                />
              </div>
              <div className="form-group">
                <label>Instructor</label>
                <input
                  type="text"
                  value={formData.instructor}
                  onChange={(e) => setFormData({...formData, instructor: e.target.value})}
                  placeholder="Enter instructor name"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    placeholder="e.g., 12 weeks"
                  />
                </div>
                <div className="form-group">
                  <label>Price</label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="e.g., $299"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddCourse}>Create Course</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Course</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Course Title</label>
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
              <div className="form-group">
                <label>Instructor</label>
                <input
                  type="text"
                  value={formData.instructor}
                  onChange={(e) => setFormData({...formData, instructor: e.target.value})}
                />
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
                  <label>Price</label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleUpdateCourse}>Update Course</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourses;
