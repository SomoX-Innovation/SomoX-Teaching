import { useState } from 'react';
import { 
  FaTimes, 
  FaChartBar,
  FaCheckCircle,
  FaClock,
  FaCalendar
} from 'react-icons/fa';
import './UsageStatsModal.css';

const UsageStatsModal = ({ isOpen, onClose }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const stats = {
    accountStatus: {
      plan: 'standard',
      status: 'Active'
    },
    dailyToken: {
      used: 0,
      limit: 50000,
      remaining: 50000
    },
    dailyRequest: {
      used: 0,
      limit: 200,
      remaining: 200
    },
    perMinuteToken: {
      current: 0,
      limit: 5000,
      remaining: 5000
    },
    perMinuteRequest: {
      current: 0,
      limit: 10,
      remaining: 10
    },
    resetSchedule: {
      daily: '05/01/2026, 05:30:00',
      minute: '05/01/2026, 04:05:00'
    },
    last7Days: {
      totalTokens: 0,
      totalRequests: 0,
      successRate: 0,
      avgTokensPerRequest: 0
    },
    currentMonth: {
      totalTokens: 0,
      totalRequests: 0,
      successRate: 0,
      avgTokensPerRequest: 0
    },
    lastUpdated: '05/01/2026, 04:04:25'
  };

  const tokenPercentage = (stats.dailyToken.used / stats.dailyToken.limit) * 100;
  const requestPercentage = (stats.dailyRequest.used / stats.dailyRequest.limit) * 100;

  return (
    <div className="usage-stats-overlay" onClick={onClose}>
      <div className="usage-stats-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="usage-stats-header">
          <div className="header-left">
            <FaChartBar className="header-icon" />
            <h2 className="usage-stats-title">AI Assistant Usage Statistics</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="usage-stats-content">
          <div className="usage-stats-grid">
            {/* Account Status */}
            <div className="account-status-card">
              <div className="card-header">
                <FaCheckCircle className="card-icon" />
                <h3 className="card-title">Account Status</h3>
              </div>
              <div className="account-status-info">
                <span className="status-label">Plan: </span>
                <span className="status-value capitalize">{stats.accountStatus.plan}</span>
                <span className="status-badge status-active">
                  {stats.accountStatus.status}
                </span>
              </div>
            </div>

            {/* Daily Token Usage */}
            <div className="usage-card">
              <div className="card-header">
                <FaClock className="card-icon" />
                <h3 className="card-title">Daily Token Usage</h3>
              </div>
              <div className="usage-details">
                <div className="usage-progress-section">
                  <div className="usage-progress-header">
                    <span className="progress-label">Used Today</span>
                    <span className="progress-value text-green">
                      {stats.dailyToken.used.toLocaleString()} / {stats.dailyToken.limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar progress-green" 
                      style={{ width: `${tokenPercentage}%` }}
                    ></div>
                  </div>
                  <div className="progress-percentage">
                    {tokenPercentage.toFixed(1)}% used
                  </div>
                </div>
                <div className="usage-remaining">
                  <span className="remaining-label">Remaining: </span>
                  <span className="remaining-value text-green">
                    {stats.dailyToken.remaining.toLocaleString()} tokens
                  </span>
                </div>
              </div>
            </div>

            {/* Daily Request Usage */}
            <div className="usage-card">
              <div className="card-header">
                <FaClock className="card-icon text-green" />
                <h3 className="card-title">Daily Request Usage</h3>
              </div>
              <div className="usage-details">
                <div className="usage-progress-section">
                  <div className="usage-progress-header">
                    <span className="progress-label">Used Today</span>
                    <span className="progress-value text-green">
                      {stats.dailyRequest.used} / {stats.dailyRequest.limit}
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar progress-green" 
                      style={{ width: `${requestPercentage}%` }}
                    ></div>
                  </div>
                  <div className="progress-percentage">
                    {requestPercentage.toFixed(1)}% used
                  </div>
                </div>
                <div className="usage-remaining">
                  <span className="remaining-label">Remaining: </span>
                  <span className="remaining-value text-green">
                    {stats.dailyRequest.remaining} requests
                  </span>
                </div>
              </div>
            </div>

            {/* Per-Minute Token Limit */}
            <div className="limit-card">
              <div className="card-header">
                <FaClock className="card-icon text-orange" />
                <h3 className="card-title">Per-Minute Token Limit</h3>
              </div>
              <div className="limit-details">
                <div className="limit-row">
                  <span className="limit-label">Current Minute:</span>
                  <span className="limit-value">
                    {stats.perMinuteToken.current.toLocaleString()} / {stats.perMinuteToken.limit.toLocaleString()}
                  </span>
                </div>
                <div className="limit-row">
                  <span className="limit-label">Remaining:</span>
                  <span className="limit-value text-green">
                    {stats.perMinuteToken.remaining.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Per-Minute Request Limit */}
            <div className="limit-card">
              <div className="card-header">
                <FaClock className="card-icon text-orange" />
                <h3 className="card-title">Per-Minute Request Limit</h3>
              </div>
              <div className="limit-details">
                <div className="limit-row">
                  <span className="limit-label">Current Minute:</span>
                  <span className="limit-value">
                    {stats.perMinuteRequest.current} / {stats.perMinuteRequest.limit}
                  </span>
                </div>
                <div className="limit-row">
                  <span className="limit-label">Remaining:</span>
                  <span className="limit-value text-green">
                    {stats.perMinuteRequest.remaining}
                  </span>
                </div>
              </div>
            </div>

            {/* Reset Schedule */}
            <div className="reset-schedule-card">
              <div className="card-header">
                <FaCalendar className="card-icon" />
                <h3 className="card-title">Reset Schedule</h3>
              </div>
              <div className="reset-schedule-grid">
                <div className="reset-item">
                  <span className="reset-label">Daily limits reset:</span>
                  <div className="reset-value">{stats.resetSchedule.daily}</div>
                </div>
                <div className="reset-item">
                  <span className="reset-label">Minute limits reset:</span>
                  <div className="reset-value">{stats.resetSchedule.minute}</div>
                </div>
              </div>
            </div>

            {/* Last 7 Days */}
            <div className="stats-summary-card">
              <h3 className="summary-title">Last 7 Days</h3>
              <div className="summary-stats">
                <div className="summary-row">
                  <span className="summary-label">Total Tokens:</span>
                  <span className="summary-value">{stats.last7Days.totalTokens.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Total Requests:</span>
                  <span className="summary-value">{stats.last7Days.totalRequests.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Success Rate:</span>
                  <span className="summary-value">{stats.last7Days.successRate}%</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Avg Tokens/Request:</span>
                  <span className="summary-value">{stats.last7Days.avgTokensPerRequest.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Current Month */}
            <div className="stats-summary-card">
              <h3 className="summary-title">Current Month</h3>
              <div className="summary-stats">
                <div className="summary-row">
                  <span className="summary-label">Total Tokens:</span>
                  <span className="summary-value">{stats.currentMonth.totalTokens.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Total Requests:</span>
                  <span className="summary-value">{stats.currentMonth.totalRequests.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Success Rate:</span>
                  <span className="summary-value">{stats.currentMonth.successRate}%</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Avg Tokens/Request:</span>
                  <span className="summary-value">{stats.currentMonth.avgTokensPerRequest.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="usage-stats-footer">
          <div className="footer-left">
            <div className="last-updated">
              Last updated: {stats.lastUpdated}
            </div>
          </div>
          <div className="footer-actions">
            <button 
              className="refresh-btn" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button className="close-footer-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageStatsModal;

