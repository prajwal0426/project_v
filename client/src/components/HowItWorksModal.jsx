import React, { useEffect, useRef } from 'react';
import { ArrowRight, BarChart3, Code2, Coins, Play, Sparkles, Users, X } from 'lucide-react';

export default function HowItWorksModal({ isOpen, onClose, onExplore }) {
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

  return (
    <div className="vertex-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="how-it-works-title">
      <div className="vertex-modal-card glass-modal" onClick={(e) => e.stopPropagation()} ref={modalRef}>
        <div className="modal-glow-edge" aria-hidden="true" />
        
        <header className="modal-header">
          <div className="modal-header-badge">
            <Sparkles size={16} className="modal-sparkle-icon" />
            <span>Platform Overview</span>
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </header>

        <div className="modal-body">
          <h2 id="how-it-works-title" className="modal-title">
            How <span className="highlight-gradient">Vertex</span> Works
          </h2>
          <p className="modal-subtitle">
            A merit-first platform designed to turn verified execution into rank, industry prestige, and direct rewards.
          </p>

          <div className="how-it-works-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon-box">
                <Code2 size={20} />
              </div>
              <h3>Build Projects</h3>
              <p>Select from verified industry challenges, build high-performance software, and validate your code through automated test harnesses.</p>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon-box">
                <Users size={20} />
              </div>
              <h3>Collaborate</h3>
              <p>Team up with top developers and co-develop with enterprise partners actively seeking proven builders.</p>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon-box">
                <BarChart3 size={20} />
              </div>
              <h3>Get Ranked</h3>
              <p>Your delivery performance, code quality, and peer reviews drive transparent placement on global skill leaderboards.</p>
            </div>

            <div className="step-card">
              <div className="step-number">04</div>
              <div className="step-icon-box">
                <Coins size={20} />
              </div>
              <h3>Earn Rewards</h3>
              <p>Earn verified credentials, claim direct contract bounties, and convert your hard skills into tangible value.</p>
            </div>
          </div>
        </div>

        <footer className="modal-footer">
          <button className="modal-secondary-btn" type="button" onClick={onClose}>
            Close
          </button>
          <button
            className="modal-primary-btn"
            type="button"
            onClick={() => {
              onClose?.();
              onExplore?.();
            }}
          >
            <span>Start Exploring</span>
            <ArrowRight size={16} />
          </button>
        </footer>
      </div>
    </div>
  );
}
