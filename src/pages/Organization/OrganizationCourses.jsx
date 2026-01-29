import { useState, useEffect } from 'react';
import { FaGraduationCap, FaSearch, FaPlus, FaEdit, FaTrash, FaEye, FaUsers, FaSpinner } from 'react-icons/fa';
import { coursesService, usersService } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
import './OrganizationCourses.css';

const OrganizationCourses = () => {
  const { getOrganizationId } = useAuth();
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [instructorSearchTerm, setInstructorSearchTerm] = useState('');
  const [showInstructorDropdown, setShowInstructorDropdown] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    duration: '',
    price: '',
    status: 'draft',
    students: 0,
    assignedTeachers: [] // Array of teacher UIDs assigned to this course
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const orgId = getOrganizationId();
      const [coursesData, usersData] = await Promise.all([
        coursesService.getAll(1000, orgId),
        usersService.getAll(1000, orgId)
      ]);
      setCourses(coursesData);
      setUsers(usersData || []);
      // Filter teachers from users
      const teachersList = (usersData || []).filter(user => {
        const role = user.role?.toLowerCase();
        return role === 'teacher';
      });
      setTeachers(teachersList);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate student count for a class
  const getStudentCountForCourse = (courseId) => {
    // Find all students who are enrolled in this class
    return users.filter(user => {
      const role = user.role ? user.role.toLowerCase() : 'student';
      if (role !== 'student') return false;
      
      // Check if user has this class ID in their classIds
      const userClassIds = user.classIds || user.batchIds || [];
      return userClassIds.includes(courseId);
    }).length;
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
      if (!formData.instructor) {
        setError('Please select an instructor for this class.');
        return;
      }
      const orgId = getOrganizationId();
      if (!orgId) {
        setError('Organization ID is missing. Please contact your administrator.');
        return;
      }
      const courseData = {
        ...formData,
        organizationId: orgId
      };
      await coursesService.create(courseData);
      await loadData();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setError('Failed to create class. Please try again.');
      console.error('Error creating course:', err);
    }
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    const instructorName = course.instructor || '';
    setFormData({
      title: course.title || '',
      description: course.description || '',
      instructor: instructorName,
      duration: course.duration || '',
      price: course.price || '',
      status: course.status || 'draft',
      students: course.students || 0,
      assignedTeachers: course.assignedTeachers || []
    });
    setInstructorSearchTerm(instructorName);
    setShowInstructorDropdown(false);
    setShowEditModal(true);
  };

  const handleUpdateCourse = async () => {
    try {
      setError(null);
      if (!formData.instructor) {
        setError('Please select an instructor for this class.');
        return;
      }
      const orgId = getOrganizationId();
      if (!orgId) {
        setError('Organization ID is missing. Please contact your administrator.');
        return;
      }
      const courseData = {
        ...formData,
        organizationId: orgId
      };
      await coursesService.update(selectedCourse.id, courseData);
      await loadData();
      setShowEditModal(false);
      setSelectedCourse(null);
      resetForm();
    } catch (err) {
      setError('Failed to update class. Please try again.');
      console.error('Error updating course:', err);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        setError(null);
        await coursesService.delete(id);
        await loadData();
      } catch (err) {
        setError('Failed to delete class. Please try again.');
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
      students: 0,
      assignedTeachers: []
    });
    setInstructorSearchTerm('');
    setShowInstructorDropdown(false);
  };

  const stats = {
    total: courses.length,
    active: courses.filter(c => c.status === 'active').length,
    draft: courses.filter(c => c.status === 'draft').length,
    totalStudents: courses.reduce((sum, c) => sum + getStudentCountForCourse(c.id), 0)
  };

  return (
    <div className="organization-courses-container">
      <div className="organization-courses-card">
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
        <div className="organization-courses-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaGraduationCap className="header-icon" />
            </div>
            <div>
              <h1 className="organization-courses-title">Classes Management</h1>
              <p className="organization-courses-subtitle">Manage all classes and enrollments</p>
            </div>
          </div>
          <button className="add-course-btn" onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}>
            <FaPlus className="btn-icon" />
            Create Class
          </button>
        </div>

        {/* Stats */}
        <div className="courses-stats-grid">
          <div className="courses-stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Classes</div>
          </div>
          <div className="courses-stat-card">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active Classes</div>
          </div>
          <div className="courses-stat-card">
            <div className="stat-value">{stats.draft}</div>
            <div className="stat-label">Draft Classes</div>
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
                <p>No classes found</p>
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
                        <span>{getStudentCountForCourse(course.id)} students</span>
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

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Class</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Class Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter class title"
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
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Instructor *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={instructorSearchTerm || formData.instructor || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // If user starts typing, clear the selected instructor to allow new search
                      if (value && formData.instructor && value !== formData.instructor) {
                        setFormData({...formData, instructor: ''});
                      }
                      setInstructorSearchTerm(value);
                      setShowInstructorDropdown(true);
                      // If exact match found, set it
                      const exactMatch = teachers.find(t => 
                        t.name?.toLowerCase() === value.toLowerCase()
                      );
                      if (exactMatch) {
                        setFormData({...formData, instructor: exactMatch.name});
                        setInstructorSearchTerm(exactMatch.name);
                        setShowInstructorDropdown(false);
                      }
                    }}
                    onFocus={() => {
                      // When focusing, if there's a selected instructor, show it but allow editing
                      if (formData.instructor && !instructorSearchTerm) {
                        setInstructorSearchTerm(formData.instructor);
                      }
                      setShowInstructorDropdown(true);
                    }}
                    onBlur={() => {
                      // Delay to allow click on dropdown item
                      setTimeout(() => {
                        setShowInstructorDropdown(false);
                      }, 200);
                    }}
                    placeholder="Search and select instructor"
                    required
                    style={{ width: '100%' }}
                  />
                  {showInstructorDropdown && teachers.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      marginTop: '0.25rem'
                    }}>
                      {teachers
                        .filter(teacher => {
                          if (!instructorSearchTerm) return true;
                          const search = instructorSearchTerm.toLowerCase();
                          return teacher.name?.toLowerCase().includes(search) ||
                                 teacher.email?.toLowerCase().includes(search);
                        })
                        .map(teacher => (
                          <div
                            key={teacher.id}
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent input blur
                              const teacherName = teacher.name || 'Unknown';
                              setFormData({...formData, instructor: teacherName});
                              setInstructorSearchTerm(teacherName);
                              setShowInstructorDropdown(false);
                            }}
                            style={{
                              padding: '0.75rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f3f4f6',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <div style={{ fontWeight: '500', color: '#111827' }}>
                              {teacher.name || 'Unknown'}
                            </div>
                            {teacher.email && (
                              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {teacher.email}
                              </div>
                            )}
                          </div>
                        ))}
                      {teachers.filter(teacher => {
                        if (!instructorSearchTerm) return false;
                        const search = instructorSearchTerm.toLowerCase();
                        return teacher.name?.toLowerCase().includes(search) ||
                               teacher.email?.toLowerCase().includes(search);
                      }).length === 0 && instructorSearchTerm && (
                        <div style={{ padding: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
                          No teachers found matching "{instructorSearchTerm}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {formData.instructor && (
                  <small style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
                    Selected: <strong>{formData.instructor}</strong>
                  </small>
                )}
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
              <button className="btn-primary" onClick={handleAddCourse}>Create Class</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Class</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Class Title</label>
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
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Instructor *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={instructorSearchTerm || formData.instructor || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // If user starts typing, clear the selected instructor to allow new search
                      if (value && formData.instructor && value !== formData.instructor) {
                        setFormData({...formData, instructor: ''});
                      }
                      setInstructorSearchTerm(value);
                      setShowInstructorDropdown(true);
                      // If exact match found, set it
                      const exactMatch = teachers.find(t => 
                        t.name?.toLowerCase() === value.toLowerCase()
                      );
                      if (exactMatch) {
                        setFormData({...formData, instructor: exactMatch.name});
                        setInstructorSearchTerm(exactMatch.name);
                        setShowInstructorDropdown(false);
                      }
                    }}
                    onFocus={() => {
                      // When focusing, if there's a selected instructor, show it but allow editing
                      if (formData.instructor && !instructorSearchTerm) {
                        setInstructorSearchTerm(formData.instructor);
                      }
                      setShowInstructorDropdown(true);
                    }}
                    onBlur={() => {
                      // Delay to allow click on dropdown item
                      setTimeout(() => {
                        setShowInstructorDropdown(false);
                      }, 200);
                    }}
                    placeholder="Search and select instructor"
                    required
                    style={{ width: '100%' }}
                  />
                  {showInstructorDropdown && teachers.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      marginTop: '0.25rem'
                    }}>
                      {teachers
                        .filter(teacher => {
                          if (!instructorSearchTerm) return true;
                          const search = instructorSearchTerm.toLowerCase();
                          return teacher.name?.toLowerCase().includes(search) ||
                                 teacher.email?.toLowerCase().includes(search);
                        })
                        .map(teacher => (
                          <div
                            key={teacher.id}
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent input blur
                              const teacherName = teacher.name || 'Unknown';
                              setFormData({...formData, instructor: teacherName});
                              setInstructorSearchTerm(teacherName);
                              setShowInstructorDropdown(false);
                            }}
                            style={{
                              padding: '0.75rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f3f4f6',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <div style={{ fontWeight: '500', color: '#111827' }}>
                              {teacher.name || 'Unknown'}
                            </div>
                            {teacher.email && (
                              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {teacher.email}
                              </div>
                            )}
                          </div>
                        ))}
                      {teachers.filter(teacher => {
                        if (!instructorSearchTerm) return false;
                        const search = instructorSearchTerm.toLowerCase();
                        return teacher.name?.toLowerCase().includes(search) ||
                               teacher.email?.toLowerCase().includes(search);
                      }).length === 0 && instructorSearchTerm && (
                        <div style={{ padding: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
                          No teachers found matching "{instructorSearchTerm}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {formData.instructor && (
                  <small style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
                    Selected: <strong>{formData.instructor}</strong>
                  </small>
                )}
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
              <button className="btn-primary" onClick={handleUpdateCourse}>Update Class</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationCourses;
