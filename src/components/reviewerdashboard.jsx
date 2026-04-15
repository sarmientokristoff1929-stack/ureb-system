import { useState, useEffect } from 'react';

import './reviewerdashboard.css';

import { getProposalsByReviewer, getReviewsByReviewer, getMessagesByUser, submitReview, getReviewerAssignments, downloadReviewerFile, deleteMessage, markMessageAsRead, changeReviewerPassword, getReviewerProfile } from '../services/api';



// Icons as simple SVG components

const DashboardIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <rect x="3" y="3" width="7" height="7" />

    <rect x="14" y="3" width="7" height="7" />

    <rect x="14" y="14" width="7" height="7" />

    <rect x="3" y="14" width="7" height="7" />

  </svg>

);



const FileCheckIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />

    <polyline points="14 2 14 8 20 8" />

    <path d="m9 15 2 2 4-4" />

  </svg>

);



const ClockIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <circle cx="12" cy="12" r="10" />

    <polyline points="12 6 12 12 16 14" />

  </svg>

);



const MessageIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />

  </svg>

);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);



const MenuIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <line x1="3" y1="12" x2="21" y2="12" />

    <line x1="3" y1="6" x2="21" y2="6" />

    <line x1="3" y1="18" x2="21" y2="18" />

  </svg>

);



const XIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M18 6 6 18" />

    <path d="m6 6 12 12" />

  </svg>

);



const LogOutIcon = () => (

  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />

    <polyline points="16 17 21 12 16 7" />

    <line x1="21" y1="12" x2="9" y2="12" />

  </svg>

);



const SearchIcon = () => (

  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <circle cx="11" cy="11" r="8" />

    <path d="m21 21-4.35-4.35" />

  </svg>

);

const BellIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const ProfileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);



const SubmitReviewIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />

    <polyline points="22 4 12 14.01 9 11.01" />

  </svg>

);



const SubmitSecondaryFileIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />

    <polyline points="14 2 14 8 20 8" />

    <line x1="12" y1="18" x2="12" y2="12" />

    <line x1="9" y1="15" x2="15" y2="15" />

  </svg>

);



const FileTemplatesIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />

    <polyline points="14 2 14 8 20 8" />

    <line x1="16" y1="13" x2="8" y2="13" />

    <line x1="16" y1="17" x2="8" y2="17" />

    <polyline points="10 9 9 9 8 9" />

  </svg>

);

const DELETED_ASSIGNMENTS_KEY = 'ureb_deleted_assignments';
const READ_ASSIGNMENTS_KEY = 'ureb_read_assignments';

const getDeletedAssignmentIds = () => {
  try {
    return JSON.parse(localStorage.getItem(DELETED_ASSIGNMENTS_KEY) || '[]');
  } catch { return []; }
};

const getReadAssignmentIds = () => {
  try {
    return JSON.parse(localStorage.getItem(READ_ASSIGNMENTS_KEY) || '[]');
  } catch { return []; }
};

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
  const [notifCount, setNotifCount] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);
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
    { id: 'assigned-proposals', label: 'Assigned Proposals', icon: <FileCheckIcon />, badge: assignedCount > 0 ? assignedCount : null },
    { id: 'file-templates', label: 'File Templates', icon: <FileTemplatesIcon /> },
    { id: 'pending-reviews', label: 'Submit Review', icon: <ClockIcon /> },
    // Only show Submit Secondary File for Preliminary Reviewers
    ...(!isSecondaryReviewer ? [{ id: 'submit-secondary-file', label: 'Submit Secondary File', icon: <SubmitSecondaryFileIcon /> }] : []),
    { id: 'submitted-reviews', label: 'Submitted Reviews', icon: <CheckIcon /> },
    { id: 'messages', label: 'Messages', icon: <MessageIcon /> },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon />, badge: notifCount > 0 ? notifCount : null },
    { id: 'profile-settings', label: 'Profile Settings', icon: <ProfileIcon /> }
  ];

  useEffect(() => {

    const savedUser = localStorage.getItem('ureb_user');

    if (savedUser) {

      const user = JSON.parse(savedUser);
      setUserInfo(user);

      // Fetch expiring proposals count for badge
      import('../services/api').then(({ getReviewerAssignments }) => {
        getReviewerAssignments(user.email).then((assignments) => {
          const deletedIds = getDeletedAssignmentIds();
          const readIds = getReadAssignmentIds();
          const activeAssignments = assignments.filter((a) => !deletedIds.includes(String(a._id)) && !readIds.includes(String(a._id)));
          setAssignedCount(activeAssignments.length);

          const today = new Date();
          let count = 0;
          assignments.forEach((p) => {
            const submitted = new Date(p.submissionDate || p.createdAt || Date.now());
            const deadline = new Date(submitted);
            deadline.setFullYear(deadline.getFullYear() + 1);
            const days = Math.ceil((deadline - today) / (1000 * 3600 * 24));
            if (days <= 3) count++;
          });
          setNotifCount(count);
        }).catch(() => { });
      });
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

        return <AssignedProposalsContent setAssignedCount={setAssignedCount} />;

      case 'file-templates':

        return <FileTemplatesContent />;

      case 'pending-reviews':

        return <SubmitReviewContent onShowSuccessModal={() => setShowSuccessModal(true)} onNavigateToSubmitted={() => setActiveTab('submitted-reviews')} />;

      case 'submit-secondary-file':

        return <SubmitSecondaryFileContent onShowSuccessModal={() => setShowSuccessModal(true)} onNavigateToSubmitted={() => setActiveTab('submitted-reviews')} />;

      case 'submitted-reviews':

        return <SubmittedReviewsContent />;

      case 'notifications':

        return <ReviewerNotificationsContent userInfo={userInfo} />;

      case 'profile-settings':

        return <ReviewerProfileContent userInfo={userInfo} setUserInfo={setUserInfo} />;

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
              {item.badge && (
                <span className="nav-badge">{item.badge}</span>
              )}

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

            <div className="user-avatar">
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

    </div>

  );

};



// ── Reviewer Notifications Content ──
const ReviewerNotificationsContent = ({ userInfo }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpiring = async () => {
      if (!userInfo?.email) return;
      try {
        const assignments = await getReviewerAssignments(userInfo.email);
        const notifs = [];
        const today = new Date();

        assignments.forEach((proposal) => {
          const submittedDate = new Date(proposal.submissionDate || proposal.createdAt || Date.now());
          const deadlineDate = new Date(submittedDate);
          deadlineDate.setFullYear(deadlineDate.getFullYear() + 1);
          const daysRemaining = Math.ceil((deadlineDate - today) / (1000 * 3600 * 24));

          if (daysRemaining <= 3 && daysRemaining > 0) {
            notifs.push({
              id: `exp-${proposal._id}`,
              type: 'warning',
              title: 'Proposal Expiring Soon',
              message: `"${proposal.researchTitle || 'Untitled'}" is expiring in ${daysRemaining} day(s). The 1-year review period ends on ${deadlineDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`,
              time: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              read: false,
            });
          } else if (daysRemaining <= 0) {
            notifs.push({
              id: `exp-${proposal._id}`,
              type: 'danger',
              title: 'Proposal Expired',
              message: `"${proposal.researchTitle || 'Untitled'}" has exceeded the 1-year review validity period (expired ${deadlineDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}).`,
              time: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              read: false,
            });
          }
        });

        setNotifications(notifs);
      } catch (err) {
        console.error('Error loading reviewer notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExpiring();
  }, [userInfo]);

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="content-section">
      <h2>Notifications</h2>
      <div className="notifications-list">
        {loading ? (
          <div className="loading-state">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="loading-state">No notifications at this time.</div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-item ${!notif.read ? 'unread' : ''} ${notif.type}`}
            >
              <div className="notification-icon">
                {notif.type === 'warning' && <span>!</span>}
                {notif.type === 'danger' && <span>✕</span>}
              </div>
              <div className="notification-content">
                <h4>{notif.title}</h4>
                <p>{notif.message}</p>
                <span className="notification-time">{notif.time}</span>
              </div>
              <div className="notification-actions">
                {!notif.read && (
                  <button className="btn-secondary" onClick={() => markAsRead(notif.id)}>
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ── Reviewer Profile Settings Content ──
const ReviewerProfileContent = ({ userInfo, setUserInfo }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({ name: userInfo?.name || '', email: userInfo?.email || '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // Only sync profileData from userInfo when NOT editing (prevents resetting while user types)
  useEffect(() => {
    if (!isEditing && userInfo?.name) {
      setProfileData({ name: userInfo.name, email: userInfo.email || '' });
    }
  }, [userInfo, isEditing]);

  // Hero card always shows the saved userInfo name; edit field uses profileData for live input
  const fullName = userInfo?.name || profileData.name || 'Reviewer';
  const initials = fullName.charAt(0).toUpperCase();

  const handleEdit = () => { setIsEditing(true); setError(''); setSuccessMsg(''); };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setProfileData({ name: userInfo?.name || '', email: userInfo?.email || '' });
  };

  const handleSave = async () => {
    if (!profileData.name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
      
      // Step 1: Fetch the reviewer record to get the MongoDB document ID
      const listRes = await fetch(`${API_BASE}/reviewers`);
      const reviewers = await listRes.json();
      const reviewer = Array.isArray(reviewers)
        ? reviewers.find(r => (r.email || '').toLowerCase() === (userInfo?.email || '').toLowerCase())
        : null;

      if (!reviewer) {
        setError('Reviewer account not found on the server.');
        setLoading(false);
        return;
      }

      // Step 2: Use the standard update endpoint that is already correctly deployed on Render
      const reviewerId = String(reviewer._id);
      const updateRes = await fetch(`${API_BASE}/reviewers/${reviewerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileData.name.trim() }),
      });
      const result = await updateRes.json();

      if (result.success) {
        const updatedUser = { ...userInfo, name: profileData.name.trim() };
        setUserInfo(updatedUser);
        localStorage.setItem('ureb_user', JSON.stringify(updatedUser));
        setIsEditing(false);
        setSuccessMsg('Profile updated successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(result.error || 'Failed to update profile.');
      }
    } catch {
      setError('Failed to update profile. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwdError('');
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdError('All password fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }
    setPwdLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

      // Step 1: Fetch the reviewer record to verify current password
      const listRes = await fetch(`${API_BASE}/reviewers`);
      const reviewers = await listRes.json();
      const reviewer = Array.isArray(reviewers)
        ? reviewers.find(r => (r.email || '').toLowerCase() === (userInfo?.email || '').toLowerCase())
        : null;

      if (!reviewer) {
        setPwdError('Reviewer account not found.');
        setPwdLoading(false);
        return;
      }

      // Step 2: Verify current password
      if (reviewer.password !== currentPassword) {
        setPwdError('Current password is incorrect.');
        setPwdLoading(false);
        return;
      }

      // Step 3: Update password via existing reviewer update endpoint
      const reviewerId = String(reviewer._id);
      const updateRes = await fetch(`${API_BASE}/reviewers/${reviewerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const result = await updateRes.json();
      if (result.success) {
        setPwdSuccess('Password changed successfully.');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswords({ current: false, new: false, confirm: false });
        setShowPasswordForm(false);
        setTimeout(() => setPwdSuccess(''), 4000);
      } else {
        setPwdError(result.error || 'Failed to change password.');
      }
    } catch {
      setPwdError('Failed to change password. Check your connection.');
    } finally {
      setPwdLoading(false);
    }
  };

  const EyeOnIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
  const EyeHideIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <path d="M2 2l20 20" />
    </svg>
  );

  const pwdFields = [
    { key: 'currentPassword', label: 'Current Password', ph: 'Current password', showKey: 'current' },
    { key: 'newPassword', label: 'New Password', ph: 'New password (min. 6 chars)', showKey: 'new' },
    { key: 'confirmPassword', label: 'Confirm New Password', ph: 'Repeat new password', showKey: 'confirm' },
  ];

  return (
    <div className="sp-wrapper">

      {/* ── Hero Card ── */}
      <div className="sp-hero-card">
        <div className="sp-avatar">{initials}</div>
        <div className="sp-hero-info">
          <h2 className="sp-hero-name">{fullName}</h2>
          <p className="sp-hero-email">{userInfo?.email || '—'}</p>
        </div>
        {!isEditing && (
          <button className="sp-btn sp-btn--outline sp-edit-trigger" onClick={handleEdit}>
            Edit Profile
          </button>
        )}
      </div>

      {/* ── Global feedback ── */}
      {successMsg && <div className="sp-banner sp-banner--success">{successMsg}</div>}
      {error && <div className="sp-banner sp-banner--error">{error}</div>}

      {/* ── Account Information Card ── */}
      <div className="sp-card">
        <div className="sp-card-header">
          <h3 className="sp-card-title">Account Information</h3>
          {!isEditing && (
            <button className="sp-btn sp-btn--ghost sp-btn--sm" onClick={handleEdit}>Edit</button>
          )}
        </div>

        {!isEditing ? (
          <div className="sp-info-list">
            {[
              { label: 'Full Name', value: fullName },
              { label: 'Email', value: userInfo?.email },
            ].map(({ label, value }) => (
              <div className="sp-info-row" key={label}>
                <span className="sp-info-label">{label}</span>
                <span className="sp-info-value">{value || <em className="sp-not-set">Not set</em>}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="sp-edit-form">
            <p className="sp-edit-hint">Update your profile information below.</p>
            <div className="sp-field-row sp-field-row--2">
              <div className="sp-field">
                <label htmlFor="rp-name">Full Name</label>
                <input
                  id="rp-name"
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your name"
                />
              </div>
              <div className="sp-field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  style={{ backgroundColor: '#f5f7f5', cursor: 'not-allowed', color: '#999' }}
                />
                <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Email cannot be changed</small>
              </div>
            </div>
            <div className="sp-form-actions">
              <button className="sp-btn sp-btn--primary" onClick={handleSave} disabled={loading}>
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
              <button className="sp-btn sp-btn--ghost" onClick={handleCancel} disabled={loading}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Security Card ── */}
      <div className="sp-card">
        <div className="sp-card-header">
          <h3 className="sp-card-title">Security</h3>
          {!showPasswordForm && (
            <button
              className="sp-btn sp-btn--outline sp-btn--sm"
              onClick={() => { setShowPasswordForm(true); setPwdError(''); }}
            >
              Change Password
            </button>
          )}
        </div>

        {pwdSuccess && <div className="sp-banner sp-banner--success">{pwdSuccess}</div>}

        {showPasswordForm ? (
          <div className="sp-edit-form">
            <div className="sp-field-row sp-field-row--3">
              {pwdFields.map(({ key, label, ph, showKey }) => (
                <div className="sp-field" key={key}>
                  <label>{label}</label>
                  <div className="sp-pwd-wrap">
                    <input
                      type={showPasswords[showKey] ? 'text' : 'password'}
                      value={passwordData[key]}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={ph}
                    />
                    <button
                      type="button"
                      className="sp-pwd-eye"
                      onClick={() => setShowPasswords(prev => ({ ...prev, [showKey]: !prev[showKey] }))}
                      tabIndex={-1}
                      aria-label={showPasswords[showKey] ? 'Hide password' : 'Show password'}
                    >
                      {showPasswords[showKey] ? <EyeHideIcon /> : <EyeOnIcon />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {pwdError && <div className="sp-banner sp-banner--error">{pwdError}</div>}
            <div className="sp-form-actions">
              <button className="sp-btn sp-btn--primary" onClick={handlePasswordChange} disabled={pwdLoading}>
                {pwdLoading ? 'Updating…' : 'Update Password'}
              </button>
              <button
                className="sp-btn sp-btn--ghost"
                onClick={() => { setShowPasswordForm(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPwdError(''); }}
                disabled={pwdLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="sp-security-hint">Keep your account secure with a strong, unique password.</p>
        )}
      </div>
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
  const [showAllActivity, setShowAllActivity] = useState(false);
  const ACTIVITY_LIMIT = 5;

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



      const deletedIds = getDeletedAssignmentIds();
      const activeAssignments = assignments.filter(a => !deletedIds.includes(String(a._id)));

      const pendingReviewsCount = reviews.filter(r => r.status === 'pending').length;
      const pendingAssignmentsCount = activeAssignments.filter(a => !a.status || a.status.toLowerCase() === 'pending').length;

      // If admin has marked this reviewer as completed, count all their assignments as done
      const isMarkedComplete = reviewerProfile?.status === 'completed';
      const completedReviews = isMarkedComplete
        ? activeAssignments.length
        : activeAssignments.filter(a => a.status === 'completed').length;

      const unreadMessages = messages.filter(m => !m.read).length;



      const activities = generateRecentActivity(activeAssignments, reviews, messages);



      setStats({

        assignedProposals: activeAssignments.length,

        pendingReviews: pendingReviewsCount + pendingAssignmentsCount,

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

        description: `${proposal.protocolCode ? 'Protocol ' + proposal.protocolCode : 'Proposal'}: "${proposal.researchTitle || 'Untitled'}"`,

        time: proposal.submissionDate || proposal.createdAt,

        timeLabel: formatTimeAgo(proposal.submissionDate || proposal.createdAt)

      });

    });



    reviews.filter(r => r.status === 'completed').slice(0, 5).forEach(review => {

      activities.push({

        type: 'review',

        icon: <DashboardIcon />,

        title: 'Review Completed',

        description: `Proposal: "${review.proposalTitle || 'Untitled Proposal'}"`,

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

            <p>Pending</p>

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
            <>
              <div className="activity-list" style={{ maxHeight: showAllActivity ? 'none' : '400px', overflow: showAllActivity ? 'visible' : 'auto' }}>
                {(showAllActivity ? recentActivity : recentActivity.slice(0, ACTIVITY_LIMIT)).map((activity, index) => (
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
              {recentActivity.length > ACTIVITY_LIMIT && (
                <button
                  onClick={() => setShowAllActivity(!showAllActivity)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    marginTop: '1rem',
                    background: 'var(--pale-green)',
                    border: '1px solid var(--soft-green)',
                    borderRadius: '8px',
                    color: 'var(--dark-green)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {showAllActivity ? 'Show Less' : `Show ${recentActivity.length - ACTIVITY_LIMIT} More`}
                </button>
              )}
            </>
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );

  const FolderIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );

  const DownloadIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
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

const AssignedProposalsContent = ({ setAssignedCount }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [readIds, setReadIds] = useState([]);
  const [viewingFile, setViewingFile] = useState(null);

  useEffect(() => {
    setReadIds(getReadAssignmentIds());
  }, []);

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
    setAssignments(prev => {
      const filtered = prev.filter(a => String(a._id) !== confirmDeleteId);
      if (setAssignedCount) {
        setAssignedCount(filtered.filter(a => !readIds.includes(String(a._id))).length);
      }
      return filtered;
    });
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

          const isRead = readIds.includes(String(assignment._id));

          return (
            <div className={`proposal-card ${!isRead ? 'unread' : ''}`} key={String(assignment._id)}>
              <div className="proposal-header">
                <div className="proposal-header-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h3>{assignment.protocolCode || 'No Protocol Code'}</h3>
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    backgroundColor: isRead ? '#e2e8f0' : '#fee2e2',
                    color: isRead ? '#64748b' : '#ef4444',
                    border: `1px solid ${isRead ? '#cbd5e1' : '#fca5a5'}`
                  }}>
                    {isRead ? 'Done' : 'New'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span
                    className={`status-badge ${(assignment.status || 'pending').toLowerCase().replace(/\s+/g, '-')}`}
                    style={(assignment.status || 'pending').toLowerCase() === 'pending' ? { fontSize: '1.05rem', fontWeight: '800', letterSpacing: '0.5px', padding: '0.4rem 0.8rem', textTransform: 'uppercase' } : {}}
                  >
                    {assignment.status || 'Pending'}
                  </span>
                  <button
                    title="Delete assignment"
                    onClick={() => setConfirmDeleteId(String(assignment._id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
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
                    onClick={() => {
                      const idStr = String(assignment._id);
                      if (isExpanded) {
                        setExpandedId(null);
                      } else {
                        setExpandedId(idStr);
                        if (!readIds.includes(idStr)) {
                          const newReadIds = [...readIds, idStr];
                          localStorage.setItem(READ_ASSIGNMENTS_KEY, JSON.stringify(newReadIds));
                          setReadIds(newReadIds);
                          if (setAssignedCount) setAssignedCount(prev => Math.max(0, prev - 1));
                        }
                      }
                    }}
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
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                className="btn-primary"
                                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                                onClick={() => handleDownload(file)}
                              >
                                Download
                              </button>
                              <button
                                className="btn-secondary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                onClick={() => setViewingFile(file)}
                                title="View file"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </button>
                            </div>
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

      {/* File Viewer Modal */}
      {viewingFile && (
        <FileViewerModal 
          viewingFile={viewingFile} 
          onClose={() => setViewingFile(null)} 
          onDownload={() => handleDownload(viewingFile)}
        />
      )}
    </div>
  );
};

// File Viewer Modal Component (separate for proper event handling)
const FileViewerModal = ({ viewingFile, onClose, onDownload }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{ padding: '2rem' }}
    >
      <div 
        className="modal-container" 
        onClick={e => e.stopPropagation()}
        style={{ 
          maxWidth: '95vw', 
          width: '95vw',
          maxHeight: '95vh',
          height: 'auto',
          margin: '0 auto'
        }}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div className="modal-header" style={{ overflow: 'hidden' }}>
          <h2 
            title={viewingFile.originalname || viewingFile.filename}
            style={{ 
              fontSize: '1.1rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%'
            }}
          >
            {viewingFile.originalname || viewingFile.filename}
          </h2>
        </div>
        <div className="modal-body" style={{ padding: '1rem' }}>
          <FileViewer file={viewingFile} onClose={onClose} />
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
          <button 
            className="btn-primary" 
            onClick={onDownload}
            style={{ marginLeft: '0.5rem' }}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

// File Viewer Component
const FileViewer = ({ file, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!file?.filename) return;

    const loadFile = async () => {
      setLoading(true);
      setError(null);

      try {
        const downloadUrl = `${import.meta.env.VITE_API_URL}/api/download/${file.filename}`;
        const response = await fetch(downloadUrl);
        
        if (!response.ok) {
          throw new Error('Failed to load file');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setFileUrl(url);

        // Determine file type
        const mimeType = blob.type;
        const extension = (file.originalname || file.filename).split('.').pop().toLowerCase();
        
        if (mimeType.includes('pdf') || extension === 'pdf') {
          setFileType('pdf');
        } else if (mimeType.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
          setFileType('image');
        } else if (mimeType.includes('text') || ['txt', 'csv'].includes(extension)) {
          setFileType('text');
        } else if (mimeType.includes('word') || extension === 'doc' || extension === 'docx') {
          setFileType('word');
        } else if (mimeType.includes('excel') || mimeType.includes('sheet') || ['xls', 'xlsx', 'csv'].includes(extension)) {
          setFileType('excel');
        } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation') || ['ppt', 'pptx'].includes(extension)) {
          setFileType('powerpoint');
        } else {
          setFileType('other');
        }
      } catch (err) {
        console.error('Error loading file:', err);
        setError('Failed to load file. Please try downloading instead.');
      } finally {
        setLoading(false);
      }
    };

    loadFile();

    return () => {
      if (fileUrl) {
        window.URL.revokeObjectURL(fileUrl);
      }
    };
  }, [file]);

  const getGoogleDocsViewerUrl = (url) => {
    return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
  };

  const getMicrosoftViewerUrl = (url) => {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Loading file...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: '#ef4444' }}>{error}</p>
      </div>
    );
  }

  // Zoom controls toolbar
  const ZoomControls = () => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      gap: '0.5rem', 
      padding: '0.5rem',
      borderRadius: '8px',
      marginBottom: '0.5rem',
      border: '1px solid #e2e8f0'
    }}>
      <button 
        onClick={() => setZoom(prev => Math.max(50, prev - 25))}
        style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}
        title="Zoom out"
      >
        −
      </button>
      <span style={{ fontSize: '0.9rem', minWidth: '60px', textAlign: 'center' }}>
        {zoom}%
      </span>
      <button 
        onClick={() => setZoom(prev => Math.min(200, prev + 25))}
        style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}
        title="Zoom in"
      >
        +
      </button>
      <button 
        onClick={() => setZoom(100)}
        style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', marginLeft: '0.5rem' }}
      >
        Reset
      </button>
    </div>
  );

  // PDF Viewer
  if (fileType === 'pdf') {
    return (
      <div style={{ height: '92vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
        <ZoomControls />
        <div style={{ flex: 1, overflow: 'auto', borderRadius: '8px' }}>
          <iframe
            src={`${fileUrl}#zoom=${zoom}`}
            width="100%"
            height="100%"
            style={{ 
              border: 'none', 
              borderRadius: '8px',
              background: 'white',
              minHeight: '700px'
            }}
            title="PDF Viewer"
          />
        </div>
      </div>
    );
  }

  // Image Viewer
  if (fileType === 'image') {
    return (
      <div style={{ height: '85vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
        <ZoomControls />
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', borderRadius: '8px' }}>
          <img
            src={fileUrl}
            alt={file.originalname || file.filename}
            style={{ 
              maxWidth: '100%', 
              maxHeight: 'none',
              width: zoom === 100 ? 'auto' : `${zoom}%`,
              height: 'auto',
              objectFit: 'contain',
              borderRadius: '8px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease',
              display: 'block'
            }}
          />
        </div>
      </div>
    );
  }

  // Text File Viewer
  if (fileType === 'text') {
    return (
      <div style={{ height: '70vh', width: '100%', overflow: 'auto' }}>
        <iframe
          src={fileUrl}
          width="100%"
          height="100%"
          style={{ border: 'none', borderRadius: '8px', background: '#f8f9fa' }}
          title="Text Viewer"
        />
      </div>
    );
  }

  // Microsoft Office Documents - Use Microsoft Online Viewer
  if (['word', 'excel', 'powerpoint'].includes(fileType)) {
    // For Office files, we need the public URL
    const viewerUrl = getMicrosoftViewerUrl(`${import.meta.env.VITE_API_URL}/api/download/${file.filename}`);
    
    return (
      <div style={{ height: '70vh', width: '100%' }}>
        <iframe
          src={viewerUrl}
          width="100%"
          height="100%"
          style={{ border: 'none', borderRadius: '8px' }}
          title="Office Document Viewer"
          allow="fullscreen"
        />
        <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-medium)' }}>
          If the document doesn't load, please use the Download button below.
        </p>
      </div>
    );
  }

  // For other file types, show download option
  return (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#7A9E7E" strokeWidth="1.5" style={{ marginBottom: '1rem' }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
      <p>This file type cannot be previewed directly.</p>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-medium)', marginTop: '0.5rem' }}>
        Please download the file to view its contents.
      </p>
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
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
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

  const handleMarkAsRead = async (messageId) => {
    const result = await markMessageAsRead(messageId);
    if (result && result.success !== false) {
      setMessages(prev => prev.map(m => (m._id || m.id) === messageId ? { ...m, read: true } : m));
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

                <button
                  className="btn-secondary"
                  onClick={() => handleMarkAsRead(message._id || message.id)}
                >
                  Mark as Read
                </button>

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
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
      case 'revision':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        );
      case 'reject':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        );
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="m9 15 2 2 4-4" />
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
                    <h4 className="sr-card-title">{review.proposalTitle || review.researchTitle || review.title || 'Untitled Proposal'}</h4>
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
                    <polyline points="6 9 12 15 18 9" />
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
    Submission: { bg: '#f0faf0', text: '#276227', border: '#c3e6c3' },
    Application: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    Compliance: { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
    Instrument: { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc' },
    Review: { bg: '#f0f9ff', text: '#0c4a6e', border: '#bae6fd' },
  };

  const DownloadIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
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