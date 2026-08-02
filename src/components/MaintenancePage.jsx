import React from 'react';
import './MaintenancePage.css';

const MaintenancePage = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="maintenance-page-container">
      <div className="maintenance-card">
        {/* Logo */}
        <div className="maintenance-logo-wrapper">
          <img src="/ureb.png" alt="UREB Logo" className="maintenance-logo" />
        </div>

        {/* Pulsing Status Badge */}
        <div className="maintenance-badge">
          <span className="maintenance-pulse-dot"></span>
          <span>Scheduled System Maintenance</span>
        </div>

        {/* Main Heading */}
        <h1 className="maintenance-title">System Under Maintenance</h1>

        {/* Respected Message */}
        <p className="maintenance-description">
          The <strong>Davao Oriental State University - University Research Ethics Board (DORSU-UREB)</strong> portal 
          is currently undergoing scheduled maintenance and system optimization to enhance performance, security, and user experience.
        </p>

        <p className="maintenance-subdescription">
          We sincerely appreciate your patience and understanding. All existing research protocols, applications, and account data remain completely safe and protected.
        </p>

        {/* Info Grid */}
        <div className="maintenance-info-grid">
          <div className="info-box">
            <div className="info-icon">⚡</div>
            <div className="info-text">
              <strong>Status</strong>
              <span>Optimization in Progress</span>
            </div>
          </div>

          <div className="info-box">
            <div className="info-icon">🕒</div>
            <div className="info-text">
              <strong>Estimated Back</strong>
              <span>We will be ready shortly</span>
            </div>
          </div>
        </div>

        {/* Refresh Action */}
        <div className="maintenance-actions">
          <button type="button" className="maintenance-refresh-btn" onClick={handleRefresh}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            <span>Check Status / Refresh</span>
          </button>
        </div>

        <div className="maintenance-footer">
          <p>© {new Date().getFullYear()} DORSU - University Research Ethics Board. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
