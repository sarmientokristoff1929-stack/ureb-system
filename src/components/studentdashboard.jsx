import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { API_BASE_URL, viewFile, downloadReviewerFile, sendStudentMessageToAdmin } from '../services/api';
import './studentdashboard.css';

// localStorage helpers for deleted proposals (Render deployment workaround)
const getDeletedProposalIds = () => {
  try { return JSON.parse(localStorage.getItem('deleted_proposals') || '[]'); }
  catch { return []; }
};
const saveDeletedProposalId = (id) => {
  try {
    const ids = getDeletedProposalIds();
    if (!ids.includes(String(id))) {
      localStorage.setItem('deleted_proposals', JSON.stringify([...ids, String(id)]));
    }
  } catch { }
};

const NOTIF_HIDDEN_KEY = 'ureb_hidden_notifications';
const getHiddenNotifIds = () => {
  try { return JSON.parse(localStorage.getItem(NOTIF_HIDDEN_KEY) || '[]'); }
  catch { return []; }
};
const saveHiddenNotifId = (id) => {
  try {
    const ids = getHiddenNotifIds();
    if (!ids.includes(String(id))) {
      localStorage.setItem(NOTIF_HIDDEN_KEY, JSON.stringify([...ids, String(id)]));
    }
  } catch { }
};

// Icons as simple SVG components
const DashboardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const BellIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const MessageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const FilePlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

const HistoryIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l3 3" />
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

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const ResubmissionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 21h5v-5" />
  </svg>
);

const ProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
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

const ReplyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    <path d="M12 12v.01" />
    <path d="M8 12h8" />
    <path d="M12 8l4 4-4 4" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Helper to get full URL for profile pictures
const getProfilePicUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const apiOrigin = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  if (apiOrigin && path.startsWith('/')) {
    return `${apiOrigin}${path}`;
  }
  return path;
};

const StudentDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedFiles, setSubmittedFiles] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem('ureb_user');
    if (savedUser) {
      setUserInfo(JSON.parse(savedUser));
    }

    // Check if welcome modal has been shown in this login session
    const welcomeShown = sessionStorage.getItem('welcome_shown');
    if (welcomeShown) {
      setShowWelcomeModal(false);
    } else {
      setShowWelcomeModal(true);
    }

    // Reset to dashboard tab on page refresh
    const currentTab = sessionStorage.getItem('activeTab');
    if (!currentTab) {
      setActiveTab('dashboard');
      sessionStorage.setItem('activeTab', 'dashboard');
    } else {
      setActiveTab(currentTab);
    }
  }, []);

  // Fetch message count for badge
  useEffect(() => {
    const fetchMessageCount = async () => {
      if (!userInfo?.email) return;
      try {
        const response = await fetch(`${API_BASE_URL}/messages/${encodeURIComponent(userInfo.email)}`);
        const data = await response.json();
        const unreadAdminMessages = data.filter((m) =>
          m.recipientEmail === userInfo.email &&
          m.type === 'admin_to_student' &&
          !m.read
        );
        setMessageCount(unreadAdminMessages.length);
      } catch (error) {
        console.error('Error fetching message count:', error);
        setMessageCount(0);
      }
    };
    fetchMessageCount();
  }, [userInfo]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'add-files', label: 'Add Files', icon: <FilePlusIcon /> },
    { id: 'resubmission', label: 'Resubmission', icon: <ResubmissionIcon /> },
    { id: 'file-templates', label: 'File Templates', icon: <FileTemplatesIcon /> },
    { id: 'messages', label: 'Messages', icon: <MailIcon />, badge: messageCount > 0 ? messageCount : null },
    { id: 'message-admin', label: 'Message Admin', icon: <MessageIcon /> },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon /> },
    { id: 'history', label: 'History', icon: <HistoryIcon /> },
    { id: 'profile', label: 'Profile', icon: <ProfileIcon /> },
  ];

  // Handle tab changes and save to sessionStorage
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    sessionStorage.setItem('activeTab', tabId);
    // Auto-close sidebar on mobile when a tab is selected
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    // Clear welcome modal flag so it shows again on next login
    sessionStorage.removeItem('welcome_shown');
    onLogout();
  };

  const cancelLogout = () => {
    setIsLogoutModalOpen(false);
  };

  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    if (!userInfo?.email) return;
    fetch(`${API_BASE_URL}/student/profile?email=${encodeURIComponent(userInfo.email)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.student) {
          setStudentData(data.student);
        }
      })
      .catch(err => console.error('Error fetching student profile:', err));
  }, [userInfo?.email]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent userInfo={userInfo} onTabChange={handleTabChange} />;
      case 'notifications':
        return <NotificationsContent userInfo={userInfo} />;
      case 'add-files':
        return (
          <AddFilesContent
            setSubmittedFiles={setSubmittedFiles}
            setShowSuccessModal={setShowSuccessModal}
            userInfo={userInfo}
            studentData={studentData}
          />
        );
      case 'resubmission':
        return (
          <ResubmissionContent
            userInfo={userInfo}
            studentData={studentData}
            setSubmittedFiles={setSubmittedFiles}
            setShowSuccessModal={setShowSuccessModal}
          />
        );
      case 'file-templates':
        return <FileTemplatesContent />;
      case 'messages':
        return <MessagesContent userInfo={userInfo} onMessageRead={refreshMessageCount} />;
      case 'message-admin':
        return <MessageAdminContent userInfo={userInfo} />;
      case 'history':
        return <HistoryContent />;
      case 'profile':
        return <ProfileContent userInfo={userInfo} setUserInfo={setUserInfo} onLogout={onLogout} />;
      default:
        return <DashboardContent userInfo={userInfo} onTabChange={handleTabChange} />;
    }
  };

  const getFirstName = () => {
    return userInfo?.name ? userInfo.name.split(' ')[0] : 'Student';
  };

  const refreshMessageCount = async () => {
    if (!userInfo?.email) return;
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${encodeURIComponent(userInfo.email)}`);
      const data = await response.json();
      const unreadAdminMessages = data.filter((m) =>
        m.recipientEmail === userInfo.email &&
        m.type === 'admin_to_student' &&
        !m.read
      );
      setMessageCount(unreadAdminMessages.length);
    } catch (error) {
      console.error('Error refreshing message count:', error);
    }
  };

  return (
    <div className="student-dashboard">
      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal
          onClose={() => setShowSuccessModal(false)}
          submittedFiles={submittedFiles}
        />
      )}

      {/* Welcome Modal */}
      {showWelcomeModal && activeTab === 'dashboard' && (
        <WelcomeModal
          firstName={getFirstName()}
          onClose={() => {
            setShowWelcomeModal(false);
            sessionStorage.setItem('welcome_shown', 'true');
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/logoureb.png" alt="UREB Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
            <span>Researcher Portal</span>
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
              onClick={() => handleTabChange(item.id)}
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
            <span>Welcome, {userInfo?.name || 'Student'}</span>
            {userInfo?.profilePicture && (
              <img
                key={userInfo.profilePicture}
                src={getProfilePicUrl(userInfo.profilePicture)}
                alt="Profile"
                className="user-avatar user-avatar-img"
                onLoad={(e) => {
                  e.target.style.display = 'block';
                  const fallback = e.target.parentElement?.querySelector('.user-avatar:not(.user-avatar-img)');
                  if (fallback) fallback.style.display = 'none';
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.parentElement?.querySelector('.user-avatar:not(.user-avatar-img)');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            )}
            <div className="user-avatar" style={{ display: userInfo?.profilePicture ? 'none' : 'flex' }}>
              {userInfo?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
          </div>
        </header>

        <div className="content-body">
          {renderContent()}
        </div>
      </main>
      <LogoutModal isOpen={isLogoutModalOpen} onClose={cancelLogout} onConfirm={confirmLogout} />
    </div>
  );
};

function ProfileContent({ userInfo, setUserInfo, onLogout }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState({
    firstName: '', middleName: '', lastName: '', suffix: '',
    gender: '', researcherType: '', department: '', program: '', gmail: '', facebookLink: '',
  });
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [studentData, setStudentData] = useState(null);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwdData, setPwdData] = useState({ current: '', newPwd: '', confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [showPwd, setShowPwd] = useState({ current: false, newPwd: false, confirm: false });

  // Profile picture state
  const [uploadingPic, setUploadingPic] = useState(false);
  const fileInputRef = useRef(null);

  // Co-members state
  const [coMembers, setCoMembers] = useState([]);
  const [showCoMemberForm, setShowCoMemberForm] = useState(false);
  const [newCoMember, setNewCoMember] = useState({ name: '', email: '', role: '' });
  const [coMemberLoading, setCoMemberLoading] = useState(false);
  const [coMemberError, setCoMemberError] = useState('');
  const [coMemberSuccess, setCoMemberSuccess] = useState('');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/student/profile?email=${encodeURIComponent(userInfo.email)}`);
        const result = await response.json();
        if (result.success) {
          const student = result.student;
          // Add cache-busting timestamp to profile picture URL
          if (student.profilePicture) {
            student.profilePicture = `${student.profilePicture}?t=${Date.now()}`;
          }
          setStudentData(student);
          setEditedInfo({
            firstName: student.firstName || '',
            middleName: student.middleName || '',
            lastName: student.lastName || '',
            suffix: student.suffix || '',
            gender: student.gender || '',
            researcherType: student.researcherType || '',
            department: student.department || '',
            program: student.program || '',
            gmail: student.gmail || '',
            facebookLink: student.facebookLink || '',
          });
          setCoMembers(Array.isArray(student.coMembers) ? student.coMembers : []);
        } else {
          setError(result.error || 'Failed to fetch profile data');
        }
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError('Failed to fetch profile data');
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [userInfo.email]);

  const getFullName = () => {
    if (!studentData) return userInfo?.name || 'Student';
    const parts = [studentData.firstName, studentData.middleName, studentData.lastName].filter(Boolean);
    const base = parts.length > 0 ? parts.join(' ') : (studentData.name || userInfo?.name || 'Student');
    return studentData.suffix ? `${base} ${studentData.suffix}` : base;
  };

  const handleProfilePicClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
      setTimeout(() => setError(''), 4000);
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      setTimeout(() => setError(''), 4000);
      return;
    }

    setUploadingPic(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      formData.append('email', userInfo.email);

      const response = await fetch(`${API_BASE_URL}/student/profile/picture`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const imageUrlWithCache = `${result.profilePicture}?t=${Date.now()}`;
        setStudentData(prev => ({ ...prev, profilePicture: imageUrlWithCache }));
        const updatedUser = { ...userInfo, profilePicture: imageUrlWithCache };
        setUserInfo(updatedUser);
        localStorage.setItem('ureb_user', JSON.stringify(updatedUser));
        setSuccessMsg('Profile picture updated successfully');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(result.error || 'Failed to upload profile picture');
        setTimeout(() => setError(''), 4000);
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setError('Failed to upload profile picture');
      setTimeout(() => setError(''), 4000);
    } finally {
      setUploadingPic(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleProfilePicDelete = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

    setUploadingPic(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/student/profile/picture`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userInfo.email }),
      });

      const result = await response.json();

      if (result.success) {
        setStudentData(prev => ({ ...prev, profilePicture: null }));
        const updatedUser = { ...userInfo, profilePicture: null };
        setUserInfo(updatedUser);
        localStorage.setItem('ureb_user', JSON.stringify(updatedUser));
        setSuccessMsg('Profile picture removed successfully');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(result.error || 'Failed to remove profile picture');
        setTimeout(() => setError(''), 4000);
      }
    } catch (err) {
      console.error('Error removing profile picture:', err);
      setError('Failed to remove profile picture');
      setTimeout(() => setError(''), 4000);
    } finally {
      setUploadingPic(false);
    }
  };

  const handleEdit = () => { setIsEditing(true); setError(''); setSuccessMsg(''); };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    if (studentData) {
      setEditedInfo({
        firstName: studentData.firstName || '',
        middleName: studentData.middleName || '',
        lastName: studentData.lastName || '',
        suffix: studentData.suffix || '',
        gender: studentData.gender || '',
        researcherType: studentData.researcherType || '',
        department: studentData.department || '',
        program: studentData.program || '',
        gmail: studentData.gmail || '',
      });
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/student/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userInfo.email, ...editedInfo }),
      });
      const result = await response.json();
      if (result.success) {
        setStudentData(result.student);
        const updatedUser = {
          ...userInfo,
          name: result.student.name || `${result.student.firstName} ${result.student.lastName}`.trim(),
          firstName: result.student.firstName,
          middleName: result.student.middleName,
          lastName: result.student.lastName,
          email: result.student.gmail,
          gender: result.student.gender,
          department: result.student.department,
          program: result.student.program,
          profilePicture: result.student.profilePicture,
        };
        setUserInfo(updatedUser);
        localStorage.setItem('ureb_user', JSON.stringify(updatedUser));
        setIsEditing(false);
        setSuccessMsg('Profile updated successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwdLoading(true);
    setPwdError('');
    setPwdSuccess('');

    // Validate passwords
    if (!pwdData.current) {
      setPwdError('Please enter your current password');
      setPwdLoading(false);
      return;
    }
    if (!pwdData.newPwd || pwdData.newPwd.length < 6) {
      setPwdError('New password must be at least 6 characters');
      setPwdLoading(false);
      return;
    }
    if (pwdData.newPwd !== pwdData.confirm) {
      setPwdError('New passwords do not match');
      setPwdLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/student/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userInfo.email,
          currentPassword: pwdData.current,
          newPassword: pwdData.newPwd
        }),
      });
      const result = await response.json();

      if (result.success) {
        setPwdSuccess('Password updated successfully');
        setPwdData({ current: '', newPwd: '', confirm: '' });
        setShowPasswordForm(false);
        setTimeout(() => setPwdSuccess(''), 4000);
      } else {
        setPwdError(result.error || 'Failed to update password');
      }
    } catch (err) {
      console.error('Error updating password:', err);
      setPwdError('Failed to update password. Please try again.');
    } finally {
      setPwdLoading(false);
    }
  };

  const saveCoMembersToDatabase = async (listToSave) => {
    setCoMemberLoading(true);
    setCoMemberError('');
    setCoMemberSuccess('');
    try {
      const response = await fetch(`${API_BASE_URL}/student/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userInfo.email, coMembers: listToSave }),
      });
      const result = await response.json();
      if (result.success) {
        setStudentData(prev => ({ ...prev, coMembers: listToSave }));
        setCoMemberSuccess('Co-members updated successfully');
        setTimeout(() => setCoMemberSuccess(''), 4000);
      } else {
        setCoMemberError(result.error || 'Failed to save co-members');
      }
    } catch (err) {
      console.error('Error saving co-members:', err);
      setCoMemberError('Failed to save co-members');
    } finally {
      setCoMemberLoading(false);
    }
  };

  const handleAddCoMember = async () => {
    setCoMemberError('');
    if (!newCoMember.name.trim() || !newCoMember.email.trim()) {
      setCoMemberError('Name and email are required');
      return;
    }
    const updated = [...coMembers, { ...newCoMember, id: Date.now().toString() }];
    setCoMembers(updated);
    setNewCoMember({ name: '', email: '', role: '' });
    setShowCoMemberForm(false);
    await saveCoMembersToDatabase(updated);
  };

  const handleRemoveCoMember = async (id, idx) => {
    const updated = coMembers.filter((m, index) => {
      if (id && (m.id === id || m._id === id)) {
        return false;
      }
      return index !== idx;
    });
    setCoMembers(updated);
    await saveCoMembersToDatabase(updated);
  };

  const handleSaveCoMembers = async () => {
    await saveCoMembersToDatabase(coMembers);
  };

  if (loading) {
    return (
      <div className="sp-loading">
        <div className="sp-spinner" />
        <span>Loading profile...</span>
      </div>
    );
  }

  if (error && !studentData) {
    return <div className="sp-error-state">{error}</div>;
  }

  const fullName = getFullName();
  const initials = fullName.charAt(0).toUpperCase();
  const profilePicUrl = studentData?.profilePicture || userInfo?.profilePicture;

  // Debug logging
  console.log('[DEBUG] Profile Picture URL:', profilePicUrl);
  console.log('[DEBUG] studentData:', studentData);
  console.log('[DEBUG] userInfo:', userInfo);

  return (
    <div className="sp-wrapper">

      {/* ── Hero Card ── */}
      <div className="sp-hero-card">
        {/* Avatar with upload functionality */}
        <div
          className="sp-avatar-wrapper"
          onClick={!uploadingPic ? handleProfilePicClick : undefined}
          style={{ cursor: uploadingPic ? 'default' : 'pointer' }}
        >
          {/* Loading state */}
          {uploadingPic && (
            <div className="sp-avatar-loading">
              <div className="sp-avatar-spinner" />
            </div>
          )}

          {/* Profile image - shown when URL exists and not loading */}
          {!uploadingPic && profilePicUrl && (
            <img
              key={profilePicUrl}
              src={getProfilePicUrl(profilePicUrl)}
              alt="Profile"
              className="uploaded-profile-picture"
              onLoad={(e) => {
                e.target.style.display = 'block';
                const fallback = e.target.parentElement?.querySelector('.sp-hero-avatar');
                if (fallback) fallback.style.display = 'none';
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                const fallback = e.target.parentElement?.querySelector('.sp-hero-avatar');
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          )}

          {/* Fallback initials - shown when no URL */}
          <div
            className="sp-hero-avatar"
            style={{ display: (!uploadingPic && !profilePicUrl) ? 'flex' : 'none' }}
          >
            {initials}
          </div>

          {/* Hover overlay - shows "Upload Picture" on hover */}
          {!uploadingPic && (
            <div className="sp-avatar-hover-overlay">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              <span>Upload Picture</span>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleProfilePicUpload}
            style={{ display: 'none' }}
          />
        </div>
        <div className="sp-hero-info">
          <h2 className="sp-hero-name">{fullName}</h2>
          {studentData?.researcherType && (
            <span className="sp-id-badge" style={{ display: 'inline-block', marginBottom: '0.4rem', backgroundColor: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>
              {studentData.researcherType}
            </span>
          )}
          <p className="sp-hero-email">{studentData?.gmail || userInfo?.email || '—'}</p>
          <p className="sp-hero-role">Principal Investigator (Leader)</p>
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
              { label: 'Sex', value: studentData?.sex || studentData?.gender },
              { label: 'Researcher Type', value: studentData?.researcherType },
              { label: 'Faculty / Insti / Agency / College', value: studentData?.department },
              { label: 'Program', value: studentData?.program },
              { label: 'Email Address', value: studentData?.gmail || studentData?.email },
              { label: 'Facebook', value: studentData?.facebookLink, isLink: true },
            ].map(({ label, value, isLink }) => (
              <div className="sp-info-row" key={label}>
                <span className="sp-info-label">{label}</span>
                <span className="sp-info-value">
                  {isLink && value ? (
                    <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0866FF', textDecoration: 'none', fontWeight: 600 }}>
                      {value}
                    </a>
                  ) : (
                    value || <em className="sp-not-set">Not set</em>
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="sp-edit-form">
            <p className="sp-edit-hint">Update your personal information below.</p>

            <div className="sp-field-row sp-field-row--4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              {[
                { id: 'sp-fn', key: 'firstName', label: 'First Name', ph: 'First name' },
                { id: 'sp-mn', key: 'middleName', label: 'Middle Name', ph: 'Middle name (optional)' },
                { id: 'sp-ln', key: 'lastName', label: 'Last Name', ph: 'Last name' },
              ].map(({ id, key, label, ph }) => (
                <div className="sp-field" key={key}>
                  <label htmlFor={id}>{label}</label>
                  <input id={id} type="text" value={editedInfo[key]}
                    onChange={e => setEditedInfo(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={ph}
                    autoComplete="off"
                    data-lpignore="true" />
                </div>
              ))}
              <div className="sp-field">
                <label htmlFor="sp-sfx">Suffix (Optional)</label>
                <select
                  id="sp-sfx"
                  value={editedInfo.suffix || ''}
                  onChange={e => setEditedInfo(p => ({ ...p, suffix: e.target.value }))}
                >
                  <option value="">None</option>
                  <option value="Jr.">Jr.</option>
                  <option value="Sr.">Sr.</option>
                  <option value="II">II</option>
                  <option value="III">III</option>
                  <option value="IV">IV</option>
                  <option value="V">V</option>
                  <option value="VI">VI</option>
                  <option value="Ph.D.">Ph.D.</option>
                  <option value="Ed.D.">Ed.D.</option>
                  <option value="M.D.">M.D.</option>
                  <option value="M.S.">M.S.</option>
                  <option value="M.A.">M.A.</option>
                  <option value="CPA">CPA</option>
                  <option value="Engr.">Engr.</option>
                  <option value="RN">RN</option>
                  <option value="LPT">LPT</option>
                </select>
              </div>
            </div>

            <div className="sp-field-row sp-field-row--2">
              <div className="sp-field">
                <label htmlFor="sp-gender">Sex</label>
                <select
                  id="sp-gender"
                  value={editedInfo.sex || editedInfo.gender || ''}
                  onChange={e => setEditedInfo(p => ({ ...p, sex: e.target.value, gender: e.target.value }))}
                >
                  <option value="">Select sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="sp-field">
                <label htmlFor="sp-researcherType">Researcher Type</label>
                <select
                  id="sp-researcherType"
                  value={editedInfo.researcherType || ''}
                  onChange={e => setEditedInfo(p => ({ ...p, researcherType: e.target.value }))}
                >
                  <option value="">Select Researcher Type</option>
                  <option value="Faculty Researcher">Faculty Researcher</option>
                  <option value="Staff Researcher">Staff Researcher</option>
                  <option value="External Researcher">External Researcher</option>
                  <option value="Student Researcher">Student Researcher</option>
                </select>
              </div>
            </div>

            <div className="sp-field-row sp-field-row--2">
              <div className="sp-field">
                <label htmlFor="sp-gmail">Email Address</label>
                <input id="sp-gmail" type="email" value={editedInfo.gmail}
                  onChange={e => setEditedInfo(p => ({ ...p, gmail: e.target.value }))}
                  placeholder="e.g., name@dorsu.edu.ph or name@gmail.com"
                  autoComplete="off" />
              </div>
              <div className="sp-field">
                <label htmlFor="sp-dept">Faculty / Insti / Agency / College</label>
                <select
                  id="sp-dept"
                  value={editedInfo.department}
                  onChange={e => setEditedInfo(p => ({ ...p, department: e.target.value }))}
                >
                  <option value="">Select Faculty / Insti / Agency / College</option>
                  <option value="FALS">FALS-Faculty of Agriculture and Life Sciences</option>
                  <option value="FTED">FTED- Faculty of Teacher Education</option>
                  <option value="FAIS">FAIS-Faculty of Advance and International Studies</option>
                  <option value="FNAS">FNAS-Faculty of Nursing and Allied Health Science</option>
                  <option value="FBM">FBM-Faculty of Business Management</option>
                  <option value="FCJE">FCJE-Faculty of Criminology Justice Education</option>
                  <option value="FACET">FACET-Faculty of Computing, Engineering, Technology</option>
                  <option value="FHUSOCOM">FHUSOCOM-Faculty of Humanities, Social Science & Communication</option>
                  <option value="SEIC">SEIC- San Isidro Extension Campus</option>
                  <option value="BEC">BEC-BanayBanay Extension Campus</option>
                  <option value="CEC">CEC-Cateel Extension Campus</option>
                  <option value="BGEC">BGEC-Baganga Extension Campus</option>
                  <option value="TEC">TEC-Tarragona Extension Campus</option>
                  <option value="NSTP">NSTP-National Service Training Program</option>
                  <option value="ICS">ICS- Indigenous Community Studies</option>
                  <option value="Community Representatives">Community Representatives</option>
                  <option value="UREB Board">UREB Board - University Research Ethics Board</option>
                </select>
              </div>
            </div>

            <div className="sp-field-row sp-field-row--2">
              <div className="sp-field">
                <label htmlFor="sp-prog">Program</label>
                <input id="sp-prog" type="text" value={editedInfo.program}
                  onChange={e => setEditedInfo(p => ({ ...p, program: e.target.value }))}
                  placeholder="e.g. BS Computer Science" />
              </div>
              <div className="sp-field">
                <label htmlFor="sp-fb">Facebook URL</label>
                <input id="sp-fb" type="url" value={editedInfo.facebookLink}
                  onChange={e => setEditedInfo(p => ({ ...p, facebookLink: e.target.value }))}
                  placeholder="https://facebook.com/yourprofile" />
              </div>
            </div>

            <div className="sp-form-actions">
              <button className="sp-btn sp-btn--primary" onClick={handleSave} disabled={saveLoading}>
                {saveLoading ? 'Saving…' : 'Save Changes'}
              </button>
              <button className="sp-btn sp-btn--ghost" onClick={handleCancel} disabled={saveLoading}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Research Co-Members Card ── */}
      <div className="sp-card">
        <div className="sp-card-header">
          <h3 className="sp-card-title">Research Co-Members</h3>
          {!showCoMemberForm && (
            <button className="sp-btn sp-btn--outline sp-btn--sm"
              onClick={() => { setShowCoMemberForm(true); setCoMemberError(''); }}>
              Add Co-Member
            </button>
          )}
        </div>

        {coMemberSuccess && <div className="sp-banner sp-banner--success">{coMemberSuccess}</div>}
        {coMemberError && <div className="sp-banner sp-banner--error">{coMemberError}</div>}

        {showCoMemberForm && (
          <div className="sp-edit-form">
            <div className="sp-field-row sp-field-row--3">
              <div className="sp-field">
                <label>Name</label>
                <input
                  type="text"
                  value={newCoMember.name}
                  onChange={e => setNewCoMember(p => ({ ...p, name: e.target.value }))}
                  placeholder="Full name"
                />
              </div>
              <div className="sp-field">
                <label>Email</label>
                <input
                  type="email"
                  value={newCoMember.email}
                  onChange={e => setNewCoMember(p => ({ ...p, email: e.target.value }))}
                  placeholder="example@gmail.com"
                />
              </div>
              <div className="sp-field">
                <label>Role</label>
                <input
                  type="text"
                  value={newCoMember.role}
                  onChange={e => setNewCoMember(p => ({ ...p, role: e.target.value }))}
                  placeholder="e.g. Research Assistant"
                />
              </div>
            </div>
            <div className="sp-form-actions">
              <button className="sp-btn sp-btn--primary" onClick={handleAddCoMember} disabled={coMemberLoading}>
                Add
              </button>
              <button className="sp-btn sp-btn--ghost"
                onClick={() => { setShowCoMemberForm(false); setNewCoMember({ name: '', email: '', role: '' }); setCoMemberError(''); }}
                disabled={coMemberLoading}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="sp-info-list">
          {coMembers.length === 0 ? (
            <div className="sp-info-row" style={{ justifyContent: 'center', padding: '1.5rem 0' }}>
              <span className="sp-not-set">No co-members added yet</span>
            </div>
          ) : (
            coMembers.map((member, idx) => (
              <div className="sp-info-row" key={member.id || member._id || idx} style={{ alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <span className="sp-info-value" style={{ fontWeight: 600 }}>{member.name}</span>
                  <span className="sp-info-label" style={{ marginLeft: '0.75rem', display: 'inline', minWidth: 'auto' }}>
                    {member.email}
                  </span>
                  {member.role && (
                    <span className="sp-info-label" style={{ marginLeft: '0.75rem', display: 'inline', minWidth: 'auto' }}>
                      — {member.role}
                    </span>
                  )}
                </div>
                <button
                  className="sp-btn sp-btn--ghost sp-btn--sm"
                  onClick={() => handleRemoveCoMember(member.id || member._id, idx)}
                  style={{ color: '#b52b2b' }}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        {(coMembers.length > 0 || (studentData?.coMembers && studentData.coMembers.length > 0)) && (
          <div className="sp-form-actions" style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #f0f4f0' }}>
            <button className="sp-btn sp-btn--primary" onClick={handleSaveCoMembers} disabled={coMemberLoading}>
              {coMemberLoading ? 'Saving…' : 'Save Co-Members'}
            </button>
          </div>
        )}
      </div>

      {/* ── Security Card ── */}
      <div className="sp-card">
        <div className="sp-card-header">
          <h3 className="sp-card-title">Security</h3>
          {!showPasswordForm && (
            <button className="sp-btn sp-btn--outline sp-btn--sm"
              onClick={() => { setShowPasswordForm(true); setPwdError(''); }}>
              Change Password
            </button>
          )}
        </div>

        {pwdSuccess && <div className="sp-banner sp-banner--success">{pwdSuccess}</div>}

        {showPasswordForm ? (
          <div className="sp-edit-form">
            <div className="sp-field-row sp-field-row--3">
              {[
                { key: 'current', label: 'Current Password', ph: 'Current password' },
                { key: 'newPwd', label: 'New Password', ph: 'New password (min. 6 chars)' },
                { key: 'confirm', label: 'Confirm New Password', ph: 'Repeat new password' },
              ].map(({ key, label, ph }) => (
                <div className="sp-field" key={key}>
                  <label>{label}</label>
                  <div className="sp-pwd-wrap">
                    <input
                      type={showPwd[key] ? 'text' : 'password'}
                      value={pwdData[key]}
                      onChange={e => setPwdData(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={ph}
                    />
                    <button
                      type="button"
                      className="sp-pwd-eye"
                      onClick={() => setShowPwd(p => ({ ...p, [key]: !p[key] }))}
                      tabIndex={-1}
                      aria-label={showPwd[key] ? 'Hide password' : 'Show password'}
                    >
                      {showPwd[key] ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                          <path d="M2 2l20 20" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
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
              <button className="sp-btn sp-btn--ghost"
                onClick={() => { setShowPasswordForm(false); setPwdData({ current: '', newPwd: '', confirm: '' }); setPwdError(''); }}
                disabled={pwdLoading}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="sp-security-hint">
            Keep your account secure with a strong, unique password.
          </p>
        )}
      </div>
    </div>
  );
};

function DashboardContent({ userInfo, onTabChange }) {
  const [stats, setStats] = useState({
    totalProposals: 0,
    underReview: 0,
    completedProposals: 0,
    notifications: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [restrictedModalOpen, setRestrictedModalOpen] = useState(false);
  const [restrictedActionType, setRestrictedActionType] = useState('edit');
  const [dueReminders, setDueReminders] = useState([]);
  const [editProposalModalOpen, setEditProposalModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [editSuccessModalOpen, setEditSuccessModalOpen] = useState(false);
  const [openFilesDropdownId, setOpenFilesDropdownId] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userInfo?.email) return;

      try {
        // Fetch real data from APIs
        const [proposalsResponse, reviewsResponse, notificationsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/proposals/student/${encodeURIComponent(userInfo.email)}`),
          fetch(`${API_BASE_URL}/reviews/student/${encodeURIComponent(userInfo.email)}`),
          fetch(`${API_BASE_URL}/messages/${encodeURIComponent(userInfo.email)}`)
        ]);

        // Check responses are OK before parsing
        if (!proposalsResponse.ok || !reviewsResponse.ok || !notificationsResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const proposalsData = await proposalsResponse.json();
        const reviewsData = await reviewsResponse.json();
        const notificationsData = await notificationsResponse.json();

        const deletedIds = getDeletedProposalIds();
        const activeProposals = proposalsData.filter(p => !deletedIds.includes(String(p._id)));
        const originalProposals = activeProposals.filter(p => !p.isResubmissionProposal && p.submissionType !== 'resubmission');

        // Calculate actual stats
        const underReviewCount = originalProposals.filter(proposal => {
          const s = (proposal.status || '').toLowerCase().trim();
          return s === 'under review';
        }).length;
        const completedProposals = originalProposals.filter(proposal => (proposal.status || '').toLowerCase() === 'completed').length;
        const notificationsCount = notificationsData.filter(msg => msg.type === 'admin_to_student').length;

        setStats({
          totalProposals: originalProposals.length,
          underReview: underReviewCount,
          completedProposals: completedProposals,
          notifications: notificationsCount
        });

        setProposals(activeProposals);
        setRecentActivity([]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set default values on error
        setStats({
          totalProposals: 0,
          underReview: 0,
          completedProposals: 0,
          notifications: 0
        });
        setRecentActivity([]);
        setProposals([]);
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Calculate due reminders for student proposals
    const checkDueReminders = async () => {
      if (!userInfo?.email) return;
      try {
        const response = await fetch(`${API_BASE_URL}/proposals/student/${encodeURIComponent(userInfo.email)}`);
        if (response.ok) {
          const proposals = await response.json();
          const reminders = [];

          proposals.forEach(proposal => {
            const status = (proposal.status || 'Pending').toLowerCase();
            if (status !== 'approved' && status !== 'completed') {
              const submittedDate = new Date(proposal.createdAt || proposal.uploadDate || Date.now());
              const deadlineDate = new Date(submittedDate);
              deadlineDate.setFullYear(deadlineDate.getFullYear() + 1);

              const today = new Date();
              const diffTime = deadlineDate - today;
              const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              // Show warning if expiring within 14 days
              if (daysRemaining <= 14 && daysRemaining > 0) {
                reminders.push({
                  id: proposal._id,
                  title: proposal.researchTitle,
                  daysRemaining,
                  type: 'warning'
                });
              } else if (daysRemaining <= 0) {
                reminders.push({
                  id: proposal._id,
                  title: proposal.researchTitle,
                  daysRemaining,
                  type: 'danger'
                });
              }
            }
          });
          setDueReminders(reminders);
        }
      } catch (err) {
        console.error("Error fetching reminders:", err);
      }
    };
    checkDueReminders();
  }, [userInfo]);

  const confirmDeleteProposal = () => {
    const idToDelete = deleteTargetId;
    // Optimistic: update UI and persist deletion immediately
    saveDeletedProposalId(idToDelete);
    setProposals(prev => prev.filter(p => p._id !== idToDelete));
    setStats(prev => ({ ...prev, totalProposals: Math.max(0, prev.totalProposals - 1) }));
    setDeleteTargetId(null);
    setDeleteModalOpen(false);
    // Try server in background
    fetch(`${API_BASE_URL}/proposals/${idToDelete}`, { method: 'DELETE' })
      .catch(err => console.error('Background proposal delete failed:', err));
  };

  const displayedProposals = useMemo(() => {
    return proposals.filter(p => !p.isResubmissionProposal);
  }, [proposals]);

  if (loading) {
    return (
      <div className="content-section">
        <h2>Dashboard</h2>
        <div className="loading-state">Loading dashboard...</div>
      </div>
    );
  }
  // Date Reminders Here
  return (
    <div className="dashboard-content">
      {/* Due Date Reminders Section */}
      {dueReminders.length > 0 && (
        <div className="due-reminders-section">
          <div className="reminders-header">
            <span className="reminder-icon">⚠️</span>
            <div className="reminder-text-group">
              <h3 className="reminder-title">Expiration Reminders</h3>
              <p className="reminder-subtitle">The following proposals are approaching or have exceeded their 1-year validity limit.</p>
            </div>
          </div>
          <div className="reminders-list">
            {dueReminders.map((reminder) => (
              <div key={reminder.id} className={`reminder-item ${reminder.type}`}>
                <div className="reminder-item-left">
                  <div className="reminder-dot"></div>
                  <span className="reminder-proposal-title">{reminder.title || 'Untitled Proposal'}</span>
                </div>
                <div className="reminder-status-pill">
                  {reminder.daysRemaining <= 0 ? (
                    <span className="status-danger">EXPIRED</span>
                  ) : (
                    <span className="status-warning">Expires in {reminder.daysRemaining} day{reminder.daysRemaining !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <FilePlusIcon />
          </div>
          <div className="stat-info">
            <h3>{stats.totalProposals}</h3>
            <p>Total Proposals</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <HistoryIcon />
          </div>
          <div className="stat-info">
            <h3>{stats.underReview}</h3>
            <p>Under Review</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon completed">
            <DashboardIcon />
          </div>
          <div className="stat-info">
            <h3>{stats.completedProposals}</h3>
            <p>Completed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon notifications">
            <BellIcon />
          </div>
          <div className="stat-info">
            <h3>{stats.notifications}</h3>
            <p>Notifications</p>
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '0.9rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e40af', fontWeight: '600' }}>
            Important Proposal Guidelines &amp; Notes:
          </p>
        </div>
        <div style={{ marginLeft: '1.6rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#1e40af', lineHeight: '1.4' }}>
            • <strong>Editing Note:</strong> You can edit your proposal details or replace files as long as <strong>no reviewer has been assigned</strong>. Once assigned, editing is restricted.
          </p>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#1e40af', lineHeight: '1.4' }}>
            • <strong>Deletion Note:</strong> You can delete a submitted proposal before a reviewer is assigned. Once assigned, deletion is disabled as the proposal is under active review.
          </p>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="up-section">
          <div className="up-header">
            <div>
              <h2 className="up-title">Uploaded Proposals</h2>
              <p className="up-subtitle">Track all your submitted research proposals</p>
            </div>
            {displayedProposals.length > 0 && (
              <span className="up-count">{displayedProposals.length} proposal{displayedProposals.length !== 1 ? 's' : ''}</span>
            )}
          </div>



          {proposals.length === 0 ? (
            <div className="up-empty">
              <div className="up-empty-icon"><FilePlusIcon /></div>
              <h3>No proposals submitted yet</h3>
              <p>Your submitted research proposals will appear here once uploaded.</p>
              <button className="up-cta-btn" onClick={() => onTabChange('add-files')}>
                Submit Your First Proposal
              </button>
            </div>
          ) : displayedProposals.length === 0 ? (
            <div className="up-empty" style={{ padding: '2rem' }}>
              <p>No proposals uploaded yet.</p>
            </div>
          ) : (
            <div className="up-list">
              {displayedProposals.map((proposal) => {
                const rawStatus = proposal.status || 'Pending';
                const displayStatus = rawStatus.replace(/Pending Preliminary Reviewer/gi, 'Pending Reviewer');
                const status = displayStatus.toLowerCase();
                const statusClass = status.replace(/\s+/g, '-');
                const studentFiles = proposal.studentFiles || proposal.files || {};
                const fileCount = Object.values(studentFiles).filter((f) => f?.filename).length;
                const submittedDate = new Date(proposal.createdAt || proposal.uploadDate || Date.now());
                return (
                  <div key={proposal._id} className={`up-card up-card--${statusClass}`}>
                    <div className="up-card-accent" />
                    <div className="up-card-body">
                      <div className="up-card-top">
                        <div className="up-card-title-group">
                          <h3 className="up-card-title">{proposal.researchTitle || 'Untitled Proposal'}</h3>
                          <span className="up-card-id">#{proposal._id?.slice(-8) || 'N/A'}</span>
                        </div>
                        <div className="up-card-top-right" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <span className={`up-status up-status--${statusClass}`}>
                            {displayStatus}
                          </span>

                          <button
                            type="button"
                            className="up-action-btn up-action-btn--edit"
                            onClick={() => {
                              const hasReviewer = Boolean(proposal.preliminaryReviewer || proposal.preliminaryReviewerName);
                              const s = (proposal.status || 'Pending').toLowerCase();
                              if (hasReviewer || s === 'under review' || s === 'submitted to admin' || s === 'review submitted') {
                                setRestrictedActionType('edit');
                                setRestrictedModalOpen(true);
                              } else {
                                setSelectedProposal(proposal);
                                setEditProposalModalOpen(true);
                              }
                            }}
                            title="Edit proposal"
                          >
                            <EditIcon /> Edit Proposal
                          </button>
                          <button
                            type="button"
                            className="up-action-btn up-action-btn--delete"
                            onClick={() => { 
                              const hasReviewer = Boolean(proposal.preliminaryReviewer || proposal.preliminaryReviewerName);
                              const s = (proposal.status || 'Pending').toLowerCase();
                              if (hasReviewer || s === 'under review' || s === 'submitted to admin' || s === 'review submitted') {
                                setRestrictedActionType('delete');
                                setRestrictedModalOpen(true);
                              } else {
                                setDeleteTargetId(proposal._id); 
                                setDeleteModalOpen(true); 
                              }
                            }}
                            title="Delete proposal"
                          >
                            <TrashIcon /> Delete Proposal
                          </button>
                        </div>
                      </div>

                      <div className="up-card-meta">
                        <div className="up-meta-item">
                          <span className="up-meta-label">Department</span>
                          <span className="up-meta-value up-dept">{proposal.department || 'N/A'}</span>
                        </div>
                        <div className="up-meta-item">
                          <span className="up-meta-label">Reviewer</span>
                          <span className="up-meta-value" style={{ fontWeight: '600', color: (proposal.preliminaryReviewer || proposal.preliminaryReviewerName) ? '#16a34a' : '#64748b' }}>
                            {(proposal.preliminaryReviewer || proposal.preliminaryReviewerName) ? 'Assigned' : 'Not assigned'}
                          </span>
                        </div>
                        <div className="up-meta-item">
                          <span className="up-meta-label">Submitted</span>
                          <span className="up-meta-value">
                            {submittedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="up-meta-item">
                          <span className="up-meta-label">Time</span>
                          <span className="up-meta-value">
                            {submittedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="up-card-footer">
                        {fileCount > 0 ? (
                          <div className="up-files-dropdown-wrap">
                            <button
                              className="up-view-files-btn"
                              onClick={() => setOpenFilesDropdownId(
                                openFilesDropdownId === proposal._id ? null : proposal._id
                              )}
                            >
                              <FileIcon />
                              View Files ({fileCount})
                              <svg
                                className={`up-chevron ${openFilesDropdownId === proposal._id ? 'up-chevron--open' : ''}`}
                                width="14" height="14" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </button>
                            {openFilesDropdownId === proposal._id && (
                              <div className="up-files-dropdown">
                                {Object.entries(studentFiles).map(([key, fileData]) => {
                                  if (!fileData) return null;
                                  // Server stores: { filename: 'fieldname-timestamp-rand.ext', originalname: 'user-name.pdf', ... }
                                  const originalName = fileData.originalname || fileData.name || fileData.fileName || key;
                                  const serverFilename = fileData.filename || null;
                                  const hasFile = !!serverFilename;

                                  const handleView = () => {
                                    if (serverFilename) viewFile(serverFilename);
                                  };

                                  const handleDownload = async () => {
                                    if (!serverFilename) return;
                                    const result = await downloadReviewerFile(serverFilename, originalName);
                                    if (!result.success) {
                                      alert(`Could not download "${originalName}".\nPlease try again or contact the administrator.`);
                                    }
                                  };

                                  return (
                                    <div key={key} className="up-files-dropdown-item">
                                      {/* File icon */}
                                      <svg className="up-fdi-fileicon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                      </svg>

                                      {/* File name */}
                                      <span className="up-files-dropdown-name" title={originalName}>{originalName}</span>

                                      {/* Action buttons */}
                                      <div className="up-fdi-actions">
                                        {hasFile ? (
                                          <>
                                            {/* View button — opens in browser/Office viewer */}
                                            <button
                                              className="up-fdi-btn up-fdi-btn--view"
                                              onClick={handleView}
                                              title="View file"
                                            >
                                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                              </svg>
                                              View
                                            </button>

                                            {/* Download button — triggers file download */}
                                            <button
                                              className="up-fdi-btn up-fdi-btn--download"
                                              onClick={handleDownload}
                                              title="Download file"
                                            >
                                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                              </svg>
                                              Download
                                            </button>
                                          </>
                                        ) : (
                                          <span className="up-files-dropdown-nolink">No file</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="up-files-chip">
                            <FileIcon /> No files
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {deleteModalOpen && (
        <div className="mini-modal-overlay" onClick={() => { setDeleteModalOpen(false); setDeleteTargetId(null); }}>
          <div className="mini-modal" onClick={e => e.stopPropagation()}>
            <div className="mini-modal-icon mini-modal-icon--danger"><TrashIcon /></div>
            <h4 className="mini-modal-title">Delete Proposal?</h4>
            <p className="mini-modal-text">This proposal will be permanently removed and cannot be undone.</p>
            <div className="mini-modal-actions">
              <button className="mini-modal-btn mini-modal-btn--ghost" onClick={() => { setDeleteModalOpen(false); setDeleteTargetId(null); }}>Cancel</button>
              <button className="mini-modal-btn mini-modal-btn--danger" onClick={confirmDeleteProposal}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Restricted Action Modal */}
      {restrictedModalOpen && (
        <div className="mini-modal-overlay" onClick={() => setRestrictedModalOpen(false)}>
          <div className="mini-modal" onClick={e => e.stopPropagation()}>
            <div className="mini-modal-icon" style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h4 className="mini-modal-title">
              {restrictedActionType === 'delete' ? 'Delete Proposal Restricted' : 'Edit Proposal Restricted'}
            </h4>
            <p className="mini-modal-text">
              {restrictedActionType === 'delete'
                ? 'You cannot delete this proposal because a reviewer has already been assigned and it is currently under review.'
                : 'You cannot edit this proposal because a reviewer has already been assigned and it is currently under review.'}
            </p>
            <div className="mini-modal-actions">
              <button 
                className="mini-modal-btn" 
                style={{ backgroundColor: '#ea580c', color: '#fff', width: '100%' }} 
                onClick={() => setRestrictedModalOpen(false)}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {editProposalModalOpen && (
        <EditProposalModal
          proposal={selectedProposal}
          onClose={() => { setEditProposalModalOpen(false); setSelectedProposal(null); }}
          onSuccess={(updatedProposal) => {
            setProposals(prev => prev.map(p => p._id === updatedProposal._id ? updatedProposal : p));
            setEditProposalModalOpen(false);
            setSelectedProposal(null);
            setEditSuccessModalOpen(true);
          }}
        />
      )}

      {editSuccessModalOpen && (
        <div className="mini-modal-overlay" onClick={() => setEditSuccessModalOpen(false)}>
          <div className="mini-modal" onClick={e => e.stopPropagation()}>
            <div className="mini-modal-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <CheckIcon />
            </div>
            <h4 className="mini-modal-title">Success</h4>
            <p className="mini-modal-text">Your proposal has been updated successfully.</p>
            <div className="mini-modal-actions">
              <button 
                className="mini-modal-btn" 
                style={{ backgroundColor: '#16a34a', color: '#fff', width: '100%' }} 
                onClick={() => setEditSuccessModalOpen(false)}
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function NotificationsContent({ userInfo }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotificationsData = useCallback(async () => {
    if (!userInfo?.email) return;
    try {
      const email = userInfo.email;
      const [proposalsRes, notifsRes, hiddenRes] = await Promise.all([
        fetch(`${API_BASE_URL}/proposals/student/${encodeURIComponent(email)}`).catch(() => null),
        fetch(`${API_BASE_URL}/notifications/${encodeURIComponent(email)}`).catch(() => null),
        fetch(`${API_BASE_URL}/user-hidden-items/${encodeURIComponent(email)}`).catch(() => null)
      ]);

      let dbHiddenIds = [];
      if (hiddenRes && hiddenRes.ok) {
        try {
          const hiddenData = await hiddenRes.json();
          if (hiddenData && Array.isArray(hiddenData.hiddenIds)) {
            dbHiddenIds = hiddenData.hiddenIds.map(String);
          }
        } catch {}
      }

      const localHiddenNotifIds = getHiddenNotifIds();
      const hiddenIds = Array.from(new Set([...localHiddenNotifIds, ...dbHiddenIds]));

      const allNotifs = [];

      // 1. Database notifications
      if (notifsRes && notifsRes.ok) {
        const dbNotifs = await notifsRes.json();
        if (Array.isArray(dbNotifs)) {
          dbNotifs.forEach(n => {
            const idStr = String(n._id);
            if (!hiddenIds.includes(idStr)) {
              allNotifs.push({
                id: idStr,
                dbId: n._id,
                isDbNotif: true,
                type: n.type || 'info',
                title: n.title || 'Notification',
                message: n.message || n.content || '',
                time: n.createdAt ? new Date(n.createdAt).toLocaleDateString() + ' ' + new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
                read: Boolean(n.read)
              });
            }
          });
        }
      }

      // 2. Proposal Expiration Warnings
      if (proposalsRes && proposalsRes.ok) {
        const proposals = await proposalsRes.json();
        if (Array.isArray(proposals)) {
          proposals.forEach((proposal) => {
            const status = (proposal.status || 'Pending').toLowerCase();
            if (status !== 'approved') {
              const submittedDate = new Date(proposal.createdAt || proposal.uploadDate || Date.now());
              const deadlineDate = new Date(submittedDate);
              deadlineDate.setFullYear(deadlineDate.getFullYear() + 1);
              const today = new Date();
              const daysRemaining = Math.ceil((deadlineDate - today) / (1000 * 3600 * 24));
              const expId = `exp-${proposal._id}`;

              if (!hiddenIds.includes(expId)) {
                if (daysRemaining <= 14 && daysRemaining > 0) {
                  allNotifs.push({
                    id: expId,
                    type: 'warning',
                    title: 'Requirement Expiration Warning',
                    message: `Your proposal "${proposal.researchTitle || 'Untitled'}" is expiring in ${daysRemaining} day(s) (1-year limit).`,
                    time: new Date().toLocaleDateString(),
                    read: false
                  });
                } else if (daysRemaining <= 0) {
                  allNotifs.push({
                    id: expId,
                    type: 'warning',
                    title: 'Requirement Expired',
                    message: `Your proposal "${proposal.researchTitle || 'Untitled'}" has exceeded the 1-year validity period.`,
                    time: new Date().toLocaleDateString(),
                    read: false
                  });
                }
              }
            }
          });
        }
      }

      setNotifications(allNotifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  useEffect(() => {
    fetchNotificationsData();
  }, [fetchNotificationsData]);

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const handleDeleteNotification = async (id, dbId, isMessage, isDbNotif) => {
    // 1. Optimistic UI delete & local backup
    saveHiddenNotifId(id);
    if (dbId) saveHiddenNotifId(dbId);
    setNotifications(prev => prev.filter(n => String(n.id) !== String(id)));

    // 2. Realtime Database Deletion
    try {
      if (isDbNotif && dbId) {
        fetch(`${API_BASE_URL}/notifications/${dbId}/delete`, { method: 'POST' }).catch(() => null);
        fetch(`${API_BASE_URL}/notifications/${dbId}`, { method: 'DELETE' }).catch(() => null);
      } else if (isMessage && dbId) {
        fetch(`${API_BASE_URL}/messages/${dbId}`, { method: 'DELETE' }).catch(() => null);
      }

      if (userInfo?.email) {
        fetch(`${API_BASE_URL}/user-hidden-items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userInfo.email, itemId: String(id), itemType: 'notification' })
        }).catch(() => null);
        if (dbId) {
          fetch(`${API_BASE_URL}/user-hidden-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userInfo.email, itemId: String(dbId), itemType: 'notification' })
          }).catch(() => null);
        }
      }
    } catch (err) {
      console.error('Realtime DB notification deletion failed:', err);
    }
  };

  const handleDeleteAllNotifications = async () => {
    const notifsToDelete = [...notifications];
    notifsToDelete.forEach(n => {
      saveHiddenNotifId(n.id);
      if (n.dbId) saveHiddenNotifId(n.dbId);
    });
    setNotifications([]);

    try {
      for (const n of notifsToDelete) {
        if (n.isDbNotif && n.dbId) {
          fetch(`${API_BASE_URL}/notifications/${n.dbId}/delete`, { method: 'POST' }).catch(() => null);
          fetch(`${API_BASE_URL}/notifications/${n.dbId}`, { method: 'DELETE' }).catch(() => null);
        } else if (n.isMessage && n.dbId) {
          fetch(`${API_BASE_URL}/messages/${n.dbId}`, { method: 'DELETE' }).catch(() => null);
        }
      }

      if (userInfo?.email && notifsToDelete.length > 0) {
        const itemIds = notifsToDelete.map(n => String(n.id));
        fetch(`${API_BASE_URL}/user-hidden-items/clear-all`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userInfo.email, itemIds, itemType: 'notification' })
        }).catch(() => null);
      }
    } catch (err) {
      console.error('Realtime DB clear all notifications failed:', err);
    }
  };

  return (
    <div className="content-section">
      <div className="sm-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Notifications</h2>
        </div>
        {notifications.length > 0 && (
          <button
            className="hist-delete-all-btn"
            title="Delete all notifications"
            onClick={handleDeleteAllNotifications}
          >
            <TrashIcon />
            <span>Delete All</span>
          </button>
        )}
      </div>
      <div className="notifications-list">
        {loading ? (
          <div className="loading-state">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="loading-state">No notifications</div>
        ) : (
          notifications.map((notification) => (
            <div className={`notification-item ${!notification.read ? 'unread' : ''} ${notification.type}`} key={notification.id}>
              <div className="notification-icon">
                {notification.type === 'success' && <span>✓</span>}
                {notification.type === 'warning' && <span>!</span>}
                {notification.type === 'info' && <span>i</span>}
              </div>
              <div className="notification-content">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <span className="notification-time">{notification.time}</span>
              </div>
              <div className="notification-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {!notification.read && (
                  <button
                    className="btn-secondary"
                    onClick={() => markAsRead(notification.id)}
                  >
                    Mark as Read
                  </button>
                )}
                <button
                  className="hist-item-delete-btn"
                  title="Delete notification"
                  onClick={() => handleDeleteNotification(notification.id, notification.dbId, notification.isMessage, notification.isDbNotif)}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const INTERNAL_ADD_FILES_FIELDS = [
  'proposal', 'approvalSheet', 'urebForm2', 'applicationForm6',
  'accomplishedForm8', 'accomplishedForm10A', 'instrumentTool', 'ethicsReviewFee',
];

const EXTERNAL_ADD_FILES_FIELDS = [
  'sampleForm1', 'sampleForm2',
];

const ALL_ADD_FILES_FILE_FIELDS = [
  ...INTERNAL_ADD_FILES_FIELDS,
  ...EXTERNAL_ADD_FILES_FIELDS,
];

const EMPTY_ADD_FILES_FORM = {
  proposal: null,
  approvalSheet: null,
  urebForm2: null,
  applicationForm6: null,
  accomplishedForm8: null,
  accomplishedForm10A: null,
  instrumentTool: null,
  ethicsReviewFee: null,
  sampleForm1: null,
  sampleForm2: null,
  proposalTitle: '',
};

function ViewFilesModal({ proposal, onClose }) {
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(null);

  if (!proposal) return null;

  const history = Array.isArray(proposal.resubmissionHistory) ? proposal.resubmissionHistory : [];
  
  const activeFilesObj = (selectedVersionIndex !== null && history[selectedVersionIndex]?.files)
    ? history[selectedVersionIndex].files
    : (proposal.studentFiles || proposal.files || {});

  const fileKeys = Object.keys(activeFilesObj).filter((key) => activeFilesObj[key]?.filename || activeFilesObj[key]?.originalname);

  const handleDownload = (key, file) => {
    const downloadUrl = file.filename
      ? `${API_BASE_URL}/download/${file.filename}?name=${encodeURIComponent(file.originalname || file.filename)}`
      : '#';
    window.location.href = downloadUrl;
  };

  return (
    <div className="mini-modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="mini-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px', width: '90%' }}>
        <div className="mini-modal-icon" style={{ backgroundColor: '#f0f9ff', color: '#0ea5e9' }}>
          <EyeIcon />
        </div>
        <h4 className="mini-modal-title">Attached Files & Resubmissions</h4>
        <p className="mini-modal-text">{proposal.researchTitle || 'Untitled Proposal'}</p>

        {history.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', margin: '0.75rem 0', justifyContent: 'center' }}>
            <button
              onClick={() => setSelectedVersionIndex(null)}
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: selectedVersionIndex === null ? '#2563eb' : '#f8fafc',
                color: selectedVersionIndex === null ? '#ffffff' : '#475569'
              }}
            >
              Latest Version
            </button>
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => setSelectedVersionIndex(i)}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: selectedVersionIndex === i ? '#7c3aed' : '#f8fafc',
                  color: selectedVersionIndex === i ? '#ffffff' : '#475569'
                }}
              >
                {h.label || `Resubmission ${h.resubmissionNumber || i}`}
              </button>
            ))}
          </div>
        )}
        
        <div style={{ marginTop: '1rem', textAlign: 'left', maxHeight: '300px', overflowY: 'auto' }}>
          {fileKeys.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b' }}>No files attached in this version.</p>
          ) : (
            fileKeys.map(key => {
              const file = activeFilesObj[key];
              return (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <FileIcon />
                    <span style={{ fontSize: '0.875rem', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '260px' }}>
                      {file.originalname || file.filename}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDownload(key, file)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: '0.875rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <DownloadIcon /> Download
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="mini-modal-actions" style={{ marginTop: '1.5rem' }}>
          <button className="mini-modal-btn mini-modal-btn--ghost" onClick={onClose} style={{ width: '100%' }}>Close</button>
        </div>
      </div>
    </div>
  );
};

function NoFileModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="mini-modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="mini-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', padding: '1.75rem', borderRadius: '12px', textAlign: 'center', backgroundColor: '#ffffff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#fef3c7',
          color: '#d97706',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem auto',
          boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.15)'
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#1e293b', fontWeight: '700' }}>
          File Required for Resubmission
        </h3>
        <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}>
          Please upload at least one updated file for resubmission.
        </p>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '0.7rem',
            borderRadius: '8px',
            backgroundColor: '#7c3aed',
            color: '#ffffff',
            border: 'none',
            fontWeight: '600',
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.25)',
            transition: 'all 0.15s ease'
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function EditProposalModal({ proposal, onClose, onSuccess }) {
  const nextResubNumber = (proposal?.resubmissionCount || 0) + 1;
  const targetLabel = `Resubmission ${nextResubNumber}`;

  const [formData, setFormData] = useState({
    proposalTitle: proposal?.researchTitle || '',
    resubmissionReason: ''
  });
  const [uploading, setUploading] = useState(false);
  const [noFileModalOpen, setNoFileModalOpen] = useState(false);

  if (!proposal) return null;

  const handleFileChange = (fieldName, file) => {
    setFormData(prev => ({ ...prev, [fieldName]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasFiles = ALL_ADD_FILES_FILE_FIELDS.some((field) => formData[field] instanceof File);
    if (!hasFiles) {
      setNoFileModalOpen(true);
      return;
    }
    setUploading(true);

    try {
      const savedUser = localStorage.getItem('ureb_user');
      const user = savedUser ? JSON.parse(savedUser) : null;

      const submitData = new FormData();
      submitData.append('proposalTitle', formData.proposalTitle);
      submitData.append('studentEmail', user?.email || '');
      submitData.append('resubmissionReason', formData.resubmissionReason || '');

      ALL_ADD_FILES_FILE_FIELDS.forEach((field) => {
        if (formData[field] instanceof File) {
          submitData.append(field, formData[field]);
        }
      });

      const response = await fetch(`${API_BASE_URL}/student/proposals/${proposal._id}`, {
        method: 'PUT',
        body: submitData
      });

      const result = await response.json();
      if (result.success) {
        onSuccess(result.proposal);
      } else {
        alert('Error updating proposal: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating proposal:', error);
      alert('Error updating proposal. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const renderFileInput = (fieldName, label) => {
    const existingFile = proposal.files?.[fieldName] || proposal.studentFiles?.[fieldName];
    const newFile = formData[fieldName];
    
    return (
      <div className="form-group" key={fieldName} style={{ marginBottom: '1rem', textAlign: 'left' }}>
        <label htmlFor={`edit-${fieldName}`} style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#334155' }}>{label}</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {existingFile && !newFile && (
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Current: {existingFile.originalname || existingFile.filename}
            </div>
          )}
          <input
            type="file"
            id={`edit-${fieldName}`}
            onChange={(e) => handleFileChange(fieldName, e.target.files[0])}
            accept=".pdf,.doc,.docx,.txt"
            style={{ fontSize: '0.875rem' }}
          />
        </div>
      </div>
    );
  };

  const isExternalProposal = Boolean(
    proposal.files?.sampleForm1 || proposal.files?.sampleForm2 ||
    proposal.studentFiles?.sampleForm1 || proposal.studentFiles?.sampleForm2
  );

  return (
    <div className="mini-modal-overlay" onClick={onClose} style={{ zIndex: 1000, overflowY: 'auto', padding: '2rem 0' }}>
      <div className="mini-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', margin: 'auto' }}>
        <div className="mini-modal-icon" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
          <UploadIcon />
        </div>
        <h4 className="mini-modal-title">Edit Proposal</h4>
        <p className="mini-modal-text">Update your proposal title or replace uploaded files as needed.</p>
        
        <form onSubmit={handleSubmit} style={{ marginTop: '1.25rem', width: '100%' }}>
          <div className="form-group" style={{ marginBottom: '1rem', textAlign: 'left' }}>
            <label htmlFor="edit-proposalTitle" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#334155' }}>Proposal Title</label>
            <input
              type="text"
              id="edit-proposalTitle"
              value={formData.proposalTitle}
              onChange={(e) => setFormData(p => ({ ...p, proposalTitle: e.target.value }))}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
            />
          </div>

          <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: '#f8fafc' }}>
            {isExternalProposal ? (
              <>
                {renderFileInput('sampleForm1', 'Sample form 1')}
                {renderFileInput('sampleForm2', 'Sample form 2')}
              </>
            ) : (
              <>
                {renderFileInput('proposal', 'Proposal')}
                {renderFileInput('approvalSheet', 'Approval Sheet')}
                {renderFileInput('urebForm2', 'UREB Form 2')}
                {renderFileInput('applicationForm6', 'Application for Research Ethics Review Form 6')}
                {renderFileInput('accomplishedForm8', 'Accomplished Form 8')}
                {renderFileInput('accomplishedForm10A', 'Accomplish Form 10 A')}
                {renderFileInput('instrumentTool', 'Copy of instrument/tool')}
                {renderFileInput('ethicsReviewFee', 'Ethics Review Fee (Receipt)')}
              </>
            )}
          </div>

          <div className="mini-modal-actions" style={{ marginTop: '1.5rem', gap: '0.5rem' }}>
            <button type="button" className="mini-modal-btn mini-modal-btn--ghost" onClick={onClose} disabled={uploading}>Cancel</button>
            <button type="submit" className="mini-modal-btn" style={{ backgroundColor: '#2563eb', color: '#fff' }} disabled={uploading}>
              {uploading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      <NoFileModal isOpen={noFileModalOpen} onClose={() => setNoFileModalOpen(false)} />
    </div>
  );
};

function AddFilesContent({ setSubmittedFiles, setShowSuccessModal, userInfo, studentData }) {
  const [formData, setFormData] = useState(EMPTY_ADD_FILES_FORM);
  const [uploading, setUploading] = useState(false);

  const currentResearcherType = studentData?.researcherType || userInfo?.researcherType || '';
  const isExternalResearcher = currentResearcherType === 'External Researcher';
  const activeFields = isExternalResearcher ? EXTERNAL_ADD_FILES_FIELDS : INTERNAL_ADD_FILES_FIELDS;

  const handleFileChange = (fieldName, file) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: file
    }));
  };

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasFiles = activeFields.some((field) => formData[field] instanceof File);
    if (!hasFiles) {
      alert('Please upload at least one file');
      return;
    }

    setUploading(true);
    try {
      const savedUser = localStorage.getItem('ureb_user');
      const user = savedUser ? JSON.parse(savedUser) : null;

      const submitData = new FormData();
      activeFields.forEach((field) => {
        if (formData[field] instanceof File) {
          submitData.append(field, formData[field]);
        }
      });

      submitData.append('proposalTitle', formData.proposalTitle);
      submitData.append('studentEmail', user?.email || '');
      submitData.append('studentName', user?.name || '');

      const response = await fetch(`${API_BASE_URL}/student/submit-files`, {
        method: 'POST',
        body: submitData
      });

      const result = await response.json();

      if (result.success) {
        const submittedFilesList = activeFields.filter((field) => formData[field] instanceof File)
          .map(field => ({
            name: formData[field].name,
            size: (formData[field].size / 1024).toFixed(1) + ' KB'
          }));

        setSubmittedFiles(submittedFilesList);
        setShowSuccessModal(true);

        setFormData({ ...EMPTY_ADD_FILES_FORM });
      } else {
        alert('Error uploading files: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting files:', error);
      alert('Error uploading files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const renderFileInput = (fieldName, label, description) => (
    <div className="form-group" key={fieldName}>
      <label htmlFor={fieldName}>{label}</label>
      {description && <p className="field-description">{description}</p>}
      <div className="file-upload-area">
        <input
          type="file"
          id={fieldName}
          onChange={(e) => handleFileChange(fieldName, e.target.files[0])}
          accept=".pdf,.doc,.docx,.txt"
        />
        <div className="file-upload-label">
          <UploadIcon />
          <p>{formData[fieldName] ? formData[fieldName].name : 'Click to upload file'}</p>
          <span>PDF, DOC, DOCX, TXT (MAX. 10MB)</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="content-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Add Files</h2>
      </div>
      <form className="add-files-form" onSubmit={handleSubmit}>

        <div className="form-group">
          <label htmlFor="proposalTitle">Proposal Title</label>
          <input
            type="text"
            id="proposalTitle"
            value={formData.proposalTitle}
            onChange={(e) => handleInputChange('proposalTitle', e.target.value)}
            placeholder="Enter your proposal title"
            required
          />
        </div>

        {isExternalResearcher ? (
          <>
            {renderFileInput('sampleForm1', 'Sample form 1')}
            {renderFileInput('sampleForm2', 'Sample form 2')}
          </>
        ) : (
          <>
            {renderFileInput('proposal', 'Proposal')}
            {renderFileInput('approvalSheet', 'Approval Sheet')}
            {renderFileInput('urebForm2', 'UREB Form 2')}
            {renderFileInput('applicationForm6', 'Application for Research Ethics Review Form 6')}
            {renderFileInput('accomplishedForm8', 'Accomplished Form 8', 'See attached form and accomplish only applicable pages')}
            {renderFileInput('accomplishedForm10A', 'Accomplish Form 10 A', 'See attached form')}
            {renderFileInput('instrumentTool', 'Copy of instrument/tool', 'e.g. questionnaire that will be administered to participants, if study entails human participants. Provide a link if instrument is administered online')}
            {renderFileInput('ethicsReviewFee', 'Ethics Review Fee (Receipt)')}
          </>
        )}

        <p className="field-description" style={{ marginTop: '0.5rem' }}>
          A reviewer will be assigned by the administrator after you submit your files.
        </p>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Submit Files'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setFormData({ ...EMPTY_ADD_FILES_FORM })}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

function ResubmissionContent({ userInfo, studentData, setSubmittedFiles, setShowSuccessModal }) {
  const [proposals, setProposals] = useState([]);
  const [selectedProposalId, setSelectedProposalId] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(EMPTY_ADD_FILES_FORM);
  const [resubmissionReason, setResubmissionReason] = useState('');
  const [uploading, setUploading] = useState(false);
  const [noFileModalOpen, setNoFileModalOpen] = useState(false);

  const currentResearcherType = studentData?.researcherType || userInfo?.researcherType || '';
  const isExternalResearcher = currentResearcherType === 'External Researcher';
  const activeFields = isExternalResearcher ? EXTERNAL_ADD_FILES_FIELDS : INTERNAL_ADD_FILES_FIELDS;

  useEffect(() => {
    const fetchStudentProposals = async () => {
      if (!userInfo?.email) return;
      try {
        const response = await fetch(`${API_BASE_URL}/proposals/student/${encodeURIComponent(userInfo.email)}`);
        if (response.ok) {
          const data = await response.json();
          const deletedIds = getDeletedProposalIds();
          const active = data.filter(p => !deletedIds.includes(String(p._id)));
          setProposals(active);
          if (active.length > 0) {
            setSelectedProposalId(active[0]._id);
            setFormData(prev => ({
              ...prev,
              proposalTitle: active[0].researchTitle || ''
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching proposals for resubmission:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentProposals();
  }, [userInfo?.email]);

  const selectedProposal = proposals.find(p => String(p._id) === String(selectedProposalId)) || null;
  const nextResubNumber = selectedProposal ? (selectedProposal.resubmissionCount || 0) + 1 : 1;
  const nextResubLabel = `Resubmission ${nextResubNumber}`;

  const unifiedHistory = useMemo(() => {
    if (!selectedProposal) return [];
    const history = Array.isArray(selectedProposal.resubmissionHistory)
      ? selectedProposal.resubmissionHistory
      : [];

    return history.filter(h => h && h.resubmissionNumber > 0 && h.label !== 'Original Submission');
  }, [selectedProposal]);

  const handleProposalChange = (proposalId) => {
    setSelectedProposalId(proposalId);
    const target = proposals.find(p => String(p._id) === String(proposalId));
    setFormData({
      ...EMPTY_ADD_FILES_FORM,
      proposalTitle: target ? (target.researchTitle || '') : ''
    });
    setResubmissionReason('');
  };

  const handleFileChange = (fieldName, file) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: file
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProposalId) {
      alert('Please select a proposal to resubmit');
      return;
    }

    const hasFiles = activeFields.some((field) => formData[field] instanceof File);
    if (!hasFiles) {
      setNoFileModalOpen(true);
      return;
    }

    setUploading(true);
    try {
      const submitData = new FormData();
      submitData.append('proposalTitle', formData.proposalTitle);
      submitData.append('studentEmail', userInfo?.email || '');
      submitData.append('resubmissionReason', resubmissionReason || 'Resubmitted updated files');

      activeFields.forEach((field) => {
        if (formData[field] instanceof File) {
          submitData.append(field, formData[field]);
        }
      });

      const response = await fetch(`${API_BASE_URL}/student/proposals/${selectedProposalId}`, {
        method: 'PUT',
        body: submitData
      });

      const result = await response.json();

      if (result.success) {
        const submittedFilesList = activeFields.filter((field) => formData[field] instanceof File)
          .map(field => ({
            name: formData[field].name,
            size: (formData[field].size / 1024).toFixed(1) + ' KB'
          }));

        setSubmittedFiles(submittedFilesList);
        setShowSuccessModal(true);

        setFormData({ ...EMPTY_ADD_FILES_FORM });
        setResubmissionReason('');

        const updatedResp = await fetch(`${API_BASE_URL}/proposals/student/${encodeURIComponent(userInfo.email)}`);
        if (updatedResp.ok) {
          const freshData = await updatedResp.json();
          const deletedIds = getDeletedProposalIds();
          setProposals(freshData.filter(p => !deletedIds.includes(String(p._id))));
        }
      } else {
        alert('Error resubmitting files: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting resubmission:', error);
      alert('Error submitting resubmission. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const renderFileInput = (fieldName, label, description) => {
    const existingFile = selectedProposal?.studentFiles?.[fieldName] || selectedProposal?.files?.[fieldName];

    return (
      <div className="form-group" key={fieldName}>
        <label htmlFor={`resub-${fieldName}`}>{label}</label>
        {description && <p className="field-description">{description}</p>}
        {existingFile && !formData[fieldName] && (
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0.5rem 0' }}>
            Current File: <strong>{existingFile.originalname || existingFile.filename}</strong>
          </p>
        )}
        <div className="file-upload-area">
          <input
            type="file"
            id={`resub-${fieldName}`}
            onChange={(e) => handleFileChange(fieldName, e.target.files[0])}
            accept=".pdf,.doc,.docx,.txt"
          />
          <div className="file-upload-label">
            <UploadIcon />
            <p>{formData[fieldName] ? formData[fieldName].name : 'Click to select replacement file'}</p>
            <span>PDF, DOC, DOCX, TXT (MAX. 10MB)</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="content-section">
        <h2>Resubmission</h2>
        <p>Loading your submitted proposals...</p>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="content-section">
        <div className="up-empty-state" style={{ padding: '3rem 1rem' }}>
          <div className="up-empty-icon"><FilePlusIcon /></div>
          <h3>No Proposals Available for Resubmission</h3>
          <p>You haven't submitted any research proposals yet. Once you submit a proposal under "Add Files", you can manage resubmissions here anytime.</p>
        </div>
      </div>
    );
  }

  const getHistoryItemFiles = (h) => {
    const filesObj = h.files || h.studentFiles || {};
    if (!filesObj) return [];

    const FILE_KEY_LABELS = {
      proposal: 'Proposal Document',
      approvalSheet: 'Approval Sheet',
      urebForm2: 'UREB Form 2',
      applicationForm6: 'Application Form 6',
      accomplishedForm8: 'Accomplished Form 8',
      accomplishedForm10A: 'Accomplished Form 10 A',
      instrumentTool: 'Instrument / Tool',
      ethicsReviewFee: 'Ethics Review Fee Receipt',
      sampleForm1: 'Sample Form 1',
      sampleForm2: 'Sample Form 2'
    };

    const getDocLabel = (key, f) => {
      if (FILE_KEY_LABELS[key]) return FILE_KEY_LABELS[key];
      if (f?.label) return f.label;
      if (!key || key.startsWith('file')) return f?.originalname || f?.filename || 'Document';
      return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };

    if (Array.isArray(filesObj)) {
      return filesObj
        .filter(f => f && (f.filename || f.originalname || f.storedName))
        .map((f, idx) => ({
          key: f.key || `file_${idx}`,
          label: getDocLabel(f.key || `file_${idx}`, f),
          filename: f.filename || f.storedName,
          originalname: f.originalname || f.name || f.filename || f.storedName,
          size: f.size
        }));
    }

    if (typeof filesObj === 'object') {
      return Object.entries(filesObj)
        .filter(([_, f]) => f && (f.filename || f.originalname || f.storedName))
        .map(([key, f]) => ({
          key,
          label: getDocLabel(key, f),
          filename: f.filename || f.storedName,
          originalname: f.originalname || f.name || f.filename || f.storedName,
          size: f.size
        }));
    }
    return [];
  };

  return (
    <div className="content-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Resubmission Portal</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Resubmit updated research documents cleanly.
          </p>
        </div>
      </div>



      <div style={{
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '0.9rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e40af', fontWeight: '600' }}>
            Important Resubmission Guidelines:
          </p>
        </div>
        <div style={{ marginLeft: '1.6rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e40af', fontWeight: '500' }}>
            • A maximum of 10 resubmissions will be accepted per research proposal.
          </p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e40af', fontWeight: '500' }}>
            • You may select only the specific files that require resubmission. Unchanged files can be left blank.
          </p>
        </div>
      </div>

      {selectedProposal && (
        <form className="add-files-form" onSubmit={handleSubmit}>

          <div className="form-group">
            <label htmlFor="resubmissionReason">Reason</label>
            <textarea
              id="resubmissionReason"
              value={resubmissionReason}
              onChange={(e) => setResubmissionReason(e.target.value)}
              placeholder="State the reason for this resubmission (e.g. replaced wrong document, revised protocol as requested)"
              rows={2}
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
            />
          </div>

          {isExternalResearcher ? (
            <>
              {renderFileInput('sampleForm1', 'Sample form 1')}
              {renderFileInput('sampleForm2', 'Sample form 2')}
            </>
          ) : (
            <>
              {renderFileInput('proposal', 'Proposal')}
              {renderFileInput('approvalSheet', 'Approval Sheet')}
              {renderFileInput('urebForm2', 'UREB Form 2')}
              {renderFileInput('applicationForm6', 'Application for Research Ethics Review Form 6')}
              {renderFileInput('accomplishedForm8', 'Accomplished Form 8', 'See attached form and accomplish only applicable pages')}
              {renderFileInput('accomplishedForm10A', 'Accomplish Form 10 A', 'See attached form')}
              {renderFileInput('instrumentTool', 'Copy of instrument/tool', 'e.g. questionnaire that will be administered to participants')}
              {renderFileInput('ethicsReviewFee', 'Ethics Review Fee (Receipt)')}
            </>
          )}

          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button
              type="submit"
              className="btn-primary"
              style={{ backgroundColor: '#7c3aed', color: '#fff' }}
              disabled={uploading}
            >
              {uploading ? 'Resubmitting...' : 'Resubmit'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setFormData({ ...EMPTY_ADD_FILES_FORM, proposalTitle: selectedProposal.researchTitle || '' });
                setResubmissionReason('');
              }}
            >
              Clear
            </button>
          </div>
        </form>
      )}

      <div className="resub-history-container">
        <div className="resub-history-header">
          <div className="resub-history-title-group">
            <h3 className="resub-history-title">Researcher Resubmission History Log</h3>
            <span className="resub-history-count-badge">
              {unifiedHistory.length} {unifiedHistory.length === 1 ? 'Entry' : 'Entries'}
            </span>
          </div>
        </div>

        {unifiedHistory.length === 0 ? (
          <div className="resub-empty-state">
            <p style={{ margin: 0, fontWeight: '600', color: '#475569' }}>No resubmission history logged yet for this proposal.</p>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.825rem', color: '#94a3b8' }}>
              When you resubmit updated documents above, your submission history log and uploaded files table will appear here.
            </p>
          </div>
        ) : (
          <div className="resub-history-table-wrapper">
            <table className="resub-history-table">
              <thead>
                <tr>
                  <th>Round / Version</th>
                  <th>Date &amp; Time</th>
                  <th>Reason / Remarks</th>
                  <th>Uploaded Documents</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {unifiedHistory.map((h, i) => {
                  const itemFiles = getHistoryItemFiles(h);
                  return (
                    <tr key={i}>
                      <td>
                        <span className="resub-badge resub-badge--purple">
                          {h.label || (h.resubmissionNumber ? `Resubmission ${h.resubmissionNumber}` : `Resubmission ${i + 1}`)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#475569', whiteSpace: 'nowrap' }}>
                          {h.submittedAt ? new Date(h.submittedAt).toLocaleString() : 'N/A'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '240px' }}>
                        <span style={{ fontSize: '0.825rem', color: '#334155', display: 'block', wordBreak: 'break-word' }}>
                          {h.resubmissionReason || 'Updated files resubmitted'}
                        </span>
                      </td>
                      <td>
                        {itemFiles.length === 0 ? (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            No specific file records attached
                          </span>
                        ) : (
                          <div className="resub-file-list">
                            {itemFiles.map((file, fIdx) => (
                              <div key={fIdx} className="resub-file-item">
                                <div className="resub-file-info">
                                  <div className="resub-file-icon">
                                    <FileIcon />
                                  </div>
                                  <div className="resub-file-details">
                                    <span className="resub-file-label">{file.label}</span>
                                    <span className="resub-file-name" title={file.originalname}>
                                      {file.originalname}
                                    </span>
                                  </div>
                                </div>
                                <div className="resub-file-actions">
                                  {file.filename && (
                                    <>
                                      <button
                                        type="button"
                                        className="resub-action-btn resub-action-btn--view"
                                        title="View Document"
                                        onClick={() => viewFile(file.filename)}
                                      >
                                        <EyeIcon /> View
                                      </button>
                                      <button
                                        type="button"
                                        className="resub-action-btn resub-action-btn--download"
                                        title="Download Document"
                                        onClick={() => downloadReviewerFile(file.filename, file.originalname || file.filename)}
                                      >
                                        <DownloadIcon /> Download
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="resub-badge resub-badge--green">
                          ✓ Saved
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <NoFileModal isOpen={noFileModalOpen} onClose={() => setNoFileModalOpen(false)} />
    </div>
  );
};

const ViewIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const FileTemplatesContent = () => {
  const [viewingFile, setViewingFile] = useState(null);

  const templates = [
    {
      id: 1,
      name: 'Form 2 — Curriculum Vitae',
      description: 'Curriculum Vitae form required for research ethics submission.',
      filename: 'Form 2  B CURRICULUM VITAE (2).docx',
      category: 'Submission',
      color: '#4a7c59',
    },
    {
      id: 2,
      name: 'Form 6 — Application for Research Ethics Review',
      description: 'Official application form for requesting a research ethics review.',
      filename: 'Form 6 APPLICATION FOR RESEARCH ETHICS REVIEW (3).docx',
      category: 'Application',
      color: '#2563eb',
    },
    {
      id: 3,
      name: 'Form 8 (A) — Checklist for Investigations',
      description: 'Checklist for investigations involving human participants. Accomplish only applicable pages.',
      filename: 'Form 8 (A) CHECKLIST FOR INVESTIGATIONS INVOLVING (3).docx',
      category: 'Compliance',
      color: '#7c3aed',
    },
    {
      id: 4,
      name: 'Form 10 (A) — Informed Consent Form',
      description: 'Informed Consent Form template for studies involving human participants.',
      filename: 'Form 10 (A) INFORMED CONSENT FORM (3).docx',
      category: 'Compliance',
      color: '#c2410c',
    },
  ];

  const categoryColors = {
    Submission: { bg: '#f0faf0', text: '#276227', border: '#c3e6c3' },
    Application: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    Compliance: { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
    Instrument: { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc' },
  };

  return (
    <div className="content-section">
      <div className="ft-page-header">
        <div>
          <h2 className="ft-page-title">File Templates</h2>
          <p className="ft-page-subtitle">Download the official UREB forms and templates needed for your submission.</p>
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
                  <div className="ft-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setViewingFile({ filename: tpl.filename, originalname: tpl.name })}
                      className="ft-view-btn"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.5rem 0.75rem',
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: '6px',
                        color: '#166534',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <ViewIcon />
                      View
                    </button>
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
            </div>
          );
        })}
      </div>

      {viewingFile && (
        <FileViewerModal
          file={viewingFile}
          onClose={() => setViewingFile(null)}
        />
      )}
    </div>
  );
};

function FileViewerModal({ file, onClose }) {
  const [zoom, setZoom] = useState(100);
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const fileUrl = `/${file.filename}`;
  const fileExt = file.filename.split('.').pop().toLowerCase();

  const handleZoomIn = () => setZoom(z => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom(z => Math.max(z - 25, 50));
  const handleZoomReset = () => setZoom(100);

  const ZoomControls = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      background: '#f8fafc',
      borderRadius: '8px',
      marginBottom: '0.5rem'
    }}>
      <button onClick={handleZoomOut} style={zoomBtnStyle}>-</button>
      <span style={{ fontSize: '0.875rem', fontWeight: '500', minWidth: '3rem', textAlign: 'center' }}>{zoom}%</span>
      <button onClick={handleZoomIn} style={zoomBtnStyle}>+</button>
      <button onClick={handleZoomReset} style={{ ...zoomBtnStyle, marginLeft: '0.5rem' }}>Reset</button>
    </div>
  );

  const zoomBtnStyle = {
    padding: '0.25rem 0.75rem',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600'
  };

  const renderFileViewer = () => {
    if (fileExt === 'pdf') {
      return (
        <div style={{ height: '85vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
          <ZoomControls />
          <div style={{ flex: 1, overflow: 'auto', borderRadius: '8px' }}>
            <iframe
              src={`${fileUrl}#zoom=${zoom}`}
              width="100%"
              height="100%"
              style={{ border: 'none', borderRadius: '8px', background: 'white' }}
              title="PDF Viewer"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        </div>
      );
    }

    if (['doc', 'docx'].includes(fileExt)) {
      // Check if running locally (Office Viewer can't access localhost files)
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      if (isLocalhost) {
        // Show immediate fallback for local files since Office Viewer can't access them
        return (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
            <h3 style={{ color: '#1e293b', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Document Preview</h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
              Preview is not available for local files. Please download the document to view it.
            </p>
            <a href={fileUrl} download={file.originalname} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: '#4a7c59',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '500',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <DownloadIcon />
              Download {file.originalname}
            </a>
          </div>
        );
      }

      const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + fileUrl)}`;

      return (
        <div style={{ height: '85vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
          {isLoading && !loadError && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              <div style={{ marginBottom: '1rem' }}>Loading document preview...</div>
              <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#4a7c59', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            </div>
          )}
          {loadError ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
              <h3 style={{ color: '#1e293b', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Preview Not Available</h3>
              <p style={{ color: '#64748b', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                We couldn't load the preview for this document. Please download it to view.
              </p>
              <a href={fileUrl} download={file.originalname} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: '#4a7c59',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '500',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <DownloadIcon />
                Download {file.originalname}
              </a>
            </div>
          ) : (
            <iframe
              src={officeUrl}
              width="100%"
              height="100%"
              style={{ border: 'none', borderRadius: '8px' }}
              title="Document Viewer"
              onLoad={() => setIsLoading(false)}
              onError={() => { setLoadError(true); setIsLoading(false); }}
            />
          )}
        </div>
      );
    }

    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📎</div>
        <p style={{ color: '#64748b', marginBottom: '1rem' }}>Preview not available for this file type.</p>
        <a href={fileUrl} download={file.originalname} className="ft-download-btn">
          <DownloadIcon />
          Download File
        </a>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{
        background: 'white',
        borderRadius: '12px',
        maxWidth: '95vw',
        width: '95vw',
        maxHeight: '95vh',
        height: 'auto',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        <div className="modal-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h2 title={file.originalname} style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 'calc(95vw - 150px)'
          }}>
            {file.originalname}
          </h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body" style={{ padding: '1rem 1.5rem' }}>
          {renderFileViewer()}
        </div>
        <div className="modal-footer" style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e2e8f0'
        }}>
          <button onClick={onClose} style={{
            padding: '0.5rem 1rem',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500'
          }}>Close</button>
          <a href={fileUrl} download={file.originalname} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.5rem 1rem',
            background: '#4a7c59',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            <DownloadIcon />
            Download
          </a>
        </div>
      </div>
    </div>
  );
};

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

function MessagesContent({ userInfo, onMessageRead }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyTargetMsg, setReplyTargetMsg] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyFiles, setReplyFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!userInfo?.email) return;
      try {
        const response = await fetch(`${API_BASE_URL}/messages/${encodeURIComponent(userInfo.email)}`);
        const data = await response.json();
        console.log('[Messages] All fetched messages:', data);
        const adminMessages = data
          .filter((m) => m.recipientEmail === userInfo.email && m.type === 'admin_to_student')
          .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
        console.log('[Messages] Admin messages with files:', adminMessages.map(m => ({ id: m._id, files: m.files })));
        setMessages(adminMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [userInfo]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      + ' · '
      + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getStoredFilename = (filePath) => {
    if (!filePath) return null;
    return filePath.split(/[\\/]/).pop();
  };

  const openDeleteModal = (messageId) => {
    setDeleteTargetId(messageId);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteTargetId(null);
    setDeleteModalOpen(false);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${deleteTargetId}`, { method: 'DELETE' });
      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg._id !== deleteTargetId));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    } finally {
      closeDeleteModal();
    }
  };

  const markAsRead = async (messageId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        setMessages(prev => prev.map(msg =>
          msg._id === messageId ? { ...msg, read: true } : msg
        ));
        // Call the callback to refresh message count in sidebar
        if (onMessageRead) {
          onMessageRead();
        }
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleReply = (message) => {
    setReplyTargetMsg(message);
    setReplyText('');
    setReplyFiles([]);
    setReplyModalOpen(true);
  };

  const closeReplyModal = () => {
    if (submitting) return;
    setReplyModalOpen(false);
    setReplyTargetMsg(null);
    setReplyText('');
    setReplyFiles([]);
  };

  const addFiles = (newFiles) => {
    const arr = Array.from(newFiles);
    setReplyFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...arr.filter(f => !existing.has(f.name + f.size))];
    });
  };

  const removeReplyFile = (index) => {
    setReplyFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleReplySubmit = async () => {
    if (replyFiles.length === 0) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('senderEmail', userInfo.email);
      formData.append('senderName', userInfo.name || userInfo.email);
      formData.append('message', 'File attachment(s)');
      if (replyTargetMsg?._id) formData.append('replyToMessageId', replyTargetMsg._id);
      replyFiles.forEach(f => formData.append('files', f));

      const res = await fetch(`${API_BASE_URL}/messages/reply`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        closeReplyModal();
        setSuccessModalOpen(true);
      } else {
        alert('Failed to send reply. Please try again.');
      }
    } catch (err) {
      console.error('Reply error:', err);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="content-section">
        <div className="sm-loading">
          <div className="sm-loading-spinner" />
          <span>Loading messages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="content-section">
      <div className="sm-page-header">
        <div>
          <h2 className="sm-page-title">Messages</h2>
          <p className="sm-page-subtitle">Messages received from the UREB Administrator</p>
        </div>
        {messages.length > 0 && (
          <span className="sm-count-badge">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="sm-empty">
          <div className="sm-empty-icon"><MailIcon /></div>
          <h3>No messages yet</h3>
          <p>When the administrator sends you a message, it will appear here.</p>
        </div>
      ) : (
        <div className="sm-list">
          {messages.map((msg) => (
            <div key={msg._id} className="sm-card">
              <div className="sm-card-top">
                <div className="sm-avatar">A</div>
                <div className="sm-sender-info">
                  <span className="sm-sender-name">UREB Administrator</span>
                  <span className="sm-sender-date">{formatDate(msg.sentAt)}</span>
                </div>
                <div className="sm-card-actions">
                  {!msg.read && (
                    <button
                      className="sm-action-btn sm-mark-read-btn"
                      onClick={() => markAsRead(msg._id)}
                      title="Mark as read"
                    >
                      <CheckIcon />
                      Read
                    </button>
                  )}
                  <button
                    className="sm-action-btn sm-reply-btn"
                    onClick={() => handleReply(msg)}
                    title="Reply to message"
                  >
                    <ReplyIcon />
                    Reply
                  </button>
                  <button
                    className="sm-action-btn sm-trash-btn"
                    onClick={() => openDeleteModal(msg._id)}
                    title="Delete message"
                  >
                    <TrashIcon />
                    Trash
                  </button>
                </div>
              </div>

              <div className="sm-card-body">
                <p className="sm-message-text">{msg.message}</p>
              </div>

              {msg.files && msg.files.length > 0 && (
                <div className="sm-attachments">
                  <span className="sm-attachments-label">
                    <FileIcon /> Attachments ({msg.files.length})
                  </span>
                  <div className="sm-attachments-list">
                    {msg.files.map((file, i) => {
                      console.log(`[File ${i}] file.path:`, file.path, '| file.filename:', file.filename);
                      const storedName = getStoredFilename(file.path);
                      console.log(`[File ${i}] storedName:`, storedName);
                      const downloadUrl = storedName
                        ? `${API_BASE_URL}/download/${storedName}?name=${encodeURIComponent(file.filename)}`
                        : null;
                      return (
                        <div key={i} className="sm-file-chip">
                          <FileIcon />
                          <span className="sm-file-name">{file.filename}</span>
                          <span className="sm-file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                          {storedName ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                              <button
                                onClick={() => {
                                  import('../services/api.js').then(({ viewFile }) => {
                                    viewFile(storedName);
                                  });
                                }}
                                title="View file"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, padding: '0.3rem 0.7rem', borderRadius: '6px', whiteSpace: 'nowrap' }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                                View
                              </button>
                              <a
                                href={downloadUrl}
                                download={file.filename}
                                title="Download file"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#7A9E7E', color: '#fff', fontSize: '0.78rem', fontWeight: 600, padding: '0.3rem 0.7rem', borderRadius: '6px', textDecoration: 'none', whiteSpace: 'nowrap' }}
                              >
                                <DownloadIcon />
                                Download
                              </a>
                            </div>
                          ) : (
                            <span style={{ color: '#999', fontSize: '0.75rem', marginLeft: 'auto', fontStyle: 'italic' }}>No file access</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {replyModalOpen && (
        <div className="rm-overlay" onClick={(e) => { if (e.target.classList.contains('rm-overlay')) closeReplyModal(); }}>
          <div className="rm-container">

            {/* Header */}
            <div className="rm-header">
              <div className="rm-header-left">
                <div className="rm-header-icon"><ReplyIcon /></div>
                <div>
                  <h3 className="rm-title">Reply to Administrator</h3>
                  <p className="rm-subtitle">Your reply will be sent directly to the UREB Admin</p>
                </div>
              </div>
              <button className="rm-close" onClick={closeReplyModal} disabled={submitting}>✕</button>
            </div>

            {/* Scrollable body */}
            <div className="rm-body">

              {/* Original message quote */}
              {replyTargetMsg && (
                <div className="rm-quote">
                  <span className="rm-quote-label">Replying to:</span>
                  <p className="rm-quote-text">{replyTargetMsg.message}</p>
                </div>
              )}

              {/* Drag & drop zone */}
              <div className="rm-field">
                <label className="rm-label">Attachments</label>
                <div
                  className={`rm-dropzone${isDragging ? ' rm-dropzone--active' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="rm-dropzone-icon"><UploadIcon /></div>
                  <p className="rm-dropzone-text">
                    Drag &amp; drop files here, or <span className="rm-dropzone-link">browse</span>
                  </p>
                  <p className="rm-dropzone-hint">PDF, DOC, DOCX, images — up to 10 MB each</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="rm-file-input"
                    onChange={e => { if (e.target.files.length) addFiles(e.target.files); e.target.value = ''; }}
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Attached file list */}
              {replyFiles.length > 0 && (
                <div className="rm-file-list">
                  {replyFiles.map((f, i) => (
                    <div key={i} className="rm-file-item">
                      <FileIcon />
                      <span className="rm-file-name">{f.name}</span>
                      <span className="rm-file-size">{(f.size / 1024).toFixed(1)} KB</span>
                      <button className="rm-file-remove" onClick={() => removeReplyFile(i)} disabled={submitting}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="rm-footer">
              <button className="rm-btn rm-btn-cancel" onClick={closeReplyModal} disabled={submitting}>Cancel</button>
              <button
                className="rm-btn rm-btn-submit"
                onClick={handleReplySubmit}
                disabled={submitting || replyFiles.length === 0}
              >
                {submitting ? 'Sending…' : 'Send Reply'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Success modal */}
      {successModalOpen && (
        <div className="mini-modal-overlay" onClick={() => setSuccessModalOpen(false)}>
          <div className="mini-modal" onClick={e => e.stopPropagation()}>
            <div className="mini-modal-icon mini-modal-icon--success">✓</div>
            <h4 className="mini-modal-title">Reply Sent!</h4>
            <p className="mini-modal-text">Your reply has been sent to the UREB Administrator.</p>
            <button className="mini-modal-btn mini-modal-btn--primary" onClick={() => setSuccessModalOpen(false)}>Done</button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <div className="mini-modal-overlay" onClick={closeDeleteModal}>
          <div className="mini-modal" onClick={e => e.stopPropagation()}>
            <div className="mini-modal-icon mini-modal-icon--danger">
              <TrashIcon />
            </div>
            <h4 className="mini-modal-title">Delete Message?</h4>
            <p className="mini-modal-text">This message will be permanently removed.</p>
            <div className="mini-modal-actions">
              <button className="mini-modal-btn mini-modal-btn--ghost" onClick={closeDeleteModal}>Cancel</button>
              <button className="mini-modal-btn mini-modal-btn--danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const HISTORY_HIDDEN_KEY = 'ureb_hidden_history';
const getHiddenHistoryIds = () => {
  try { return JSON.parse(localStorage.getItem(HISTORY_HIDDEN_KEY) || '[]'); }
  catch { return []; }
};
const saveHiddenHistoryId = (id) => {
  const ids = getHiddenHistoryIds();
  if (!ids.includes(String(id))) {
    localStorage.setItem(HISTORY_HIDDEN_KEY, JSON.stringify([...ids, String(id)]));
  }
};
const clearHiddenHistory = () => localStorage.removeItem(HISTORY_HIDDEN_KEY);

const HistoryContent = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, mode: null, id: null });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('ureb_user') || '{}');
    setUserInfo(userData);
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userInfo?.email) return;

      try {
        const [proposalsResponse, reviewsResponse, hiddenResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/proposals/student/${encodeURIComponent(userInfo.email)}`),
          fetch(`${API_BASE_URL}/reviews/student/${encodeURIComponent(userInfo.email)}`),
          fetch(`${API_BASE_URL}/user-hidden-items/${encodeURIComponent(userInfo.email)}`).catch(() => null)
        ]);

        if (!proposalsResponse.ok || !reviewsResponse.ok) {
          throw new Error('Server endpoints not available. Please restart the server.');
        }

        const proposalsContentType = proposalsResponse.headers.get('content-type');
        const reviewsContentType = reviewsResponse.headers.get('content-type');

        if (!proposalsContentType?.includes('application/json') || !reviewsContentType?.includes('application/json')) {
          throw new Error('Invalid server response. Please restart the server.');
        }

        const proposals = await proposalsResponse.json();
        const reviews = await reviewsResponse.json();

        let dbHiddenIds = [];
        if (hiddenResponse && hiddenResponse.ok) {
          const hiddenData = await hiddenResponse.json();
          if (Array.isArray(hiddenData.hiddenIds)) {
            dbHiddenIds = hiddenData.hiddenIds.map(String);
          }
        }

        const activities = [];
        const deletedProposalIds = getDeletedProposalIds();
        const localHiddenIds = getHiddenHistoryIds();
        const hiddenIds = Array.from(new Set([...localHiddenIds, ...dbHiddenIds]));

        proposals.filter(p => !deletedProposalIds.includes(String(p._id)) && !hiddenIds.includes(String(p._id))).forEach(proposal => {
          const resubHistory = Array.isArray(proposal.resubmissionHistory) ? proposal.resubmissionHistory : [];
          if (resubHistory.length > 0) {
            resubHistory.forEach((h, idx) => {
              const actId = `${proposal._id}-resub-${idx}`;
              if (!hiddenIds.includes(actId)) {
                activities.push({
                  id: actId,
                  type: idx === 0 ? 'proposal' : 'resubmission',
                  title: proposal.researchTitle || 'Untitled Proposal',
                  action: idx === 0 ? 'Submitted initial research proposal' : `Resubmitted files (${h.label || `Resubmission ${idx}`})`,
                  date: h.submittedAt || proposal.createdAt || new Date(),
                  status: h.label || (idx === 0 ? 'Original Submission' : `Resubmission ${idx}`),
                  details: {
                    department: proposal.department || 'Unknown',
                    abstract: h.resubmissionReason || (idx === 0 ? 'Initial submission' : 'Resubmitted updated proposal files')
                  }
                });
              }
            });
          } else {
            activities.push({
              id: proposal._id,
              type: 'proposal',
              title: proposal.researchTitle || 'Untitled Proposal',
              action: proposal.resubmissionCount > 0 ? `Resubmitted files (${proposal.resubmissionLabel})` : 'Submitted research proposal',
              date: proposal.updatedAt || proposal.createdAt || new Date(),
              status: proposal.resubmissionCount > 0 ? proposal.resubmissionLabel : (proposal.status || 'pending'),
              details: {
                department: proposal.department || 'Unknown',
                abstract: 'Research proposal submitted for review'
              }
            });
          }
        });

        reviews.filter(r => !hiddenIds.includes(String(r._id))).forEach(review => {
          activities.push({
            id: review._id,
            type: 'review',
            title: review.proposalTitle || 'Research Proposal',
            action: 'Submitted file for review',
            date: review.createdAt || review.submittedAt,
            status: review.status || 'pending',
            details: {
              reviewer: review.reviewerName || review.reviewerEmail,
              files: review.files ? Object.keys(review.files).length : 0,
              feedback: review.feedback ? 'Feedback provided' : 'No feedback yet'
            }
          });
        });

        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        setHistory(activities);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userInfo) fetchHistory();
  }, [userInfo]);

  const handleDeleteOne = async () => {
    const { id } = confirmModal;
    saveHiddenHistoryId(id);
    setHistory(prev => prev.filter(a => String(a.id) !== String(id)));
    setConfirmModal({ open: false, mode: null, id: null });

    if (userInfo?.email) {
      try {
        await fetch(`${API_BASE_URL}/user-hidden-items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userInfo.email, itemId: String(id), itemType: 'history' })
        });
      } catch (err) {
        console.error('Realtime DB history item deletion failed:', err);
      }
    }
  };

  const handleDeleteAll = async () => {
    const currentIds = history.map(a => a.id);
    currentIds.forEach(id => saveHiddenHistoryId(id));
    setHistory([]);
    setConfirmModal({ open: false, mode: null, id: null });

    if (userInfo?.email && currentIds.length > 0) {
      try {
        await fetch(`${API_BASE_URL}/user-hidden-items/clear-all`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userInfo.email, itemIds: currentIds.map(String), itemType: 'history' })
        });
      } catch (err) {
        console.error('Realtime DB clear all history failed:', err);
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown date';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'reviewed':
      case 'completed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      case 'in_review':
      case 'under review': return '#3b82f6';
      case 'review submitted': return '#6366f1';
      case 'resubmitted': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'proposal':
      case 'review':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="content-section">
        <div className="sm-loading">
          <div className="sm-loading-spinner" />
          <span>Loading history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="content-section">
      <div className="sm-page-header">
        <div>
          <h2 className="sm-page-title">Activity History</h2>
          <p className="sm-page-subtitle">Your recent activity and submissions</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {history.length > 0 && (
            <span className="sm-count-badge">{history.length} activities</span>
          )}
          {history.length > 0 && (
            <button
              className="hist-delete-all-btn"
              title="Delete all history"
              onClick={() => setConfirmModal({ open: true, mode: 'all', id: null })}
            >
              <TrashIcon />
              <span>Delete All</span>
            </button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="sm-empty">
          <div className="sm-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3>No activity yet</h3>
          <p>When you submit proposals or files, your activity will appear here.</p>
        </div>
      ) : (
        <div className="sm-timeline">
          {history.map((activity) => (
            <div key={activity.id} className="sm-timeline-item">
              <div className="sm-timeline-marker" style={{ color: getStatusColor(activity.status) }}>
                {getStatusIcon(activity.type)}
              </div>

              <div className="sm-timeline-content">
                <div className="sm-timeline-header">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 className="sm-timeline-title">{activity.title}</h4>
                    <p className="sm-timeline-action">{activity.action}</p>
                  </div>
                  <div className="sm-timeline-meta">
                    <span className="sm-timeline-date">{formatDate(activity.date)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span
                        className="sm-status-badge"
                        style={{
                          backgroundColor: getStatusColor(activity.status) + '20',
                          color: getStatusColor(activity.status),
                          border: `1px solid ${getStatusColor(activity.status)}40`
                        }}
                      >
                        {activity.status}
                      </span>
                      <button
                        className="hist-item-delete-btn"
                        title="Delete this entry"
                        onClick={() => setConfirmModal({ open: true, mode: 'one', id: activity.id })}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="sm-timeline-details">
                  {activity.type === 'proposal' && (
                    <div className="sm-proposal-details">
                      <p><strong>Department:</strong> {activity.details.department}</p>
                      <p><strong>Abstract:</strong> {activity.details.abstract}</p>
                    </div>
                  )}
                  {activity.type === 'review' && (
                    <div className="sm-review-details">
                      <p><strong>Reviewer:</strong> {activity.details.reviewer}</p>
                      <p><strong>Files Submitted:</strong> {activity.details.files} file(s)</p>
                      <p><strong>Status:</strong> {activity.details.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmModal.open && (
        <div className="mini-modal-overlay" onClick={() => setConfirmModal({ open: false, mode: null, id: null })}>
          <div className="mini-modal" onClick={e => e.stopPropagation()}>
            <div className="mini-modal-icon mini-modal-icon--danger"><TrashIcon /></div>
            <h4 className="mini-modal-title">
              {confirmModal.mode === 'all' ? 'Delete All History?' : 'Delete Entry?'}
            </h4>
            <p className="mini-modal-text">
              {confirmModal.mode === 'all'
                ? 'All activity history entries will be permanently removed.'
                : 'This history entry will be permanently removed.'}
            </p>
            <div className="mini-modal-actions">
              <button className="mini-modal-btn mini-modal-btn--ghost" onClick={() => setConfirmModal({ open: false, mode: null, id: null })}>Cancel</button>
              <button className="mini-modal-btn mini-modal-btn--danger" onClick={confirmModal.mode === 'all' ? handleDeleteAll : handleDeleteOne}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MAX_MESSAGE_ATTACHMENTS = 15;
const MAX_MESSAGE_FILE_BYTES = 10 * 1024 * 1024;
const MESSAGE_ATTACHMENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/jpg',
  'image/png',
]);

const isValidMessageAttachment = (file) =>
  file
  && MESSAGE_ATTACHMENT_TYPES.has(file.type)
  && file.size > 0
  && file.size <= MAX_MESSAGE_FILE_BYTES;

const createMessageUploadZone = () => ({
  id: `zone-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  file: null,
});

function MessageUploadDropZone({ zone, showRemoveZone, onFileSet, onRemoveZone, onInvalidFile }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputId = `msg-admin-upload-${zone.id}`;

  const applyFile = (file) => {
    if (!file) return;
    if (!isValidMessageAttachment(file)) {
      onInvalidFile();
      return;
    }
    onFileSet(zone.id, file);
  };

  return (
    <div style={{ marginBottom: '1rem', position: 'relative' }}>
      {showRemoveZone && (
        <button
          type="button"
          onClick={() => onRemoveZone(zone.id)}
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            zIndex: 1,
            padding: '0.25rem 0.6rem',
            fontSize: '0.75rem',
            background: '#fff',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            color: '#6b7280',
            cursor: 'pointer',
          }}
        >
          Remove
        </button>
      )}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) applyFile(file);
        }}
        style={{
          border: `2px dashed ${isDragOver ? '#4a7c59' : '#ddd'}`,
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center',
          background: isDragOver ? '#f0fdf4' : '#fafafa',
          transition: 'all 0.2s',
        }}
      >
        {zone.file ? (
          <>
            <FileIcon />
            <p style={{ color: '#374151', margin: '0.5rem 0', fontWeight: 500 }}>
              {zone.file.name}
            </p>
            <p style={{ color: '#999', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
              ({(zone.file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
            <button
              type="button"
              onClick={() => onFileSet(zone.id, null)}
              style={{
                marginRight: '0.5rem',
                padding: '0.4rem 0.75rem',
                background: '#fff',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              Clear file
            </button>
            <label
              htmlFor={inputId}
              style={{ color: '#4a7c59', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem' }}
            >
              Replace
            </label>
          </>
        ) : (
          <>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" style={{ marginBottom: '0.5rem' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p style={{ color: '#666', margin: '0.5rem 0' }}>
              Drag and drop files here, or{' '}
              <label
                htmlFor={inputId}
                style={{ color: '#4a7c59', cursor: 'pointer', textDecoration: 'underline' }}
              >
                browse
              </label>
            </p>
            <p style={{ color: '#999', fontSize: '0.85rem', margin: 0 }}>
              Up to {MAX_MESSAGE_ATTACHMENTS} files, 10MB each. PDF, DOC, DOCX, TXT, JPG, PNG
            </p>
          </>
        )}
        <input
          type="file"
          id={inputId}
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          onChange={(e) => {
            applyFile(e.target.files?.[0]);
            e.target.value = '';
          }}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

function MessageAdminContent({ userInfo }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [uploadZones, setUploadZones] = useState([createMessageUploadZone()]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sentAttachmentCount, setSentAttachmentCount] = useState(0);
  const [sending, setSending] = useState(false);

  const attachedFiles = uploadZones
    .map((z) => z.file)
    .filter((file) => file instanceof File);
  const canAddMoreZones = uploadZones.length < MAX_MESSAGE_ATTACHMENTS;

  const showInvalidFileError = () => {
    setError('Invalid file type or file too large (max 10MB)');
    setTimeout(() => setError(''), 4000);
  };

  const setZoneFile = (zoneId, file) => {
    setUploadZones((prev) =>
      prev.map((zone) => (zone.id === zoneId ? { ...zone, file } : zone))
    );
  };

  const addUploadZone = () => {
    if (!canAddMoreZones) {
      setError(`You can attach up to ${MAX_MESSAGE_ATTACHMENTS} files per message`);
      setTimeout(() => setError(''), 4000);
      return;
    }
    setUploadZones((prev) => [...prev, createMessageUploadZone()]);
  };

  const removeUploadZone = (zoneId) => {
    setUploadZones((prev) => {
      const next = prev.filter((z) => z.id !== zoneId);
      return next.length > 0 ? next : [createMessageUploadZone()];
    });
  };

  const resetUploadZones = () => setUploadZones([createMessageUploadZone()]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setError('Please enter a message');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setError('');
    setSending(true);

    try {
      const result = await sendStudentMessageToAdmin({
        senderEmail: userInfo?.email || '',
        senderName: userInfo?.name || 'Student',
        subject: subject || 'Message from Student',
        message,
        attachments: attachedFiles,
      });

      if (result.success) {
        const received = Number(result.filesReceived ?? 0);
        if (attachedFiles.length > 0 && received !== attachedFiles.length) {
          setError(
            `Only ${received} of ${attachedFiles.length} file(s) were saved. Please try sending again.`
          );
          return;
        }
        setSentAttachmentCount(received);
        setSuccess(true);
        setSubject('');
        setMessage('');
        resetUploadZones();
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(result.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="content-section" style={{ padding: '1rem' }}>
      <div className="form-card" style={{ marginLeft: '0.5rem', width: '100%' }}>
        <h2>Message Admin</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          Send a message directly to the UREB admin. You can attach multiple files if needed.
        </p>

        {/* Success Modal */}
        {success && (
          <div className="mini-modal-overlay" onClick={() => setSuccess(false)} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}>
            <div className="mini-modal" onClick={e => e.stopPropagation()} style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 style={{ margin: '0 0 0.5rem', color: '#166534', fontSize: '1.25rem' }}>
                Message Sent!
              </h3>
              <p style={{ margin: '0 0 1.5rem', color: '#666' }}>
                Your message has been sent to the admin successfully.
                {sentAttachmentCount > 0 && (
                  <> {sentAttachmentCount} attachment{sentAttachmentCount === 1 ? '' : 's'} were received.</>
                )}
              </p>
              <button
                onClick={() => setSuccess(false)}
                style={{
                  padding: '0.75rem 2rem',
                  background: '#4a7c59',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="error-banner" style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            color: '#dc2626'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Subject (Optional)
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter message subject..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Message <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              required
              rows={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem',
                resize: 'vertical'
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Attach Files (Optional)
            </label>

            {uploadZones.map((zone, index) => (
              <MessageUploadDropZone
                key={zone.id}
                zone={zone}
                showRemoveZone={uploadZones.length > 1}
                onFileSet={setZoneFile}
                onRemoveZone={removeUploadZone}
                onInvalidFile={showInvalidFileError}
              />
            ))}

            {canAddMoreZones && (
              <button
                type="button"
                onClick={addUploadZone}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.25rem',
                  background: '#f0fdf4',
                  border: '1px solid #4a7c59',
                  borderRadius: '8px',
                  color: '#4a7c59',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Another Attachment
              </button>
            )}
          </div>

          <div className="form-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                setSubject('');
                setMessage('');
                resetUploadZones();
                setError('');
              }}
              disabled={sending}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f0f0f0',
                border: 'none',
                borderRadius: '6px',
                cursor: sending ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                color: '#666'
              }}
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={sending}
              style={{
                padding: '0.75rem 1.5rem',
                background: sending ? '#ccc' : '#4a7c59',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: sending ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {sending ? (
                <>
                  <span className="spinner" style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Sending...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Send Message
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function WelcomeModal({ firstName, onClose }) {
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
          <h2>WELCOME BACK!</h2>
          <p>We're excited to have you back. Manage your research proposals, track your ethics review progress, and advance your research today.</p>
          <button className="welcome-close-btn" onClick={onClose}>
            Let's Start
          </button>
        </div>
      </div>
    </div>
  );
};

function LogoutModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="logout-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="logout-modal-container">
        <div className="logout-modal-header">
          <h2>Confirm Logout</h2>
        </div>
        <div className="logout-modal-body">
          <p>Are you sure you want to log out of the student dashboard?</p>
        </div>
        <div className="logout-modal-footer">
          <button className="logout-modal-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="logout-modal-btn-primary" onClick={onConfirm}>Logout</button>
        </div>
      </div>
    </div>
  );
};

function SuccessModal({ onClose, submittedFiles }) {
  return (
    <div className="success-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="success-modal-container">
        <div className="success-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" className="success-check-svg">
            <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 12.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="success-modal-title">Submission Received</h2>
        <p className="success-modal-subtitle">Your files have been submitted successfully and are now pending review.</p>

        {submittedFiles.length > 0 && (
          <div className="success-files-list">
            {submittedFiles.map((file, index) => (
              <div key={index} className="success-file-row">
                <svg viewBox="0 0 24 24" fill="none" className="success-file-icon">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
                <span className="success-file-name">{file.name}</span>
                <span className="success-file-size">{file.size}</span>
              </div>
            ))}
          </div>
        )}

        <button className="success-done-btn" onClick={onClose}>Done</button>
      </div>
    </div>
  );
};

export default StudentDashboard;