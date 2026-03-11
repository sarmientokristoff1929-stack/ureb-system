import { useState, useEffect } from 'react';

import './reviewerdashboard.css';

import { getProposalsByReviewer, getReviewsByReviewer, getMessagesByUser, submitReview, getReviewerAssignments, downloadReviewerFile, deleteMessage, changeReviewerPassword, getReviewerProfile } from '../services/api';



// Icons as simple SVG components

const DashboardIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <rect x="3" y="3" width="7" height="7"/>

    <rect x="14" y="3" width="7" height="7"/>

    <rect x="14" y="14" width="7" height="7"/>

    <rect x="3" y="14" width="7" height="7"/>

  </svg>

);



const FileCheckIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>

    <polyline points="14 2 14 8 20 8"/>

    <path d="m9 15 2 2 4-4"/>

  </svg>

);



const ClockIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <circle cx="12" cy="12" r="10"/>

    <polyline points="12 6 12 12 16 14"/>

  </svg>

);



const MessageIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>

  </svg>

);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);



const MenuIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <line x1="3" y1="12" x2="21" y2="12"/>

    <line x1="3" y1="6" x2="21" y2="6"/>

    <line x1="3" y1="18" x2="21" y2="18"/>

  </svg>

);



const XIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M18 6 6 18"/>

    <path d="m6 6 12 12"/>

  </svg>

);



const LogOutIcon = () => (

  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>

    <polyline points="16 17 21 12 16 7"/>

    <line x1="21" y1="12" x2="9" y2="12"/>

  </svg>

);



const SearchIcon = () => (

  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <circle cx="11" cy="11" r="8"/>

    <path d="m21 21-4.35-4.35"/>

  </svg>

);



const SubmitReviewIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>

    <polyline points="22 4 12 14.01 9 11.01"/>

  </svg>

);



const SubmitSecondaryFileIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>

    <polyline points="14 2 14 8 20 8"/>

    <line x1="12" y1="18" x2="12" y2="12"/>

    <line x1="9" y1="15" x2="15" y2="15"/>

  </svg>

);



const FileTemplatesIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>

    <polyline points="14 2 14 8 20 8"/>

    <line x1="16" y1="13" x2="8" y2="13"/>

    <line x1="16" y1="17" x2="8" y2="17"/>

    <polyline points="10 9 9 9 8 9"/>

  </svg>

);



const ReviewerDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState(() => {
    // Restore active tab from localStorage on initial load
    const savedTab = localStorage.getItem('ureb_activeTab');
    return savedTab || 'dashboard';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ureb_activeTab', activeTab);
  }, [activeTab]);

  const [userInfo, setUserInfo] = useState({ name: 'Reviewer', email: 'reviewer@ureb.edu' });

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSecondaryReviewer, setIsSecondaryReviewer] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // List of Secondary Reviewers
  const secondaryReviewers = [
    'Dr. Emily S. Antonio',
    'Dr. Jeralyn N. Hemillan', 
    'Dr. Rose Anelyn V. Ceniza',
    'Dr. Roselyn V. Regino',
    'Dr. Maria Gloria R. Lugo',
    'Dr. Sharmaine Anne C. Argawanon'
  ];

  // Check if current user is a Secondary Reviewer
  useEffect(() => {
    const savedUser = localStorage.getItem('ureb_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      const userIsSecondary = secondaryReviewers.includes(user.name);
      setIsSecondaryReviewer(userIsSecondary);
    }
  }, []);

  const CheckIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'assigned-proposals', label: 'Assigned Proposals', icon: <FileCheckIcon /> },
    { id: 'file-templates', label: 'File Templates', icon: <FileTemplatesIcon /> },
    { id: 'pending-reviews', label: 'Submit Review', icon: <ClockIcon /> },
    // Only show Submit Secondary File for Preliminary Reviewers
    ...(!isSecondaryReviewer ? [{ id: 'submit-secondary-file', label: 'Submit Secondary File', icon: <SubmitSecondaryFileIcon /> }] : []),
    { id: 'submitted-reviews', label: 'Submitted Reviews', icon: <CheckIcon /> },
    { id: 'messages', label: 'Messages', icon: <MessageIcon /> }
  ];

  useEffect(() => {

    const savedUser = localStorage.getItem('ureb_user');

    if (savedUser) {

      setUserInfo(JSON.parse(savedUser));

    }

    // Check if welcome modal has been shown in this login session

    const welcomeShown = sessionStorage.getItem('reviewer_welcome_shown');

    if (welcomeShown) {

      setShowWelcomeModal(false);

    }

  }, []);



  const handleLogout = () => {

    setIsLogoutModalOpen(true);

  };



  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    // Clear welcome modal flag so it shows again on next login
    sessionStorage.removeItem('reviewer_welcome_shown');
    onLogout();
  };



  const cancelLogout = () => {

    setIsLogoutModalOpen(false);

  };



  const handleProfileClick = () => {
    setProfileData({ name: userInfo.name, email: userInfo.email });
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setProfileError('');
    setProfileSuccess('');
    setEditingProfile(false);
    setShowProfileModal(true);
  };

  const handleProfileUpdate = async () => {
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const response = await fetch('/api/reviewers/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: userInfo.email, 
          name: profileData.name
        }),
      });

      const result = await response.json();
      if (result.success) {
        const updatedUser = { ...userInfo, name: profileData.name };
        setUserInfo(updatedUser);
        localStorage.setItem('ureb_user', JSON.stringify(updatedUser));
        setEditingProfile(false);
        setProfileSuccess('Profile updated successfully!');
        setTimeout(() => setProfileSuccess(''), 3000);
      } else {
        setProfileError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setProfileError('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    if (!currentPassword || !newPassword || !confirmPassword) {
      setProfileError('All password fields are required');
      setTimeout(() => setProfileError(''), 3000);
      return;
    }
    if (newPassword.length < 6) {
      setProfileError('New password must be at least 6 characters');
      setTimeout(() => setProfileError(''), 3000);
      return;
    }
    if (newPassword !== confirmPassword) {
      setProfileError('New passwords do not match');
      setTimeout(() => setProfileError(''), 3000);
      return;
    }
    setProfileLoading(true);
    setProfileError('');
    const savedUser = localStorage.getItem('ureb_user');
    const user = savedUser ? JSON.parse(savedUser) : null;
    const result = await changeReviewerPassword(user?.email, currentPassword, newPassword);
    setProfileLoading(false);
    if (result.success) {
      setProfileSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswords({ current: false, new: false, confirm: false });
      setTimeout(() => setProfileSuccess(''), 3000);
    } else {
      setProfileError(result.error || 'Failed to change password');
      setTimeout(() => setProfileError(''), 3000);
    }
  };

const renderContent = () => {

switch (activeTab) {

case 'dashboard':

return <DashboardContent />;

case 'assigned-proposals':

return <AssignedProposalsContent />;

case 'file-templates':

return <FileTemplatesContent />;

case 'pending-reviews':

return <SubmitReviewContent onShowSuccessModal={() => setShowSuccessModal(true)} onNavigateToSubmitted={() => setActiveTab('submitted-reviews')} />;

case 'submit-secondary-file':

return <SubmitSecondaryFileContent onShowSuccessModal={() => setShowSuccessModal(true)} onNavigateToSubmitted={() => setActiveTab('submitted-reviews')} />;

case 'submitted-reviews':

return <SubmittedReviewsContent />;

case 'messages':

return <MessagesContent />;

default:

return <DashboardContent />;

    }

  };



  return (
    <div className="reviewer-dashboard">
      {/* Welcome Modal */}
      {showWelcomeModal && activeTab === 'dashboard' && (
        <ReviewerWelcomeModal
          firstName={userInfo.name.split(' ')[0]}
          onClose={() => {
            setShowWelcomeModal(false);
            sessionStorage.setItem('reviewer_welcome_shown', 'true');
          }}
        />
      )}

      {/* Sidebar */}

      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>

        <div className="sidebar-header">

          <div className="sidebar-logo">
            <img src="/logoureb.png" alt="UREB Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
            <span>Reviewer Portal</span>
          </div>

          <button
            className="sidebar-toggle mobile-only"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <XIcon /> : <MenuIcon />}
          </button>

        </div>

        <nav className="sidebar-nav">

          {menuItems.map((item) => (

            <button

              key={item.id}

              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}

              onClick={() => { setActiveTab(item.id); if (window.innerWidth <= 768) setIsSidebarOpen(false); }}

            >

              {item.icon}

              <span>{item.label}</span>

            </button>

          ))}

        </nav>

        <div className="sidebar-footer">

          <button className="nav-item logout" onClick={handleLogout}>

            <LogOutIcon />

            <span>Log Out</span>

          </button>

        </div>

      </aside>



      {/* Main Content */}

      <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>

        <header className="content-header">

          <button
            className="menu-toggle desktop-only"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >

            <MenuIcon />

          </button>

          <h1>{menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}</h1>

          <div className="user-info">

            <span>Welcome, {userInfo.name}</span>

            <div className="user-avatar" onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
              {userInfo.name.charAt(0).toUpperCase()}
            </div>

          </div>

        </header>

        

        <div className="content-body">

          {renderContent()}

        </div>

      </main>

      <LogoutModal isOpen={isLogoutModalOpen} onClose={cancelLogout} onConfirm={confirmLogout} />
      
      {/* Success Modal */}
      <SuccessModal isOpen={showSuccessModal} onClose={() => { setShowSuccessModal(false); setActiveTab('submitted-reviews'); }} />

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="profile-modal-overlay" onClick={() => !profileLoading && setShowProfileModal(false)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2>Profile Settings</h2>
              <button className="profile-modal-close" onClick={() => setShowProfileModal(false)} disabled={profileLoading}>
                Close
              </button>
            </div>

            {profileSuccess && (
              <div className="profile-success-banner">
                {profileSuccess}
              </div>
            )}

            {profileError && (
              <div className="profile-error-banner">
                {profileError}
              </div>
            )}

            <div className="profile-modal-content">
              {/* Profile Information Section */}
              <div className="profile-section">
                <h3>Profile Information</h3>
                {!editingProfile ? (
                  <div className="profile-info-display">
                    <div className="profile-info-row">
                      <span className="profile-label">Name:</span>
                      <span className="profile-value">{profileData.name}</span>
                    </div>
                    <div className="profile-info-row">
                      <span className="profile-label">Email:</span>
                      <span className="profile-value">{profileData.email}</span>
                    </div>
                    <button 
                      className="profile-edit-btn"
                      onClick={() => setEditingProfile(true)}
                      disabled={profileLoading}
                    >
                      Edit Profile
                    </button>
                  </div>
                ) : (
                  <div className="profile-edit-form">
                    <div className="profile-form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div className="profile-form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                      <small style={{ color: '#666', fontSize: '0.8rem' }}>Email cannot be changed</small>
                    </div>
                    <div className="profile-form-actions">
                      <button 
                        className="profile-save-btn"
                        onClick={handleProfileUpdate}
                        disabled={profileLoading}
                      >
                        {profileLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button 
                        className="profile-cancel-btn"
                        onClick={() => {
                          setEditingProfile(false);
                          setProfileData({ name: userInfo.name, email: userInfo.email });
                        }}
                        disabled={profileLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Password Change Section */}
              <div className="profile-section">
                <h3>Change Password</h3>
                <div className="password-form">
                  <div className="profile-form-group">
                    <label>Current Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      >
                        {showPasswords.current ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                  <div className="profile-form-group">
                    <label>New Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password (min. 6 characters)"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      >
                        {showPasswords.new ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                  <div className="profile-form-group">
                    <label>Confirm New Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showPasswords.confirm ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                  <button 
                    className="profile-password-btn"
                    onClick={handlePasswordChange}
                    disabled={profileLoading}
                  >
                    {profileLoading ? 'Updating...' : 'Change Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>

  );

};



// Content Components

const DashboardContent = () => {

  const [stats, setStats] = useState({

    assignedProposals: 0,

    pendingReviews: 0,

    completedReviews: 0,

    unreadMessages: 0

  });

  const [recentActivity, setRecentActivity] = useState([]);

  const [loading, setLoading] = useState(true);

  const [userInfo, setUserInfo] = useState({ id: null });



  useEffect(() => {

    const savedUser = localStorage.getItem('ureb_user');

    if (savedUser) {

      const user = JSON.parse(savedUser);

      setUserInfo(user);

      fetchDashboardData(user.email);

    }

  }, []);



  const fetchDashboardData = async (userEmail) => {

    if (!userEmail) return;

    setLoading(true);

    try {

      const [assignments, reviews, messages, reviewerProfile] = await Promise.all([

        getReviewerAssignments(userEmail),

        getReviewsByReviewer(userEmail),

        getMessagesByUser(userEmail),

        getReviewerProfile(userEmail)

      ]);



      const pendingReviews = reviews.filter(r => r.status === 'pending').length;

      // If admin has marked this reviewer as completed, count all their assignments as done
      const isMarkedComplete = reviewerProfile?.status === 'completed';
      const completedReviews = isMarkedComplete
        ? assignments.length
        : assignments.filter(a => a.status === 'completed').length;

      const unreadMessages = messages.filter(m => !m.read).length;



      const activities = generateRecentActivity(assignments, reviews, messages);



      setStats({

        assignedProposals: assignments.length,

        pendingReviews,

        completedReviews,

        unreadMessages

      });

      setRecentActivity(activities);

    } catch (error) {

      console.error('Error fetching dashboard data:', error);

    } finally {

      setLoading(false);

    }

  };



  const generateRecentActivity = (proposals, reviews, messages) => {

    const activities = [];



    proposals.slice(0, 5).forEach(proposal => {

      activities.push({

        type: 'proposal',

        icon: <FileCheckIcon />,

        title: 'New Proposal Assigned',

        description: `${proposal.protocolCode || proposal._id}: "${proposal.researchTitle || 'Untitled'}"`,

        time: proposal.submissionDate || proposal.createdAt,

        timeLabel: formatTimeAgo(proposal.submissionDate || proposal.createdAt)

      });

    });



    reviews.filter(r => r.status === 'completed').slice(0, 5).forEach(review => {

      activities.push({

        type: 'review',

        icon: <DashboardIcon />,

        title: 'Review Completed',

        description: `${review.proposalId || review._id}: "${review.proposalTitle || 'Untitled Proposal'}"`,

        time: review.completedDate || review.updatedAt || review.createdAt,

        timeLabel: formatTimeAgo(review.completedDate || review.updatedAt || review.createdAt)

      });

    });



    messages.slice(0, 5).forEach(message => {

      activities.push({

        type: 'message',

        icon: <MessageIcon />,

        title: 'New Message',

        description: `From: ${message.senderName || message.senderEmail || 'Unknown'} - "${message.subject || 'No Subject'}"`,

        time: message.createdAt,

        timeLabel: formatTimeAgo(message.createdAt)

      });

    });



    return activities

      .sort((a, b) => new Date(b.time) - new Date(a.time))

      .slice(0, 5);

  };



  const formatTimeAgo = (dateString) => {

    if (!dateString) return 'Unknown';

    const date = new Date(dateString);

    const now = new Date();

    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    

    if (diffInHours < 1) return 'Just now';

    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays === 1) return '1 day ago';

    return `${diffInDays} days ago`;

  };



  return (

    <div className="dashboard-content">

      <div className="stats-grid">

        <div className="stat-card">

          <div className="stat-icon assigned">

            <FileCheckIcon />

          </div>

          <div className="stat-info">

            <h3>{loading ? '-' : stats.assignedProposals}</h3>

            <p>Assigned Proposals</p>

          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon pending">

            <ClockIcon />

          </div>

          <div className="stat-info">

            <h3>{loading ? '-' : stats.pendingReviews}</h3>

            <p>Pending Reviews</p>

          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon completed">

            <DashboardIcon />

          </div>

          <div className="stat-info">

            <h3>{loading ? '-' : stats.completedReviews}</h3>

            <p>Completed Reviews</p>

          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon messages">

            <MessageIcon />

          </div>

          <div className="stat-info">

            <h3>{loading ? '-' : stats.unreadMessages}</h3>

            <p>Unread Messages</p>

          </div>

        </div>

      </div>

      


      

      <div className="dashboard-sections">

        <div className="recent-activity">

          <h2>Recent Activity</h2>

          {loading ? (

            <div className="loading-state">Loading activity...</div>

          ) : recentActivity.length === 0 ? (

            <div className="empty-state">No recent activity.</div>

          ) : (

            <div className="activity-list">

              {recentActivity.map((activity, index) => (

                <div className="activity-item" key={index}>

                  <div className="activity-icon">

                    {activity.icon}

                  </div>

                  <div className="activity-content">

                    <h4>{activity.title}</h4>

                    <p>{activity.description}</p>

                    <span className="activity-time">{activity.timeLabel}</span>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

        

      </div>

    </div>

  );

};



// Proposal Details Modal Component

const ProposalDetailsModal = ({ isOpen, onClose, proposal }) => {

  if (!isOpen || !proposal) return null;



  return (

    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>

      <div className="modal-container large">

        <button className="modal-close" onClick={onClose} aria-label="Close modal">

          <XIcon />

        </button>

        <div className="modal-header">

          <h2>Proposal Details</h2>

        </div>

        <div className="modal-body">

          <div className="proposal-detail-section">

            <h3>Protocol Information</h3>

            <div className="detail-row">

              <span className="detail-label">Protocol Code:</span>

              <span className="detail-value">{proposal.protocolCode || 'N/A'}</span>

            </div>

            <div className="detail-row">

              <span className="detail-label">Research Title:</span>

              <span className="detail-value">{proposal.researchTitle || 'Untitled'}</span>

            </div>

            <div className="detail-row">

              <span className="detail-label">Proponent:</span>

              <span className="detail-value">{proposal.proponent || 'N/A'}</span>

            </div>

            {proposal.preliminaryReviewer && (
            <div className="detail-row">
              <span className="detail-label">Preliminary Reviewer:</span>
              <span className="detail-value">
                {proposal.preliminaryReviewerName || proposal.preliminaryReviewer}
                <span className="preliminary-badge" style={{ marginLeft: '0.5rem' }}>Preliminary</span>
              </span>
            </div>
            )}

            <div className="detail-row">

              <span className="detail-label">Status:</span>

              <span className={`status-badge ${proposal.status?.toLowerCase().replace(' ', '-') || 'pending'}`}>

                {proposal.status || 'Pending Review'}

              </span>

            </div>

          </div>



          <div className="proposal-detail-section">

            <h3>Date Information</h3>

            <div className="detail-row">

              <span className="detail-label">Date of Application:</span>

              <span className="detail-value">

                {proposal.dateOfApplication ? new Date(proposal.dateOfApplication).toLocaleDateString() : 'N/A'}

              </span>

            </div>

            <div className="detail-row">

              <span className="detail-label">Submission Date:</span>

              <span className="detail-value">

                {proposal.submissionDate ? new Date(proposal.submissionDate).toLocaleDateString() : 'N/A'}

              </span>

            </div>

          </div>



          <div className="proposal-detail-section">

            <h3>Reviewer Assignment</h3>

            <div className="detail-row">

              <span className="detail-label">Reviewer 1:</span>

              <span className="detail-value">{proposal.reviewers?.reviewer1 || 'Not assigned'}</span>

            </div>

            <div className="detail-row">

              <span className="detail-label">Reviewer 2:</span>

              <span className="detail-value">{proposal.reviewers?.reviewer2 || 'Not assigned'}</span>

            </div>

            <div className="detail-row">

              <span className="detail-label">Reviewer 3:</span>

              <span className="detail-value">{proposal.reviewers?.reviewer3 || 'Not assigned'}</span>

            </div>

          </div>



          {proposal.files && Object.keys(proposal.files).length > 0 && (
            <div className="proposal-detail-section">
              <h3>Files</h3>
              {Object.entries(proposal.files).map(([key, file]) => (
                file && <div key={key} className="file-item">• {typeof file === 'string' ? file : file.originalname || key}</div>
              ))}
            </div>
          )}

        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>

      </div>

    </div>

  );

};

// Review Modal Component
const ReviewModal = ({ isOpen, onClose, proposal }) => {
  if (!isOpen || !proposal) return null;

  const handleDownloadFile = async (fileKey, file) => {
    let fileUrl, fileName;
    
    // Debug: Log the exact file data we're receiving
    console.log('File data received:', { fileKey, file });
    
    if (typeof file === 'string') {
      // Extract just the filename from the full path
      fileName = file.split(/[/\\]/).pop() || fileKey;
      fileUrl = `${import.meta.env.VITE_API_URL}/uploads/${fileName}`;
    } else if (file.originalname) {
      // Handle file objects - use the actual filename on server, not originalname
      fileName = file.originalname; // For download display
      const serverFilename = file.filename; // Actual file on server
      fileUrl = `${import.meta.env.VITE_API_URL}/uploads/${serverFilename}`;
    } else {
      return; // No valid file to download
    }
    
    console.log('Attempting download from:', fileUrl); // Debug log
    console.log('Filename for download:', fileName);
    
    try {
      // Try to download the file directly
      const response = await fetch(fileUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      window.URL.revokeObjectURL(url);
      console.log('Download successful:', fileName);
    } catch (error) {
      console.error('Download failed:', error);
      
      // Show user a helpful message with available file types
      const availableFiles = [
        'notificationLetter-1770706722776-470251442.docx',
        'proposal-1770706722777-486564680.docx',
        'ethicalClearance-1770706722780-752777537.docx',
        'reviewResults-1770706722777-796906084.docx'
      ];
      
      const fileList = availableFiles.map(f => `• ${f}`).join('\n');
      
      const message = `File "${fileName}" not found on server.\n\nAvailable files:\n${fileList}\n\nPlease contact administrator to update the file records.`;
      alert(message);
    }
  };

  const FileIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );

  const FolderIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  );

  const DownloadIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container large">
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <XIcon />
        </button>
        <div className="modal-header">
          <h2>{proposal.protocolCode || proposal._id}</h2>
          <p className="modal-subtitle">{proposal.researchTitle || 'Untitled'}</p>
        </div>
        <div className="modal-body">
          <div className="proposal-info">
            <p><strong>Proponent:</strong> {proposal.proponent || 'N/A'}</p>
          </div>

          {proposal.files && Object.keys(proposal.files).length > 0 && (
            <div className="files-section">
              <h3>Files for Review</h3>
              <div className="files-grid">
                {Object.entries(proposal.files).map(([key, file]) => (
                  file && (
                    <div className="file-card" key={key}>
                      <div className="file-info">
                        <div className="file-icon"><FileIcon /></div>
                        <div className="file-details">
                          <span className="file-field"><strong>{key}</strong></span>
                          <span className="file-name">
                            {typeof file === 'string' ? file : file.originalname || 'No filename available'}
                          </span>
                        </div>
                      </div>
                      <button 
                        className="download-btn"
                        onClick={() => handleDownloadFile(key, file)}
                        title="Download file"
                      >
                        <DownloadIcon />
                        Download
                      </button>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {!proposal.files || Object.keys(proposal.files).length === 0 && (
            <div className="no-files">
              <div className="no-files-icon"><FolderIcon /></div>
              <p>No files attached to this proposal</p>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};


const DELETED_ASSIGNMENTS_KEY = 'ureb_deleted_assignments';

const getDeletedAssignmentIds = () => {
  try {
    return JSON.parse(localStorage.getItem(DELETED_ASSIGNMENTS_KEY) || '[]');
  } catch { return []; }
};

const AssignedProposalsContent = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('ureb_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      fetchAssignments(user.email);
    }
  }, []);

  const fetchAssignments = async (userEmail) => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const data = await getReviewerAssignments(userEmail);
      const deletedIds = getDeletedAssignmentIds();
      setAssignments(data.filter(a => !deletedIds.includes(String(a._id))));
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    const deletedIds = getDeletedAssignmentIds();
    if (!deletedIds.includes(confirmDeleteId)) {
      localStorage.setItem(DELETED_ASSIGNMENTS_KEY, JSON.stringify([...deletedIds, confirmDeleteId]));
    }
    setAssignments(prev => prev.filter(a => String(a._id) !== confirmDeleteId));
    setConfirmDeleteId(null);
    setDeleting(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleDownload = async (file) => {
    if (!file?.filename) return;
    await downloadReviewerFile(file.filename, file.originalname || file.filename);
  };

  const formatFileLabel = (key) => {
    const labels = {
      urebForm16: 'UREB Form 16',
      urebForm10B: 'UREB Form 10-B',
      urebForm11: 'UREB Form 11',
      urebForm2: 'UREB Form 2',
      urebForm6: 'UREB Form 6',
      urebForm7: 'UREB Form 7',
      urebForm8A: 'UREB Form 8-A',
      urebForm10A: 'UREB Form 10-A',
      approvedProposal: 'Approved Proposal',
      questionnaire: 'Questionnaire',
      cvOfProponent: 'CV of Proponent',
    };
    return labels[key] || key;
  };

  if (loading) {
    return (
      <div className="content-section">
        <h2>Assigned Proposals</h2>
        <div className="loading-state">Loading assigned proposals...</div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="content-section">
        <h2>Assigned Proposals</h2>
        <div className="empty-state">No proposals have been assigned to you yet.</div>
      </div>
    );
  }

  return (
    <div className="content-section">
      <h2>Assigned Proposals</h2>

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="logout-modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="logout-modal-container" onClick={e => e.stopPropagation()}>
            <div className="logout-modal-header">
              <h2>Delete Assignment</h2>
            </div>
            <div className="logout-modal-body">
              <p>Are you sure you want to delete this assignment? This cannot be undone.</p>
            </div>
            <div className="logout-modal-footer">
              <button className="logout-modal-btn-secondary" onClick={() => setConfirmDeleteId(null)} disabled={deleting}>Cancel</button>
              <button className="logout-modal-btn-primary" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="proposals-list">
        {assignments.map((assignment) => {
          const files = assignment.assignedFiles || {};
          const fileEntries = Object.entries(files);
          const isExpanded = expandedId === String(assignment._id);

          return (
            <div className="proposal-card" key={String(assignment._id)}>
              <div className="proposal-header">
                <div className="proposal-header-left">
                  <h3>{assignment.protocolCode || 'No Protocol Code'}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`status-badge ${(assignment.status || 'pending').toLowerCase().replace(/\s+/g, '-')}`}>
                    {assignment.status || 'Pending'}
                  </span>
                  <button
                    title="Delete assignment"
                    onClick={() => setConfirmDeleteId(String(assignment._id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="proposal-content">
                <p><strong>Assigned by:</strong> {assignment.assignedBy || 'Admin'}</p>
                <div className="proposal-meta">
                  <span><strong>Review Start:</strong> {formatDate(assignment.reviewPeriod?.startDate)}</span>
                  <span><strong>Review End:</strong> {formatDate(assignment.reviewPeriod?.endDate)}</span>
                  <span><strong>Assigned:</strong> {formatDate(assignment.createdAt)}</span>
                  <span><strong>Files:</strong> {fileEntries.length} document{fileEntries.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {fileEntries.length > 0 && (
                <div className="assigned-files-section">
                  <button
                    className="btn-secondary"
                    style={{ marginBottom: '0.75rem' }}
                    onClick={() => setExpandedId(isExpanded ? null : String(assignment._id))}
                  >
                    {isExpanded ? 'Hide Files' : `View Files (${fileEntries.length})`}
                  </button>

                  {isExpanded && (
                    <div className="assigned-files-list">
                      {fileEntries.map(([key, file]) => (
                        <div key={key} className="assigned-file-item">
                          <span className="assigned-file-label">{formatFileLabel(key)}</span>
                          <span className="assigned-file-name">{file.originalname || file.filename}</span>
                          {file?.filename && (
                            <button
                              className="btn-primary"
                              style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                              onClick={() => handleDownload(file)}
                            >
                              Download
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};



const SubmitReviewContent = ({ onShowSuccessModal, onNavigateToSubmitted }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  
  // List of Secondary Reviewers
  const secondaryReviewers = [
    'Dr. Emily S. Antonio',
    'Dr. Jeralyn N. Hemillan', 
    'Dr. Rose Anelyn V. Ceniza',
    'Dr. Roselyn V. Regino',
    'Dr. Maria Gloria R. Lugo',
    'Dr. Sharmaine Anne C. Argawanon'
  ];
  
  // Check if current user is a Secondary Reviewer
  const [isSecondaryReviewer, setIsSecondaryReviewer] = useState(false);
  
  // Load saved data from localStorage on component mount
  const [reviewData, setReviewData] = useState(() => {
    const savedData = localStorage.getItem('reviewDraftData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Convert file object references back to null (files can't be stored in localStorage)
        return {
          ...parsed,
          proposal: null,
          approvalSheet: null,
          urebForm2: null,
          urebForm10B: null,
          urebForm11: null,
          applicationForm6: null,
          accomplishedForm8: null,
          accomplishForm10A: null,
          copyOfInstrument: null,
          ethicsReviewFee: null,
          form7: null
        };
      } catch (error) {
        console.error('Error parsing saved review data:', error);
      }
    }
    return {
      proposal: null,
      approvalSheet: null,
      urebForm2: null,
      urebForm10B: null,
      urebForm11: null,
      applicationForm6: null,
      accomplishedForm8: null,
      accomplishForm10A: null,
      copyOfInstrument: null,
      ethicsReviewFee: null,
      form7: null,
      decision: 'approve',
      comment: ''
    };
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Save data to localStorage whenever reviewData changes
  useEffect(() => {
    const dataToSave = {
      decision: reviewData.decision,
      comment: reviewData.comment,
      // Save file names but not actual file objects
      proposalFileName: reviewData.proposal?.name || null,
      approvalSheetFileName: reviewData.approvalSheet?.name || null,
      urebForm2FileName: reviewData.urebForm2?.name || null,
      urebForm10BFileName: reviewData.urebForm10B?.name || null,
      urebForm11FileName: reviewData.urebForm11?.name || null,
      applicationForm6FileName: reviewData.applicationForm6?.name || null,
      accomplishedForm8FileName: reviewData.accomplishedForm8?.name || null,
      accomplishForm10AFileName: reviewData.accomplishForm10A?.name || null,
      copyOfInstrumentFileName: reviewData.copyOfInstrument?.name || null,
      ethicsReviewFeeFileName: reviewData.ethicsReviewFee?.name || null,
      form7FileName: reviewData.form7?.name || null
    };
    localStorage.setItem('reviewDraftData', JSON.stringify(dataToSave));
  }, [reviewData]);

  useEffect(() => {
    const savedUser = localStorage.getItem('ureb_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      
      // Check if current user is a Secondary Reviewer by name
      const userIsSecondary = secondaryReviewers.includes(user.name);
      setIsSecondaryReviewer(userIsSecondary);
      
      console.log('User:', user.name, 'isSecondaryReviewer:', userIsSecondary);
      
      fetchProposals(user.email);
    }
  }, []);

  const fetchProposals = async (userEmail) => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const data = await getProposalsByReviewer(userEmail);
      const assignedProposals = data.filter(p => p.status === 'In Progress' || p.status === 'Assigned');
      setProposals(assignedProposals);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (field, file) => {
    setReviewData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      // Get current user info
      const savedUser = localStorage.getItem('ureb_user');
      const user = savedUser ? JSON.parse(savedUser) : null;

      // Submit review to the API with files (saves to database + creates admin notification)
      const result = await submitReview({
        proposalId: selectedProposal?._id || '',
        reviewerEmail: user?.email,
        reviewerName: user?.name || user?.email,
        decision: reviewData.decision,
        comment: reviewData.comment,
        proposal: reviewData.proposal,
        approvalSheet: reviewData.approvalSheet,
        urebForm2: reviewData.urebForm2,
        urebForm10B: reviewData.urebForm10B,
        urebForm11: reviewData.urebForm11,
        applicationForm6: reviewData.applicationForm6,
        accomplishedForm8: reviewData.accomplishedForm8,
        accomplishForm10A: reviewData.accomplishForm10A,
        copyOfInstrument: reviewData.copyOfInstrument,
        ethicsReviewFee: reviewData.ethicsReviewFee,
        form7: reviewData.form7
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit review');
      }

      // Show success modal
      onShowSuccessModal();

      // Clear localStorage after successful submission
      localStorage.removeItem('reviewDraftData');

      // Reset form
      setReviewData({
        proposal: null,
        approvalSheet: null,
        urebForm2: null,
        urebForm10B: null,
        urebForm11: null,
        applicationForm6: null,
        accomplishedForm8: null,
        accomplishForm10A: null,
        copyOfInstrument: null,
        ethicsReviewFee: null,
        form7: null,
        decision: 'approve',
        comment: ''
      });
      setSelectedProposal(null);

    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const FileUploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const FileUploadComponent = ({ label, field, accept = ".pdf,.doc,.docx" }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange(field, files[0]);
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div 
        className={`file-upload ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id={field}
          accept={accept}
          onChange={(e) => handleFileChange(field, e.target.files[0])}
          className="file-input"
          style={{ display: 'none' }}
        />
        <label htmlFor={field} className="file-upload-label">
          <div className="file-upload-icon">
            <FileUploadIcon />
          </div>
          <div className="file-upload-text">
            <p>Attach file or drag and drop here</p>
            <span>PDF, DOC, DOCX (MAX. 10MB)</span>
          </div>
        </label>
        {reviewData[field] && (
          <div className="attached-file">
            <span>
              <FileIcon /> {reviewData[field].name}
            </span>
            <button
              type="button"
              onClick={() => handleFileChange(field, null)}
              className="remove-file"
            >
              <CloseIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

  if (loading) {
    return (
      <div className="content-section">
        <h2>Submit Review</h2>
        <div className="loading-state">Loading proposals...</div>
      </div>
    );
  }

  
  return (
    <div className="content-section">
      <h2>Submit Review</h2>
      
      <form onSubmit={handleSubmit} className="review-form">
        {/* Document upload section - conditional based on reviewer type */}
        <div className="form-section">
          {isSecondaryReviewer ? (
            // Secondary Reviewer Layout - Only UREB Form 10B and UREB Form 11
            <div className="documents-grid secondary-reviewer-layout">
              <FileUploadComponent 
                label="UREB Form 10B" 
                field="urebForm10B" 
              />
              <FileUploadComponent 
                label="UREB Form 11" 
                field="urebForm11" 
              />
            </div>
          ) : (
            // Preliminary Reviewer Layout - All existing documents
            <div className="documents-grid preliminary-reviewer-layout">
              <FileUploadComponent 
                label="Proposal" 
                field="proposal" 
              />
              <FileUploadComponent 
                label="Approval Sheet" 
                field="approvalSheet" 
              />
              <FileUploadComponent 
                label="UREB Form 2" 
                field="urebForm2" 
              />
              <FileUploadComponent 
                label="Application for Research Ethics Review Form 6" 
                field="applicationForm6" 
              />
              <FileUploadComponent 
                label="Accomplished Form 8" 
                field="accomplishedForm8" 
              />
              <FileUploadComponent 
                label="Accomplish Form 10 A" 
                field="accomplishForm10A" 
              />
              <FileUploadComponent 
                label="Copy of instrument/tool" 
                field="copyOfInstrument" 
              />
              <FileUploadComponent 
                label="Ethics Review Fee (Receipt)" 
                field="ethicsReviewFee" 
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <FileUploadComponent 
                label="Form 7" 
                field="form7" 
              />
            </div>
          )}
        </div>

        {/* Decision section - only for Preliminary Reviewers */}
        {!isSecondaryReviewer && (
          <div className="form-section">
            <h3>Review Decision</h3>
            <div className="decision-options">
              <label className="decision-option">
                <input
                  type="radio"
                  name="decision"
                  value="approve"
                  checked={reviewData.decision === 'approve'}
                  onChange={(e) => setReviewData(prev => ({ ...prev, decision: e.target.value }))}
                />
                <span className="decision-label approve">Approve</span>
              </label>
              <label className="decision-option">
                <input
                  type="radio"
                  name="decision"
                  value="revision"
                  checked={reviewData.decision === 'revision'}
                  onChange={(e) => setReviewData(prev => ({ ...prev, decision: e.target.value }))}
                />
                <span className="decision-label revision">Request Revision</span>
              </label>
              <label className="decision-option">
                <input
                  type="radio"
                  name="decision"
                  value="reject"
                  checked={reviewData.decision === 'reject'}
                  onChange={(e) => setReviewData(prev => ({ ...prev, decision: e.target.value }))}
                />
                <span className="decision-label reject">Reject</span>
              </label>
            </div>
          </div>
        )}

        {/* Comment section - only for Preliminary Reviewers */}
        {!isSecondaryReviewer && (
          <div className="form-section">
            <h3>Leave Comment</h3>
            <div className="form-group">
              <label className="form-label"></label>
              <textarea
                className="form-textarea"
                value={reviewData.comment}
                onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Please provide your comments and feedback..."
                rows="5"
                required
              />
            </div>
          </div>
        )}

        {/* Show proposal info only when a proposal is selected */}
        {selectedProposal && (
          <div className="proposal-info-card">
            <h3>{selectedProposal.protocolCode}</h3>
            <p><strong>Title:</strong> {selectedProposal.researchTitle}</p>
            <p><strong>Proponent:</strong> {selectedProposal.proponent}</p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setReviewData({
                proposal: null,
                approvalSheet: null,
                urebForm2: null,
                urebForm10B: null,
                urebForm11: null,
                applicationForm6: null,
                accomplishedForm8: null,
                accomplishForm10A: null,
                copyOfInstrument: null,
                ethicsReviewFee: null,
                form7: null,
                decision: 'approve',
                comment: ''
              });
              setSelectedProposal(null);
            }}
          >
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
};



const SubmitSecondaryFileContent = ({ onShowSuccessModal, onNavigateToSubmitted }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  
  // Load saved data from localStorage on component mount
  const [secondaryFileData, setSecondaryFileData] = useState(() => {
    const savedData = localStorage.getItem('secondaryFileDraftData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Convert file object references back to null (files can't be stored in localStorage)
        return {
          ...parsed,
          urebForm10B: null,
          urebForm11: null
        };
      } catch (error) {
        console.error('Error parsing saved secondary file data:', error);
      }
    }
    return {
      urebForm10B: null,
      urebForm11: null
    };
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Save data to localStorage whenever secondaryFileData changes
  useEffect(() => {
    const dataToSave = {
      urebForm10BFileName: secondaryFileData.urebForm10B?.name || null,
      urebForm11FileName: secondaryFileData.urebForm11?.name || null
    };
    localStorage.setItem('secondaryFileDraftData', JSON.stringify(dataToSave));
  }, [secondaryFileData]);

  useEffect(() => {
    const savedUser = localStorage.getItem('ureb_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      fetchProposals(user.email);
    }
  }, []);

  const fetchProposals = async (userEmail) => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const data = await getProposalsByReviewer(userEmail);
      const assignedProposals = data.filter(p => p.status === 'In Progress' || p.status === 'Assigned');
      setProposals(assignedProposals);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (field, file) => {
    setSecondaryFileData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      // Get current user info
      const savedUser = localStorage.getItem('ureb_user');
      const user = savedUser ? JSON.parse(savedUser) : null;

      // Submit secondary files to the API
      const result = await submitReview({
        proposalId: selectedProposal?._id || '',
        reviewerEmail: user?.email,
        reviewerName: user?.name || user?.email,
        decision: 'secondary_file', // Special decision type for secondary files
        comment: 'Secondary files submitted',
        urebForm10B: secondaryFileData.urebForm10B,
        urebForm11: secondaryFileData.urebForm11
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit secondary files');
      }

      // Show success modal
      onShowSuccessModal();

      // Clear localStorage after successful submission
      localStorage.removeItem('secondaryFileDraftData');

      // Reset form
      setSecondaryFileData({
        urebForm10B: null,
        urebForm11: null
      });
      setSelectedProposal(null);

    } catch (error) {
      console.error('Error submitting secondary files:', error);
      alert('Error submitting secondary files. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const FileUploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const FileUploadComponent = ({ label, field, accept = ".pdf,.doc,.docx" }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange(field, files[0]);
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div 
        className={`file-upload ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id={field}
          accept={accept}
          onChange={(e) => handleFileChange(field, e.target.files[0])}
          className="file-input"
          style={{ display: 'none' }}
        />
        <label htmlFor={field} className="file-upload-label">
          <div className="file-upload-icon">
            <FileUploadIcon />
          </div>
          <div className="file-upload-text">
            <p>Attach file or drag and drop here</p>
            <span>PDF, DOC, DOCX (MAX. 10MB)</span>
          </div>
        </label>
        {secondaryFileData[field] && (
          <div className="attached-file">
            <span>
              <FileIcon /> {secondaryFileData[field].name}
            </span>
            <button
              type="button"
              onClick={() => handleFileChange(field, null)}
              className="remove-file"
            >
              <CloseIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

  if (loading) {
    return (
      <div className="content-section">
        <h2>Submit Secondary File</h2>
        <div className="loading-state">Loading proposals...</div>
      </div>
    );
  }

  
  return (
    <div className="content-section">
      <h2>Submit Secondary File</h2>
      
      <form onSubmit={handleSubmit} className="review-form">
        {/* Document upload section - Secondary Reviewer Layout */}
        <div className="form-section">
          <div className="documents-grid secondary-reviewer-layout">
            <FileUploadComponent 
              label="UREB Form 10B" 
              field="urebForm10B" 
            />
            <FileUploadComponent 
              label="UREB Form 11" 
              field="urebForm11" 
            />
          </div>
        </div>

        {/* Show proposal info only when a proposal is selected */}
        {selectedProposal && (
          <div className="proposal-info-card">
            <h3>{selectedProposal.protocolCode}</h3>
            <p><strong>Title:</strong> {selectedProposal.researchTitle}</p>
            <p><strong>Proponent:</strong> {selectedProposal.proponent}</p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Secondary Files'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setSecondaryFileData({
                urebForm10B: null,
                urebForm11: null
              });
              setSelectedProposal(null);
            }}
          >
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
};



const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/>
    <path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const MessagesContent = () => {

  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    const savedUser = localStorage.getItem('ureb_user');

    if (savedUser) {

      const user = JSON.parse(savedUser);

      fetchMessages(user.email);

    }

  }, []);



  const fetchMessages = async (userEmail) => {

    if (!userEmail) return;

    setLoading(true);

    try {

      const data = await getMessagesByUser(userEmail);

      setMessages(data);

    } catch (error) {

      console.error('Error fetching messages:', error);

    } finally {

      setLoading(false);

    }

  };

  const handleDeleteMessage = async (messageId) => {
    const result = await deleteMessage(messageId);
    if (result.success) {
      setMessages(prev => prev.filter(m => (m._id || m.id) !== messageId));
    }
  };



  const formatTimeAgo = (dateString) => {

    if (!dateString) return 'Unknown';

    const date = new Date(dateString);

    const now = new Date();

    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    

    if (diffInHours < 1) return 'Just now';

    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays === 1) return '1 day ago';

    return `${diffInDays} days ago`;

  };



  if (loading) {

    return (

      <div className="content-section">

        <h2>Messages</h2>

        <div className="loading-state">Loading messages...</div>

      </div>

    );

  }



  if (messages.length === 0) {

    return (

      <div className="content-section">

        <h2>Messages</h2>

        <div className="empty-state">No messages yet.</div>

      </div>

    );

  }



  return (

    <div className="content-section">

      <h2>Messages</h2>

      <div className="messages-list">

        {messages.map((message) => (

          <div className={`message-item ${!message.read ? 'unread' : ''}`} key={message._id || message.id}>

            <div className="message-header">

              <div className="message-sender">

                <div className="sender-avatar">

                  {(message.senderName || message.senderEmail || 'U').charAt(0).toUpperCase()}

                </div>

                <div className="sender-info">

                  <h4>{message.senderName || message.senderEmail || 'Unknown'}</h4>

                  <span>{formatTimeAgo(message.createdAt)}</span>

                </div>

              </div>

              <div className="message-header-right">
                {!message.read && <span className="unread-badge">New</span>}
                <button
                  className="message-delete-btn"
                  onClick={() => handleDeleteMessage(message._id || message.id)}
                  title="Delete message"
                >
                  <TrashIcon />
                </button>
              </div>

            </div>

            <div className="message-content">

              <h4>{message.subject || 'No Subject'}</h4>

              <p>{message.message || 'No content'}</p>

            </div>

            <div className="message-actions">

              {!message.read && (

                <button className="btn-secondary">Mark as Read</button>

              )}

            </div>

          </div>

        ))}

      </div>

    </div>

  );

};

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="logout-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="logout-modal-container">
        <div className="logout-modal-header">
          <h2>Confirm Logout</h2>
        </div>
        <div className="logout-modal-body">
          <p>Are you sure you want to log out of the reviewer dashboard?</p>
        </div>
        <div className="logout-modal-footer">
          <button className="logout-modal-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="logout-modal-btn-primary" onClick={onConfirm}>Logout</button>
        </div>
      </div>
    </div>
  );
};



const ReviewerWelcomeModal = ({ firstName, onClose }) => {
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    // Generate confetti pieces
    const pieces = [];
    for (let i = 0; i < 50; i++) {
      pieces.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 3 + Math.random() * 2,
        color: ['#7A9E7E', '#A8C5A8', '#8FB996', '#F57C00', '#1976D2', '#388E3C'][Math.floor(Math.random() * 6)]
      });
    }
    setConfetti(pieces);
  }, []);

  return (
    <div className="welcome-modal-overlay">
      <div className="confetti-container">
        {confetti.map((piece) => (
          <div
            key={piece.id}
            className="confetti"
            style={{
              left: `${piece.left}%`,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              backgroundColor: piece.color
            }}
          />
        ))}
      </div>
      <div className="welcome-modal-container">
        <div className="welcome-content">
          <div className="welcome-checkmark">✓</div>
          <h2>WELCOME BACK, REVIEWER!</h2>
          <p>We're excited to have you here. Review proposals, provide feedback, and help ensure research ethics compliance across the UREB system.</p>
          <button className="welcome-close-btn" onClick={onClose}>
            Let's Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

// Submitted Reviews Content Component
const SubmittedReviewsContent = () => {
  const [submittedReviews, setSubmittedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    // Initial fetch
    fetchSubmittedReviews();

    // Listen for storage changes (when user logs out/in)
    const handleStorageChange = (e) => {
      if (e.key === 'ureb_user') {
        fetchSubmittedReviews();
      }
    };

    // Also listen for custom login/logout events
    const handleUserChange = () => {
      fetchSubmittedReviews();
    };

    // Fallback: Check for user changes every 2 seconds
    let lastUserEmail = null;
    const checkUserChange = () => {
      const savedUser = localStorage.getItem('ureb_user');
      const currentUser = savedUser ? JSON.parse(savedUser) : null;
      const currentEmail = currentUser?.email || null;
      
      if (currentEmail !== lastUserEmail) {
        lastUserEmail = currentEmail;
        fetchSubmittedReviews();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userChanged', handleUserChange);
    const intervalId = setInterval(checkUserChange, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userChanged', handleUserChange);
      clearInterval(intervalId);
    };
  }, []); // Only run once on mount

  const fetchSubmittedReviews = async () => {
    setLoading(true);
    try {
      const savedUser = localStorage.getItem('ureb_user');
      const currentUser = savedUser ? JSON.parse(savedUser) : null;

      if (!currentUser?.email) {
        console.log('No user logged in, clearing submitted reviews');
        setSubmittedReviews([]);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews/completed/${currentUser.email}`);
      const data = await response.json();
      setSubmittedReviews(data.map(r => ({
        ...r,
        dateSubmitted: r.completedDate || r.createdAt
      })));
    } catch (error) {
      console.error('Error fetching submitted reviews:', error);
      setSubmittedReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDecisionClass = (decision) => {
    switch (decision) {
      case 'approve': return 'sr-decision--approved';
      case 'revision': return 'sr-decision--revision';
      case 'reject': return 'sr-decision--rejected';
      default: return 'sr-decision--pending';
    }
  };

  const getDecisionLabel = (decision) => {
    switch (decision) {
      case 'approve': return 'Approved';
      case 'revision': return 'Revision';
      case 'reject': return 'Rejected';
      default: return 'Pending';
    }
  };

  const getDecisionIcon = (decision) => {
    switch (decision) {
      case 'approve':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        );
      case 'revision':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
        );
      case 'reject':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        );
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        );
    }
  };

  const stats = {
    total: submittedReviews.length,
    approved: submittedReviews.filter(r => r.decision === 'approve').length,
    revision: submittedReviews.filter(r => r.decision === 'revision').length,
    rejected: submittedReviews.filter(r => r.decision === 'reject').length
  };

  if (loading) {
    return (
      <div className="sr-container">
        <div className="sr-loading">
          <div className="sr-loading-spinner"></div>
          <p>Loading your reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sr-container">
      {/* Stats Summary */}
      <div className="sr-stats">
        <div className="sr-stat-item">
          <span className="sr-stat-number">{stats.total}</span>
          <span className="sr-stat-label">Total</span>
        </div>
        <div className="sr-stat-divider"></div>
        <div className="sr-stat-item sr-stat--approved">
          <span className="sr-stat-number">{stats.approved}</span>
          <span className="sr-stat-label">Approved</span>
        </div>
        <div className="sr-stat-divider"></div>
        <div className="sr-stat-item sr-stat--revision">
          <span className="sr-stat-number">{stats.revision}</span>
          <span className="sr-stat-label">Revision</span>
        </div>
        <div className="sr-stat-divider"></div>
        <div className="sr-stat-item sr-stat--rejected">
          <span className="sr-stat-number">{stats.rejected}</span>
          <span className="sr-stat-label">Rejected</span>
        </div>
      </div>

      {/* Reviews List */}
      {submittedReviews.length === 0 ? (
        <div className="sr-empty">
          <div className="sr-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <path d="m9 15 2 2 4-4"/>
            </svg>
          </div>
          <h3>No Reviews Yet</h3>
          <p>Your submitted reviews will appear here once you complete a review.</p>
        </div>
      ) : (
        <div className="sr-list">
          {submittedReviews.map((review) => (
            <div
              key={review._id}
              className={`sr-card ${expandedId === review._id ? 'sr-card--expanded' : ''}`}
            >
              <div
                className="sr-card-main"
                onClick={() => setExpandedId(expandedId === review._id ? null : review._id)}
              >
                <div className="sr-card-left">
                  <span className={`sr-decision-dot ${getDecisionClass(review.decision)}`}>
                    {getDecisionIcon(review.decision)}
                  </span>
                  <div className="sr-card-info">
                    <h4 className="sr-card-title">{review.proposalTitle || 'Untitled Proposal'}</h4>
                    <span className="sr-card-code">{review.protocolCode || 'No code'}</span>
                  </div>
                </div>
                <div className="sr-card-right">
                  <div className="sr-card-datetime">
                    <span className="sr-card-date">{formatDate(review.dateSubmitted)}</span>
                    <span className="sr-card-time">{formatTime(review.dateSubmitted)}</span>
                  </div>
                  <span className={`sr-decision-tag ${getDecisionClass(review.decision)}`}>
                    {getDecisionLabel(review.decision)}
                  </span>
                  <svg className={`sr-chevron ${expandedId === review._id ? 'sr-chevron--open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>

              {expandedId === review._id && (
                <div className="sr-card-expand">
                  <div className="sr-expand-grid">
                    <div className="sr-expand-item">
                      <span className="sr-expand-label">Protocol Code</span>
                      <span className="sr-expand-value">{review.protocolCode || 'N/A'}</span>
                    </div>
                    <div className="sr-expand-item">
                      <span className="sr-expand-label">Proponent</span>
                      <span className="sr-expand-value">{review.proponent || 'N/A'}</span>
                    </div>
                    <div className="sr-expand-item">
                      <span className="sr-expand-label">Date Submitted</span>
                      <span className="sr-expand-value">{formatDate(review.dateSubmitted)}</span>
                    </div>
                    <div className="sr-expand-item">
                      <span className="sr-expand-label">Time Submitted</span>
                      <span className="sr-expand-value">{formatTime(review.dateSubmitted)}</span>
                    </div>
                  </div>
                  {(review.comment || review.comments) && (
                    <div className="sr-expand-comment">
                      <span className="sr-expand-label">Your Comments</span>
                      <p>{review.comment || review.comments}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


const FileTemplatesContent = () => {
  const templates = [
    {
      id: 1,
      name: 'Form 10 (B) — Informed Consent Assessment Form',
      description: 'Informed Consent Assessment Form for evaluating participant consent processes.',
      filename: 'Form-10-B-INFORMED-CONSENT-ASSESSMENT-FORM-Copy.docx',
      category: 'Compliance',
      color: '#c2410c',
    },
    {
      id: 2,
      name: 'Form 11 — Expedited/Full Review Checklist',
      description: 'Findings of the Review Panel checklist for expedited and full review processes.',
      filename: 'Form-11-EXPEDITEDFULL-REVIEW-CHECKLIST-FINDINGS-OF-THE-REVIEW-PANEL-FORM-Copy-Copy.docx',
      category: 'Review',
      color: '#0891b2',
    },
  ];

  const categoryColors = {
    Submission:  { bg: '#f0faf0', text: '#276227', border: '#c3e6c3' },
    Application: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    Compliance:  { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
    Instrument:  { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc' },
    Review:     { bg: '#f0f9ff', text: '#0c4a6e', border: '#bae6fd' },
  };

  const DownloadIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );

  return (
    <div className="content-section">
      <div className="ft-page-header">
        <div>
          <h2 className="ft-page-title">File Templates</h2>
          <p className="ft-page-subtitle">Download the official UREB forms and templates needed for your review process.</p>
        </div>
        <span className="ft-count-badge">{templates.length} templates available</span>
      </div>

      <div className="ft-grid">
        {templates.map((tpl) => {
          const cat = categoryColors[tpl.category] || categoryColors.Submission;
          return (
            <div key={tpl.id} className="ft-card">
              <div className="ft-card-accent" style={{ background: tpl.color }} />
              <div className="ft-card-body">
                <div className="ft-card-top">
                  <div className="ft-icon-wrap" style={{ background: tpl.color + '18', color: tpl.color }}>
                    <FileTemplatesIcon />
                  </div>
                  <span className="ft-category-badge" style={{ background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}>
                    {tpl.category}
                  </span>
                </div>
                <h3 className="ft-card-title">{tpl.name}</h3>
                <p className="ft-card-desc">{tpl.description}</p>
                <div className="ft-card-footer">
                  <span className="ft-filename">{tpl.filename}</span>
                  <a
                    href={`/${tpl.filename}`}
                    download={tpl.filename}
                    className="ft-download-btn"
                  >
                    <DownloadIcon />
                    Download
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// Success Modal Component
const SuccessModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="success-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="success-modal-container">
        <div className="success-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" className="success-check-svg">
            <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 12.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="success-modal-title">Review Submitted</h2>
        <p className="success-modal-subtitle">Your review has been submitted and sent to the admin successfully.</p>
        <button className="success-done-btn" onClick={onClose}>Done</button>
      </div>
    </div>
  );
};


export default ReviewerDashboard;