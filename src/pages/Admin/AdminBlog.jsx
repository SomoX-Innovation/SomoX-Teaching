import { useState, useEffect } from 'react';
import { FaBook, FaSearch, FaPlus, FaEdit, FaTrash, FaEye, FaSpinner } from 'react-icons/fa';
import { blogService } from '../../services/firebaseService';
import './AdminBlog.css';

const AdminBlog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    author: '',
    category: '',
    tags: '',
    status: 'draft',
    featuredImage: ''
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await blogService.getAll();
      setPosts(data);
    } catch (err) {
      setError('Failed to load blog posts. Please try again.');
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || post.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAddPost = async () => {
    try {
      setError(null);
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
      await blogService.create({
        ...formData,
        tags: tagsArray
      });
      await loadPosts();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setError('Failed to create blog post. Please try again.');
      console.error('Error creating post:', err);
    }
  };

  const handleEditPost = (post) => {
    setSelectedPost(post);
    setFormData({
      title: post.title || '',
      content: post.content || '',
      excerpt: post.excerpt || '',
      author: post.author || '',
      category: post.category || '',
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : post.tags || '',
      status: post.status || 'draft',
      featuredImage: post.featuredImage || ''
    });
    setShowEditModal(true);
  };

  const handleUpdatePost = async () => {
    try {
      setError(null);
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
      await blogService.update(selectedPost.id, {
        ...formData,
        tags: tagsArray
      });
      await loadPosts();
      setShowEditModal(false);
      setSelectedPost(null);
      resetForm();
    } catch (err) {
      setError('Failed to update blog post. Please try again.');
      console.error('Error updating post:', err);
    }
  };

  const handleDeletePost = async (id) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        setError(null);
        await blogService.delete(id);
        await loadPosts();
      } catch (err) {
        setError('Failed to delete blog post. Please try again.');
        console.error('Error deleting post:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      author: '',
      category: '',
      tags: '',
      status: 'draft',
      featuredImage: ''
    });
  };

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    draft: posts.filter(p => p.status === 'draft').length
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return timestamp;
  };

  return (
    <div className="admin-blog-container">
      <div className="admin-blog-card">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {/* Header */}
        <div className="admin-blog-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaBook className="header-icon" />
            </div>
            <div>
              <h1 className="admin-blog-title">Blog Management</h1>
              <p className="admin-blog-subtitle">Manage all blog posts and articles</p>
            </div>
          </div>
          <button className="add-post-btn" onClick={() => setShowAddModal(true)}>
            <FaPlus className="btn-icon" />
            Create Post
          </button>
        </div>

        {/* Stats */}
        <div className="blog-stats-grid">
          <div className="blog-stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Posts</div>
          </div>
          <div className="blog-stat-card">
            <div className="stat-value">{stats.published}</div>
            <div className="stat-label">Published</div>
          </div>
          <div className="blog-stat-card">
            <div className="stat-value">{stats.draft}</div>
            <div className="stat-label">Drafts</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="blog-toolbar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search posts..." 
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
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spinner" />
            <p>Loading posts...</p>
          </div>
        ) : (
          <div className="blog-posts-grid">
            {filteredPosts.length === 0 ? (
              <div className="empty-state">
                <FaBook className="empty-icon" />
                <p>No blog posts found</p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div key={post.id} className="blog-post-card">
                  {post.featuredImage && (
                    <div className="post-image">
                      <img src={post.featuredImage} alt={post.title} />
                    </div>
                  )}
                  <div className="post-content">
                    <div className="post-header">
                      <span className={`status-badge status-${post.status || 'draft'}`}>
                        {post.status || 'draft'}
                      </span>
                      <div className="post-actions">
                        <button 
                          className="action-btn view-btn"
                          title="View"
                        >
                          <FaEye />
                        </button>
                        <button 
                          className="action-btn edit-btn"
                          title="Edit"
                          onClick={() => handleEditPost(post)}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          title="Delete"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    <h3 className="post-title">{post.title || 'Untitled Post'}</h3>
                    <p className="post-excerpt">{post.excerpt || post.content?.substring(0, 100) || 'No excerpt'}</p>
                    <div className="post-meta">
                      <span className="post-author">By {post.author || 'Unknown'}</span>
                      <span className="post-date">{formatDate(post.createdAt)}</span>
                    </div>
                    {Array.isArray(post.tags) && post.tags.length > 0 && (
                      <div className="post-tags">
                        {post.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Post Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Blog Post</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter post title"
                />
              </div>
              <div className="form-group">
                <label>Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                  placeholder="Enter short excerpt"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Enter post content"
                  rows="10"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Author</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({...formData, author: e.target.value})}
                    placeholder="Author name"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="Category"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Featured Image URL</label>
                  <input
                    type="url"
                    value={formData.featuredImage}
                    onChange={(e) => setFormData({...formData, featuredImage: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  placeholder="Tag 1, Tag 2, Tag 3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddPost}>Create Post</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Blog Post</h2>
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
                <label>Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows="10"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Author</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({...formData, author: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Featured Image URL</label>
                  <input
                    type="url"
                    value={formData.featuredImage}
                    onChange={(e) => setFormData({...formData, featuredImage: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleUpdatePost}>Update Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlog;
