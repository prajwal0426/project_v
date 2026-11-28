import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, HelpCircle, Mail, MessageSquare, Send, Sparkles, X } from 'lucide-react';

export default function SupportModal({ isOpen, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const modalRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose?.();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!email || !message) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setMessage('');
      onClose?.();
    }, 2200);
  }

  return (
    <div className="vertex-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="support-modal-title">
      <div className="vertex-modal-card glass-modal" onClick={(e) => e.stopPropagation()} ref={modalRef}>
        <div className="modal-glow-edge" aria-hidden="true" />
        
        <header className="modal-header">
          <div className="modal-header-badge">
            <HelpCircle size={16} className="modal-sparkle-icon" />
            <span>Support &amp; Community</span>
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </header>

        <div className="modal-body">
          <h2 id="support-modal-title" className="modal-title">
            Help &amp; <span className="highlight-gradient">Support</span>
          </h2>
          <p className="modal-subtitle">
            Need assistance with account verification, project bounties, or team collaboration? Our team and global community are here to help.
          </p>

          <div className="support-channels-grid">
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="support-channel-card">
              <div className="channel-icon-box discord">
                <MessageSquare size={20} />
              </div>
              <div>
                <strong>Community Discord</strong>
                <p>Chat with builders, mentors &amp; engineers 24/7</p>
              </div>
            </a>

            <a href="mailto:support@vertexplatform.io" className="support-channel-card">
              <div className="channel-icon-box email">
                <Mail size={20} />
              </div>
              <div>
                <strong>Email Support</strong>
                <p>support@vertexplatform.io</p>
              </div>
            </a>
          </div>

          <form className="support-ticket-form" onSubmit={handleSubmit}>
            <h3>Send a Direct Query</h3>
            {submitted ? (
              <div className="support-success-msg">
                <CheckCircle2 size={18} />
                <span>Thank you! Your query has been logged and our support team will follow up shortly.</span>
              </div>
            ) : (
              <>
                <label>
                  <span>YOUR EMAIL</span>
                  <input
                    type="email"
                    required
                    placeholder="builder@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label>
                  <span>MESSAGE</span>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe your issue or question..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </label>
                <button type="submit" className="support-submit-btn">
                  <Send size={15} />
                  <span>Submit Ticket</span>
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
