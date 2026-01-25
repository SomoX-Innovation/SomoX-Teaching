import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaGraduationCap, FaUsers, FaVideo, FaChartLine } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import './SignIn.css';

const SignIn = () => {
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
      const role = user.role?.toLowerCase();
      if (role === 'superadmin') {
        navigate('/superadmin/dashboard');
      } else if (role === 'admin') {
        navigate('/organization/dashboard');
      } else if (role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleEmailBlur = (e) => {
    const value = e.target.value.trim();
    // Only auto-fill if there's a non-empty value without @
    if (value && value.length > 0 && !value.includes('@')) {
      setFormData({...formData, email: `${value}@gmail.com`});
    } else if (!value || value.length === 0) {
      // Explicitly clear the field if it's empty
      setFormData({...formData, email: ''});
    }
  };

  const handleEmailKeyDown = (e) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      const value = formData.email?.trim() || '';
      if (value && !value.includes('@')) {
        e.preventDefault();
        setFormData({...formData, email: `${value}@gmail.com`});
        setTimeout(() => {
          const passwordInput = e.target.form?.querySelector('input[type="password"]');
          if (passwordInput) {
            passwordInput.focus();
          }
        }, 10);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
    } catch (error) {
      console.error('Sign in error:', error);
      let errorMessage = 'Failed to sign in. Please check your credentials.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
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
      {/* Animated Background Elements */}
      <div className="signin-bg-shapes">
        <div className="signin-shape signin-shape-1"></div>
        <div className="signin-shape signin-shape-2"></div>
        <div className="signin-shape signin-shape-3"></div>
        <div className="signin-shape signin-shape-4"></div>
        <div className="signin-shape signin-shape-5"></div>
        <div className="signin-shape signin-shape-6"></div>
        <div className="signin-shape signin-shape-7"></div>
      </div>

      {/* Animated Particles */}
      <div className="signin-particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className={`signin-particle signin-particle-${i + 1}`}></div>
        ))}
      </div>

      {/* Grid Pattern Overlay */}
      <div className="signin-grid-overlay"></div>

      <div className="signin-layout">
        {/* Left Side - Branding */}
        <div className="signin-left">
          {/* Floating Icons */}
          <div className="signin-floating-icons">
            <div className="signin-floating-icon signin-icon-1">
              <FaGraduationCap />
            </div>
            <div className="signin-floating-icon signin-icon-2">
              <FaUsers />
            </div>
            <div className="signin-floating-icon signin-icon-3">
              <FaVideo />
            </div>
            <div className="signin-floating-icon signin-icon-4">
              <FaChartLine />
            </div>
          </div>

          <div className="signin-left-content">
            {/* Decorative Circles */}
            <div className="signin-decorative-circles">
              <div className="signin-circle signin-circle-1"></div>
              <div className="signin-circle signin-circle-2"></div>
              <div className="signin-circle signin-circle-3"></div>
            </div>

            <div className="signin-left-text">
              <div className="signin-tagline">
                <span className="tagline-word tagline-animate-1">Class.</span>
                <div className="tagline-software">
                  <span className="tagline-word tagline-animate-2">Management.</span>
                </div>
                <span className="tagline-word tagline-animate-3">Simplified</span>
              </div>
              <div className="signin-subtagline">
                <span>Streamline your classes, manage students, and track progress all in one place</span>
              </div>
              
              {/* Feature Highlights */}
              <div className="signin-features">
                <div className="signin-feature-item">
                  <div className="signin-feature-icon">
                    <FaGraduationCap />
                  </div>
                  <span>Class Organization</span>
                </div>
                <div className="signin-feature-item">
                  <div className="signin-feature-icon">
                    <FaUsers />
                  </div>
                  <span>Student Tracking</span>
                </div>
                <div className="signin-feature-item">
                  <div className="signin-feature-icon">
                    <FaChartLine />
                  </div>
                  <span>Progress Monitoring</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="signin-right">
          <div className="signin-right-content">
            {/* Form Container */}
            <div className="signin-form-container">
              <div className="signin-form-header">
                <div className="signin-welcome-badge">
                  <span>Welcome Back</span>
                </div>
                <h1 className="signin-form-title">Sign in to your account</h1>
                <p className="signin-form-subtitle">Enter your credentials to access your dashboard</p>
              </div>

              <form className="signin-form" onSubmit={handleSubmit}>
                {/* Email Input */}
                <div className="signin-input-wrapper">
                  <label className="signin-input-label">
                    <span className="signin-label-icon">✉</span>
                    Email Address
                  </label>
                  <div className="signin-input-container">
                    <div className="signin-input-icon">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="email"
                      placeholder="name@example.com"
                      autoComplete="off"
                      data-1p-ignore="true"
                      data-lpignore="true"
                      className="signin-input"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleEmailBlur}
                      onKeyDown={handleEmailKeyDown}
                      required
                    />
                    <div className="signin-input-focus-line"></div>
                    <div className="signin-input-glow"></div>
                  </div>
                </div>

                {/* Password Input */}
                <div className="signin-input-wrapper">
                  <label className="signin-input-label">
                    <span className="signin-label-icon">🔒</span>
                    Password
                  </label>
                  <div className="signin-input-container signin-password-container">
                    <div className="signin-input-icon">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="signin-input"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="signin-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    <div className="signin-input-focus-line"></div>
                    <div className="signin-input-glow"></div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="signin-error">
                    <svg className="signin-error-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="signin-button-wrapper">
                  <button
                    type="submit"
                    className="signin-button"
                    disabled={loading || !formData.email || !formData.password}
                  >
                    <span className="signin-button-text">
                      {loading ? 'Signing in...' : 'Sign In'}
                    </span>
                    {!loading && (
                      <svg className="signin-button-arrow" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                    {loading && (
                      <div className="signin-button-loader">
                        <div className="signin-loader-spinner"></div>
                      </div>
                    )}
                    <div className="signin-button-shine"></div>
                  </button>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="signin-footer">
              <div className="signin-footer-text">© Somox Learning 2026</div>
              <div className="signin-footer-divider">|</div>
              <a href="#" className="signin-footer-link">Privacy Policy</a>
              <div className="signin-footer-divider">|</div>
              <a href="#" className="signin-footer-link">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
