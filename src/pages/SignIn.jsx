import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import Navbar from '../components/Navbar';
import './SignIn.css';

const SignIn = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setResetLoading(true);
    setResetSuccess(false);

    try {
      // Add actionCodeSettings for better email delivery
      const actionCodeSettings = {
        url: `${window.location.origin}/sign-in`,
        handleCodeInApp: false, // Set to false to open link in browser
      };

      await sendPasswordResetEmail(auth, resetEmail, actionCodeSettings);
      
      console.log('Password reset email sent successfully to:', resetEmail);
      setResetSuccess(true);
      setResetEmail('');
    } catch (error) {
      console.error('Password reset error:', error);
      let errorMessage = 'Failed to send password reset email.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later.';
          break;
        case 'auth/quota-exceeded':
          errorMessage = 'Email quota exceeded. Please contact support.';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setResetLoading(false);
    }
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label htmlFor="password" className="form-label" style={{ marginBottom: 0 }}>
                      <span className="label-icon">🔒</span>
                      <span>Password</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setResetEmail(formData.email);
                        setError('');
                        setResetSuccess(false);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        padding: '0.25rem 0',
                        textDecoration: 'underline'
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
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
                    <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>{error}</div>
                    {error.includes('Invalid email or password') && (
                      <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.9 }}>
                        💡 <strong>Need to create an account?</strong> Go to Firebase Console → Authentication → Users → Add User, then create a user document in Firestore with role "admin" or "student".
                      </div>
                    )}
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

              {/* Forgot Password Modal */}
              {showForgotPassword && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000
                }} onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                  setError('');
                  setResetSuccess(false);
                }}>
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '1rem',
                    padding: '2rem',
                    maxWidth: '400px',
                    width: '90%',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                  }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Reset Password</h2>
                      <button
                        onClick={() => {
                          setShowForgotPassword(false);
                          setResetEmail('');
                          setError('');
                          setResetSuccess(false);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '1.5rem',
                          cursor: 'pointer',
                          color: '#6b7280'
                        }}
                      >
                        ×
                      </button>
                    </div>

                    {resetSuccess ? (
                      <div>
                        <div style={{
                          padding: '1rem',
                          background: 'rgba(34, 197, 94, 0.1)',
                          borderRadius: '0.5rem',
                          marginBottom: '1rem',
                          color: '#16a34a',
                          border: '1px solid rgba(34, 197, 94, 0.2)'
                        }}>
                          <strong>✓ Email Sent!</strong>
                          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                            We've sent a password reset link to <strong>{resetEmail || 'your email'}</strong>. 
                            Please check your inbox (and spam folder) and click the link to reset your password.
                          </p>
                          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                            💡 <strong>Tip:</strong> If you don't see the email, check your spam/junk folder. 
                            The email should arrive within a few minutes.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setShowForgotPassword(false);
                            setResetEmail('');
                            setError('');
                            setResetSuccess(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '500'
                          }}
                        >
                          Close
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleForgotPassword}>
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="Enter your email address"
                            required
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.5rem',
                              fontSize: '1rem'
                            }}
                          />
                        </div>

                        {error && (
                          <div style={{
                            padding: '0.75rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '0.5rem',
                            marginBottom: '1rem',
                            color: '#dc2626',
                            fontSize: '0.875rem',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                          }}>
                            {error}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setShowForgotPassword(false);
                              setResetEmail('');
                              setError('');
                              setResetSuccess(false);
                            }}
                            style={{
                              flex: 1,
                              padding: '0.75rem',
                              background: '#f3f4f6',
                              color: '#374151',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              fontSize: '1rem',
                              fontWeight: '500'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={resetLoading}
                            style={{
                              flex: 1,
                              padding: '0.75rem',
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: resetLoading ? 'not-allowed' : 'pointer',
                              fontSize: '1rem',
                              fontWeight: '500',
                              opacity: resetLoading ? 0.6 : 1
                            }}
                          >
                            {resetLoading ? 'Sending...' : 'Send Reset Link'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;

