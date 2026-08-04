import React, { useState } from 'react';
import './DataPrivacyModal.css';

const DataPrivacyModal = ({ isOpen, onAccept, userRole }) => {
  const [isChecked, setIsChecked] = useState(false);

  const isAdmin = ['admin', 'superadmin', 'super-admin', 'root', 'administrator'].includes(userRole?.toLowerCase());

  if (!isOpen || isAdmin) return null;

  const handleProceed = () => {
    if (isChecked) {
      onAccept();
    }
  };

  return (
    <div className="post-login-privacy-overlay">
      <div className="post-login-privacy-modal">
        {/* Modal Title */}
        <h2 className="post-login-privacy-title">Data Privacy & Protection Notice</h2>

        {/* Message Content - 2 Sentences Only */}
        <div className="post-login-privacy-content">
          <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.6', margin: '0 0 0.75rem 0' }}>
            In compliance with the Data Privacy Act of 2012 (RA 10173), the UREB portal processes your personal and research data strictly for official ethics review and administrative purposes.
          </p>
          <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.6', margin: 0 }}>
            All submitted credentials and protocol details are protected under confidential safeguards and will never be shared with unauthorized third parties.
          </p>
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
