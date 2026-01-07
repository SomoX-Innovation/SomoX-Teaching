import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaChevronRight, FaFilter, FaCheckCircle, FaClock, FaExclamationCircle, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { tasksService } from '../../services/firebaseService';
import './TaskManagement.css';

const TaskManagement = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('not-started');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

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

export default TaskManagement;
