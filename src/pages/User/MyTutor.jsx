import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaChevronRight, FaUserGraduate, FaEnvelope, FaBook, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { usersService } from '../../services/firebaseService';
import './MyTutor.css';

const MyTutor = () => {
  const { user } = useAuth();
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.uid) {
      loadTutors();
    }
  }, [user]);

  const loadTutors = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await usersService.getTutorsForStudent(user.uid);
      setTutors(list);
    } catch (err) {
      console.error('Error loading tutors:', err);
      setError('Could not load your tutors.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-tutor-container">
      <div className="my-tutor-card">
        <div className="my-tutor-header">
          <div className="header-content">
            <h1 className="my-tutor-title">My Tutor</h1>
            <p className="my-tutor-subtitle">Tutors assigned to your classes</p>
          </div>
        </div>

        <nav className="breadcrumb">
          <ol className="breadcrumb-list">
            <li className="breadcrumb-item">
              <Link to="/dashboard" className="breadcrumb-link">
                <FaHome className="breadcrumb-icon" />
                Dashboard
              </Link>
            </li>
            <li className="breadcrumb-item">
              <FaChevronRight className="breadcrumb-sep" />
            </li>
            <li className="breadcrumb-item">
              <span className="breadcrumb-current">My Tutor</span>
            </li>
          </ol>
        </nav>

        {loading ? (
          <div className="my-tutor-loading">
            <FaSpinner className="spin" />
            <p>Loading your tutors...</p>
          </div>
        ) : error ? (
          <div className="my-tutor-error">
            <p>{error}</p>
          </div>
        ) : tutors.length === 0 ? (
          <div className="my-tutor-empty">
            <FaUserGraduate className="empty-icon" />
            <p>No tutors assigned yet.</p>
            <p className="empty-hint">Your tutors will appear here once you are enrolled in classes with assigned teachers.</p>
          </div>
        ) : (
          <div className="tutor-grid">
            {tutors.map((tutor) => (
              <article key={tutor.id} className="tutor-card">
                <div className="tutor-avatar">
                  <FaUserGraduate />
                </div>
                <h3 className="tutor-name">{tutor.name || tutor.email || 'Tutor'}</h3>
                {tutor.email && (
                  <a href={`mailto:${tutor.email}`} className="tutor-email">
                    <FaEnvelope />
                    {tutor.email}
                  </a>
                )}
                {tutor.phone && (
                  <p className="tutor-phone">{tutor.phone}</p>
                )}
                {tutor.courses && tutor.courses.length > 0 && (
                  <div className="tutor-courses">
                    <FaBook className="tutor-courses-icon" />
                    <span className="tutor-courses-label">Classes:</span>
                    <ul className="tutor-courses-list">
                      {tutor.courses.map((title, i) => (
                        <li key={i}>{title}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTutor;
