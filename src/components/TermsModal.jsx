import { useState } from 'react';
import './TermsModal.css';

const TermsModal = ({ isOpen, onClose }) => {
  const [accepted, setAccepted] = useState(false);

  if (!isOpen) return null;

  const handleAccept = () => {
    setAccepted(true);
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="terms-modal-overlay" onClick={handleOverlayClick}>
      <div className="terms-modal-container">
        <button className="terms-modal-close" onClick={onClose} aria-label="Close modal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <div className="terms-modal-content">
          <div className="terms-modal-header">
            <h2>Terms &amp; Conditions</h2>
            <p>Please read these terms carefully before using the UREB system.</p>
          </div>

          <div className="terms-modal-body">
            <div className="terms-section">
              <h3>1. Acceptance of Terms</h3>
              <p>By accessing and using the University Research Ethics Board (UREB) system, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our services.</p>
            </div>

            <div className="terms-section">
              <h3>2. Use of the System</h3>
              <p>The UREB system is provided for the purpose of submitting, reviewing, and managing research ethics protocols. Users must provide accurate and complete information when using the system.</p>
            </div>

            <div className="terms-section">
              <h3>3. Researcher Responsibilities</h3>
              <p>Researchers are responsible for ensuring that their research protocols comply with all applicable laws, regulations, and institutional policies. The UREB reserves the right to reject or request revisions to any submission that does not meet ethical standards.</p>
            </div>

            <div className="terms-section">
              <h3>4. Data Privacy and Confidentiality</h3>
              <p>All personal and research data submitted through the UREB system is treated as confidential. We do not share, sell, or distribute user data to third parties without explicit consent, except as required by law.</p>
            </div>

            <div className="terms-section">
              <h3>5. Intellectual Property</h3>
              <p>All content, documents, and materials submitted through the UREB system remain the intellectual property of the original authors. The UREB system only facilitates review and does not claim ownership of submitted work.</p>
            </div>

            <div className="terms-section">
              <h3>6. System Availability</h3>
              <p>We strive to maintain the availability and reliability of the UREB system. However, we do not guarantee uninterrupted access and reserve the right to suspend or modify system services for maintenance or improvement purposes.</p>
            </div>

            <div className="terms-section">
              <h3>7. Changes to Terms</h3>
              <p>We reserve the right to update these terms at any time. Changes will be effective immediately upon posting on this system. Continued use of the system constitutes acceptance of the updated terms.</p>
            </div>

            <div className="terms-section">
              <h3>8. Contact</h3>
              <p>For questions or concerns regarding these terms, please contact us at <a href="mailto:reo@dorsu.edu.ph">reo@dorsu.edu.ph</a>.</p>
            </div>
          </div>

          <div className="terms-modal-footer">
            <label className="terms-checkbox">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <span>I have read and agree to the Terms &amp; Conditions</span>
            </label>
            <button
              className="btn-primary terms-accept-btn"
              disabled={!accepted}
              onClick={handleAccept}
            >
              I Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
