import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaHome, 
  FaChevronRight, 
  FaRobot,
  FaChartBar,
  FaLock,
  FaPaperPlane
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { paymentsService } from '../../services/firebaseService';
import UsageStatsModal from '../../components/UsageStatsModal';
import './AIAssistant.css';

const AIAssistant = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isPaymentRequired, setIsPaymentRequired] = useState(true);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPaymentStatus();
  }, [user]);

  const checkPaymentStatus = async () => {
    if (!user?.uid || user?.role === 'admin') {
      setIsPaymentRequired(false);
      setLoading(false);
      return;
    }

    try {
      const payments = await paymentsService.getByUser(user.uid);
      
      // Check if current month is paid
      const now = new Date();
      const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
      const currentYear = now.getFullYear().toString();
      
      const hasPaid = payments.some(payment => {
        return payment.status === 'completed' && 
               payment.year === currentYear && 
               payment.month === currentMonth;
      });
      
      setIsPaymentRequired(!hasPaid);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setIsPaymentRequired(true); // Default to requiring payment on error
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (isPaymentRequired) {
      toast.warning('Payment required to use AI Assistant. Please complete payment for the current month.');
      return;
    }
    
    if (message.trim()) {
      // Handle sending message
      console.log('Sending:', message);
      // TODO: Implement actual AI chat functionality
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleSend(e);
    }
  };

  return (
    <div className="ai-assistant-container">
      <div className="ai-assistant-card">
        {/* Header */}
        <div className="ai-header">
          <div className="ai-header-left">
            <div className="ai-icon-wrapper">
              <FaRobot className="ai-header-icon" />
            </div>
            <h2 className="ai-title">AI Assistant</h2>
          </div>
          
          <div className="ai-header-right">
            <button 
              className="usage-stats-btn" 
              title="View Usage Statistics"
              onClick={() => setIsStatsModalOpen(true)}
            >
              <FaChartBar className="stats-icon" />
              Usage Stats
            </button>
            
            {/* Breadcrumb */}
            <nav className="ai-breadcrumb" aria-label="Breadcrumb">
              <ol className="breadcrumb-list">
                <li className="breadcrumb-item">
                  <div className="breadcrumb-content">
                    <FaHome className="breadcrumb-icon" />
                    <Link to="/dashboard" className="breadcrumb-link">Dashboard</Link>
                  </div>
                </li>
                <li className="breadcrumb-item">
                  <div className="breadcrumb-content">
                    <FaChevronRight className="breadcrumb-separator" />
                    <span className="breadcrumb-text">Chatgpt</span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Payment Warning Alert */}
        {loading ? (
          <div className="payment-warning-alert" style={{ background: '#eff6ff' }}>
            <div className="warning-text">Checking payment status...</div>
          </div>
        ) : isPaymentRequired ? (
          <div className="payment-warning-alert">
            <FaLock className="warning-icon" />
            <div className="warning-text">
              AI Assistant access requires payment completion for the current month. Please contact the administrator to make a payment.
            </div>
          </div>
        ) : null}

        {/* Chat Area */}
        <div className="ai-chat-area">
          <div className="ai-empty-state">
            <FaRobot className="empty-state-icon" />
            <h3 className="empty-state-title">Welcome to AI Assistant</h3>
            <p className="empty-state-hint">Press Ctrl+Enter to send a message</p>
          </div>
        </div>

        {/* Input Area */}
        <div className="ai-input-area">
          <div className="ai-input-container">
            <textarea
              placeholder={isPaymentRequired ? "Payment required to use AI Assistant..." : "Type your message here..."}
              className={`ai-textarea ${isPaymentRequired ? 'disabled' : ''}`}
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isPaymentRequired}
            />
            <button
              type="button"
              className={`ai-send-btn ${isPaymentRequired ? 'disabled' : ''}`}
              onClick={handleSend}
              disabled={isPaymentRequired}
            >
              <FaPaperPlane className="send-icon" />
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Usage Stats Modal */}
      <UsageStatsModal 
        isOpen={isStatsModalOpen} 
        onClose={() => setIsStatsModalOpen(false)} 
      />
    </div>
  );
};

export default AIAssistant;

