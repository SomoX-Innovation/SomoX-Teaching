import { useState } from 'react';
import { toast } from 'react-toastify';
import { FaUser, FaSave, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './AdminProfile.css';

const AdminProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    bio: '',
    avatar: ''
  });

  const handleChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success('Profile updated successfully!');
    }, 1000);
  };

  return (
    <div className="admin-profile-container">
      <div className="admin-profile-card">
        {/* Header */}
        <div className="admin-profile-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaUser className="header-icon" />
            </div>
            <div>
              <h1 className="admin-profile-title">Admin Profile</h1>
              <p className="admin-profile-subtitle">Manage your profile information</p>
            </div>
          </div>
          <button className="save-btn" onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <FaSpinner className="btn-icon spinner" />
                Saving...
              </>
            ) : (
              <>
                <FaSave className="btn-icon" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* Profile Content */}
        <div className="profile-content">
          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div className="avatar-wrapper">
              {formData.avatar ? (
                <img src={formData.avatar} alt="Profile" className="profile-avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {formData.name?.charAt(0).toUpperCase() || 'A'}
                </div>
              )}
            </div>
            <div className="avatar-info">
              <h3 className="profile-name">{formData.name || 'Admin User'}</h3>
              <p className="profile-role">Administrator</p>
            </div>
          </div>

          {/* Profile Form */}
          <div className="profile-form-section">
            <h2 className="form-section-title">Personal Information</h2>
            <div className="profile-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Tell us about yourself"
                  rows="4"
                />
              </div>
              <div className="form-group">
                <label>Avatar URL</label>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => handleChange('avatar', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="profile-settings-section">
            <h2 className="form-section-title">Account Settings</h2>
            <div className="account-actions">
              <button className="action-button change-password-btn">
                Change Password
              </button>
              <button className="action-button danger-btn">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
