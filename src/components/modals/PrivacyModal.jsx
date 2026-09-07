import { useState } from 'react';
import '../../styles/PrivacyModal.css';

const PrivacyModal = ({ isOpen, onClose }) => {
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
        <div className="privacy-modal-overlay" onClick={handleOverlayClick}>
            <div className="privacy-modal-container">
                <button className="privacy-modal-close" onClick={onClose} aria-label="Close modal">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                    </svg>
                </button>

                <div className="privacy-modal-content">
                    <div className="privacy-modal-header">
                        <h2>Privacy Policy</h2>
                        <p>Your privacy is important to us. Please read our privacy policy carefully.</p>
                    </div>

                    <div className="privacy-modal-body">
                        <div className="privacy-section">
                            <h3>1. Information We Collect</h3>
                            <p>We collect personal information that you voluntarily provide when using the UREB system, including your name, email address, institutional affiliation, and research protocol details submitted through the platform.</p>
                        </div>

                        <div className="privacy-section">
                            <h3>2. How We Use Your Information</h3>
                            <p>Your information is used solely for the purpose of facilitating research ethics review processes, communicating review decisions, and improving the quality of our services. We do not use your data for any purpose beyond what is necessary for the ethics review workflow.</p>
                        </div>

                        <div className="privacy-section">
                            <h3>3. Data Storage and Security</h3>
                            <p>All data submitted through the UREB system is stored securely on protected servers. We implement appropriate technical and organizational measures to safeguard your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
                        </div>

                        <div className="privacy-section">
                            <h3>4. Third-Party Sharing</h3>
                            <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your explicit consent. Your data is only shared with authorized UREB board members and reviewers involved in the ethics review process.</p>
                        </div>

                        <div className="privacy-section">
                            <h3>5. Cookies and Tracking</h3>
                            <p>Our system may use cookies to enhance your browsing experience. These cookies are used solely for session management and do not collect any personally identifiable information beyond what is necessary for system functionality.</p>
                        </div>

                        <div className="privacy-section">
                            <h3>6. Your Rights</h3>
                            <p>You have the right to access, correct, or request the deletion of your personal data at any time. You may also request a copy of the data you have submitted to the UREB system by contacting our data protection officer.</p>
                        </div>

                        <div className="privacy-section">
                            <h3>7. Data Retention</h3>
                            <p>We retain your data only for as long as necessary to fulfill the purposes for which it was collected, including compliance with legal and regulatory obligations related to research ethics review.</p>
                        </div>

                        <div className="privacy-section">
                            <h3>8. Contact Us</h3>
                            <p>If you have any questions or concerns about this privacy policy or how your data is handled, please contact us at <a href="mailto:reo@dorsu.edu.ph">reo@dorsu.edu.ph</a>.</p>
                        </div>
                    </div>

                    <div className="privacy-modal-footer">
                        <label className="privacy-checkbox">
                            <input
                                type="checkbox"
                                checked={accepted}
                                onChange={(e) => setAccepted(e.target.checked)}
                            />
                            <span>I have read and agree to the Privacy Policy</span>
                        </label>
                        <button
                            className="btn-primary privacy-accept-btn"
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

export default PrivacyModal;
