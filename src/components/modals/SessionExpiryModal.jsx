import React from 'react';
import './SessionExpiryModal.css';

const SessionExpiryModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="session-expiry-overlay" role="alertdialog" aria-modal="true" aria-labelledby="session-expiry-title">
      <div className="session-expiry-modal">
        <div className="session-expiry-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="#C77700" strokeWidth="2" />
            <path d="M12 7.5V12L15 14.25" stroke="#C77700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 id="session-expiry-title" className="session-expiry-title">Session Expired</h2>

        <p className="session-expiry-message">
          You've been signed out after 10 minutes of inactivity. This helps keep
          your research account secure. Please log in again to continue.
        </p>

        <button
          type="button"
          className="session-expiry-btn session-expiry-btn-primary"
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default SessionExpiryModal;
