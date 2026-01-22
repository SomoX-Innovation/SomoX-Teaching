import { useState } from 'react';
import { toast } from 'react-toastify';
import { FaCog, FaSave, FaSpinner } from 'react-icons/fa';
import './OrganizationSettings.css';

// Organization Settings Component
const OrganizationSettings = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    siteName: 'Somox Learning',
    siteDescription: 'Learn and grow with Somox Learning',
    siteEmail: 'admin@somoxlearning.com',
    sitePhone: '+1 (555) 123-4567',
    maintenanceMode: false,
    allowRegistrations: true,
    emailNotifications: true,
    smsNotifications: false
  });

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success('Settings saved successfully!');
    }, 1000);
  };

  return (
    <div className="organization-settings-container">
      <div className="organization-settings-card">
        {/* Header */}
        <div className="organization-settings-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaCog className="header-icon" />
            </div>
            <div>
              <h1 className="organization-settings-title">Settings</h1>
              <p className="organization-settings-subtitle">Configure system settings and preferences</p>
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

        {/* Settings Sections */}
        <div className="settings-sections">
          {/* General Settings */}
          <div className="settings-section">
            <h2 className="section-title">General Settings</h2>
            <div className="settings-form">
              <div className="form-group">
                <label>Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => handleChange('siteName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Site Description</label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => handleChange('siteDescription', e.target.value)}
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    value={settings.siteEmail}
                    onChange={(e) => handleChange('siteEmail', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="tel"
                    value={settings.sitePhone}
                    onChange={(e) => handleChange('sitePhone', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="settings-section">
            <h2 className="section-title">System Settings</h2>
            <div className="settings-form">
              <div className="toggle-group">
                <div className="toggle-item">
                  <div className="toggle-info">
                    <label className="toggle-label">Maintenance Mode</label>
                    <p className="toggle-description">Put the site in maintenance mode</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="toggle-item">
                  <div className="toggle-info">
                    <label className="toggle-label">Allow Registrations</label>
                    <p className="toggle-description">Allow new users to register</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.allowRegistrations}
                      onChange={(e) => handleChange('allowRegistrations', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="settings-section">
            <h2 className="section-title">Notification Settings</h2>
            <div className="settings-form">
              <div className="toggle-group">
                <div className="toggle-item">
                  <div className="toggle-info">
                    <label className="toggle-label">Email Notifications</label>
                    <p className="toggle-description">Send email notifications to users</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="toggle-item">
                  <div className="toggle-info">
                    <label className="toggle-label">SMS Notifications</label>
                    <p className="toggle-description">Send SMS notifications to users</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.smsNotifications}
                      onChange={(e) => handleChange('smsNotifications', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationSettings;
