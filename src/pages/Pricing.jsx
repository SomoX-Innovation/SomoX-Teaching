import { Link } from 'react-router-dom';
import { 
  FaCheckCircle,
  FaChevronRight,
  FaBars,
  FaTimes,
  FaCheck,
  FaStar,
  FaRocket
} from 'react-icons/fa';
import { useState } from 'react';
import './Pricing.css';

const Pricing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for small classes and individual teachers',
      monthlyPrice: 29,
      yearlyPrice: 290,
      features: [
        'Up to 5 Classes',
        'Up to 50 Students',
        'Basic Task Management',
        'Session Recordings (10 hours)',
        'Email Support',
        'Basic Analytics'
      ],
      popular: false
    },
    {
      name: 'Professional',
      description: 'Ideal for growing institutions and multiple teachers',
      monthlyPrice: 79,
      yearlyPrice: 790,
      features: [
        'Unlimited Classes',
        'Up to 500 Students',
        'Advanced Task Management',
        'Unlimited Recordings',
        'Priority Support',
        'Advanced Analytics',
        'Payment Processing',
        'Multi-Teacher Support'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      description: 'For large institutions with custom requirements',
      monthlyPrice: 199,
      yearlyPrice: 1990,
      features: [
        'Everything in Professional',
        'Unlimited Students',
        'Custom Integrations',
        'Dedicated Account Manager',
        '24/7 Phone Support',
        'Custom Branding',
        'API Access',
        'Advanced Security',
        'SLA Guarantee'
      ],
      popular: false
    }
  ];

  const faq = [
    {
      question: 'Can I change plans later?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, and bank transfers. Enterprise plans also support invoicing.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! All plans come with a 14-day free trial. No credit card required to start.'
    },
    {
      question: 'Do you offer discounts for educational institutions?',
      answer: 'Yes, we offer special pricing for schools and educational institutions. Contact us for more information.'
    }
  ];

  return (
    <div className="pricing-page">
      {/* Navigation */}
      <nav className="pricing-nav">
        <div className="pricing-nav-wrapper">
          <div className="pricing-nav-container">
            <Link to="/" className="pricing-brand">
              <img src="/assets/logo.png" alt="Somox Learning" className="pricing-brand-image" />
            </Link>
            <nav className="pricing-nav-menu">
              <div className="pricing-nav-links">
                <a href="/#features" className="pricing-nav-link">Features</a>
                <a href="/about" className="pricing-nav-link">About</a>
                <a href="/pricing" className="pricing-nav-link pricing-nav-link-active">Pricing</a>
                <Link to="/sign-in" className="pricing-nav-link">Login</Link>
                <Link to="/sign-in" className="pricing-nav-link pricing-nav-link-primary">
                  Get Started
                  <FaChevronRight className="pricing-nav-arrow-icon" />
                </Link>
              </div>
            </nav>
            <button 
              className="pricing-menu-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="menu"
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pricing-hero">
        <div className="pricing-hero-container">
          <div className="pricing-hero-content">
            <div className="pricing-hero-badge">
              <span>Simple, Transparent Pricing</span>
            </div>
            <h1 className="pricing-hero-title">
              Choose the Perfect Plan
              <span className="pricing-hero-title-highlight"> for Your Needs</span>
            </h1>
            <p className="pricing-hero-description">
              All plans include a 14-day free trial. No credit card required.
            </p>
            
            {/* Billing Toggle */}
            <div className="pricing-billing-toggle">
              <button
                className={`pricing-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </button>
              <button
                className={`pricing-toggle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('yearly')}
              >
                Yearly
                <span className="pricing-save-badge">Save 17%</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="pricing-plans">
        <div className="pricing-plans-container">
          <div className="pricing-plans-grid">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`pricing-plan-card ${plan.popular ? 'pricing-plan-popular' : ''}`}
              >
                {plan.popular && (
                  <div className="pricing-plan-badge">
                    <FaStar />
                    <span>Most Popular</span>
                  </div>
                )}
                <div className="pricing-plan-header">
                  <h3 className="pricing-plan-name">{plan.name}</h3>
                  <p className="pricing-plan-description">{plan.description}</p>
                  <div className="pricing-plan-price">
                    <span className="pricing-plan-currency">$</span>
                    <span className="pricing-plan-amount">
                      {billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                    </span>
                    <span className="pricing-plan-period">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <div className="pricing-plan-savings">
                      Save ${(plan.monthlyPrice * 12) - plan.yearlyPrice} per year
                    </div>
                  )}
                </div>
                <div className="pricing-plan-features">
                  <ul className="pricing-features-list">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="pricing-feature-item">
                        <FaCheckCircle className="pricing-feature-check" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pricing-plan-footer">
                  <Link 
                    to="/sign-in" 
                    className={`pricing-plan-btn ${plan.popular ? 'pricing-plan-btn-primary' : 'pricing-plan-btn-secondary'}`}
                  >
                    Start Free Trial
                    <FaChevronRight />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="pricing-comparison">
        <div className="pricing-comparison-container">
          <div className="pricing-comparison-header">
            <h2 className="pricing-section-title">Compare Plans</h2>
            <p className="pricing-section-subtitle">
              See what's included in each plan
            </p>
          </div>
          <div className="pricing-comparison-table">
            <table className="pricing-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Starter</th>
                  <th>Professional</th>
                  <th>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Classes</td>
                  <td>Up to 5</td>
                  <td>Unlimited</td>
                  <td>Unlimited</td>
                </tr>
                <tr>
                  <td>Students</td>
                  <td>Up to 50</td>
                  <td>Up to 500</td>
                  <td>Unlimited</td>
                </tr>
                <tr>
                  <td>Recordings Storage</td>
                  <td>10 hours</td>
                  <td>Unlimited</td>
                  <td>Unlimited</td>
                </tr>
                <tr>
                  <td>Support</td>
                  <td>Email</td>
                  <td>Priority</td>
                  <td>24/7 Phone</td>
                </tr>
                <tr>
                  <td>Analytics</td>
                  <td>Basic</td>
                  <td>Advanced</td>
                  <td>Advanced</td>
                </tr>
                <tr>
                  <td>API Access</td>
                  <td>—</td>
                  <td>—</td>
                  <td><FaCheck className="pricing-check-icon" /></td>
                </tr>
                <tr>
                  <td>Custom Branding</td>
                  <td>—</td>
                  <td>—</td>
                  <td><FaCheck className="pricing-check-icon" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="pricing-faq">
        <div className="pricing-faq-container">
          <div className="pricing-faq-header">
            <h2 className="pricing-section-title">Frequently Asked Questions</h2>
            <p className="pricing-section-subtitle">
              Everything you need to know about our pricing
            </p>
          </div>
          <div className="pricing-faq-list">
            {faq.map((item, index) => (
              <div key={index} className="pricing-faq-item">
                <h3 className="pricing-faq-question">{item.question}</h3>
                <p className="pricing-faq-answer">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pricing-cta">
        <div className="pricing-cta-container">
          <div className="pricing-cta-content">
            <h2 className="pricing-cta-title">Ready to Get Started?</h2>
            <p className="pricing-cta-description">
              Start your 14-day free trial today. No credit card required.
            </p>
            <div className="pricing-cta-buttons">
              <Link to="/sign-in" className="pricing-cta-btn pricing-cta-btn-primary">
                Start Free Trial
                <FaRocket />
              </Link>
              <a href="/contact" className="pricing-cta-btn pricing-cta-btn-secondary">
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pricing-footer">
        <div className="pricing-footer-container">
          <div className="pricing-footer-content">
            <div className="pricing-footer-brand">
              <img src="/assets/logo.png" alt="Somox Learning" className="pricing-footer-logo" />
              <p className="pricing-footer-tagline">Empowering Education Through Technology</p>
            </div>
            <div className="pricing-footer-links">
              <div className="pricing-footer-column">
                <h4 className="pricing-footer-heading">Product</h4>
                <a href="/#features" className="pricing-footer-link">Features</a>
                <a href="/pricing" className="pricing-footer-link">Pricing</a>
                <Link to="/sign-in" className="pricing-footer-link">Login</Link>
              </div>
              <div className="pricing-footer-column">
                <h4 className="pricing-footer-heading">Company</h4>
                <a href="/about" className="pricing-footer-link">About Us</a>
                <Link to="/contact" className="pricing-footer-link">Contact</Link>
                <a href="#" className="pricing-footer-link">Blog</a>
              </div>
              <div className="pricing-footer-column">
                <h4 className="pricing-footer-heading">Support</h4>
                <a href="#help" className="pricing-footer-link">Help Center</a>
                <a href="#" className="pricing-footer-link">Documentation</a>
                <Link to="/legal" className="pricing-footer-link">Legal</Link>
              </div>
            </div>
          </div>
          <div className="pricing-footer-bottom">
            <div className="pricing-footer-copyright">© Somox Learning 2026. All Rights Reserved.</div>
            <div className="pricing-footer-social">
              <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="pricing-footer-social-link">
                LinkedIn
              </a>
              <span className="pricing-footer-divider">|</span>
              <Link to="/legal" className="pricing-footer-social-link">Privacy Policy</Link>
              <span className="pricing-footer-divider">|</span>
              <Link to="/legal" className="pricing-footer-social-link">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
