import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaHome, FaChevronRight, FaFilter, FaCheckCircle, FaClock, FaExclamationCircle, FaSpinner, FaEdit } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { tasksService } from '../../services/firebaseService';
import './TaskManagement.css';

const TaskManagement = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('not-started');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [updateData, setUpdateData] = useState({
    status: 'not-started',
    progress: 0
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      // Load tasks for the current user
      const userTasks = await tasksService.getByUser(user.uid);
      setTasks(userTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOptions = [
    { value: 'not-started', label: 'Still not start tasks' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'all', label: 'All Tasks' }
  ];

  const getTaskStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="task-status-icon completed" />;
      case 'in-progress':
        return <FaClock className="task-status-icon in-progress" />;
      default:
        return <FaExclamationCircle className="task-status-icon not-started" />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleUpdateTask = (task) => {
    setSelectedTask(task);
    setUpdateData({
      status: task.status || 'not-started',
      progress: task.progress || 0
    });
    setShowUpdateModal(true);
  };

  const handleSubmitUpdate = async () => {
    try {
      setError(null);
      
      // Auto-update status based on progress
      let newStatus = updateData.status;
      if (updateData.progress === 100) {
        newStatus = 'completed';
      } else if (updateData.progress > 0 && updateData.progress < 100) {
        newStatus = 'in-progress';
      } else if (updateData.progress === 0 && newStatus === 'completed') {
        newStatus = 'not-started';
      }

      await tasksService.update(selectedTask.id, {
        status: newStatus,
        progress: Math.min(100, Math.max(0, updateData.progress))
      });
      
      await loadTasks();
      setShowUpdateModal(false);
      setSelectedTask(null);
      toast.success('Task updated successfully!');
    } catch (err) {
      setError('Failed to update task. Please try again.');
      toast.error('Failed to update task. Please try again.');
      console.error('Error updating task:', err);
    }
  };

  if (loading) {
    return (
      <div className="task-management-container">
        <div className="task-management-card">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite', fontSize: '2rem', color: 'var(--primary)' }} />
            <p>Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="task-management-container">
      <div className="task-management-card">
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
        <div className="task-header">
          <h2 className="task-title">Student Tasks</h2>
          
          {/* Breadcrumb */}
          <nav className="task-breadcrumb" aria-label="Breadcrumb">
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
                  <span className="breadcrumb-text">Student-tasks</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Filter Buttons */}
        <div className="task-filters">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`filter-btn ${filter === option.value ? 'active' : ''}`}
              onClick={() => setFilter(option.value)}
            >
              <FaFilter className="filter-icon" />
              {option.label}
            </button>
          ))}
        </div>

        {/* Tasks Grid */}
        <div className="task-scroll-container">
          {filteredTasks.length === 0 ? (
            <div className="task-empty-state">
              <div className="empty-state-icon">
                <FaExclamationCircle />
              </div>
              <h3 className="empty-state-title">Not yet any started tasks</h3>
              <p className="empty-state-description">
                {filter === 'not-started' 
                  ? 'No tasks have been started yet. Tasks will appear here once students begin working on them.'
                  : filter === 'in-progress'
                  ? 'No tasks are currently in progress.'
                  : filter === 'completed'
                  ? 'No tasks have been completed yet.'
                  : 'No tasks available at the moment.'}
              </p>
            </div>
          ) : (
            <div className="task-grid">
              {filteredTasks.map((task) => (
                <div key={task.id} className="task-card">
                  <div className="task-card-header">
                    {getTaskStatusIcon(task.status)}
                    <div className="task-card-info">
                      <h3 className="task-card-title">{task.title}</h3>
                      <p className="task-card-subtitle">{task.description || ''}</p>
                    </div>
                  </div>
                  <div className="task-card-body">
                    <div className="task-meta">
                      {task.assignedDate && (
                        <span className="task-meta-item">
                          <span className="task-meta-label">Assigned:</span>
                          <span className="task-meta-value">{formatDate(task.assignedDate)}</span>
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="task-meta-item">
                          <span className="task-meta-label">Due:</span>
                          <span className="task-meta-value">{formatDate(task.dueDate)}</span>
                        </span>
                      )}
                    </div>
                    {task.progress !== undefined && (
                      <div className="task-progress">
                        <div className="task-progress-bar">
                          <div 
                            className="task-progress-fill" 
                            style={{ width: `${task.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="task-progress-text">{task.progress || 0}%</span>
                      </div>
                    )}
                    <button
                      className="task-update-btn"
                      onClick={() => handleUpdateTask(task)}
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem 1rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        justifyContent: 'center'
                      }}
                    >
                      <FaEdit />
                      Update Progress
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Update Task Modal */}
      {showUpdateModal && selectedTask && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Update Task Progress</h2>
              <button className="modal-close" onClick={() => setShowUpdateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ 
                padding: '1rem', 
                background: '#eff6ff', 
                borderRadius: '0.5rem', 
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
                color: '#1e40af'
              }}>
                <strong>Task:</strong> {selectedTask.title}
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={updateData.status}
                  onChange={(e) => setUpdateData({...updateData, status: e.target.value})}
                >
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Progress (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={updateData.progress}
                  onChange={(e) => {
                    const progress = parseInt(e.target.value) || 0;
                    setUpdateData({
                      ...updateData, 
                      progress: Math.min(100, Math.max(0, progress)),
                      // Auto-update status based on progress
                      status: progress === 100 ? 'completed' : (progress > 0 ? 'in-progress' : updateData.status)
                    });
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={updateData.progress}
                  onChange={(e) => {
                    const progress = parseInt(e.target.value);
                    setUpdateData({
                      ...updateData, 
                      progress,
                      // Auto-update status based on progress
                      status: progress === 100 ? 'completed' : (progress > 0 ? 'in-progress' : updateData.status)
                    });
                  }}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}>
                  Progress: {updateData.progress}% - Status will auto-update to "{updateData.progress === 100 ? 'Completed' : updateData.progress > 0 ? 'In Progress' : 'Not Started'}" when saved
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => {
                setShowUpdateModal(false);
                setSelectedTask(null);
                setError(null);
              }}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmitUpdate}>Update Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;
