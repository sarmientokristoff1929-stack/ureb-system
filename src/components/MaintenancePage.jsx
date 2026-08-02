import React from 'react';
import './MaintenancePage.css';

const MaintenancePage = () => {
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

        <div className="maintenance-footer">
          <p>© {new Date().getFullYear()} DORSU - University Research Ethics Board. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
