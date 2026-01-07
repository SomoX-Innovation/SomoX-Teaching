import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import Navbar from '../components/Navbar';
import './SignIn.css';

const SignIn = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in with Firebase Authentication
      await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // AuthContext will handle the user state update via onAuthStateChanged
      // The navigation will happen automatically via the useEffect above
      // when the user state is updated
    } catch (error) {
      console.error('Sign in error:', error);
      let errorMessage = 'Failed to sign in. Please check your credentials.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="signin-page">
      {/* Navigation */}
      <Navbar showSignIn={false} />

      {/* Main Content */}
      <div className="signin-container">
        {/* Floating Background Decorations */}
        <div className="signin-background-decorations">
          <div className="decoration decoration-1"></div>
          <div className="decoration decoration-2"></div>
          <div className="decoration decoration-3"></div>
        </div>

        {/* Sign In Card */}
        <div className="signin-card">
          {/* Left Side - Welcome Section */}
          <div className="signin-welcome">
            <div className="welcome-pattern">
              <div className="pattern-circle pattern-1"></div>
              <div className="pattern-square pattern-2"></div>
              <div className="pattern-circle pattern-3"></div>
            </div>
            <div className="welcome-content">
              <div className="welcome-icon">🎓</div>
              <h1 className="welcome-title">Welcome Back!</h1>
              <p className="welcome-subtitle">
                Continue your coding journey with our advanced LMS platform
              </p>
              <div className="welcome-features">
                <div className="welcome-feature">
                  <div className="feature-dot feature-dot-green"></div>
                  <span>AI-Powered Learning</span>
                </div>
                <div className="welcome-divider"></div>
                <div className="welcome-feature">
                  <div className="feature-dot feature-dot-blue"></div>
                  <span>Live Sessions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form Section */}
          <div className="signin-form-section">
            <div className="signin-form-wrapper">
              {/* Logo */}
              <div className="signin-form-logo">
                <img src="/assets/logo.png" alt="Somox Learning" />
              </div>

              {/* Form */}
              <form className="signin-form" onSubmit={handleSubmit}>
                {/* Email Field */}
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    <span className="label-icon">📧</span>
                    <span>Email Address</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      autoComplete="email"
                      className="form-input"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                    <div className="input-gradient"></div>
                  </div>
                </div>

                {/* Password Field */}
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    <span className="label-icon">🔒</span>
                    <span>Password</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      id="password"
                      autoComplete="current-password"
                      className="form-input form-input-password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                      disabled={loading}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    <div className="input-gradient"></div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="form-error" style={{
                    color: '#ef4444',
                    fontSize: '0.875rem',
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="signin-submit-btn"
                  disabled={loading}
                >
                  <div className="btn-gradient-overlay"></div>
                  <div className="btn-content">
                    <span>{loading ? 'Signing In...' : 'Sign In to Dashboard'}</span>
                    {!loading && (
                      <svg className="btn-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    )}
                  </div>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;

