import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaCog, FaSave, FaSpinner, FaPercentage } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getDocument, updateDocument } from '../../services/firebaseService';
import './OrganizationSettings.css';

// Organization Settings Component
const OrganizationSettings = () => {
  const { getOrganizationId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [settings, setSettings] = useState({
    siteName: 'Somox Learning',
    siteDescription: 'Learn and grow with Somox Learning',
    siteEmail: 'admin@somoxlearning.com',
    sitePhone: '+1 (555) 123-4567',
    logoUrl: '', // Organization logo URL – shown in sidebar after login
    maintenanceMode: false,
    allowRegistrations: true,
    emailNotifications: true,
    smsNotifications: false,
    teacherSalaryPercentage: 75, // Default 75% for teacher, 25% for organization
    organizationSalaryPercentage: 25
  });

  useEffect(() => {
    loadOrganizationSettings();
  }, []);

  const loadOrganizationSettings = async () => {
    try {
      setLoadingData(true);
      const orgId = getOrganizationId();
      if (orgId) {
        const orgDoc = await getDocument('organizations', orgId).catch(() => null);
        if (orgDoc) {
          setSettings(prev => ({
            ...prev,
            ...orgDoc,
            teacherSalaryPercentage: orgDoc.teacherSalaryPercentage || 75,
            organizationSalaryPercentage: orgDoc.organizationSalaryPercentage || 25
          }));
        }
      }
    } catch (err) {
      console.error('Error loading organization settings:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const orgId = getOrganizationId();
      
      if (!orgId) {
        toast.error('Organization ID is missing');
        return;
      }

      // Ensure percentages add up to 100
      const teacherPercent = parseFloat(settings.teacherSalaryPercentage) || 0;
      const orgPercent = parseFloat(settings.organizationSalaryPercentage) || 0;
      
      if (teacherPercent + orgPercent !== 100) {
        toast.error('Teacher and Organization percentages must add up to 100%');
        setLoading(false);
        return;
      }

      await updateDocument('organizations', orgId, {
        ...settings,
        updatedAt: new Date().toISOString()
      });

      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings. Please try again.');
      console.error('Error saving settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePercentageChange = (type, value) => {
    const numValue = parseFloat(value) || 0;
    if (numValue < 0 || numValue > 100) return;
    
    if (type === 'teacher') {
      setSettings(prev => ({
        ...prev,
        teacherSalaryPercentage: numValue,
        organizationSalaryPercentage: 100 - numValue
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        organizationSalaryPercentage: numValue,
        teacherSalaryPercentage: 100 - numValue
      }));
    }
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
                <label>Organization Logo URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={settings.logoUrl || ''}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                />
                <p className="form-description">
                  Logo shown in the sidebar after organization login. Leave empty to use the default Somox logo.
                </p>
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

          {/* Payroll Settings */}
          <div className="settings-section">
            <h2 className="section-title">
              <FaPercentage style={{ marginRight: '0.5rem' }} />
              Payroll Settings
            </h2>
            <div className="settings-form">
              <div className="form-group">
                <label>Teacher Salary Percentage (%)</label>
                <div className="percentage-input-group">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.teacherSalaryPercentage}
                    onChange={(e) => handlePercentageChange('teacher', e.target.value)}
                    className="percentage-input"
                  />
                  <span className="percentage-label">%</span>
                </div>
                <p className="form-description">
                  Percentage of student payments that goes to teachers. Example: If a student pays $1000 and this is set to 75%, the teacher receives $750.
                </p>
              </div>
              <div className="form-group">
                <label>Organization Percentage (%)</label>
                <div className="percentage-input-group">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.organizationSalaryPercentage}
                    onChange={(e) => handlePercentageChange('organization', e.target.value)}
                    className="percentage-input"
                  />
                  <span className="percentage-label">%</span>
                </div>
                <p className="form-description">
                  Percentage of student payments that goes to the organization. Automatically updates when Teacher % changes, or you can edit it directly (Teacher % will update automatically).
                </p>
              </div>
              <div className="percentage-summary">
                <strong>Total: {parseFloat(settings.teacherSalaryPercentage) + parseFloat(settings.organizationSalaryPercentage)}%</strong>
                {parseFloat(settings.teacherSalaryPercentage) + parseFloat(settings.organizationSalaryPercentage) !== 100 && (
                  <span className="error-text">⚠️ Percentages must add up to 100%</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationSettings;
