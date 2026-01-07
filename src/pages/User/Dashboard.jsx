import { useState, useEffect } from 'react';
import { FaUser, FaCalendar, FaArrowRight, FaHome, FaHeart, FaBookmark, FaShare, FaSpinner } from 'react-icons/fa';
import { blogService } from '../../services/firebaseService';
import './Dashboard.css';

const Dashboard = () => {
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState(new Set());
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlogPosts();
  }, []);

  const loadBlogPosts = async () => {
    try {
      setLoading(true);
      // Load only published blog posts
      const posts = await blogService.getPublished();
      setBlogPosts(posts);
    } catch (error) {
      console.error('Error loading blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = (id) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleBookmark = (id) => {
    setBookmarkedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-card">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite', fontSize: '2rem', color: 'var(--primary)' }} />
            <p>Loading blog posts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <h2 className="dashboard-title gradient-text">Blogs</h2>
            <p className="dashboard-subtitle">Discover latest insights and tutorials</p>
          </div>
          
          {/* Breadcrumb */}
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb-list">
              <li className="breadcrumb-item">
                <div className="breadcrumb-content">
                  <FaHome className="breadcrumb-icon" />
                  <span className="breadcrumb-text">Dashboard</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon-wrapper blue">
              <FaCalendar className="stat-icon" />
            </div>
            <div className="stat-info">
              <div className="stat-value">{blogPosts.length}</div>
              <div className="stat-label">Total Posts</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper pink">
              <FaHeart className="stat-icon" />
            </div>
            <div className="stat-info">
              <div className="stat-value">{likedPosts.size}</div>
              <div className="stat-label">Liked</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper purple">
              <FaBookmark className="stat-icon" />
            </div>
            <div className="stat-info">
              <div className="stat-value">{bookmarkedPosts.size}</div>
              <div className="stat-label">Bookmarked</div>
            </div>
          </div>
        </div>

        {/* Blog Cards Grid */}
        <div className="blog-scroll-container">
          {blogPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p>No blog posts available yet.</p>
            </div>
          ) : (
            <div className="blog-grid">
              {blogPosts.map((blog) => (
                <div key={blog.id} className="blog-card scale-in">
                  {/* Blog Image */}
                  <div className="blog-image-container">
                    <img 
                      src={blog.image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23e5e7eb"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%236b7280" font-size="20">No Image</text></svg>'} 
                      alt={blog.title}
                      className="blog-image"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23e5e7eb"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%236b7280" font-size="20">No Image</text></svg>';
                      }}
                    />
                    <div className="image-overlay">
                      <button 
                        className={`action-btn ${likedPosts.has(blog.id) ? 'liked' : ''}`}
                        onClick={() => toggleLike(blog.id)}
                        aria-label="Like post"
                      >
                        <FaHeart />
                      </button>
                      <button 
                        className={`action-btn ${bookmarkedPosts.has(blog.id) ? 'bookmarked' : ''}`}
                        onClick={() => toggleBookmark(blog.id)}
                        aria-label="Bookmark post"
                      >
                        <FaBookmark />
                      </button>
                      <button className="action-btn" aria-label="Share post">
                        <FaShare />
                      </button>
                    </div>
                    {blog.category && (
                      <div className="blog-category">{blog.category}</div>
                    )}
                  </div>

                  {/* Blog Content */}
                  <div className="blog-content">
                    <h3 className="blog-title">{blog.title}</h3>
                    <p className="blog-excerpt">{blog.excerpt || blog.description || ''}</p>

                    {/* Blog Meta */}
                    <div className="blog-meta">
                      <div className="blog-meta-items">
                        <div className="blog-author">
                          <FaUser className="meta-icon" />
                          <span>{blog.author || 'Unknown'}</span>
                        </div>
                        <div className="blog-date">
                          <FaCalendar className="meta-icon" />
                          <span>{formatDate(blog.createdAt || blog.date)}</span>
                        </div>
                      </div>
                      <div className="blog-stats">
                        <div className="stat-item">
                          <FaHeart className="stat-icon-small" />
                          <span>{blog.likes || 0 + (likedPosts.has(blog.id) ? 1 : 0)}</span>
                        </div>
                        {blog.readTime && (
                          <div className="stat-item">
                            <span className="read-time">{blog.readTime}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Read More Button */}
                    <button type="button" className="read-more-btn">
                      <span>Read More</span>
                      <FaArrowRight className="read-more-icon" />
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

export default Dashboard;
