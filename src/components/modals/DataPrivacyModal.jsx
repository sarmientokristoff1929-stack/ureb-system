import React, { useState } from 'react';
import '../../styles/DataPrivacyModal.css';

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
        <h2 className="post-login-privacy-title">Data Privacy Disclaimer</h2>

        <div className="post-login-privacy-content">
          <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.6', margin: '0 0 0.75rem 0' }}>
            All information and protocol documents submitted through this online application system will be processed strictly for research ethics review, monitoring, and administrative record-keeping. In compliance with the Data Privacy Act of 2012 (Republic Act No. 10173) and the Philippine Health Research Ethics Board (PHREB) standards, all submitted data will be handled with strict confidentiality and stored securely. The Davao Oriental State University – Research Ethics Board (DOrSU-REB) functions as an independent ethics body responsible for evaluating research protocols to ensure the safety, welfare, and protection of research participants.
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
