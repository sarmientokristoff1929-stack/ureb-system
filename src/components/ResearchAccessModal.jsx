import { useState } from 'react';
import './ResearchAccessModal.css';

const FileCheckIcon = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <path d="m9 15 2 2 4-4"/>
  </svg>
);

const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

const ResearchAccessModal = ({ isOpen, onClose }) => {
  const [protocolCode, setProtocolCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call to check protocol status
    setTimeout(() => {
      setIsLoading(false);
      // Mock status response
      setStatus({
        code: protocolCode,
        title: 'Research Protocol: Impact of Green Spaces on Student Wellbeing',
        status: 'Under Review',
        submittedDate: '2026-01-15',
        lastUpdated: '2026-02-05',
        stage: 'Initial Review',
        estimatedCompletion: '2026-02-20',
        notes: 'Your protocol is currently being reviewed by the ethics committee. No additional action required at this time.'
      });
    }, 1500);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
      // Reset state when closing
      setStatus(null);
      setProtocolCode('');
    }
  };

  const handleClose = () => {
    onClose();
    setStatus(null);
    setProtocolCode('');
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container research-modal">
        <button className="modal-close" onClick={handleClose} aria-label="Close modal">
          <XIcon />
        </button>
        
        <div className="modal-header">
          <FileCheckIcon />
          <h2>Research Access</h2>
          <p>Enter your protocol code to check your research status</p>
        </div>

        {!status ? (
          <form className="modal-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="protocolCode">Protocol Code</label>
              <input
                type="text"
                id="protocolCode"
                value={protocolCode}
                onChange={(e) => setProtocolCode(e.target.value.toUpperCase())}
                placeholder="e.g., UREB-2026-001"
                required
                disabled={isLoading}
              />
              <span className="input-hint">Format: UREB-YYYY-XXX</span>
            </div>
            <button 
              type="submit" 
              className="btn-primary modal-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-spinner">Checking...</span>
              ) : (
                'Check Status'
              )}
            </button>
          </form>
        ) : (
          <div className="status-result">
            <div className="status-header">
              <span className={`status-badge ${status.status.toLowerCase().replace(' ', '-')}`}>
                {status.status}
              </span>
              <span className="protocol-code">{status.code}</span>
            </div>
            
            <h3 className="protocol-title">{status.title}</h3>
            
            <div className="status-details">
              <div className="detail-row">
                <span className="detail-label">Current Stage:</span>
                <span className="detail-value">{status.stage}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Submitted:</span>
                <span className="detail-value">{status.submittedDate}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Last Updated:</span>
                <span className="detail-value">{status.lastUpdated}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Est. Completion:</span>
                <span className="detail-value">{status.estimatedCompletion}</span>
              </div>
            </div>

            <div className="status-notes">
              <p>{status.notes}</p>
            </div>

            <button 
              className="btn-primary modal-submit"
              onClick={() => { setStatus(null); setProtocolCode(''); }}
            >
              Check Another Protocol
            </button>
          </div>
        )}

        <div className="modal-footer">
          <p>Need help? <a href="#contact">Contact support</a></p>
        </div>
      </div>
    </div>
  );
};

export default ResearchAccessModal;
