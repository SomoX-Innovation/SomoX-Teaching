import { useTheme } from '../context/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      className="theme-toggle-btn" 
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="toggle-icon-container">
        <FaSun className={`toggle-icon sun-icon ${theme === 'light' ? 'active' : ''}`} />
        <FaMoon className={`toggle-icon moon-icon ${theme === 'dark' ? 'active' : ''}`} />
      </div>
      <div className="toggle-slider">
        <div className={`toggle-thumb ${theme === 'dark' ? 'dark' : 'light'}`}></div>
      </div>
    </button>
  );
};

export default ThemeToggle;

