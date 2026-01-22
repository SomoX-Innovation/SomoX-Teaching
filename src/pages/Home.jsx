import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaCheckCircle,
  FaChevronRight,
  FaBars,
  FaTimes,
  FaGraduationCap,
  FaUsers,
  FaVideo,
  FaTasks,
  FaChartLine,
  FaBook,
  FaLaptop,
  FaMobileAlt,
  FaClock,
  FaAward,
  FaRocket
} from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import { recordingsService, usersService, tasksService, batchesService } from '../services/firebaseService';
import teacherDashboard from '../assets/images/TD.png';
import studentDashboard from '../assets/images/SD.png';
import './Home.css';

const Home = () => {
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    students: 0,
    recordings: 0,
    tasks: 0,
    batches: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const [studentsCount, recordingsCount, tasksCount, batchesCount] = await Promise.all([
        usersService.getCountByRole('student').catch(() => 0),
        recordingsService.getCount().catch(() => 0),
        tasksService.getCount().catch(() => 0),
        batchesService.getCount().catch(() => 0)
      ]);

      setStats({
        students: studentsCount || 0,
        recordings: recordingsCount || 0,
        tasks: tasksCount || 0,
        batches: batchesCount || 0
      });
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { 
      icon: <FaGraduationCap />, 
      title: 'Class Management', 
      description: 'Organize classes, batches, and courses with ease. Manage schedules, enrollments, and student progress all in one place.' 
    },
    { 
      icon: <FaVideo />, 
      title: 'Session Recordings', 
      description: 'Record and store all your class sessions. Students can access recordings anytime to review lessons and catch up.' 
    },
    { 
      icon: <FaTasks />, 
      title: 'Task & Assignment', 
      description: 'Create, assign, and track tasks and assignments. Monitor student progress and provide timely feedback.' 
    },
    { 
      icon: <FaUsers />, 
      title: 'Student Management', 
      description: 'Comprehensive student profiles, attendance tracking, progress monitoring, and performance analytics.' 
    },
    { 
      icon: <FaChartLine />, 
      title: 'Analytics & Reports', 
      description: 'Get detailed insights into student performance, class statistics, and learning outcomes with interactive dashboards.' 
    },
    { 
      icon: <FaBook />, 
      title: 'Content Library', 
      description: 'Build a rich library of educational content, resources, and materials accessible to students and teachers.' 
    }
  ];

  const benefits = [
    { icon: <FaClock />, text: 'Save Time with Automation' },
    { icon: <FaAward />, text: 'Improve Learning Outcomes' },
    { icon: <FaLaptop />, text: 'Access Anywhere, Anytime' },
    { icon: <FaChartLine />, text: 'Track Progress Easily' }
  ];

  return (
    <div className="home-page">
      {/* Navigation */}
      <nav className="home-nav">
        <div className="home-nav-wrapper">
          <div className="home-nav-container">
            <Link to="/" className="home-brand">
              <img src="/assets/logo.png" alt="Somox Learning" className="home-brand-image" />
            </Link>
            <nav className="home-nav-menu">
              <div className="home-nav-links">
                <a href="#features" className="home-nav-link">Features</a>
                <a href="#about" className="home-nav-link">About</a>
                <a href="#pricing" className="home-nav-link">Pricing</a>
                <Link to="/sign-in" className="home-nav-link">Login</Link>
                <Link to="/sign-in" className="home-nav-link home-nav-link-primary">
                  Get Started
                  <FaChevronRight className="home-nav-arrow-icon" />
                </Link>
              </div>
            </nav>
            <button 
              className="home-menu-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="menu"
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-container">
          <div className="home-hero-content">
            <div className="home-hero-badge">
              <FaRocket className="home-badge-icon" />
              <span>Modern Class Management System</span>
            </div>
            <h1 className="home-hero-title">
              Manage Your Classes
              <span className="home-hero-title-highlight"> Smarter, Faster</span>
            </h1>
            <p className="home-hero-description">
              Everything you need to manage classes, track student progress, deliver content, 
              and enhance learning outcomes—all in one powerful platform.
            </p>
            <div className="home-hero-cta">
              <Link to="/sign-in" className="home-hero-btn home-hero-btn-primary">
                Start Free Trial
                <FaChevronRight />
              </Link>
              <a href="#features" className="home-hero-btn home-hero-btn-secondary">
                Learn More
              </a>
            </div>
            <div className="home-hero-stats">
              <div className="home-hero-stat">
                <div className="home-hero-stat-value">{stats.students}+</div>
                <div className="home-hero-stat-label">Active Students</div>
              </div>
              <div className="home-hero-stat">
                <div className="home-hero-stat-value">{stats.batches}+</div>
                <div className="home-hero-stat-label">Active Classes</div>
              </div>
              <div className="home-hero-stat">
                <div className="home-hero-stat-value">{stats.recordings}+</div>
                <div className="home-hero-stat-label">Session Recordings</div>
              </div>
            </div>
          </div>
          <div className="home-hero-visual">
            <div className="home-hero-dashboard-preview">
              <img 
                src={teacherDashboard} 
                alt="Class Management Dashboard Preview" 
                className="home-hero-dashboard-image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="home-trusted">
        <div className="home-trusted-container">
          <p className="home-trusted-label">Trusted by Educational Institutions</p>
          <div className="home-trusted-logos">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="home-trusted-logo">
                <span>Institution {i}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="home-features">
        <div className="home-features-container">
          <div className="home-features-header">
            <div className="home-features-badge">
              <span>Why Choose Somox?</span>
            </div>
            <h2 className="home-features-title">
              Everything You Need to Manage Classes
            </h2>
            <p className="home-features-subtitle">
              Powerful tools designed for modern education. Streamline your workflow and focus on what matters—teaching.
            </p>
          </div>
          <div className="home-features-grid">
            {features.map((feature, index) => (
              <div key={index} className="home-feature-card">
                <div className="home-feature-icon">{feature.icon}</div>
                <h3 className="home-feature-title">{feature.title}</h3>
                <p className="home-feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Teachers & Students Section */}
      <section className="home-audience">
        <div className="home-audience-container">
          <div className="home-audience-header">
            <h2 className="home-audience-title">
              Built for <strong>Teachers</strong> and <strong>Students</strong>
            </h2>
            <p className="home-audience-subtitle">
              A platform that empowers both educators and learners
            </p>
          </div>
          <div className="home-audience-grid">
            {/* For Teachers */}
            <div className="home-audience-card home-audience-teachers">
              <div className="home-audience-badge">For Teachers</div>
              <h3 className="home-audience-card-title">Teach Without the Paperwork</h3>
              <p className="home-audience-card-description">
                Create classes, assign tasks, upload recordings, track student progress, 
                and generate reports—all from one intuitive dashboard.
              </p>
              <ul className="home-audience-list">
                <li><FaCheckCircle /> Easy class creation and management</li>
                <li><FaCheckCircle /> Automated task assignment</li>
                <li><FaCheckCircle /> Real-time progress tracking</li>
                <li><FaCheckCircle /> Comprehensive analytics</li>
              </ul>
              <div className="home-audience-visual">
                <div className="home-audience-image-container">
                  <img 
                    src={teacherDashboard} 
                    alt="Teacher Dashboard" 
                    className="home-audience-image"
                  />
                </div>
              </div>
            </div>

            {/* For Students */}
            <div className="home-audience-card home-audience-students">
              <div className="home-audience-visual">
                <div className="home-audience-image-container">
                  <img 
                    src={studentDashboard} 
                    alt="Student Dashboard" 
                    className="home-audience-image"
                  />
                </div>
              </div>
              <div className="home-audience-badge">For Students</div>
              <h3 className="home-audience-card-title">All Your Learning in One Place</h3>
              <p className="home-audience-card-description">
                Access classes, complete assignments, watch recordings, track your progress, 
                and stay organized throughout your learning journey.
              </p>
              <ul className="home-audience-list">
                <li><FaCheckCircle /> Access all class materials</li>
                <li><FaCheckCircle /> Submit assignments easily</li>
                <li><FaCheckCircle /> Watch recordings anytime</li>
                <li><FaCheckCircle /> Track your progress</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="home-benefits">
        <div className="home-benefits-container">
          <div className="home-benefits-grid">
            {benefits.map((benefit, index) => (
              <div key={index} className="home-benefit-item">
                <div className="home-benefit-icon">{benefit.icon}</div>
                <div className="home-benefit-text">{benefit.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Features List */}
      <section className="home-all-features">
        <div className="home-all-features-container">
          <h2 className="home-all-features-title">
            Everything You Need. <strong>Seriously.</strong>
          </h2>
          <div className="home-all-features-grid">
            {[
              'Class Management', 'Batch Organization', 'Student Enrollment', 'Teacher Assignment',
              'Session Recordings', 'Task Management', 'Assignment Grading', 'Progress Tracking',
              'Analytics Dashboard', 'Report Generation', 'Payment Processing', 'Attendance Tracking',
              'Content Library', 'File Uploads', 'Role-Based Access', 'Mobile Access',
              'Real-time Updates', 'Notification System', 'Search & Filter', 'Export Data'
            ].map((feature, index) => (
              <div key={index} className="home-all-feature-item">
                <FaCheckCircle className="home-all-feature-check" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
          <Link to="/sign-in" className="home-all-features-cta">
            Get Started Today
            <FaChevronRight />
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="home-cta-section">
        <div className="home-cta-container">
          <div className="home-cta-content">
            <h2 className="home-cta-title">Ready to Transform Your Class Management?</h2>
            <p className="home-cta-description">
              Join thousands of educators who are already using Somox to streamline their teaching workflow.
            </p>
            <div className="home-cta-buttons">
              <Link to="/sign-in" className="home-cta-btn home-cta-btn-primary">
                Start Free Trial
                <FaChevronRight />
              </Link>
              <a href="#features" className="home-cta-btn home-cta-btn-secondary">
                View Features
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-container">
          <div className="home-footer-content">
            <div className="home-footer-brand">
              <img src="/assets/logo.png" alt="Somox Learning" className="home-footer-logo" />
              <p className="home-footer-tagline">Empowering Education Through Technology</p>
            </div>
            <div className="home-footer-links">
              <div className="home-footer-column">
                <h4 className="home-footer-heading">Product</h4>
                <a href="#features" className="home-footer-link">Features</a>
                <a href="#pricing" className="home-footer-link">Pricing</a>
                <Link to="/sign-in" className="home-footer-link">Login</Link>
              </div>
              <div className="home-footer-column">
                <h4 className="home-footer-heading">Company</h4>
                <a href="#about" className="home-footer-link">About Us</a>
                <Link to="/contact" className="home-footer-link">Contact</Link>
                <a href="#" className="home-footer-link">Blog</a>
              </div>
              <div className="home-footer-column">
                <h4 className="home-footer-heading">Support</h4>
                <a href="#help" className="home-footer-link">Help Center</a>
                <a href="#" className="home-footer-link">Documentation</a>
                <Link to="/legal" className="home-footer-link">Legal</Link>
              </div>
            </div>
          </div>
          <div className="home-footer-bottom">
            <div className="home-footer-copyright">© Somox Learning 2026. All Rights Reserved.</div>
            <div className="home-footer-social">
              <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="home-footer-social-link">
                LinkedIn
              </a>
              <span className="home-footer-divider">|</span>
              <Link to="/legal" className="home-footer-social-link">Privacy Policy</Link>
              <span className="home-footer-divider">|</span>
              <Link to="/legal" className="home-footer-social-link">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
