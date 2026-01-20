import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaRocket, 
  FaUsers, 
  FaVideo, 
  FaTasks, 
  FaGraduationCap,
  FaCheckCircle,
  FaUserFriends,
  FaTrophy,
  FaChevronRight,
  FaChevronLeft,
  FaRobot,
  FaGithub,
  FaCreditCard,
  FaPlayCircle,
  FaSpinner
} from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import { recordingsService, usersService, tasksService, batchesService } from '../services/firebaseService';
import Navbar from '../components/Navbar';
import './Home.css';

const Home = () => {
  const { theme } = useTheme();
  const [currentFeature, setCurrentFeature] = useState(4); // Payment Management (index 4)
  const [videos, setVideos] = useState([]);
  // Mock values for display
  const MOCK_STATS = {
    students: 150,
    recordings: 85,
    tasks: 320,
    batches: 12
  };

  const [stats, setStats] = useState(MOCK_STATS);
  const [loading, setLoading] = useState(true);

  const features = [
    {
      icon: '🤖',
      title: 'AI Pro Model Access',
      description: 'Get access to advanced AI models for coding assistance, debugging help, and learning support.',
      details: 'ChatGPT Pro, Claude, GitHub Copilot integration, code review assistance, and intelligent suggestions.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '🎥',
      title: 'Session Recordings',
      description: 'Access all your class recordings, tutorials, and workshop sessions anytime, anywhere.',
      details: 'HD video quality, automatic transcription, bookmarking, playback speed control, and offline downloads.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: '📋',
      title: 'Task Management',
      description: 'Organize assignments, track progress, and manage deadlines with our powerful task system.',
      details: 'Kanban boards, priority levels, due date reminders, progress tracking, and team collaboration.',
      color: 'from-green-500 to-teal-500'
    },
    {
      icon: '🔗',
      title: 'GitHub Integration',
      description: 'Seamlessly link your coding projects with GitHub for version control and collaboration.',
      details: 'Auto PR creation, code reviews, commit tracking, branch management, and deployment integration.',
      color: 'from-gray-700 to-gray-900'
    },
    {
      icon: '💳',
      title: 'Payment Management',
      description: 'Easily manage student payments and billing with secure, automated payment processing.',
      details: 'Stripe integration, automatic invoicing, payment plans, refund management, and detailed financial analytics.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: '📹',
      title: 'Zoom Sessions',
      description: 'Integrated video conferencing for live classes, one-on-one mentoring, and group discussions.',
      details: 'Screen sharing, breakout rooms, recording, chat, polls, and attendance tracking.',
      color: 'from-indigo-500 to-blue-500'
    }
  ];

  useEffect(() => {
    loadHomeData();
  }, []);

  // Debug: Log stats changes
  useEffect(() => {
    console.log('Stats state updated:', stats);
  }, [stats]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // Use optimized count queries instead of loading all documents
      // Load all counts in parallel for better performance
      const [studentsCount, recordingsCount, tasksCount, batchesCount] = await Promise.all([
        usersService.getCountByRole('student').catch(() => 0),
        recordingsService.getCount().catch(() => 0),
        tasksService.getCount().catch(() => 0),
        batchesService.getCount().catch(() => 0)
      ]);

      console.log('✅ Stats loaded:', { studentsCount, recordingsCount, tasksCount, batchesCount });

      // Use real data if available, otherwise use mock values
      const statsData = {
        students: studentsCount > 0 ? studentsCount : MOCK_STATS.students,
        recordings: recordingsCount > 0 ? recordingsCount : MOCK_STATS.recordings,
        tasks: tasksCount > 0 ? tasksCount : MOCK_STATS.tasks,
        batches: batchesCount > 0 ? batchesCount : MOCK_STATS.batches
      };

      console.log('📊 Final stats:', statsData);
      console.log('📊 Real counts:', { studentsCount, recordingsCount, tasksCount, batchesCount });
      setStats(statsData);


      // Load recordings that have YouTube video IDs (for video section)
      // Only load first 10 active recordings, then filter client-side (much faster)
      try {
        const activeRecordings = await recordingsService.getActive(10);
        const youtubeRecordings = (activeRecordings || [])
          .filter(r => r.youtubeVideoId || r.videoUrl?.includes('youtube.com') || r.videoUrl?.includes('youtu.be'))
          .slice(0, 2)
          .map(r => ({
            id: r.id,
            title: r.title || 'Session Recording',
            description: r.description || '',
            videoId: r.youtubeVideoId || extractYouTubeId(r.videoUrl),
            duration: r.duration || 'N/A',
            level: r.level || 'Beginner',
            category: r.category || 'General',
            views: r.views || '0'
          }));
        setVideos(youtubeRecordings);
        console.log('✅ Videos loaded:', youtubeRecordings.length);
      } catch (error) {
        console.error('❌ Error loading videos:', error);
        setVideos([]);
      }

    } catch (error) {
      console.error('❌ Critical error loading home data:', error);
      // Use mock values on error
      console.log('⚠️ Using mock stats due to error');
      setStats(MOCK_STATS);
    } finally {
      setLoading(false);
    }
  };

  const extractYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Create stats cards with real data
  const statsCards = [
    { icon: '👥', value: `${stats.students || 0}+`, label: 'Students', color: 'from-blue-500 to-purple-500', delay: '0s' },
    { icon: '🎥', value: `${stats.recordings || 0}+`, label: 'Session Recordings', color: 'from-green-500 to-blue-500', delay: '0.1s' },
    { icon: '📋', value: `${stats.tasks || 0}+`, label: 'Tasks', color: 'from-orange-500 to-red-500', delay: '0.2s' },
    { icon: '🎓', value: `${stats.batches || 0}+`, label: 'Batches', color: 'from-purple-500 to-pink-500', delay: '0.3s' }
  ];

  const nextFeature = () => {
    setCurrentFeature((prev) => (prev + 1) % features.length);
  };

  const prevFeature = () => {
    setCurrentFeature((prev) => (prev - 1 + features.length) % features.length);
  };

  return (
    <div className="home-page">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="gradient-text">Build Skills,</span>
              <span className="gradient-text">Ship Software.</span>
            </h1>
            <p className="hero-subtitle">
              Master coding through hands-on projects, expert mentorship, and real-world experience.
            </p>
          </div>

          <div className="hero-card-container">
            <div className="hero-card">
              <div className="hero-card-icon">
                <FaRocket />
              </div>
              <h3 className="hero-card-title gradient-text">Start Your Journey</h3>
              <p className="hero-card-subtitle">Join thousands of developers worldwide</p>

              <div className="hero-features">
                <div className="hero-feature">
                  <FaCheckCircle className="hero-feature-icon" />
                  <div>
                    <h4>Interactive Learning</h4>
                    <p>Hands-on coding experience</p>
                  </div>
                </div>
                <div className="hero-feature">
                  <FaUserFriends className="hero-feature-icon" />
                  <div>
                    <h4>Expert Mentorship</h4>
                    <p>Learn from industry professionals</p>
                  </div>
                </div>
                <div className="hero-feature">
                  <FaTrophy className="hero-feature-icon" />
                  <div>
                    <h4>Career Growth</h4>
                    <p>Build your professional portfolio</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="workflow-section">
        <div className="section-container">
          <h2 className="section-title gradient-text">
            <FaRocket className="section-title-icon" />
            Power Up Your Learning Workflow
          </h2>
          <p className="section-subtitle">
            Manage tasks, link GitHub PRs, handle payments, and access session recordings — all in one powerful platform.
          </p>
          <div className="workflow-features">
            <div className="workflow-feature">
              <div className="workflow-dot"></div>
              <span>Task Management</span>
            </div>
            <div className="workflow-feature">
              <div className="workflow-dot"></div>
              <span>AI Pro Model Access</span>
            </div>
            <div className="workflow-feature">
              <div className="workflow-dot"></div>
              <span>GitHub Integration</span>
            </div>
            <div className="workflow-feature">
              <div className="workflow-dot"></div>
              <span>Payment Processing</span>
            </div>
            <div className="workflow-feature">
              <div className="workflow-dot"></div>
              <span>Session Recordings</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Carousel */}
      <section className="features-section">
        <div className="section-container">
          <h2 className="section-title gradient-text">Platform Features</h2>
          <p className="section-subtitle">
            Everything you need to succeed in your learning journey, all in one powerful platform
          </p>

          <div className="features-carousel">
            <button className="carousel-btn carousel-btn-prev" onClick={prevFeature}>
              <FaChevronLeft />
            </button>

            <div className="feature-card">
              <div className={`feature-card-gradient ${features[currentFeature].color}`}></div>
              <div className="feature-card-content">
                <div className="feature-icon">{features[currentFeature].icon}</div>
                <h3 className="feature-title">{features[currentFeature].title}</h3>
                <p className="feature-description">{features[currentFeature].description}</p>
                <p className="feature-details">{features[currentFeature].details}</p>
                <div className="feature-progress"></div>
              </div>
            </div>

            <button className="carousel-btn carousel-btn-next" onClick={nextFeature}>
              <FaChevronRight />
            </button>
          </div>

          <div className="feature-indicators">
            {features.map((feature, index) => (
              <button
                key={index}
                className={`feature-indicator ${index === currentFeature ? 'active' : ''}`}
                onClick={() => setCurrentFeature(index)}
              >
                <div className="feature-indicator-icon">{feature.icon}</div>
                <div className="feature-indicator-dot"></div>
              </button>
            ))}
          </div>

          <div className="feature-progress-bar">
            <div 
              className="feature-progress-fill"
              style={{ width: `${((currentFeature + 1) / features.length) * 100}%` }}
            ></div>
          </div>
          <p className="feature-progress-text">{currentFeature + 1} of {features.length}</p>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="stats-section">
        <div className="section-container">
          <div className="stats-grid">
            <div className="stats-info">
              <h2 className="section-title gradient-text">LMS Statistics</h2>
              <p className="section-subtitle">See the impact of our learning platform in numbers</p>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite', fontSize: '2rem', color: 'var(--primary)' }} />
                  <p>Loading statistics...</p>
                </div>
              ) : (
                <div className="stats-cards">
                  {statsCards.map((stat, index) => (
                    <div key={index} className="stat-card" style={{ transitionDelay: stat.delay }}>
                      <div className={`stat-gradient bg-gradient-to-br ${stat.color}`}></div>
                      <div className="stat-icon">{stat.icon}</div>
                      <div className="stat-value">{stat.value}</div>
                      <div className="stat-label">{stat.label}</div>
                      <div className={`stat-bar bg-gradient-to-r ${stat.color}`}></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="stats-cta">
              <div className="stats-cta-content">
                <div className="stats-cta-header">
                  <h3>New Feature: Interactive Workshops</h3>
                  <div className="stats-cta-emoji">✨</div>
                </div>
                <p>
                  Join live sessions with industry experts to level up your skills, collaborate with peers, 
                  and receive real-time feedback on projects.
                </p>
                <a 
                  href="https://sl.codinggura.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="stats-cta-btn"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="video-section">
        <div className="section-container">
          <h2 className="section-title-white">YouTube Published Session Recordings</h2>
          <p className="section-subtitle-white">
            Explore our wide range of session recordings to gain deeper insights and sharpen your skills with expert-led content.
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite', fontSize: '2rem', color: 'var(--primary)' }} />
              <p>Loading videos...</p>
            </div>
          ) : (
            <div className="video-grid">
              {videos.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem' }}>No videos available yet.</p>
              ) : (
                videos.map((video) => (
                  video.videoId ? (
                    <div key={video.id} className="video-card">
                      <div className="video-frame">
                        <iframe
                          src={`https://www.youtube.com/embed/${video.videoId}`}
                          title={video.title}
                          frameBorder="0"
                          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                        <div className="video-badges">
                          <span className="video-badge">{video.duration}</span>
                          <span className="video-badge">{video.level}</span>
                        </div>
                      </div>
                      <div className="video-content">
                        <div className="video-header">
                          <span className="video-category">{video.category}</span>
                          <div className="video-views">
                            <span>👁</span>
                            <span>{video.views} views</span>
                          </div>
                        </div>
                        <h3 className="video-title">{video.title}</h3>
                        <p className="video-description">{video.description}</p>
                        <button className="video-btn">
                          <FaPlayCircle /> Watch Now
                        </button>
                      </div>
                    </div>
                  ) : null
                ))
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;

