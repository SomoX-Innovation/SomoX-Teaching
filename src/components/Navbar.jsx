import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

const Navbar = ({ showSignIn = true }) => {
  const { theme } = useTheme();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src="/assets/logo.png" alt="Somox Learning" />
        </Link>
        <div className="navbar-links">
          {showSignIn && (
            <Link to="/sign-in" className="navbar-link-primary">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

