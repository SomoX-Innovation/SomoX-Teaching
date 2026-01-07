import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute component to protect routes based on authentication and role
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if access is granted
 * @param {boolean} props.requireAuth - Whether authentication is required (default: true)
 * @param {string} props.requireRole - Required role ('admin' or 'student', default: null)
 * @param {string} props.redirectTo - Path to redirect to if access is denied (default: '/sign-in')
 */
const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  requireRole = null,
  redirectTo = '/sign-in' 
}) => {
  const { user, loading, isAdmin, isStudent } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        Loading...
      </div>
    );
  }

  // Check if authentication is required
  if (requireAuth && !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check if specific role is required
  if (requireRole === 'admin' && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireRole === 'student' && !isStudent()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Access granted
  return children;
};

export default ProtectedRoute;

