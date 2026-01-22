import { useState, useEffect } from 'react';
import { FaTasks, FaSearch, FaPlus, FaEdit, FaTrash, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { tasksService } from '../../services/firebaseService';
import './TeacherTasks.css';

const TeacherTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium',
    status: 'pending'
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tasksService.getAll();
      setTasks(data);
    } catch (err) {
      setError('Failed to load tasks. Please try again.');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAddTask = async () => {
    try {
      setError(null);
      await tasksService.create(formData);
      await loadTasks();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setError('Failed to create task. Please try again.');
      console.error('Error creating task:', err);
    }
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      assignedTo: task.assignedTo || '',
      dueDate: task.dueDate || '',
      priority: task.priority || 'medium',
      status: task.status || 'pending'
    });
    setShowEditModal(true);
  };

  const handleUpdateTask = async () => {
    try {
      setError(null);
      await tasksService.update(selectedTask.id, formData);
      await loadTasks();
      setShowEditModal(false);
      setSelectedTask(null);
      resetForm();
    } catch (err) {
      setError('Failed to update task. Please try again.');
      console.error('Error updating task:', err);
    }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        setError(null);
        await tasksService.delete(id);
        await loadTasks();
      } catch (err) {
        setError('Failed to delete task. Please try again.');
        console.error('Error deleting task:', err);
      }
    }
  };

  const handleToggleStatus = async (task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await tasksService.update(task.id, { status: newStatus });
      await loadTasks();
    } catch (err) {
      setError('Failed to update task status.');
      console.error('Error updating task status:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assignedTo: '',
      dueDate: '',
      priority: 'medium',
      status: 'pending'
    });
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    highPriority: tasks.filter(t => t.priority === 'high').length
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return timestamp;
  };

  return (
    <div className="teacher-tasks-container">
      <div className="teacher-tasks-card">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {/* Header */}
        <div className="teacher-tasks-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaTasks className="header-icon" />
            </div>
            <div>
              <h1 className="teacher-tasks-title">Tasks Management</h1>
              <p className="teacher-tasks-subtitle">Manage all tasks and assignments</p>
            </div>
          </div>
          <button className="add-task-btn" onClick={() => setShowAddModal(true)}>
            <FaPlus className="btn-icon" />
            Create Task
          </button>
        </div>

        {/* Stats */}
        <div className="tasks-stats-grid">
          <div className="tasks-stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="tasks-stat-card">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="tasks-stat-card">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="tasks-stat-card">
            <div className="stat-value">{stats.highPriority}</div>
            <div className="stat-label">High Priority</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="tasks-toolbar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
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
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spinner" />
            <p>Loading tasks...</p>
          </div>
        ) : (
          <div className="tasks-list">
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <FaTasks className="empty-icon" />
                <p>No tasks found</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div key={task.id} className={`task-card ${task.status === 'completed' ? 'completed' : ''}`}>
                  <div className="task-card-header">
                    <div className="task-checkbox" onClick={() => handleToggleStatus(task)}>
                      {task.status === 'completed' ? (
                        <FaCheckCircle className="check-icon completed" />
                      ) : (
                        <div className="check-circle" />
                      )}
                    </div>
                    <div className="task-info">
                      <h3 className="task-title">{task.title || 'Untitled Task'}</h3>
                      <p className="task-description">{task.description || 'No description'}</p>
                    </div>
                    <div className="task-actions">
                      <span className={`priority-badge priority-${task.priority || 'medium'}`}>
                        {task.priority || 'medium'}
                      </span>
                      <button 
                        className="action-btn edit-btn"
                        title="Edit"
                        onClick={() => handleEditTask(task)}
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        title="Delete"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="task-card-footer">
                    <div className="task-meta">
                      <span className="task-assigned">Assigned to: {task.assignedTo || 'Unassigned'}</span>
                      <span className="task-due">Due: {task.dueDate || formatDate(task.createdAt)}</span>
                    </div>
                    <span className={`status-badge status-${task.status || 'pending'}`}>
                      {task.status || 'pending'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Task</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter task title"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter task description"
                  rows="4"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Assigned To</label>
                  <input
                    type="text"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                    placeholder="User email or name"
                  />
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddTask}>Create Task</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Task</h2>
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
                  <label>Assigned To</label>
                  <input
                    type="text"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleUpdateTask}>Update Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherTasks;

