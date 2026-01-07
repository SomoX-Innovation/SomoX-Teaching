import { Link } from 'react-router-dom';
import { FaHome, FaChevronRight, FaVideo } from 'react-icons/fa';
import './OtherRecording.css';

const OtherRecording = () => {
  return (
    <div className="other-recording-container">
      <div className="other-recording-card">
        {/* Header */}
        <div className="other-recording-header">
          <h2 className="other-recording-title">Other Recording</h2>
          
          {/* Breadcrumb */}
          <nav className="other-recording-breadcrumb" aria-label="Breadcrumb">
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
                  <span className="breadcrumb-text">Student-other-recording</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Content */}
        <div className="other-recording-scroll-container">
          <div className="other-recording-grid">
            <div className="other-recording-empty-state">
              <div className="empty-state-icon">
                <FaVideo />
              </div>
              <p className="empty-state-message">No Other Recording available.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtherRecording;

