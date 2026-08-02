import React, { useState } from 'react';
import './DataPrivacyModal.css';

const DataPrivacyModal = ({ isOpen, onAccept }) => {
  const [isChecked, setIsChecked] = useState(false);

  if (!isOpen) return null;

  const handleProceed = () => {
    if (isChecked) {
      onAccept();
    }
  };

  return (
    <div className="post-login-privacy-overlay">
      <div className="post-login-privacy-modal">
        {/* Top Header Badge */}
        <div className="post-login-privacy-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Official Notice • RA 10173</span>
        </div>

        {/* Modal Title */}
        <h2 className="post-login-privacy-title">Data Privacy & Protection Commitment</h2>

        <p className="post-login-privacy-greeting">
          Welcome to the <strong>Davao Oriental State University - UREB Portal</strong>.
        </p>

        {/* Message Content */}
        <div className="post-login-privacy-content">
          <p>
            We hold your academic work and privacy in highest regard. In strict compliance with 
            the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong>, we are committed to 
            protecting your personal credentials and research submissions.
          </p>

          <div className="post-login-privacy-pillars">
            <div className="privacy-pillar-item">
              <div className="pillar-icon">🔒</div>
              <div>
                <strong>Confidentiality & Security</strong>
                <p>Your data and research protocols are secured with encryption and restricted access controls.</p>
              </div>
            </div>

            <div className="privacy-pillar-item">
              <div className="pillar-icon">📋</div>
              <div>
                <strong>Legitimate Purpose</strong>
                <p>Processed exclusively for official ethics reviews, application tracking, and board notifications.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Acceptance Checkbox */}
        <label className="post-login-privacy-checkbox">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
          />
          <span>I have read, understood, and accept the Data & Privacy Policy.</span>
        </label>

        {/* Action Button */}
        <button
          type="button"
          className="post-login-privacy-btn"
          disabled={!isChecked}
          onClick={handleProceed}
        >
          Accept & Proceed
        </button>
      </div>
    </div>
  );
};

export default DataPrivacyModal;
