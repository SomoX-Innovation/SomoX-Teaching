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
  FaAward,
  FaRocket,
  FaLightbulb,
  FaHandshake,
  FaGlobe
} from 'react-icons/fa';
import { useState } from 'react';
import './About.css';

const About = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const values = [
    {
      icon: <FaGraduationCap />,
      title: 'Excellence in Education',
      description: 'We are committed to providing the highest quality learning experiences and educational tools.'
    },
    {
      icon: <FaUsers />,
      title: 'Student-Centered',
      description: 'Every feature is designed with students and teachers in mind, prioritizing their needs and success.'
    },
    {
      icon: <FaLightbulb />,
      title: 'Innovation',
      description: 'We continuously innovate to bring cutting-edge technology and methodologies to education.'
    },
    {
      icon: <FaHandshake />,
      title: 'Partnership',
      description: 'We work closely with educational institutions to understand and meet their unique requirements.'
    }
  ];

  const team = [
    {
      name: 'Education Experts',
      role: 'Curriculum & Pedagogy',
      description: 'Our team of experienced educators ensures our platform meets real-world teaching needs.'
    },
    {
      name: 'Technology Team',
      role: 'Development & Innovation',
      description: 'Skilled developers building robust, scalable solutions for modern education.'
    },
    {
      name: 'Support Team',
      role: 'Customer Success',
      description: 'Dedicated professionals ready to help you succeed with our platform.'
    }
  ];

  const milestones = [
    { year: '2024', title: 'Platform Launch', description: 'Initial release with core features' },
    { year: '2025', title: 'Major Updates', description: 'Enhanced features and improved UX' },
    { year: '2026', title: 'Growing Community', description: 'Thousands of active users and institutions' }
  ];

  return (
    <div className="about-page">
      {/* Navigation */}
      <nav className="about-nav">
        <div className="about-nav-wrapper">
          <div className="about-nav-container">
            <Link to="/" className="about-brand">
              <img src="/assets/logo.png" alt="Somox Learning" className="about-brand-image" />
            </Link>
            <nav className="about-nav-menu">
              <div className="about-nav-links">
                <a href="/#features" className="about-nav-link">Features</a>
                <a href="/about" className="about-nav-link about-nav-link-active">About</a>
                <a href="/pricing" className="about-nav-link">Pricing</a>
                <Link to="/sign-in" className="about-nav-link">Login</Link>
                <Link to="/sign-in" className="about-nav-link about-nav-link-primary">
                  Get Started
                  <FaChevronRight className="about-nav-arrow-icon" />
                </Link>
              </div>
            </nav>
            <button 
              className="about-menu-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="menu"
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-container">
          <div className="about-hero-content">
            <div className="about-hero-badge">
              <span>About Somox Learning</span>
            </div>
            <h1 className="about-hero-title">
              Empowering Education Through
              <span className="about-hero-title-highlight"> Technology</span>
            </h1>
            <p className="about-hero-description">
              We're on a mission to transform how classes are managed, how students learn, 
              and how teachers teach. Our platform brings together powerful tools and intuitive 
              design to create the ultimate class management experience.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-mission">
        <div className="about-mission-container">
          <div className="about-mission-grid">
            <div className="about-mission-content">
              <h2 className="about-section-title">Our Mission</h2>
              <p className="about-section-text">
                To revolutionize education management by providing institutions, teachers, 
                and students with a comprehensive, user-friendly platform that streamlines 
                operations, enhances learning outcomes, and fosters collaboration.
              </p>
              <p className="about-section-text">
                We believe that technology should empower educators, not complicate their work. 
                That's why we've built Somox Learning with simplicity, efficiency, and 
                effectiveness at its core.
              </p>
            </div>
            <div className="about-mission-visual">
              <div className="about-mission-icon">
                <FaRocket />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="about-values">
        <div className="about-values-container">
          <div className="about-values-header">
            <h2 className="about-section-title">Our Values</h2>
            <p className="about-section-subtitle">
              The principles that guide everything we do
            </p>
          </div>
          <div className="about-values-grid">
            {values.map((value, index) => (
              <div key={index} className="about-value-card">
                <div className="about-value-icon">{value.icon}</div>
                <h3 className="about-value-title">{value.title}</h3>
                <p className="about-value-description">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="about-team">
        <div className="about-team-container">
          <div className="about-team-header">
            <h2 className="about-section-title">Our Team</h2>
            <p className="about-section-subtitle">
              Passionate professionals dedicated to transforming education
            </p>
          </div>
          <div className="about-team-grid">
            {team.map((member, index) => (
              <div key={index} className="about-team-card">
                <div className="about-team-icon">
                  <FaUsers />
                </div>
                <h3 className="about-team-name">{member.name}</h3>
                <div className="about-team-role">{member.role}</div>
                <p className="about-team-description">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="about-timeline">
        <div className="about-timeline-container">
          <div className="about-timeline-header">
            <h2 className="about-section-title">Our Journey</h2>
            <p className="about-section-subtitle">
              Milestones in our mission to transform education
            </p>
          </div>
          <div className="about-timeline-list">
            {milestones.map((milestone, index) => (
              <div key={index} className="about-timeline-item">
                <div className="about-timeline-year">{milestone.year}</div>
                <div className="about-timeline-content">
                  <h3 className="about-timeline-title">{milestone.title}</h3>
                  <p className="about-timeline-description">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="about-cta-container">
          <div className="about-cta-content">
            <h2 className="about-cta-title">Ready to Join Us?</h2>
            <p className="about-cta-description">
              Start your journey with Somox Learning today and experience the future of class management.
            </p>
            <div className="about-cta-buttons">
              <Link to="/sign-in" className="about-cta-btn about-cta-btn-primary">
                Get Started
                <FaChevronRight />
              </Link>
              <a href="/pricing" className="about-cta-btn about-cta-btn-secondary">
                View Pricing
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <div className="about-footer-container">
          <div className="about-footer-content">
            <div className="about-footer-brand">
              <img src="/assets/logo.png" alt="Somox Learning" className="about-footer-logo" />
              <p className="about-footer-tagline">Empowering Education Through Technology</p>
            </div>
            <div className="about-footer-links">
              <div className="about-footer-column">
                <h4 className="about-footer-heading">Product</h4>
                <a href="/#features" className="about-footer-link">Features</a>
                <a href="/pricing" className="about-footer-link">Pricing</a>
                <Link to="/sign-in" className="about-footer-link">Login</Link>
              </div>
              <div className="about-footer-column">
                <h4 className="about-footer-heading">Company</h4>
                <a href="/about" className="about-footer-link">About Us</a>
                <Link to="/contact" className="about-footer-link">Contact</Link>
                <a href="#" className="about-footer-link">Blog</a>
              </div>
              <div className="about-footer-column">
                <h4 className="about-footer-heading">Support</h4>
                <a href="#help" className="about-footer-link">Help Center</a>
                <a href="#" className="about-footer-link">Documentation</a>
                <Link to="/legal" className="about-footer-link">Legal</Link>
              </div>
            </div>
          </div>
          <div className="about-footer-bottom">
            <div className="about-footer-copyright">© Somox Learning 2026. All Rights Reserved.</div>
            <div className="about-footer-social">
              <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="about-footer-social-link">
                LinkedIn
              </a>
              <span className="about-footer-divider">|</span>
              <Link to="/legal" className="about-footer-social-link">Privacy Policy</Link>
              <span className="about-footer-divider">|</span>
              <Link to="/legal" className="about-footer-social-link">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
