import { useState, useEffect, useRef, useMemo, useCallback } from 'react';



import '../styles/admindashboard.css';
import '../styles/admindashboard-sp.css';

import '../styles/GenerateReportModal.css';
import InboxReportModal from '../components/modals/InboxReportModal';
import { getAllStudents, getAllReviewers } from '../services/api';







// Helper to format reviewer name with title prefix/suffix

const formatReviewerName = (reviewer) => {

  if (!reviewer) return '';

  const firstName = reviewer.firstName || '';

  const middleName = reviewer.middleName || '';

  const lastName = reviewer.lastName || '';

  const title = reviewer.title || '';

  const baseName = [firstName, middleName, lastName].filter(Boolean).join(' ');

  const fallbackName = reviewer.name || baseName || reviewer.email || 'Unnamed Reviewer';



  if (!title) return fallbackName;



  // Prefix titles: Doctor, Engineer, Professor

  const prefixMap = { Doctor: 'Dr.', Engineer: 'Engr.', Professor: 'Prof.' };

  if (prefixMap[title]) {

    const prefix = prefixMap[title];

    // Check if name already starts with the prefix to avoid duplication

    if (fallbackName.startsWith(prefix + ' ')) {

      return fallbackName;

    }

    return `${prefix} ${fallbackName}`;

  }



  // Suffix titles: RN, LPT, MSN, RN/LPT, RN/MSN, MIT, DBM

  if (title === 'RN' || title === 'LPT' || title === 'MSN' || title === 'RN/LPT' || title === 'RN/MSN' || title === 'MIT' || title === 'DBM') {

    // Check if name already ends with the title to avoid duplication

    if (fallbackName.endsWith(', ' + title)) {

      return fallbackName;

    }

    return `${fallbackName}, ${title}`;

  }



  return fallbackName;

};



const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const TrashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// Rich Text Editor Component

const RichTextEditor = ({ placeholder, content, onChange }) => {

  const [editorContent, setEditorContent] = useState(content || '');

  const [isBold, setIsBold] = useState(false);

  const [isItalic, setIsItalic] = useState(false);

  const [isUnderline, setIsUnderline] = useState(false);



  // Update editor content when prop changes

  useEffect(() => {

    if (content !== undefined && content !== editorContent) {

      setEditorContent(content);

    }

  }, [content, editorContent]);



  const execCommand = (command, value = null) => {

    document.execCommand(command, false, value);

    updateActiveStates();

  };



  const updateActiveStates = () => {

    setIsBold(document.queryCommandState('bold'));

    setIsItalic(document.queryCommandState('italic'));

    setIsUnderline(document.queryCommandState('underline'));

  };



  const handleInput = (e) => {

    const newContent = e.target.innerHTML;

    setEditorContent(newContent);

    updateActiveStates();

    if (onChange) {

      onChange(newContent);

    }

  };



  return (

    <div className="rich-text-editor">

      <div className="editor-toolbar">

        <button

          type="button"

          className={`toolbar-btn ${isBold ? 'active' : ''}`}

          onClick={() => execCommand('bold')}

          title="Bold"

        >

          <strong>B</strong>

        </button>

        <button

          type="button"

          className={`toolbar-btn ${isItalic ? 'active' : ''}`}

          onClick={() => execCommand('italic')}

          title="Italic"

        >

          <em>I</em>

        </button>

        <button

          type="button"

          className={`toolbar-btn ${isUnderline ? 'active' : ''}`}

          onClick={() => execCommand('underline')}

          title="Underline"

        >

          <u>U</u>

        </button>

        <span className="toolbar-divider"></span>

        <button

          type="button"

          className="toolbar-btn"

          onClick={() => execCommand('insertUnorderedList')}

          title="Bullet List"

        >

          • List

        </button>

        <button

          type="button"

          className="toolbar-btn"

          onClick={() => execCommand('insertOrderedList')}

          title="Numbered List"

        >

          1. List

        </button>

      </div>

      <div

        className="editor-content"

        contentEditable

        onInput={handleInput}

        onMouseUp={updateActiveStates}

        onKeyUp={updateActiveStates}

        dangerouslySetInnerHTML={{ __html: editorContent }}

        placeholder={placeholder}

      />

    </div>

  );

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







const FilePlusIcon = () => (



  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">



    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />



    <polyline points="14 2 14 8 20 8" />



    <line x1="12" y1="18" x2="12" y2="12" />



    <line x1="9" y1="15" x2="15" y2="15" />



  </svg>



);







const UserPlusIcon = () => (



  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">



    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />



    <circle cx="8.5" cy="7" r="4" />



    <line x1="20" y1="8" x2="20" y2="14" />



    <line x1="23" y1="11" x2="17" y2="11" />



  </svg>



);







const AssignIcon = () => (



  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">



    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />



    <circle cx="9" cy="7" r="4" />



    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />



    <path d="M16 3.13a4 4 0 0 1 0 7.75" />



  </svg>



);



const FileCheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M9 15l2 2 4-4" />
  </svg>
);



const UsersIcon = () => (



  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">



    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />



    <circle cx="9" cy="7" r="4" />



    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />



    <path d="M16 3.13a4 4 0 0 1 0 7.75" />



  </svg>



);







const LogOutIcon = () => (



  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">



    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />



    <polyline points="16 17 21 12 16 7" />



    <line x1="21" y1="12" x2="9" y2="12" />



  </svg>



);







const ShieldIcon = () => (



  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">



    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />



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











const NotificationIcon = () => (



  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">



    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />



    <path d="M13.73 21a2 2 0 0 1-3.46 0" />



  </svg>



);







const MessageIcon = () => (



  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">



    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />



    <polyline points="22,6 12,13 2,6" />



  </svg>



);



const ReviewsIcon = () => (



  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">



    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />



    <polyline points="14,2 14,8 20,8" />



    <line x1="16" y1="13" x2="8" y2="13" />



    <line x1="16" y1="17" x2="8" y2="17" />



    <polyline points="10,9 9,9 8,9" />



  </svg>



);



const CheckCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const Trash2Icon = () => (

  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <polyline points="3 6 5 6 21 6"></polyline>

    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>

    <line x1="10" y1="11" x2="10" y2="17"></line>

    <line x1="14" y1="11" x2="14" y2="17"></line>

  </svg>

);



const SearchIcon = () => (




  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">



    <circle cx="11" cy="11" r="8" />



    <path d="m21 21-4.35-4.35" />



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

const isStudentSubmissionProposal = (proposal) => {
  const hasStudent = proposal?.studentEmail && String(proposal.studentEmail).trim() !== '';
  const isResubmission = proposal?.submissionType === 'resubmission' || proposal?.status === 'Resubmitted';
  return hasStudent && !isResubmission;
};

const isStudentProposalNew = (proposal) => {
  if (!isStudentSubmissionProposal(proposal)) return false;
  if (proposal.adminSeen === true) return false;
  if (proposal.adminSeen === false) return true;
  if (proposal.adminSeenAt) return false;
  // Legacy rows before adminSeen existed: treat as seen if already assigned
  if (proposal.preliminaryReviewer) return false;
  return true;
};

const AdminDashboard = ({ onLogout }) => {

  // Initialize activeTab with localStorage data if available

  const getInitialTab = () => {

    const savedTab = localStorage.getItem('activeAdminTab');

    console.log('Loading active tab from localStorage:', savedTab);

    return savedTab || 'dashboard';

  };



  const [activeTab, setActiveTab] = useState(getInitialTab());



  const [isSidebarOpen, setIsSidebarOpen] = useState(true);



  const [userInfo, setUserInfo] = useState({ name: 'Admin', email: 'admin@ureb.edu' });



  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeletePhotoModalOpen, setIsDeletePhotoModalOpen] = useState(false);

  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

  const [messageCount, setMessageCount] = useState(0);

  const [notifCount, setNotifCount] = useState(0);
  const [studentProposalNewCount, setStudentProposalNewCount] = useState(0);
  const [proposalsPagination, setProposalsPagination] = useState(null);
  const [messagesPagination, setMessagesPagination] = useState(null);
  const [mcrPagination, setMcrPagination] = useState(null);
  const [manageUsersPagination, setManageUsersPagination] = useState(null);

  useEffect(() => {
    if (activeTab !== 'student-proposals') setProposalsPagination(null);
    if (activeTab !== 'messages-inbox') setMessagesPagination(null);
    if (activeTab !== 'mark-completed-review') setMcrPagination(null);
    if (activeTab !== 'manage-users') setManageUsersPagination(null);
  }, [activeTab]);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [picError, setPicError] = useState('');
  const [picSuccess, setPicSuccess] = useState('');
  const fileInputRef = useRef(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwdData, setPwdData] = useState({ current: '', new: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  // Admin-only text size preference (accessibility). Persisted per-browser and
  // only applied while the Admin Dashboard is mounted — reset on logout/unmount
  // so it never leaks into the Landing Page or other roles' dashboards.
  const [fontScale, setFontScale] = useState(() => {
    const saved = parseInt(localStorage.getItem('ureb_admin_font_scale') || '100', 10);
    return Number.isNaN(saved) ? 100 : saved;
  });

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale}%`;
    localStorage.setItem('ureb_admin_font_scale', String(fontScale));
    return () => {
      document.documentElement.style.fontSize = '';
    };
  }, [fontScale]);



  // Load user info from localStorage on mount and refresh profile picture from server
  useEffect(() => {
    const savedUser = localStorage.getItem('ureb_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUserInfo(parsed);

      // Refresh profile picture from server to ensure it's up to date
      if (parsed.email) {
        const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
        fetch(`${API_BASE}/users`)
          .then(r => r.json())
          .then(users => {
            const adminUser = Array.isArray(users)
              ? users.find(u => (u.email || '').toLowerCase() === parsed.email.toLowerCase())
              : null;
            if (adminUser) {
              const picUrl = adminUser.profilePictureGridFS
                ? `/api/admin/profile/picture/${adminUser.profilePictureGridFS}?t=${Date.now()}`
                : parsed.profilePicture;
              const updated = {
                ...parsed,
                profilePicture: picUrl,
                originalRole: adminUser.role || parsed.originalRole || 'admin'
              };
              setUserInfo(updated);
              localStorage.setItem('ureb_user', JSON.stringify(updated));
            }
          })
          .catch(() => { });
      }
    }

    // Check if welcome modal has been shown in this login session
    const welcomeShown = sessionStorage.getItem('admin_welcome_shown');
    if (welcomeShown) {
      setShowWelcomeModal(false);
    }
  }, []);



  // Save activeTab to localStorage whenever it changes

  useEffect(() => {

    console.log('Saving active tab to localStorage:', activeTab);

    localStorage.setItem('activeAdminTab', activeTab);

  }, [activeTab]);

  // Fetch message count for badge (incoming student/reviewer submissions only)
  const refreshMessageCount = async () => {
    if (!userInfo?.email) return;
    try {
      const { getMessagesByUser } = await import('../services/api.js');
      const messageList = await getMessagesByUser(userInfo.email);
      const readIds = (() => {
        try {
          return JSON.parse(localStorage.getItem('read_messages') || '[]');
        } catch {
          return [];
        }
      })();
      const unreadMessages = (Array.isArray(messageList) ? messageList : []).filter(
        (m) => !m.read && !readIds.includes(String(m._id))
      );
      setMessageCount(unreadMessages.length);
    } catch (error) {
      console.error('Error fetching message count:', error);
      setMessageCount(0);
    }
  };

  const refreshNotifCount = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`);
      const data = await response.json();
      // Server already excludes dismissed (deleted) notifications.
      const unreadNotifs = data.filter(n => !n.read);
      setNotifCount(unreadNotifs.length);
    } catch (error) {
      console.error('Error fetching notification count:', error);
      setNotifCount(0);
    }
  };

  const refreshStudentProposalNewCount = useCallback(async (countOverride) => {
    if (typeof countOverride === 'number') {
      setStudentProposalNewCount(countOverride);
      return;
    }
    try {
      const { getAllProposals } = await import('../services/api.js');
      const list = await getAllProposals();
      const newCount = (Array.isArray(list) ? list : [])
        .filter(isStudentSubmissionProposal)
        .filter(isStudentProposalNew).length;
      setStudentProposalNewCount(newCount);
    } catch (error) {
      console.error('Error fetching new student proposal count:', error);
      setStudentProposalNewCount(0);
    }
  }, []);

  useEffect(() => {
    refreshMessageCount();
    refreshNotifCount();
    refreshStudentProposalNewCount();
    const interval = setInterval(() => {
      refreshMessageCount();
      refreshNotifCount();
      refreshStudentProposalNewCount();
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo]);

  useEffect(() => {
    if (activeTab === 'student-proposals') {
      refreshStudentProposalNewCount();
    }
    if (activeTab === 'messages-inbox') {
      refreshMessageCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);







  const menuItems = [



    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },

    { id: 'student-proposals', label: 'Researcher Proposals', icon: <FileCheckIcon />, badge: studentProposalNewCount > 0 ? studentProposalNewCount : null },

    { id: 'messages-inbox', label: 'Files And Messages Submitted', icon: <MessageIcon />, badge: messageCount > 0 ? messageCount : null },

    { id: 'mark-completed-review', label: 'Mark Completed Review', icon: <CheckCircleIcon /> },

    { id: 'add-reviewer', label: 'Add Reviewer', icon: <UserPlusIcon /> },

    { id: 'manage-users', label: 'Manage Users', icon: <UsersIcon /> },

    { id: 'message-reviewer', label: 'Message Reviewer', icon: <MessageIcon /> },

    { id: 'message-researcher', label: 'Message Researcher', icon: <MessageIcon /> },

    { id: 'notification', label: 'Notifications', icon: <NotificationIcon />, badge: notifCount > 0 ? notifCount : null },
    { id: 'profile', label: 'Admin Settings', icon: <SettingsIcon /> },
  ];







  const handleLogout = () => {

    setIsLogoutModalOpen(true);

  };



  const confirmLogout = () => {

    setIsLogoutModalOpen(false);

    // Clear welcome modal flag so it shows again on next login

    sessionStorage.removeItem('admin_welcome_shown');

    onLogout();

  };



  const cancelLogout = () => {

    setIsLogoutModalOpen(false);

  };







  const handleProfilePicClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setPicError('Please upload an image file (PNG, JPG, WEBP)');
      setTimeout(() => setPicError(''), 4000);
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setPicError('File size must be less than 2MB');
      setTimeout(() => setPicError(''), 4000);
      return;
    }

    setUploadingPic(true);
    setPicError('');

    try {
      const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
      const formData = new FormData();
      formData.append('profilePicture', file);
      formData.append('email', userInfo.email);

      const response = await fetch(`${API_BASE}/admin/profile/picture`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Add timestamp for cache-busting
        const imageUrlWithCache = `${result.profilePicture}?t=${Date.now()}`;
        const updatedUser = { ...userInfo, profilePicture: imageUrlWithCache };
        setUserInfo(updatedUser);
        localStorage.setItem('ureb_user', JSON.stringify(updatedUser));
        setPicSuccess('Profile picture updated successfully');
        setTimeout(() => setPicSuccess(''), 4000);
      } else {
        setPicError(result.error || 'Failed to upload profile picture');
        setTimeout(() => setPicError(''), 4000);
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setPicError('Failed to upload profile picture');
      setTimeout(() => setPicError(''), 4000);
    } finally {
      setUploadingPic(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleProfilePicDelete = () => {
    setIsDeletePhotoModalOpen(true);
  };

  const confirmDeletePhoto = async () => {
    setIsDeletePhotoModalOpen(false);
    setUploadingPic(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
      const response = await fetch(`${API_BASE}/admin/profile/picture`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userInfo.email }),
      });

      const result = await response.json();
      if (result.success) {
        const updatedUser = { ...userInfo };
        delete updatedUser.profilePicture;
        setUserInfo(updatedUser);
        localStorage.setItem('ureb_user', JSON.stringify(updatedUser));
        setPicSuccess('Profile picture removed');
        setTimeout(() => setPicSuccess(''), 4000);
      } else {
        setPicError(result.error || 'Failed to remove picture');
        setTimeout(() => setPicError(''), 4000);
      }
    } catch (err) {
      console.error('Error deleting profile picture:', err);
      setPicError('Failed to remove picture');
      setTimeout(() => setPicError(''), 4000);
    } finally {
      setUploadingPic(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (pwdData.new !== pwdData.confirm) {
      setPwdError('New passwords do not match');
      return;
    }
    if (pwdData.new.length < 6) {
      setPwdError('Password must be at least 6 characters');
      return;
    }

    setPwdLoading(true);
    setPwdError('');
    setPwdSuccess('');

    try {
      const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
      const response = await fetch(`${API_BASE}/admin/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userInfo.email,
          currentPassword: pwdData.current,
          newPassword: pwdData.new
        }),
      });

      const result = await response.json();
      if (result.success) {
        setPwdSuccess('Password updated successfully');
        setPwdData({ current: '', new: '', confirm: '' });
        setTimeout(() => {
          setShowPasswordForm(false);
          setPwdSuccess('');
        }, 3000);
      } else {
        setPwdError(result.error || 'Failed to update password');
      }
    } catch (err) {
      console.error('Error updating password:', err);
      setPwdError('Server error updating password');
    } finally {
      setPwdLoading(false);
    }
  };

  const renderContent = () => {



    switch (activeTab) {



      case 'dashboard':



        return <DashboardContent />;



      case 'add-reviewer':



        return <AddReviewerContent />;



      case 'mark-completed-review':

        return <MarkCompletedReviewContent onPaginationChange={setMcrPagination} />;

      case 'student-proposals':

        return <StudentProposalContent onNewCountChange={refreshStudentProposalNewCount} onPaginationChange={setProposalsPagination} />;

      case 'message-researcher':



        return <MessageResearcherContent />;



      case 'message-reviewer':



        return <MessageReviewerContent />;



      case 'manage-users':



        return <ManageUsersContent onPaginationChange={setManageUsersPagination} />;



      case 'profile':
        return (
          <AdminProfileContent
            userInfo={userInfo}
            uploadingPic={uploadingPic}
            picError={picError}
            picSuccess={picSuccess}
            fileInputRef={fileInputRef}
            handleProfilePicClick={handleProfilePicClick}
            handleProfilePicUpload={handleProfilePicUpload}
            handleProfilePicDelete={handleProfilePicDelete}
            showPasswordForm={showPasswordForm}
            setShowPasswordForm={setShowPasswordForm}
            pwdData={pwdData}
            setPwdData={setPwdData}
            pwdError={pwdError}
            pwdSuccess={pwdSuccess}
            pwdLoading={pwdLoading}
            handlePasswordUpdate={handlePasswordUpdate}
            showPasswords={showPasswords}
            setShowPasswords={setShowPasswords}
            fontScale={fontScale}
            setFontScale={setFontScale}
          />
        );
      case 'notification':



        return <NotificationContent setActiveTab={setActiveTab} onRefreshCount={refreshNotifCount} />;



      case 'messages-inbox':



        return <MessagesInboxContent onMessageRead={refreshMessageCount} onPaginationChange={setMessagesPagination} />;



      default:



        return <DashboardContent />;



    }



  };







  return (



    <div className="admin-dashboard">



      {/* Welcome Modal */}

      {showWelcomeModal && activeTab === 'dashboard' && (

        <AdminWelcomeModal

          firstName={userInfo.name.split(' ')[0]}

          onClose={() => {

            setShowWelcomeModal(false);

            sessionStorage.setItem('admin_welcome_shown', 'true');

          }}

        />

      )}



      {/* Sidebar */}



      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>



        <div className="sidebar-header">



          <div className="sidebar-logo">



            <img src="/logoureb.png" alt="UREB Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />



            <span>UREB Admin</span>



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



      <main className="main-content">



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



            <div
              className="user-avatar-wrapper"
              onClick={() => setActiveTab('profile')}
              style={{ cursor: 'pointer' }}
              title="Admin Settings"
            >
              {userInfo?.profilePicture ? (
                <img
                  key={userInfo.profilePicture}
                  src={getProfilePicUrl(userInfo.profilePicture)}
                  alt="Profile"
                  className="header-profile-pic"
                  onLoad={(e) => {
                    e.target.style.display = 'block';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'none';
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="user-avatar"
                style={{ display: userInfo?.profilePicture ? 'none' : 'flex' }}
              >
                {userInfo.name.charAt(0).toUpperCase()}
              </div>
            </div>



          </div>



        </header>



        <div className="content-body">



          {renderContent()}



        </div>

        {proposalsPagination && (
          <div className="sp-pagination-floating">
            <span className="sp-pagination-count">
              Showing {proposalsPagination.pageCount} Proposal{proposalsPagination.pageCount !== 1 ? 's' : ''} of {proposalsPagination.pageSize}
            </span>
            <button
              type="button"
              className="sp-pagination-btn"
              disabled={proposalsPagination.currentPage <= 1}
              onClick={() => proposalsPagination.setCurrentPage((p) => Math.max(1, p - 1))}
            >
              ‹ Prev
            </button>
            <span className="sp-pagination-indicator">
              Page <strong>{proposalsPagination.currentPage}</strong> of {proposalsPagination.totalPages}
            </span>
            <button
              type="button"
              className="sp-pagination-btn"
              disabled={proposalsPagination.currentPage >= proposalsPagination.totalPages}
              onClick={() => proposalsPagination.setCurrentPage((p) => Math.min(proposalsPagination.totalPages, p + 1))}
            >
              Next ›
            </button>
          </div>
        )}

        {messagesPagination && (
          <div className="sp-pagination-floating">
            <span className="sp-pagination-count">
              Showing {messagesPagination.pageCount} Message{messagesPagination.pageCount !== 1 ? 's' : ''} of {messagesPagination.pageSize}
            </span>
            <button
              type="button"
              className="sp-pagination-btn"
              disabled={messagesPagination.currentPage <= 1}
              onClick={() => messagesPagination.setCurrentPage((p) => Math.max(1, p - 1))}
            >
              ‹ Prev
            </button>
            <span className="sp-pagination-indicator">
              Page <strong>{messagesPagination.currentPage}</strong> of {messagesPagination.totalPages}
            </span>
            <button
              type="button"
              className="sp-pagination-btn"
              disabled={messagesPagination.currentPage >= messagesPagination.totalPages}
              onClick={() => messagesPagination.setCurrentPage((p) => Math.min(messagesPagination.totalPages, p + 1))}
            >
              Next ›
            </button>
          </div>
        )}

        {mcrPagination && (
          <div className="sp-pagination-floating">
            <span className="sp-pagination-count">
              Showing {mcrPagination.pageCount} Assignment{mcrPagination.pageCount !== 1 ? 's' : ''} of {mcrPagination.pageSize}
            </span>
            <button
              type="button"
              className="sp-pagination-btn"
              disabled={mcrPagination.currentPage <= 1}
              onClick={() => mcrPagination.setCurrentPage((p) => Math.max(1, p - 1))}
            >
              ‹ Prev
            </button>
            <span className="sp-pagination-indicator">
              Page <strong>{mcrPagination.currentPage}</strong> of {mcrPagination.totalPages}
            </span>
            <button
              type="button"
              className="sp-pagination-btn"
              disabled={mcrPagination.currentPage >= mcrPagination.totalPages}
              onClick={() => mcrPagination.setCurrentPage((p) => Math.min(mcrPagination.totalPages, p + 1))}
            >
              Next ›
            </button>
          </div>
        )}

        {manageUsersPagination && (
          <div className="sp-pagination-floating">
            <span className="sp-pagination-count">
              Showing {manageUsersPagination.pageCount} {manageUsersPagination.label}{manageUsersPagination.pageCount !== 1 ? 's' : ''} of {manageUsersPagination.pageSize}
            </span>
            <button
              type="button"
              className="sp-pagination-btn"
              disabled={manageUsersPagination.currentPage <= 1}
              onClick={() => manageUsersPagination.setCurrentPage((p) => Math.max(1, p - 1))}
            >
              ‹ Prev
            </button>
            <span className="sp-pagination-indicator">
              Page <strong>{manageUsersPagination.currentPage}</strong> of {manageUsersPagination.totalPages}
            </span>
            <button
              type="button"
              className="sp-pagination-btn"
              disabled={manageUsersPagination.currentPage >= manageUsersPagination.totalPages}
              onClick={() => manageUsersPagination.setCurrentPage((p) => Math.min(manageUsersPagination.totalPages, p + 1))}
            >
              Next ›
            </button>
          </div>
        )}

      </main>



      <LogoutModal isOpen={isLogoutModalOpen} onClose={cancelLogout} onConfirm={confirmLogout} />
      <ConfirmDeletePhotoModal isOpen={isDeletePhotoModalOpen} onClose={() => setIsDeletePhotoModalOpen(false)} onConfirm={confirmDeletePhoto} />

    </div>



  );



};







// Content Components



const DashboardContent = () => {



  const [isReviewerModalOpen, setIsReviewerModalOpen] = useState(false);



  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);



  const [isPendingProposalsModalOpen, setIsPendingProposalsModalOpen] = useState(false);



  const [isGenerateReportModalOpen, setIsGenerateReportModalOpen] = useState(false);



  const [searchQuery, setSearchQuery] = useState('');



  const [stats, setStats] = useState({



    totalProposals: 0,
    pendingReviews: 0,
    approved: 0,
    activeReviewers: 0,
    totalResearchers: 0,
    studentProposals: 0,
    reviewerProposals: 0,
    onlineResearchers: 0,
    onlineReviewers: 0,
    onlineResearchersNames: [],
    onlineReviewersNames: []



  });



  const [recentActivity, setRecentActivity] = useState([]);
  const [deletedActivityIds, setDeletedActivityIds] = useState(() => {
    const saved = localStorage.getItem('deleted_admin_activities');
    return saved ? JSON.parse(saved) : [];
  });
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const ACTIVITY_LIMIT = 5;



  const [activityLoading, setActivityLoading] = useState(true);







  useEffect(() => {



    // Fetch dashboard stats from API



    const fetchStats = async () => {
      try {
        const { getDashboardStats, getAllProposals, API_BASE_URL } = await import('../services/api.js');

        // Fetch base stats and all proposals in parallel
        const [statsData, allProposals] = await Promise.all([
          getDashboardStats(),
          getAllProposals()
        ]);

        // Count student-submitted proposals client-side (most reliable).
        // Uses the same filter as the Researcher Proposal sidebar (StudentProposalContent)
        // so this stat card matches the actual list of submissions shown there.
        const studentProposalCount = allProposals.filter(isStudentSubmissionProposal).length;

        // Count reviewer submissions from /api/reviews count
        let reviewerSubmissionCount = 0;
        try {
          const reviewsRes = await fetch(`${API_BASE_URL}/reviews/count`);
          if (reviewsRes.ok) {
            const reviewsData = await reviewsRes.json();
            reviewerSubmissionCount = reviewsData.count || 0;
          }
        } catch (_) {
          // fallback: use value from stats endpoint
          reviewerSubmissionCount = statsData.reviewerProposals || 0;
        }

        setStats({
          ...statsData,
          // Total Proposals mirrors the Researcher Proposals count so this
          // stat card always matches the Researcher Proposals sidebar list.
          totalProposals: studentProposalCount,
          studentProposals: studentProposalCount,
          reviewerProposals: reviewerSubmissionCount
        });

      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();

    // Keep the "System Realtime" Active Researchers/Reviewers cards fresh
    // without a manual refresh — heartbeats land server-side every 60s, so
    // poll a bit faster than that.
    const realtimeInterval = setInterval(fetchStats, 30 * 1000);
    return () => clearInterval(realtimeInterval);

  }, []);








  useEffect(() => {



    // Fetch recent activity from API



    const fetchRecentActivity = async () => {



      try {



        const { getAllProposals, getAllUsers } = await import('../services/api.js');



        const proposals = await getAllProposals();



        const users = await getAllUsers();







        // Create activity items from recent proposals



        const activities = proposals



          .sort((a, b) => {
            const dateA = new Date(a.submissionDate || a.createdAt || 0);
            const dateB = new Date(b.submissionDate || b.createdAt || 0);
            return dateB - dateA;
          })



          .slice(0, 5)



          .map(proposal => ({

            id: proposal._id,

            type: 'proposal',



            title: 'New Proposal Submitted',



            description: `${proposal.protocolCode ? 'Protocol ' + proposal.protocolCode : 'Proposal'}: "${proposal.researchTitle || proposal.title || 'Untitled'}"${(proposal.proponent || proposal.studentName) ? ' — by ' + (proposal.proponent || proposal.studentName) : ''}`,



            timestamp: proposal.submissionDate || proposal.createdAt || new Date(),



            icon: 'FilePlus'



          }));








        setRecentActivity(activities);



      } catch (error) {



        console.error('Error fetching recent activity:', error);



      } finally {



        setActivityLoading(false);



      }



    };







    fetchRecentActivity();



  }, []);







  const openReviewerModal = () => setIsReviewerModalOpen(true);



  const closeReviewerModal = () => setIsReviewerModalOpen(false);



  const openStudentModal = () => setIsStudentModalOpen(true);



  const closeStudentModal = () => setIsStudentModalOpen(false);



  const openPendingProposalsModal = () => setIsPendingProposalsModalOpen(true);



  const closePendingProposalsModal = () => setIsPendingProposalsModalOpen(false);



  const openGenerateReportModal = () => setIsGenerateReportModalOpen(true);



  const closeGenerateReportModal = () => setIsGenerateReportModalOpen(false);



  const handleDeleteActivity = (e, activityId) => {
    e.stopPropagation();
    setActivityToDelete(activityId);
    setDeleteModalOpen(true);
  };

  const confirmDeleteActivity = () => {
    if (activityToDelete) {
      const updatedDeletedIds = [...deletedActivityIds, activityToDelete];
      setDeletedActivityIds(updatedDeletedIds);
      localStorage.setItem('deleted_admin_activities', JSON.stringify(updatedDeletedIds));
      setDeleteModalOpen(false);
      setActivityToDelete(null);
    }
  };

  const filteredActivity = recentActivity.filter(activity => !deletedActivityIds.includes(activity.id));









  return (



    <div className="dashboard-content">



      <div className="stats-grid">



        <div className="stat-card">



          <div className="stat-icon proposals">



            <FilePlusIcon />



          </div>



          <div className="stat-info">



            <h3>{stats.totalProposals}</h3>



            <p>Total Proposals</p>



          </div>



        </div>



        {/* Student Proposals Submitted */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="stat-info">
            <h3>{stats.studentProposals}</h3>
            <p>Researcher Proposals</p>
          </div>
        </div>

        <div className="stat-card">



          <div className="stat-icon pending">



            <DashboardIcon />



          </div>



          <div className="stat-info">



            <h3>{stats.pendingReviews}</h3>



            <p>Under Review</p>



          </div>



        </div>



        <div className="stat-card">



          <div className="stat-icon approved">



            <ShieldIcon />



          </div>



          <div className="stat-info">



            <h3>{stats.approved}</h3>



            <p>Completed</p>



          </div>



        </div>



        <div className="stat-card">



          <div className="stat-icon reviewers">



            <UsersIcon />



          </div>



          <div className="stat-info">



            <h3>{stats.activeReviewers}</h3>



            <p>Reviewers</p>



          </div>



        </div>

        {/* Total Researchers registered */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #14b8a6, #0ea5e9)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
            </svg>
          </div>
          <div className="stat-info">
            <h3>{stats.totalResearchers}</h3>
            <p>Researchers</p>
          </div>
        </div>

        {/* System Realtime: Researchers currently logged in */}
        <div className="stat-card realtime">
          <span className="stat-live-badge" title="Updates automatically">
            <span className="stat-live-dot"></span>
            Live
          </span>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <polyline points="17 11 19 13 23 9" />
            </svg>
          </div>
          <div className="stat-info">
            <h3>{stats.onlineResearchers ?? 0}</h3>
            <p>Active Researchers</p>
          </div>
          <div className="stat-tooltip">
            <div className="stat-tooltip-title">Active Researchers</div>
            {(stats.onlineResearchersNames && stats.onlineResearchersNames.length > 0) ? (
              <ul>
                {stats.onlineResearchersNames.map((name, idx) => (
                  <li key={idx}>{name}</li>
                ))}
              </ul>
            ) : (
              <p className="stat-tooltip-empty">No researchers currently active</p>
            )}
          </div>
        </div>

        {/* System Realtime: Reviewers currently logged in */}
        <div className="stat-card realtime">
          <span className="stat-live-badge" title="Updates automatically">
            <span className="stat-live-dot"></span>
            Live
          </span>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div className="stat-info">
            <h3>{stats.onlineReviewers ?? 0}</h3>
            <p>Active Reviewers</p>
          </div>
          <div className="stat-tooltip">
            <div className="stat-tooltip-title">Active Reviewers</div>
            {(stats.onlineReviewersNames && stats.onlineReviewersNames.length > 0) ? (
              <ul>
                {stats.onlineReviewersNames.map((name, idx) => (
                  <li key={idx}>{name}</li>
                ))}
              </ul>
            ) : (
              <p className="stat-tooltip-empty">No reviewers currently active</p>
            )}
          </div>
        </div>

      </div>














      <div className="dashboard-sections">



        <div className="recent-activity">



          <h2>Recent Activity</h2>



          <div className="activity-list">



            {activityLoading ? (



              <div className="activity-item" style={{ justifyContent: 'center', padding: '2rem' }}>



                <p style={{ color: 'var(--text-medium)' }}>Loading activity...</p>



              </div>



            ) : recentActivity.length === 0 ? (



              <div className="activity-item" style={{ justifyContent: 'center', padding: '2rem' }}>



                <p style={{ color: 'var(--text-medium)' }}>No recent activity</p>



              </div>



            ) : (



              <>



                <div style={{ maxHeight: showAllActivity ? 'none' : '400px', overflow: showAllActivity ? 'visible' : 'auto' }}>



                  {(showAllActivity ? filteredActivity : filteredActivity.slice(0, ACTIVITY_LIMIT)).map((activity) => (



                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon">
                        {activity.icon === 'FilePlus' ? <FilePlusIcon /> : <DashboardIcon />}
                      </div>
                      <div className="activity-content">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                          <h4 style={{ margin: 0 }}>{activity.title}</h4>
                          {activity.status && (
                            <span className="activity-status-badge" style={{
                              fontSize: '10px',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: (statusColors[activity.status.toLowerCase()]?.bg || '#f1f5f9'),
                              color: (statusColors[activity.status.toLowerCase()]?.color || '#475569'),
                              fontWeight: '600',
                              textTransform: 'uppercase'
                            }}>
                              {activity.status}
                            </span>
                          )}
                        </div>
                        <p>{activity.description}</p>
                        <span className="activity-time">
                          {(() => {
                            const d = activity.timestamp ? new Date(activity.timestamp) : null;
                            const isValid = d && !isNaN(d.getTime());
                            return isValid
                              ? `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                              : 'Just now';
                          })()}
                        </span>
                      </div>

                      <button
                        className="delete-activity-btn"
                        onClick={(e) => handleDeleteActivity(e, activity.id)}
                        title="Remove activity"
                      >
                        <Trash2Icon />
                      </button>



                    </div>



                  ))}



                </div>



                {filteredActivity.length > ACTIVITY_LIMIT && (




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







      <ViewReviewerSubmissionsModal isOpen={isReviewerModalOpen} onClose={closeReviewerModal} />



      <StudentSubmissionsModal isOpen={isStudentModalOpen} onClose={closeStudentModal} />



      <PendingProposalsModal isOpen={isPendingProposalsModalOpen} onClose={closePendingProposalsModal} />



      <GenerateReportModal isOpen={isGenerateReportModalOpen} onClose={closeGenerateReportModal} />

      <DeleteActivityModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteActivity}
      />

    </div>




  );

};







const AddReviewerContent = () => {

  // Initialize state with localStorage data if available

  const getInitialFormData = () => {

    const savedFormData = localStorage.getItem('addReviewerForm');

    const defaultFormData = {

      firstName: '',

      middleName: '',

      lastName: '',

      title: '',

      gender: '',

      email: '',

      password: '',

      department: '',

      reviewerType: ''

    };

    if (savedFormData) {

      try {

        const parsed = JSON.parse(savedFormData);

        return { ...defaultFormData, ...parsed };

      } catch (error) {

        console.error('Error parsing saved form data:', error);

        localStorage.removeItem('addReviewerForm');

      }

    }

    return defaultFormData;

  };



  const [formData, setFormData] = useState(getInitialFormData());

  const [loading, setLoading] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [showErrorModal, setShowErrorModal] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');



  // Save form data to localStorage whenever it changes

  useEffect(() => {

    localStorage.setItem('addReviewerForm', JSON.stringify(formData));

  }, [formData]);



  // Generate password based on first name initial, last name, and random 2 digits

  const generatePassword = (firstName, lastName) => {

    if (!firstName || !lastName) return '';

    const firstInitial = firstName.charAt(0).toUpperCase();

    const lastNameClean = lastName.replace(/\s/g, '').toUpperCase();

    const randomDigits = Math.floor(10 + Math.random() * 90); // Generate 2-digit number (10-99)

    return `${firstInitial}${lastNameClean}${randomDigits}`;

  };



  // Update password when first or last name changes

  useEffect(() => {

    if (formData.firstName && formData.lastName) {

      const generatedPassword = generatePassword(formData.firstName, formData.lastName);

      setFormData(prev => ({

        ...prev,

        password: generatedPassword

      }));

    }

  }, [formData.firstName, formData.lastName]);



  const handleInputChange = (e) => {

    const { name, value } = e.target;



    setFormData(prev => ({

      ...prev,

      [name]: value

    }));

  };

  const handleCancel = () => {
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      title: '',
      gender: '',
      email: '',
      password: '',
      department: '',
      reviewerType: ''
    });
    localStorage.removeItem('addReviewerForm');
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);



    // Validation: Check if department is selected

    if (!formData.department || formData.department.trim() === '') {

      setErrorMessage('Please select a department.');

      setShowErrorModal(true);

      setLoading(false);

      return;

    }



    // Validation: Check if department value is valid (not random string)

    const validDepartments = [

      'FALS', 'FTED', 'FAIS', 'FNAHS', 'FBM', 'FCJE', 'FACET',

      'FHUSOCOM', 'SIEC', 'BEC', 'CEC', 'BGEC', 'TEC',

      'NSTP', 'ICS', 'Community Representatives', 'UREB Board'

    ];

    try {
      const { addReviewer } = await import('../services/api');

      const payload = {
        ...formData,
        role: 'reviewer',
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        status: 'active'
      };

      const result = await addReviewer(payload);

      if (result && result.success === false) {
        setErrorMessage(result.error || 'Failed to add reviewer.');
        setShowErrorModal(true);
        setLoading(false);
        return;
      }

      setShowSuccessModal(true);

      // Clear form and localStorage
      setFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        title: '',
        gender: '',
        email: '',
        password: '',
        department: '',
        reviewerType: ''
      });
      localStorage.removeItem('addReviewerForm');
    } catch (err) {
      console.error('Submit error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };



  return (

    <div className="form-content full-width">

      <div className="form-card">

        <h2>Add New Reviewer</h2>

        <form className="reviewer-form" onSubmit={handleSubmit}>

          <div className="form-row">

            <div className="form-group">

              <label>First Name</label>

              <input

                type="text"

                name="firstName"

                placeholder="Enter first name"

                value={formData.firstName}

                onChange={handleInputChange}

              />

            </div>

            <div className="form-group">

              <label>Middle Name (optional)</label>

              <input

                type="text"

                name="middleName"

                placeholder="Enter middle name"

                value={formData.middleName || ''}

                onChange={handleInputChange}

              />

            </div>

            <div className="form-group">

              <label>Last Name</label>

              <input

                type="text"

                name="lastName"

                placeholder="Enter last name"

                value={formData.lastName}

                onChange={handleInputChange}

              />

            </div>

            <div className="form-group">

              <label>Title (optional)</label>

              <select

                name="title"

                value={formData.title || ''}

                onChange={handleInputChange}

              >

                <option value="">None</option>

                <option value="Doctor">Doctor (Dr.)</option>

                <option value="Engineer">Engineer (Engr.)</option>

                <option value="Professor">Professor (Prof.)</option>

                <option value="RN">RN</option>

                <option value="LPT">LPT</option>

                <option value="MSN">MSN</option>

                <option value="RN/LPT">RN/LPT</option>

                <option value="RN/MSN">RN/MSN</option>

                <option value="MIT">MIT</option>

                <option value="DBM">DBM</option>

              </select>

            </div>

            <div className="form-group">
              <label>Sex</label>
              <select
                name="gender"
                value={formData.gender || ''}
                onChange={handleInputChange}
              >
                <option value="">Select Sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Email Address</label>

            <input

              type="email"

              name="email"

              placeholder="reviewer@university.edu"

              value={formData.email}

              onChange={handleInputChange}

            />

          </div>

          <div className="form-group">

            <label>Generated Password</label>

            <input

              type="text"

              name="password"

              placeholder="Auto-generated password"

              value={formData.password}

              readOnly

              className="generated-password"

            />

            <small className="password-hint">Password is automatically generated based on first name initial + last name + 2 random digits</small>

          </div>

          <div className="form-row">

            <div className="form-group">

              <label>Faculty</label>

              <select

                name="department"

                value={formData.department}

                onChange={handleInputChange}

              >

                <option value="">Select Faculty</option>

                <option value="FALS">FALS-Faculty of Agriculture and Life Sciences</option>

                <option value="FTED">FTED- Faculty of Teacher Education</option>

                <option value="FAIS">FAIS-Faculty of Advance and International Studies</option>

                <option value="FNAHS">FNAHS-Faculty of Nursing and Allied Health Science</option>

                <option value="FBM">FBM-Faculty of Business Management</option>

                <option value="FCJE">FCJE-Faculty of Criminology Justice Education</option>

                <option value="FACET">FACET-Faculty of Computing, Engineering, Technology</option>

                <option value="FHUSOCOM">FHUSOCOM-Faculty of Humanities, Social Science & Communication</option>

                <option value="SIEC">SIEC- San Isidro Extension Campus</option>

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

          <div className="form-actions">

            <button type="submit" className="btn-primary" disabled={loading}>

              {loading ? 'Adding...' : 'Add Reviewer'}

            </button>

            <button type="button" className="btn-secondary" onClick={handleCancel}>Cancel</button>

          </div>

        </form>

      </div>



      {/* Success Modal */}

      {showSuccessModal && (

        <div className="success-modal-overlay">

          <div className="success-modal-container">

            <div className="success-content">

              <div className="success-checkmark">✓</div>

              <h3>Reviewer Added Successfully!</h3>

              <p>The new reviewer has been created and added to the system.</p>

              <button className="success-close-btn" onClick={() => setShowSuccessModal(false)}>

                OK

              </button>

            </div>

          </div>

        </div>

      )}



      {/* Error Modal */}

      {showErrorModal && (

        <div className="error-modal-overlay">

          <div className="error-modal-container">

            <div className="error-content">

              <div className="error-icon">✕</div>
              <h3>{errorMessage?.toLowerCase().includes('email') ? 'Email Already Exists' : 'Action Failed'}</h3>
              <p>{errorMessage}</p>

              <button className="error-close-btn" onClick={() => setShowErrorModal(false)}>

                OK

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

};







// Normalize MongoDB ObjectId / string ids from API responses
const toRecordId = (value) => {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') {
    if (value.$oid) return String(value.$oid).trim();
    if (value._id) return toRecordId(value._id);
    if (typeof value.toString === 'function') {
      const s = value.toString();
      if (s && s !== '[object Object]') return s.trim();
    }
  }
  const str = String(value);
  return str === '[object Object]' ? '' : str.trim();
};

const normalizeMcrStatus = (status) => {
  const s = String(status || '').toLowerCase().trim();
  if (s === 'completed') return 'completed';
  return 'under review';
};

const getMcrRowKey = (row) => row.assignmentId || row.proposalId || row.protocolCode;

const STUDENT_PROPOSAL_DEPARTMENTS = [
  { value: 'Institution/Agency', label: 'Institution/Agency' },
  { value: 'FALS', label: 'FALS — Faculty of Agriculture and Life Sciences' },
  { value: 'FTED', label: 'FTED — Faculty of Teacher Education' },
  { value: 'FAIS', label: 'FAIS — Faculty of Advance and International Studies' },
  { value: 'FNAHS', label: 'FNAHS — Faculty of Nursing and Allied Health Science' },
  { value: 'FBM', label: 'FBM — Faculty of Business Management' },
  { value: 'FCJE', label: 'FCJE — Faculty of Criminology Justice Education' },
  { value: 'FACET', label: 'FACET — Faculty of Computing, Engineering, Technology' },
  { value: 'FHUSOCOM', label: 'FHUSOCOM — Faculty of Humanities, Social Science & Communication' },
  { value: 'SIEC', label: 'SIEC — San Isidro Extension Campus' },
  { value: 'BEC', label: 'BEC — BanayBanay Extension Campus' },
  { value: 'CEC', label: 'CEC — Cateel Extension Campus' },
  { value: 'BGEC', label: 'BGEC — Baganga Extension Campus' },
  { value: 'TEC', label: 'TEC — Tarragona Extension Campus' },
  { value: 'NSTP', label: 'NSTP — National Service Training Program' },
  { value: 'ICS', label: 'ICS — Indigenous Community Studies' },
  { value: 'Community Representatives', label: 'Community Representatives' },
  { value: 'UREB Board', label: 'UREB Board — University Research Ethics Board' },
];

const DEPARTMENT_ORDER = STUDENT_PROPOSAL_DEPARTMENTS.reduce((acc, d, idx) => {
  acc[d.value] = idx;
  return acc;
}, {});
const DEPARTMENT_LABELS = STUDENT_PROPOSAL_DEPARTMENTS.reduce((acc, d) => {
  acc[d.value] = d.label;
  return acc;
}, {});

const UNASSIGNED_FACULTY_KEY = '__unassigned__';
const UNASSIGNED_FACULTY_LABEL = 'No Faculty Assigned';

// Resolves a raw reviewer department value (which may be blank, mis-cased,
// or padded with whitespace) to the canonical faculty code so reviewers
// group under the correct faculty instead of stray one-off buckets.
const normalizeFacultyKey = (dept) => {
  const raw = String(dept || '').trim();
  if (!raw) return UNASSIGNED_FACULTY_KEY;
  const match = STUDENT_PROPOSAL_DEPARTMENTS.find(d => d.value.toUpperCase() === raw.toUpperCase());
  return match ? match.value : raw;
};

const getFacultyLabel = (key) => {
  if (key === UNASSIGNED_FACULTY_KEY) return UNASSIGNED_FACULTY_LABEL;
  return DEPARTMENT_LABELS[key] || key;
};

const STUDENT_SUBMISSION_FILE_LABELS = {
  proposal: 'Research Proposal',
  approvalSheet: 'Approval Sheet',
  urebForm2: 'UREB Form 2',
  applicationForm6: 'Application Form 6',
  accomplishedForm8: 'Accomplished Form 8',
  accomplishedForm10A: 'Accomplished Form 10-A',
  instrumentTool: 'Research Instrument / Tool',
  ethicsReviewFee: 'Ethics Review Fee Receipt',
  sampleForm1: 'Sample Form 1',
  sampleForm2: 'Sample Form 2',
};

const getProposalStudentFiles = (proposal) => {
  if (!proposal) return {};
  const source = proposal.studentFiles && typeof proposal.studentFiles === 'object'
    ? proposal.studentFiles
    : proposal.files || {};
  return Object.fromEntries(
    Object.entries(source).filter(([key, file]) => (
      Object.prototype.hasOwnProperty.call(STUDENT_SUBMISSION_FILE_LABELS, key) && file?.filename
    ))
  );
};

// Admin-uploaded attachments use dynamically-generated field names
// (attachment_0, attachment_<timestamp>_<n>, ...) rather than a fixed key list.
const getProposalAdminAttachments = (proposal) => {
  if (!proposal) return {};
  const source = proposal.adminFiles && typeof proposal.adminFiles === 'object'
    ? proposal.adminFiles
    : proposal.files || {};
  return Object.fromEntries(
    Object.entries(source).filter(([key, file]) => /^attachment(_|$)/.test(key) && file?.filename)
  );
};

const isPreliminaryReviewerRole = (reviewer) => {
  const type = String(reviewer.reviewerType || '').toLowerCase();
  return !type || type === 'preliminary' || type === 'both';
};

const getReviewerDisplayName = (reviewer) => {
  if (!reviewer) return '';
  return reviewer.name
    || `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim()
    || reviewer.email
    || '';
};

// ── Student Proposal (admin assigns reviewers) ─────
function StudentProposalContent({ onNewCountChange, onPaginationChange }) {
  const [proposals, setProposals] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposalId, setSelectedProposalId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeletingProposal, setIsDeletingProposal] = useState(false);
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);
  const [showLeftScrollIndicator, setShowLeftScrollIndicator] = useState(false);
  const [showRightScrollIndicator, setShowRightScrollIndicator] = useState(false);

  const checkLeftScroll = useCallback(() => {
    if (leftPanelRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = leftPanelRef.current;
      setShowLeftScrollIndicator(scrollHeight - scrollTop - clientHeight > 30);
    }
  }, []);

  const checkRightScroll = useCallback(() => {
    if (rightPanelRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = rightPanelRef.current;
      setShowRightScrollIndicator(scrollHeight - scrollTop - clientHeight > 30);
    }
  }, []);

  useEffect(() => {
    if (selectedProposalId) {
      const timer = setTimeout(() => {
        checkLeftScroll();
        checkRightScroll();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setShowLeftScrollIndicator(false);
      setShowRightScrollIndicator(false);
    }
  }, [selectedProposalId, checkLeftScroll, checkRightScroll]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { getAllProposals, getAllReviewers, getAllStudents } = await import('../services/api.js');
      const API = import.meta.env.VITE_API_URL || '';
      const [proposalsData, reviewersData, studentsData, assignmentsRes] = await Promise.all([
        getAllProposals(),
        getAllReviewers(),
        getAllStudents(),
        fetch(`${API}/api/assignments`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]);
      const list = Array.isArray(proposalsData) ? proposalsData : [];
      const studentOnly = list.filter(isStudentSubmissionProposal);
      setProposals(studentOnly);
      onNewCountChange?.(studentOnly.filter(isStudentProposalNew).length);
      setReviewers(Array.isArray(reviewersData) ? reviewersData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setAssignments(Array.isArray(assignmentsRes) ? assignmentsRes : []);
    } catch (err) {
      console.error('Error loading student proposals:', err);
      setProposals([]);
      setReviewers([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [onNewCountChange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const applyProposalSeen = useCallback((proposalId, adminSeenAt) => {
    setProposals((prev) => {
      const target = prev.find((p) => toRecordId(p._id) === proposalId);
      if (!target || !isStudentProposalNew(target)) return prev;

      const seenAt = adminSeenAt || new Date().toISOString();
      const next = prev.map((p) => (
        toRecordId(p._id) === proposalId
          ? { ...p, adminSeen: true, adminSeenAt: seenAt }
          : p
      ));
      onNewCountChange?.(next.filter(isStudentProposalNew).length);
      return next;
    });
  }, [onNewCountChange]);

  const handleProposalRowClick = useCallback(async (proposalId) => {
    setSelectedProposalId(proposalId);

    const target = proposals.find((p) => toRecordId(p._id) === proposalId);
    const wasNew = Boolean(target && isStudentProposalNew(target));

    if (wasNew) {
      const seenAt = new Date().toISOString();
      setProposals((prev) => {
        const next = prev.map((p) => (
          toRecordId(p._id) === proposalId
            ? { ...p, adminSeen: true, adminSeenAt: seenAt }
            : p
        ));
        onNewCountChange?.(next.filter(isStudentProposalNew).length);
        return next;
      });

      try {
        const { markStudentProposalSeen } = await import('../services/api.js');
        const result = await markStudentProposalSeen(proposalId);
        if (!result.success) {
          await loadData();
          onNewCountChange?.();
          return;
        }
        applyProposalSeen(proposalId, result.adminSeenAt);
      } catch (err) {
        console.error('Error marking proposal as seen:', err);
        await loadData();
        onNewCountChange?.();
      }
    }
  }, [proposals, applyProposalSeen, loadData, onNewCountChange]);

  const getReviewersForDepartment = useCallback((department) => {
    const dept = String(department || '').trim().toUpperCase();
    if (!dept) return [];
    return reviewers
      .filter((r) => isPreliminaryReviewerRole(r))
      .filter((r) => String(r.department || '').trim().toUpperCase() === dept)
      .filter((r) => r.email);
  }, [reviewers]);

  const [submissionTypeFilter, setSubmissionTypeFilter] = useState('all'); // 'all' | 'first' | 'resubmission'
  const [facultyFilter, setFacultyFilter] = useState(''); // '' = all faculties
  const [departmentFilter, setDepartmentFilter] = useState(''); // '' = all departments/programs
  const [researcherFilter, setResearcherFilter] = useState(''); // '' = all researchers

  // Map each student's email to their program/department (the specific unit
  // within a faculty, e.g. "BS Computer Science" under FACET), so proposals
  // — which only store the faculty — can be filtered by that sub-department.
  const studentProgramByEmail = useMemo(() => {
    const map = new Map();
    students.forEach((s) => {
      const email = String(s.email || '').trim().toLowerCase();
      if (email) map.set(email, (s.program || '').trim());
    });
    return map;
  }, [students]);

  const getProposalProgram = useCallback((proposal) => {
    const email = String(proposal.studentEmail || '').trim().toLowerCase();
    return (email && studentProgramByEmail.get(email)) || proposal.program || '';
  }, [studentProgramByEmail]);

  // Only list faculties/departments that actually have submissions, so the
  // dropdown stays short and relevant to this proposal list.
  const facultyFilterOptions = useMemo(() => {
    const present = new Set(proposals.map((p) => normalizeFacultyKey(p.department)));
    return STUDENT_PROPOSAL_DEPARTMENTS.filter((d) => present.has(d.value));
  }, [proposals]);

  // Departments/programs, narrowed to the selected faculty (if any).
  const departmentFilterOptions = useMemo(() => {
    const scoped = facultyFilter
      ? proposals.filter((p) => normalizeFacultyKey(p.department) === facultyFilter)
      : proposals;
    const names = new Set(scoped.map((p) => getProposalProgram(p).trim()).filter(Boolean));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [proposals, facultyFilter, getProposalProgram]);

  // Researcher names, narrowed to the selected faculty and department (if any),
  // so picking those first shortens the researcher list.
  const researcherFilterOptions = useMemo(() => {
    let scoped = proposals;
    if (facultyFilter) scoped = scoped.filter((p) => normalizeFacultyKey(p.department) === facultyFilter);
    if (departmentFilter) scoped = scoped.filter((p) => getProposalProgram(p).trim() === departmentFilter);
    const names = new Set(scoped.map((p) => (p.proponent || '').trim()).filter(Boolean));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [proposals, facultyFilter, departmentFilter, getProposalProgram]);

  // If the faculty filter changes and the currently selected department/
  // researcher no longer applies under it, clear those filters.
  useEffect(() => {
    if (departmentFilter && !departmentFilterOptions.includes(departmentFilter)) {
      setDepartmentFilter('');
    }
  }, [departmentFilterOptions, departmentFilter]);

  useEffect(() => {
    if (researcherFilter && !researcherFilterOptions.includes(researcherFilter)) {
      setResearcherFilter('');
    }
  }, [researcherFilterOptions, researcherFilter]);

  const filteredProposals = useMemo(() => {
    let result = proposals;
    if (submissionTypeFilter === 'first') {
      result = result.filter(p => !p.isResubmissionProposal && p.submissionType !== 'resubmission');
    } else if (submissionTypeFilter === 'resubmission') {
      result = result.filter(p => p.isResubmissionProposal === true || p.submissionType === 'resubmission');
    }

    if (facultyFilter) {
      result = result.filter((p) => normalizeFacultyKey(p.department) === facultyFilter);
    }

    if (departmentFilter) {
      result = result.filter((p) => getProposalProgram(p).trim() === departmentFilter);
    }

    if (researcherFilter) {
      result = result.filter((p) => (p.proponent || '').trim() === researcherFilter);
    }

    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter((p) => {
      const title = (p.researchTitle || '').toLowerCase();
      const student = (p.proponent || p.studentEmail || '').toLowerCase();
      const dept = (p.department || '').toLowerCase();
      const reviewer = (p.preliminaryReviewerName || p.preliminaryReviewer || '').toLowerCase();
      return title.includes(q) || student.includes(q) || dept.includes(q) || reviewer.includes(q);
    });
  }, [proposals, searchQuery, submissionTypeFilter, facultyFilter, departmentFilter, researcherFilter, getProposalProgram]);

  const firstSubmissionsCount = useMemo(() => proposals.filter(p => !p.isResubmissionProposal && p.submissionType !== 'resubmission').length, [proposals]);
  const resubmissionsCount = useMemo(() => proposals.filter(p => p.isResubmissionProposal === true || p.submissionType === 'resubmission').length, [proposals]);

  const SP_PAGE_SIZE = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredProposals.length / SP_PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, submissionTypeFilter, facultyFilter, departmentFilter, researcherFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedProposals = useMemo(() => {
    const start = (currentPage - 1) * SP_PAGE_SIZE;
    return filteredProposals.slice(start, start + SP_PAGE_SIZE);
  }, [filteredProposals, currentPage]);

  useEffect(() => {
    if (!onPaginationChange) return;
    if (loading || filteredProposals.length === 0) {
      onPaginationChange(null);
      return;
    }
    onPaginationChange({
      currentPage,
      totalPages,
      pageSize: SP_PAGE_SIZE,
      pageCount: paginatedProposals.length,
      total: filteredProposals.length,
      setCurrentPage,
    });
  }, [onPaginationChange, loading, filteredProposals.length, paginatedProposals.length, currentPage, totalPages]);

  useEffect(() => () => onPaginationChange?.(null), [onPaginationChange]);

  useEffect(() => {
    if (!filteredProposals.length) {
      setSelectedProposalId('');
      return;
    }
    const stillVisible = filteredProposals.some((p) => toRecordId(p._id) === selectedProposalId);
    if (!stillVisible) setSelectedProposalId('');
  }, [filteredProposals, selectedProposalId]);

  const formatDate = (d) => (d
    ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—');

  const newCount = proposals.filter(isStudentProposalNew).length;

  const isProposalAssigned = useCallback((proposal) => {
    const propIdStr = toRecordId(proposal?._id);
    return assignments.some((a) => {
      const aPropId = toRecordId(a.proposalId);
      if (aPropId && propIdStr && aPropId === propIdStr) return true;
      if (a.protocolCode && proposal?.protocolCode && a.protocolCode === proposal.protocolCode) return true;
      return false;
    });
  }, [assignments]);

  const selectedProposal = filteredProposals.find((p) => toRecordId(p._id) === selectedProposalId) || null;
  const isSelectedProposalAssigned = selectedProposal ? isProposalAssigned(selectedProposal) : false;
  const selectedFiles = selectedProposal
    ? Object.entries(getProposalStudentFiles(selectedProposal)).map(([key, file]) => ({
      key,
      label: STUDENT_SUBMISSION_FILE_LABELS[key] || key,
      file,
    }))
    : [];
  const existingAdminAttachments = selectedProposal
    ? Object.entries(getProposalAdminAttachments(selectedProposal)).map(([key, file], index) => ({
      key,
      label: `Attachment ${index + 1}`,
      file,
    }))
    : [];

  const [rightCanvasForm, setRightCanvasForm] = useState({
    protocolCode: '',
    secondaryReviewer1: '',
    secondaryReviewer2: '',
    initialReviewDecision: '',
    startDate: '',
    endDate: '',
  });
  const [rightCanvasFiles, setRightCanvasFiles] = useState({});
  const [attachmentSlots, setAttachmentSlots] = useState(['attachment_0']);
  const [removedAttachmentKeys, setRemovedAttachmentKeys] = useState([]);
  const [rightCanvasSaving, setRightCanvasSaving] = useState(false);
  const [rightCanvasFeedback, setRightCanvasFeedback] = useState({ type: '', message: '' });
  const [showAssignSuccessModal, setShowAssignSuccessModal] = useState(false);
  const [assignSuccessDetails, setAssignSuccessDetails] = useState(null);
  const [protocolCodeErrorModal, setProtocolCodeErrorModal] = useState('');
  const [pendingRemoveAttachmentKey, setPendingRemoveAttachmentKey] = useState(null);

  const handleAddAttachmentSlot = () => {
    const nextKey = `attachment_${Date.now()}_${attachmentSlots.length}`;
    setAttachmentSlots((prev) => [...prev, nextKey]);
  };

  const handleRemoveAttachmentSlot = (slotKey) => {
    setAttachmentSlots((prev) => (prev.length > 1 ? prev.filter((key) => key !== slotKey) : prev));
    setRightCanvasFiles((prev) => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
  };

  const handleRemoveExistingAttachment = (key) => {
    setRemovedAttachmentKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
    // Discard any replacement file staged for this attachment — it's being removed, not replaced.
    setRightCanvasFiles((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleUndoRemoveExistingAttachment = (key) => {
    setRemovedAttachmentKeys((prev) => prev.filter((k) => k !== key));
  };

  const requestRemoveExistingAttachment = (key) => setPendingRemoveAttachmentKey(key);
  const cancelRemoveExistingAttachment = () => setPendingRemoveAttachmentKey(null);
  const confirmRemoveExistingAttachment = () => {
    if (pendingRemoveAttachmentKey) handleRemoveExistingAttachment(pendingRemoveAttachmentKey);
    setPendingRemoveAttachmentKey(null);
  };
  const pendingRemoveAttachment = pendingRemoveAttachmentKey
    ? existingAdminAttachments.find((a) => a.key === pendingRemoveAttachmentKey) || null
    : null;

  const selectedProposalIdStr = selectedProposal ? toRecordId(selectedProposal._id) : '';
  const proposalAssignments = useMemo(() => {
    if (!selectedProposal) return [];
    return assignments.filter((a) => {
      const aPropId = toRecordId(a.proposalId);
      if (aPropId && selectedProposalIdStr && aPropId === selectedProposalIdStr) return true;
      if (a.protocolCode && selectedProposal.protocolCode && a.protocolCode === selectedProposal.protocolCode) return true;
      return false;
    });
  }, [selectedProposal, selectedProposalIdStr, assignments]);

  const adminAssignments = useMemo(() => {
    return proposalAssignments.filter((a) => a.assignedBy === 'admin' || a.assignmentSource === 'admin');
  }, [proposalAssignments]);

  useEffect(() => {
    if (selectedProposal) {
      const propId = toRecordId(selectedProposal._id);
      const pAss = assignments.filter((a) => {
        const aPropId = toRecordId(a.proposalId);
        if (aPropId && propId && aPropId === propId) return true;
        if (a.protocolCode && selectedProposal.protocolCode && a.protocolCode === selectedProposal.protocolCode) return true;
        return false;
      });
      const adminAss = pAss.filter((a) => a.assignedBy === 'admin' || a.assignmentSource === 'admin');

      const code = selectedProposal.protocolCode || pAss.find((a) => a.protocolCode)?.protocolCode || '';

      const rawRev1 = selectedProposal.secondaryReviewer1
        || selectedProposal.reviewers?.reviewer2
        || selectedProposal.reviewer1
        || adminAss[0]?.reviewerEmail
        || '';

      const rawRev2 = selectedProposal.secondaryReviewer2
        || selectedProposal.reviewers?.reviewer3
        || selectedProposal.reviewer2
        || adminAss[1]?.reviewerEmail
        || '';

      const decision = selectedProposal.initialReviewDecision
        || pAss.find((a) => a.initialReviewDecision)?.initialReviewDecision
        || '';

      const rawStart = selectedProposal.reviewPeriod?.startDate
        || selectedProposal.startDate
        || pAss.find((a) => a.reviewPeriod?.startDate || a.startDate)?.reviewPeriod?.startDate
        || pAss.find((a) => a.reviewPeriod?.startDate || a.startDate)?.startDate;

      const rawEnd = selectedProposal.reviewPeriod?.endDate
        || selectedProposal.endDate
        || pAss.find((a) => a.reviewPeriod?.endDate || a.endDate)?.reviewPeriod?.endDate
        || pAss.find((a) => a.reviewPeriod?.endDate || a.endDate)?.endDate;

      const formatISOToInputDate = (d) => {
        if (!d) return '';
        try {
          const dateObj = new Date(d);
          if (isNaN(dateObj.getTime())) return '';
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } catch (e) {
          return '';
        }
      };

      setRightCanvasForm({
        protocolCode: code,
        secondaryReviewer1: rawRev1,
        secondaryReviewer2: rawRev2,
        initialReviewDecision: decision,
        startDate: formatISOToInputDate(rawStart),
        endDate: formatISOToInputDate(rawEnd),
      });
      setRightCanvasFiles({});
      // The default new-attachment slot must not reuse a key an already-uploaded
      // attachment owns (e.g. "attachment_0") — otherwise picking a file here silently
      // stages a REPLACE of that existing attachment instead of adding a new one,
      // and the "new" file never actually reaches the reviewer as an extra attachment.
      const usedAttachmentKeys = new Set(Object.keys(getProposalAdminAttachments(selectedProposal)));
      const initialSlotKey = usedAttachmentKeys.has('attachment_0')
        ? `attachment_${Date.now()}_0`
        : 'attachment_0';
      setAttachmentSlots([initialSlotKey]);
      setRemovedAttachmentKeys([]);
      setRightCanvasFeedback({ type: '', message: '' });
      setPendingRemoveAttachmentKey(null);
    }
  }, [selectedProposalId, selectedProposal, assignments]);

  const handleRightCanvasInputChange = (e) => {
    const { name, value } = e.target;
    setRightCanvasForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'secondaryReviewer1' && next.secondaryReviewer2 === value) {
        next.secondaryReviewer2 = '';
      }
      return next;
    });
  };

  const handleRightCanvasFileChange = (fieldName, file) => {
    setRightCanvasFiles((prev) => ({ ...prev, [fieldName]: file }));
  };

  const handleSaveRightCanvasDetails = async (e) => {
    e.preventDefault();
    if (!selectedProposal) return;
    const wasEdit = isSelectedProposalAssigned;

    if (!rightCanvasForm.protocolCode.trim()) {
      setRightCanvasFeedback({ type: 'error', message: 'Protocol Code is required.' });
      return;
    }
    if (!rightCanvasForm.secondaryReviewer1.trim()) {
      setRightCanvasFeedback({ type: 'error', message: 'Reviewer 1 (Chair) is required.' });
      return;
    }
    if (!rightCanvasForm.secondaryReviewer2.trim()) {
      setRightCanvasFeedback({ type: 'error', message: 'Reviewer 2 (Member) is required.' });
      return;
    }
    if (rightCanvasForm.secondaryReviewer1.trim() === rightCanvasForm.secondaryReviewer2.trim()) {
      setRightCanvasFeedback({ type: 'error', message: 'Reviewer 2 (Member) must be different from Reviewer 1 (Chair).' });
      return;
    }
    if (!rightCanvasForm.startDate) {
      setRightCanvasFeedback({ type: 'error', message: 'Start Date is required.' });
      return;
    }
    if (!rightCanvasForm.endDate) {
      setRightCanvasFeedback({ type: 'error', message: 'End Date is required.' });
      return;
    }

    setRightCanvasSaving(true);
    setRightCanvasFeedback({ type: '', message: '' });

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('proposalId', toRecordId(selectedProposal._id));
      formDataToSend.append('protocolCode', rightCanvasForm.protocolCode.toUpperCase().replace(/\s+/g, ''));
      formDataToSend.append('secondaryReviewer1', rightCanvasForm.secondaryReviewer1);
      if (rightCanvasForm.secondaryReviewer2.trim()) {
        formDataToSend.append('secondaryReviewer2', rightCanvasForm.secondaryReviewer2);
      }
      if (rightCanvasForm.initialReviewDecision) {
        formDataToSend.append('initialReviewDecision', rightCanvasForm.initialReviewDecision);
      }
      formDataToSend.append('startDate', rightCanvasForm.startDate);
      formDataToSend.append('endDate', rightCanvasForm.endDate);
      if (removedAttachmentKeys.length > 0) {
        formDataToSend.append('removedAttachmentKeys', JSON.stringify(removedAttachmentKeys));
      }

      Object.entries(rightCanvasFiles).forEach(([key, file]) => {
        if (file instanceof File) {
          formDataToSend.append(key, file);
        }
      });

      const { assignFileToReviewer } = await import('../services/api.js');
      const result = await assignFileToReviewer(formDataToSend);

      if (result.success) {
        setRightCanvasFeedback({
          type: 'success',
          message: wasEdit ? 'Reviewers reassigned successfully!' : 'Reviewers & protocol metadata assigned successfully!',
        });

        const rev1Obj = reviewers.find((r) => r.email === rightCanvasForm.secondaryReviewer1);
        const rev2Obj = reviewers.find((r) => r.email === rightCanvasForm.secondaryReviewer2);
        const rev1Name = rev1Obj ? getReviewerDisplayName(rev1Obj) : rightCanvasForm.secondaryReviewer1;
        const rev2Name = rev2Obj ? getReviewerDisplayName(rev2Obj) : (rightCanvasForm.secondaryReviewer2 || 'None');

        setAssignSuccessDetails({
          mode: wasEdit ? 'edit' : 'assign',
          protocolCode: rightCanvasForm.protocolCode.toUpperCase().replace(/\s+/g, ''),
          researchTitle: selectedProposal?.researchTitle || 'Proposal',
          proponent: selectedProposal?.proponent || selectedProposal?.studentName || 'Student',
          chairName: rev1Name,
          memberName: rev2Name,
          initialDecision: rightCanvasForm.initialReviewDecision || 'Pending Decision',
          startDate: rightCanvasForm.startDate,
          endDate: rightCanvasForm.endDate,
        });
        setShowAssignSuccessModal(true);

        await loadData();
      } else {
        const errMsg = result.error || 'Failed to assign reviewers.';
        setRightCanvasFeedback({ type: 'error', message: errMsg });
        if (errMsg.toLowerCase().includes('protocol code')) {
          setProtocolCodeErrorModal(errMsg);
        }
      }
    } catch (err) {
      console.error('Error assigning reviewers:', err);
      const errMsg = err.message || 'Failed to assign reviewers.';
      setRightCanvasFeedback({ type: 'error', message: errMsg });
      if (errMsg.toLowerCase().includes('protocol code')) {
        setProtocolCodeErrorModal(errMsg);
      }
    } finally {
      setRightCanvasSaving(false);
    }
  };

  const handleViewStudentFile = (file) => {
    if (!file?.filename) return;
    import('../services/api.js').then(({ viewFile }) => {
      viewFile(file.filename);
    });
  };

  const handleDownloadStudentFile = async (file) => {
    if (!file?.filename) return;
    try {
      const { downloadReviewerFile } = await import('../services/api.js');
      await downloadReviewerFile(file.filename, file.originalname || file.filename);
    } catch (err) {
      console.error('Error downloading student file:', err);
    }
  };

  const requestDeleteProposal = (proposal, e) => {
    e.stopPropagation();
    setDeleteTarget(proposal);
  };

  const cancelDeleteProposal = () => {
    if (isDeletingProposal) return;
    setDeleteTarget(null);
  };

  const confirmDeleteProposal = async () => {
    if (!deleteTarget) return;
    const id = toRecordId(deleteTarget._id);
    setIsDeletingProposal(true);
    try {
      const { deleteProposal } = await import('../services/api.js');
      const result = await deleteProposal(id);
      if (result.success) {
        setProposals((prev) => prev.filter((p) => toRecordId(p._id) !== id));
        setAssignments((prev) => prev.filter((a) => {
          const aPropId = toRecordId(a.proposalId);
          if (aPropId && aPropId === id) return false;
          if (deleteTarget.protocolCode && a.protocolCode === deleteTarget.protocolCode) return false;
          return true;
        }));
        if (selectedProposalId === id) setSelectedProposalId('');
        setDeleteTarget(null);
        setFeedback({ type: 'success', message: `"${deleteTarget.researchTitle || 'Proposal'}" and its reviewer assignment(s) were deleted.` });
        setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
      } else {
        setFeedback({ type: 'error', message: result.error || 'Failed to delete proposal.' });
      }
    } catch (err) {
      console.error('Error deleting proposal:', err);
      setFeedback({ type: 'error', message: 'Failed to delete proposal.' });
    } finally {
      setIsDeletingProposal(false);
    }
  };

  return (
    <div className="content-section sp-wrapper">
      <div className="sp-header">
        <div>
          <h2 className="sp-title">Student Proposal</h2>
          <p className="sp-subtitle">
            Review student file submissions and assign a department and reviewer for each proposal.
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={loadData} disabled={loading}>
          Refresh
        </button>
      </div>

      {feedback.message && (
        <div className={`sp-feedback sp-feedback--${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      {/* Informational Note for Admin */}
      <div className="sp-instruction-note" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        backgroundColor: '#f0f7ff',
        border: '1px solid #bae6fd',
        color: '#0369a1',
        padding: '0.65rem 1rem',
        borderRadius: '8px',
        fontSize: '0.85rem',
        fontWeight: '500',
        marginBottom: '1rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: '#0284c7' }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span><strong>Note:</strong> Select a researcher proposal from the list below to assign reviewers and update protocol details.</span>
      </div>

      <div className="sp-toolbar">
        <div className="sp-filter-group">
          <select
            className="sp-select"
            value={facultyFilter}
            onChange={(e) => setFacultyFilter(e.target.value)}
            aria-label="Filter by faculty"
          >
            <option value="">All Faculties</option>
            {facultyFilterOptions.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <select
            className="sp-select"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            aria-label="Filter by department"
          >
            <option value="">All Departments</option>
            {departmentFilterOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <select
            className="sp-select"
            value={researcherFilter}
            onChange={(e) => setResearcherFilter(e.target.value)}
            aria-label="Filter by researcher name"
          >
            <option value="">All Researchers</option>
            {researcherFilterOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className="sp-search-row">
          <input
            type="search"
            className="sp-search"
            placeholder="Search by title or researcher…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="sp-stat">
            <strong>{proposals.length}</strong> submission{proposals.length !== 1 ? 's' : ''}
          </span>
          {newCount > 0 && (
            <span className="sp-stat sp-stat--new">
              <strong>{newCount}</strong> new submission{newCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="sp-loading">Loading student submissions…</div>
      ) : filteredProposals.length === 0 ? (
        <div className="sp-empty">No student submissions found.</div>
      ) : (
        <div className="sp-table-wrap">
          <table className="sp-table">
            <colgroup>
              <col className="sp-col-indicator" />
              <col className="sp-col-title" />
              <col className="sp-col-student" />
              <col className="sp-col-faculty" />
              <col className="sp-col-date" />
              <col className="sp-col-assign-status" />
              <col className="sp-col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th>Status</th>
                <th>Proposal Title</th>
                <th>Submitted By</th>
                <th className="sp-th-faculty">Faculty</th>
                <th>Submitted</th>
                <th>Assignment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProposals.map((proposal) => {
                const id = toRecordId(proposal._id);
                const isNew = isStudentProposalNew(proposal);
                const statusLabel = isNew ? 'New' : 'Seen';

                // Determine if this proposal has been assigned to a reviewer
                const isAssigned = isProposalAssigned(proposal);

                return (
                  <tr
                    key={id}
                    className={`${isNew ? 'sp-row--new' : ''} ${selectedProposalId === id ? 'sp-row--selected' : ''}`}
                    onClick={() => handleProposalRowClick(id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="sp-cell-indicator">
                      <span
                        className={`sp-indicator-badge ${isNew ? 'sp-indicator-badge--new' : 'sp-indicator-badge--seen'}`}
                        title={statusLabel}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="sp-td-title" title={proposal.researchTitle || 'Untitled Proposal'}>
                      <span className="sp-cell-ellipsis">{proposal.researchTitle || 'Untitled Proposal'}</span>
                    </td>
                    <td>
                      <div className="sp-student-name" title={proposal.proponent || 'Unknown'}>
                        <span className="sp-cell-ellipsis">{proposal.proponent || 'Unknown'}</span>
                        {proposal.department && (
                          <span className="sp-faculty-inline">{normalizeFacultyKey(proposal.department)}</span>
                        )}
                      </div>
                      <div className="sp-student-email" title={proposal.studentEmail}>
                        <span className="sp-cell-ellipsis">{proposal.studentEmail}</span>
                      </div>
                    </td>
                    <td className="sp-cell-faculty" title={getFacultyLabel(normalizeFacultyKey(proposal.department))}>
                      <span className="sp-cell-ellipsis">{proposal.department ? normalizeFacultyKey(proposal.department) : '—'}</span>
                    </td>
                    <td className="sp-cell-date">{formatDate(proposal.submissionDate || proposal.createdAt)}</td>
                    <td className="sp-cell-assign-status">
                      <span className={`sp-assign-status-badge ${isAssigned ? 'sp-assign-status-badge--assigned' : 'sp-assign-status-badge--not-assigned'}`}>
                        {isAssigned ? 'Assigned' : 'Not Assigned'}
                      </span>
                    </td>
                    <td className="sp-cell-actions">
                      <button
                        type="button"
                        className="sp-delete-btn"
                        title="Delete proposal"
                        aria-label="Delete proposal"
                        onClick={(e) => requestDeleteProposal(proposal, e)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedProposal && (
        <div className="sp-modal-overlay" onClick={() => setSelectedProposalId('')}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sp-modal-header">
              <div className="sp-modal-header-title">
                <h3>Researcher Proposal</h3>
                {selectedProposal && (
                  <span
                    className={`sp-indicator-badge ${isStudentProposalNew(selectedProposal) ? 'sp-indicator-badge--new' : 'sp-indicator-badge--seen'}`}
                  >
                    {isStudentProposalNew(selectedProposal) ? 'New' : 'Seen'}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="sp-modal-close"
                onClick={() => setSelectedProposalId('')}
                aria-label="Close details"
              >
                ×
              </button>
            </div>
            <div className="sp-modal-body-split">
              {/* Left Panel: Proposal Overview, Details & Files */}
              <div className="sp-modal-panel sp-modal-panel--left" ref={leftPanelRef} onScroll={checkLeftScroll}>
                <div className="sp-modal-title-box">
                  <p className="sp-modal-title-label">Proposal Title</p>
                  <h4 className="sp-modal-title">{selectedProposal.researchTitle || 'Untitled Proposal'}</h4>
                </div>
                <div className="sp-detail-grid">
                  <div className="sp-detail-item">
                    <span className="sp-detail-label">Submitted By</span>
                    <span className="sp-detail-value">{selectedProposal.proponent || 'Unknown'}</span>
                  </div>
                  <div className="sp-detail-item">
                    <span className="sp-detail-label">Student Email</span>
                    <span className="sp-detail-value">{selectedProposal.studentEmail || 'N/A'}</span>
                  </div>
                  <div className="sp-detail-item sp-detail-item--full">
                    <span className="sp-detail-label">Submitted Date</span>
                    <span className="sp-detail-value">{formatDate(selectedProposal.submissionDate || selectedProposal.createdAt)}</span>
                  </div>
                </div>

                {/* Files Sent by Student inside Left Panel */}
                <div className="sp-files-section">
                  <div className="sp-files-head">
                    <h4>Files Sent by Student</h4>
                    <span className="sp-files-count">{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}</span>
                  </div>
                  {selectedFiles.length === 0 ? (
                    <div className="sp-files-empty">No uploaded files found for this submission.</div>
                  ) : (
                    <div className="sp-files-list">
                      {selectedFiles.map(({ key, label, file }) => (
                        <div className="sp-file-item" key={key}>
                          <div className="sp-file-meta">
                            <div className="sp-file-label">{label}</div>
                            <div className="sp-file-name" title={file?.originalname || file?.filename || key}>
                              {file?.originalname || file?.filename || key}
                            </div>
                            <div className="sp-file-submeta">
                              {file?.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                              {file?.mimetype ? ` • ${file.mimetype}` : ''}
                            </div>
                          </div>
                          <div className="sp-file-actions">
                            <button type="button" className="sp-file-btn sp-file-btn--view" onClick={() => handleViewStudentFile(file)}>
                              View
                            </button>
                            <button type="button" className="sp-file-btn sp-file-btn--download" onClick={() => handleDownloadStudentFile(file)}>
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {showLeftScrollIndicator && (
                  <button
                    type="button"
                    className="sp-panel-scroll-indicator"
                    title="Scroll down to see more"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (leftPanelRef.current) {
                        leftPanelRef.current.scrollBy({ top: 250, behavior: 'smooth' });
                      }
                    }}
                  >
                    <span>Scroll down</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M19 12l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Right Panel Canvas: Interactive Form Inputs for Protocol Code, Reviewer 1 & 2, Initial Review Decision, Review Period (PHT) */}
              <div className="sp-modal-panel sp-modal-panel--right" ref={rightPanelRef} onScroll={checkRightScroll}>
                <div className="sp-right-canvas-container">
                  <div className="sp-canvas-header">
                    <div className="sp-canvas-title-group">
                      <h4 className="sp-canvas-heading">{isSelectedProposalAssigned ? 'Reassign Reviewer' : 'Assign Reviewer'}</h4>
                    </div>
                  </div>

                  {rightCanvasFeedback.message && (
                    <div className={`sp-canvas-feedback sp-canvas-feedback--${rightCanvasFeedback.type}`}>
                      {rightCanvasFeedback.message}
                    </div>
                  )}

                  <form onSubmit={handleSaveRightCanvasDetails} className="sp-canvas-form">
                    {/* 1. Protocol Code */}
                    <div className="sp-canvas-field-group">
                      <label className="sp-canvas-input-label" htmlFor="sp-right-protocolCode">
                        Protocol Code <span className="sp-required-star">*</span>
                      </label>
                      <input
                        type="text"
                        id="sp-right-protocolCode"
                        name="protocolCode"
                        className="sp-canvas-input"
                        placeholder="e.g., UREB-2026-001"
                        value={rightCanvasForm.protocolCode}
                        onChange={handleRightCanvasInputChange}
                        required
                      />
                    </div>

                    {/* 2. Reviewer 1 (Chair) & Reviewer 2 (Member) */}
                    <div className="sp-canvas-field-group">
                      <label className="sp-canvas-input-label" htmlFor="sp-right-reviewer1">
                        Reviewer 1 (Chair) <span className="sp-required-star">*</span>
                      </label>
                      <select
                        id="sp-right-reviewer1"
                        name="secondaryReviewer1"
                        className="sp-canvas-select"
                        value={rightCanvasForm.secondaryReviewer1}
                        onChange={handleRightCanvasInputChange}
                        required
                      >
                        <option value="">-- Select Reviewer 1 (Chair) --</option>
                        {reviewers
                          .filter((r) => r.email)
                          .map((r, idx) => (
                            <option key={r._id || idx} value={r.email}>
                              {getReviewerDisplayName(r)}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="sp-canvas-field-group">
                      <label className="sp-canvas-input-label" htmlFor="sp-right-reviewer2">
                        Reviewer 2 (Member) <span className="sp-required-star">*</span>
                      </label>
                      <select
                        id="sp-right-reviewer2"
                        name="secondaryReviewer2"
                        className="sp-canvas-select"
                        value={rightCanvasForm.secondaryReviewer2}
                        onChange={handleRightCanvasInputChange}
                        required
                      >
                        <option value="">-- Select Reviewer 2 (Member) --</option>
                        {reviewers
                          .filter((r) => r.email && r.email !== rightCanvasForm.secondaryReviewer1)
                          .map((r, idx) => (
                            <option key={r._id || idx} value={r.email}>
                              {getReviewerDisplayName(r)}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* 3. Initial Review Decision */}
                    <div className="sp-canvas-field-group">
                      <label className="sp-canvas-input-label" htmlFor="sp-right-decision">
                        Initial Review Decision
                      </label>
                      <select
                        id="sp-right-decision"
                        name="initialReviewDecision"
                        className="sp-canvas-select"
                        value={rightCanvasForm.initialReviewDecision}
                        onChange={handleRightCanvasInputChange}
                      >
                        <option value="">-- Select Decision --</option>
                        <option value="Exempted">Exempted</option>
                        <option value="Expedited">Expedited</option>
                        <option value="Full Review">Full Review</option>
                        <option value="No Human Involvement">No Human Involvement</option>
                      </select>
                    </div>

                    {/* 4. Review Period */}
                    <div className="sp-canvas-field-group">
                      <div className="sp-canvas-period-header">
                        <label className="sp-canvas-input-label">Review Period (Philippine Time)</label>
                      </div>
                      <div className="sp-canvas-dates-row">
                        <div className="sp-canvas-date-col">
                          <span className="sp-canvas-sublabel">Start Date *</span>
                          <input
                            type="date"
                            name="startDate"
                            className="sp-canvas-input"
                            value={rightCanvasForm.startDate}
                            onChange={handleRightCanvasInputChange}
                            required
                          />
                        </div>
                        <div className="sp-canvas-date-col">
                          <span className="sp-canvas-sublabel">End Date *</span>
                          <input
                            type="date"
                            name="endDate"
                            className="sp-canvas-input"
                            value={rightCanvasForm.endDate}
                            onChange={handleRightCanvasInputChange}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* 5. Add Attachment Section */}
                    <div className="sp-canvas-field-group">
                      <div className="sp-canvas-period-header">
                        <div className="sp-canvas-doc-header-title">
                          <span className="sp-canvas-icon">📎</span>
                          <label className="sp-canvas-input-label">Attachments</label>
                        </div>
                        <span className="sp-canvas-tz-badge">
                          {attachmentSlots.length} Attachment{attachmentSlots.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {existingAdminAttachments.length > 0 && (
                        <div className="sp-files-section sp-files-section--attachments">
                          <div className="sp-files-head">
                            <h4>Already Uploaded</h4>
                            <span className="sp-files-count">
                              {existingAdminAttachments.length} file{existingAdminAttachments.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className="sp-files-hint">
                            Replace or remove a saved attachment below, or leave it as-is to keep it unchanged.
                          </p>
                          <div className="sp-files-list">
                            {existingAdminAttachments.map(({ key, label, file }) => {
                              const isRemoved = removedAttachmentKeys.includes(key);
                              const replacementFile = rightCanvasFiles[key];
                              return (
                                <div className={`sp-attachment-card${isRemoved ? ' sp-attachment-card--removed' : ''}`} key={key}>
                                  <div className="sp-attachment-card-top">
                                    <div className="sp-file-meta">
                                      <div className="sp-file-label">{label}</div>
                                      <div
                                        className={`sp-file-name${isRemoved ? ' sp-file-name--removed' : ''}`}
                                        title={file?.originalname || file?.filename || key}
                                      >
                                        {file?.originalname || file?.filename || key}
                                      </div>
                                      <div className="sp-file-submeta">
                                        {isRemoved
                                          ? 'Will be removed on save'
                                          : replacementFile
                                            ? (
                                              <>
                                                {`Replacing with: ${replacementFile.name}`}
                                                {' '}
                                                <button
                                                  type="button"
                                                  className="sp-inline-cancel-btn"
                                                  title="Cancel replacement"
                                                  onClick={() => handleRightCanvasFileChange(key, null)}
                                                >
                                                  ×
                                                </button>
                                              </>
                                            )
                                            : (
                                              <>
                                                {file?.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                                                {file?.mimetype ? ` • ${file.mimetype}` : ''}
                                              </>
                                            )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="sp-attachment-card-footer">
                                    <div className="sp-attachment-card-footer-left">
                                      {!isRemoved && (
                                        <button
                                          type="button"
                                          className="sp-file-btn sp-file-btn--view"
                                          onClick={() => handleViewStudentFile(file)}
                                          disabled={!file?.filename}
                                          title={file?.filename ? 'Open this file in a new tab' : 'File is unavailable'}
                                        >
                                          View
                                        </button>
                                      )}
                                    </div>
                                    <div className="sp-attachment-card-footer-group">
                                      {isRemoved ? (
                                        <button type="button" className="sp-file-btn" onClick={() => handleUndoRemoveExistingAttachment(key)}>
                                          Undo
                                        </button>
                                      ) : (
                                        <>
                                          <input
                                            type="file"
                                            id={`sp-right-attachment-replace-${key}`}
                                            accept=".pdf,.doc,.docx"
                                            onChange={(e) => handleRightCanvasFileChange(key, e.target.files[0])}
                                            className="sp-canvas-file-input-hidden"
                                          />
                                          <label htmlFor={`sp-right-attachment-replace-${key}`} className="sp-file-btn">
                                            {replacementFile ? 'Change' : 'Replace'}
                                          </label>
                                          <button
                                            type="button"
                                            className="sp-file-btn sp-file-btn--danger"
                                            onClick={() => requestRemoveExistingAttachment(key)}
                                          >
                                            Remove
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="sp-canvas-attachments-list">
                        {attachmentSlots.map((slotKey, index) => {
                          const selectedFile = rightCanvasFiles[slotKey];
                          return (
                            <div key={slotKey} className="sp-canvas-file-upload-box">
                              <input
                                type="file"
                                id={`sp-right-attachment-${slotKey}`}
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => handleRightCanvasFileChange(slotKey, e.target.files[0])}
                                className="sp-canvas-file-input-hidden"
                              />
                              <div className="sp-attachment-slot-row">
                                <label htmlFor={`sp-right-attachment-${slotKey}`} className="sp-canvas-upload-dropzone sp-canvas-upload-dropzone--grow">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                                  </svg>
                                  <div className="sp-upload-text-group">
                                    <span className="sp-upload-primary-text">
                                      {selectedFile ? selectedFile.name : `Choose file for Attachment ${existingAdminAttachments.length + index + 1}`}
                                    </span>
                                    <span className="sp-upload-subtext">PDF, DOC, DOCX (MAX. 12MB)</span>
                                  </div>
                                </label>
                                {attachmentSlots.length > 1 && (
                                  <button
                                    type="button"
                                    className="sp-slot-delete-btn"
                                    onClick={() => handleRemoveAttachmentSlot(slotKey)}
                                    title="Remove attachment slot"
                                  >
                                    🗑
                                  </button>
                                )}
                              </div>

                              {selectedFile && (
                                <div className="sp-canvas-selected-chip">
                                  <span className="sp-chip-icon">✓</span>
                                  <span className="sp-chip-filename">{selectedFile.name}</span>
                                  <button
                                    type="button"
                                    className="sp-chip-remove-btn"
                                    onClick={() => handleRightCanvasFileChange(slotKey, null)}
                                    title="Remove file"
                                  >
                                    ×
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="sp-add-attachment-wrap">
                        <button
                          type="button"
                          className="sp-add-attachment-btn"
                          onClick={handleAddAttachmentSlot}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                          <span>+ Add Attachment</span>
                        </button>
                      </div>
                    </div>

                    {/* Submit Action */}
                    <div className="sp-canvas-actions">
                      <button
                        type="submit"
                        className="btn-primary sp-canvas-submit-btn"
                        disabled={rightCanvasSaving}
                      >
                        {rightCanvasSaving
                          ? (isSelectedProposalAssigned ? 'Reassigning…' : 'Assigning…')
                          : (isSelectedProposalAssigned ? 'Reassign' : 'Assign')}
                      </button>
                    </div>
                  </form>
                </div>

                {showRightScrollIndicator && (
                  <button
                    type="button"
                    className="sp-panel-scroll-indicator"
                    title="Scroll down to see more"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (rightPanelRef.current) {
                        rightPanelRef.current.scrollBy({ top: 250, behavior: 'smooth' });
                      }
                    }}
                  >
                    <span>Scroll down</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M19 12l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* SUCCESS MESSAGE MODAL FOR REVIEWER ASSIGNMENT */}
      {showAssignSuccessModal && assignSuccessDetails && (
        <div className="sp-modal-overlay" style={{ zIndex: 10000 }}>
          <div
            className="sp-modal-card"
            style={{
              maxWidth: '500px',
              width: '92%',
              borderRadius: '16px',
              padding: '2rem',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
                boxShadow: '0 0 0 8px #f0fdf4',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.4rem' }}>
              {assignSuccessDetails.mode === 'edit' ? 'Reviewers Reassigned Successfully!' : 'Reviewers Assigned Successfully!'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.4rem', lineHeight: '1.4' }}>
              {assignSuccessDetails.mode === 'edit'
                ? 'The research protocol metadata has been updated and the newly assigned reviewers have been notified.'
                : 'The research protocol metadata has been updated and sent to the assigned reviewers.'}
            </p>

            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.1rem',
                textAlign: 'left',
                marginBottom: '1.6rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Protocol Code:</span>
                <span style={{ color: '#1e40af', fontWeight: '800', fontFamily: 'monospace', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #dbeafe' }}>
                  {assignSuccessDetails.protocolCode}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Reviewer 1 (Chair):</span>
                <span style={{ color: '#0f172a', fontWeight: '700' }}>
                  {assignSuccessDetails.chairName}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Reviewer 2 (Member):</span>
                <span style={{ color: '#0f172a', fontWeight: '700' }}>
                  {assignSuccessDetails.memberName}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Initial Decision:</span>
                <span style={{ color: '#15803d', fontWeight: '700', backgroundColor: '#f0fdf4', padding: '1px 7px', borderRadius: '4px' }}>
                  {assignSuccessDetails.initialDecision}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Review Period:</span>
                <span style={{ color: '#334155', fontWeight: '600' }}>
                  {assignSuccessDetails.startDate} to {assignSuccessDetails.endDate}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setShowAssignSuccessModal(false);
                setAssignSuccessDetails(null);
              }}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: '700',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              OK, Got it
            </button>
          </div>
        </div>
      )}

      {/* ERROR MODAL FOR PROTOCOL CODE */}
      {Boolean(protocolCodeErrorModal) && (
        <div className="sp-modal-overlay" style={{ zIndex: 10001 }} onClick={() => setProtocolCodeErrorModal('')}>
          <div
            className="sp-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '460px',
              width: '92%',
              borderRadius: '16px',
              padding: '2rem',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              background: '#ffffff',
              border: '1px solid #fee2e2',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
                boxShadow: '0 0 0 8px #fef2f2',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#991b1b', marginBottom: '0.5rem' }}>
              Protocol Code Conflict
            </h3>

            <p style={{ fontSize: '0.925rem', color: '#1e293b', fontWeight: '600', marginBottom: '0.5rem', lineHeight: '1.4' }}>
              {protocolCodeErrorModal}
            </p>

            <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              Please enter a different, unique Protocol Code for this proposal before saving.
            </p>

            <button
              type="button"
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem 1.2rem',
                backgroundColor: '#dc2626',
                borderColor: '#dc2626',
                color: '#ffffff',
                fontWeight: '700',
                borderRadius: '10px',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
              onClick={() => setProtocolCodeErrorModal('')}
            >
              Understand & Close
            </button>
          </div>
        </div>
      )}

      {/* REMOVE ATTACHMENT CONFIRMATION */}
      {pendingRemoveAttachment && (
        <div className="sp-confirm-overlay" onClick={cancelRemoveExistingAttachment}>
          <div className="sp-confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="sp-confirm-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14H6L5 6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
                <path d="M9 6V4h6v2"></path>
              </svg>
            </div>
            <h4 className="sp-confirm-title">Remove this attachment?</h4>
            <p className="sp-confirm-text">
              <strong>
                {pendingRemoveAttachment.file?.originalname || pendingRemoveAttachment.file?.filename || pendingRemoveAttachment.label}
              </strong>
              {' '}will be removed once you save changes. You can still cancel before saving.
            </p>
            <div className="sp-confirm-actions">
              <button type="button" className="sp-confirm-btn sp-confirm-btn--ghost" onClick={cancelRemoveExistingAttachment}>
                Cancel
              </button>
              <button type="button" className="sp-confirm-btn sp-confirm-btn--danger" onClick={confirmRemoveExistingAttachment}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE PROPOSAL CONFIRMATION */}
      {deleteTarget && (
        <div className="sp-confirm-overlay" onClick={cancelDeleteProposal}>
          <div className="sp-confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="sp-confirm-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14H6L5 6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
                <path d="M9 6V4h6v2"></path>
              </svg>
            </div>
            <h4 className="sp-confirm-title">Delete this proposal?</h4>
            <p className="sp-confirm-text">
              This proposal and any reviewer assignment linked to it will be permanently deleted. This cannot be undone.
            </p>
            <div className="sp-confirm-actions">
              <button type="button" className="sp-confirm-btn sp-confirm-btn--ghost" onClick={cancelDeleteProposal} disabled={isDeletingProposal}>
                Cancel
              </button>
              <button type="button" className="sp-confirm-btn sp-confirm-btn--danger" onClick={confirmDeleteProposal} disabled={isDeletingProposal}>
                {isDeletingProposal ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Mark Completed Review ──────────────────────────────────────────────────
const MarkCompletedReviewContent = ({ onPaginationChange }) => {
  const [reviewerRows, setReviewerRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [proposalStatus, setProposalStatus] = useState({});
  const [reviewerTypeFilter, setReviewerTypeFilter] = useState('');
  const [selectedReviewerKey, setSelectedReviewerKey] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');

  const fetchMcrData = async (silent = false) => {
    if (!silent) setLoading(true);
      try {
        const API = import.meta.env.VITE_API_URL;
        const [reviewsRes, proposalsRes, allAccounts, assignmentsRes] = await Promise.all([
          fetch(`${API}/api/reviews`),
          fetch(`${API}/api/proposals`),
          getAllReviewers(), // uses admin auth header — /api/reviewers 404s without it
          fetch(`${API}/api/assignments`),
        ]);

        const allReviews = reviewsRes.ok ? await reviewsRes.json() : [];
        const allProposals = proposalsRes.ok ? await proposalsRes.json() : [];
        const allAssignments = assignmentsRes.ok ? await assignmentsRes.json() : [];

        // Build proposals lookup
        const proposalsMap = {};
        if (Array.isArray(allProposals)) {
          allProposals.forEach(p => {
            const id = toRecordId(p._id);
            if (id) proposalsMap[id] = p;
            const altId = toRecordId(p.proposalId);
            if (altId) proposalsMap[altId] = p;
            if (p.protocolCode) proposalsMap[String(p.protocolCode).trim()] = p;
          });
        }

        const byKey = {};
        const accountMap = {};
        const accountByName = {};

        if (Array.isArray(allAccounts)) {
          allAccounts.forEach(acc => {
            const email = (acc.email || '').trim().toLowerCase();
            if (email) accountMap[email] = acc;
            const accName = (acc.name || `${acc.firstName || ''} ${acc.lastName || ''}`).trim().toLowerCase();
            if (accName) accountByName[accName] = acc;
          });
        }

        // Falls back to a name match when the email on the assignment/review
        // doesn't line up with the reviewer's account email, so the reviewer's
        // real faculty is still found instead of being marked unassigned.
        const resolveAccount = (email, name) => {
          if (email && accountMap[email]) return accountMap[email];
          const nameKey = (name || '').trim().toLowerCase();
          if (nameKey && accountByName[nameKey]) return accountByName[nameKey];
          return {};
        };

        // Group reviewers based on assignments first (so they appear even if they haven't submitted a review)
        if (Array.isArray(allAssignments)) {
          allAssignments.forEach(assignment => {
            const email = (assignment.reviewerEmail || assignment.email || '').trim().toLowerCase();
            if (!email) return;

            const pId = toRecordId(assignment.proposalId);
            const proposal = proposalsMap[pId] || {};

            const acc = resolveAccount(email, assignment.reviewerName || assignment.name);
            // Admin assignments (secondary) always have assignedBy: 'admin'
            let rType = (assignment.assignedBy === 'admin') ? 'secondary' : 'preliminary';

            // Based on user request, admin assignments (Secondary) should only be listed 
            // if the proposal has a Protocol Code (check both the proposal and the assignment record)
            const assignmentProtocolCode = (assignment.protocolCode || proposal.protocolCode || '').trim();
            if (rType === 'secondary' && assignmentProtocolCode === '') {
              return;
            }

            const key = `${email}_${rType}`;

            const reviewerEmail = (assignment.reviewerEmail || assignment.email || '').trim() || email;

            if (!byKey[key]) {
              byKey[key] = {
                key,
                email,
                reviewerEmail,
                name: assignment.reviewerName || assignment.name || acc.name || `${acc.firstName || ''} ${acc.lastName || ''}`.trim() || email,
                reviewerType: rType,
                department: normalizeFacultyKey(acc.department),
                proposals: [],
              };
            }

            const proposalId = pId || toRecordId(proposal._id) || assignmentProtocolCode;
            const assignmentId = toRecordId(assignment._id);
            const title = proposal.researchTitle || proposal.title || assignment.researchTitle || 'Untitled Proposal';
            const leader = proposal.proponent || proposal.studentName || assignment.proponent || 'Unknown';
            const assignmentStatus = rType === 'secondary'
              ? (assignment.status || 'Pending')
              : (proposal.status || assignment.status || 'Pending');
            const proposalCompleted = (proposal.status || '').toLowerCase() === 'completed';
            const assignmentCompleted = normalizeMcrStatus(assignment.status) === 'completed';
            const completed = rType === 'secondary'
              ? assignmentCompleted
              : (proposalCompleted || assignmentCompleted);
            const rowKey = proposalId || assignmentProtocolCode;

            const rowData = {
              proposalId: rowKey,
              assignmentId,
              protocolCode: assignmentProtocolCode,
              assignmentStatus,
              title,
              leader,
              completed,
            };

            if (!rowKey && !assignmentId) return;

            const proposals = byKey[key].proposals;
            const existingIdx = assignmentId
              ? proposals.findIndex(p => p.assignmentId === assignmentId)
              : proposals.findIndex(p => (p.proposalId || p.protocolCode) === rowKey);

            if (existingIdx >= 0) {
              proposals[existingIdx] = { ...proposals[existingIdx], ...rowData };
            } else {
              proposals.push(rowData);
            }
          });
        }

        // Also process submitted reviews to catch any discrepancies
        if (Array.isArray(allReviews)) {
          allReviews.forEach(review => {
            const email = (review.reviewerEmail || '').trim().toLowerCase();
            if (!email) return;

            const pId = toRecordId(review.proposalId || (review.proposal && review.proposal._id));
            const proposal = proposalsMap[pId] || review.proposal || {};

            const acc = resolveAccount(email, review.reviewerName || review.reviewer);
            // Determine role purely based on the review submission type (user request)
            const isSecondarySubmission = review.decision === 'secondary_file' || review.urebForm10B || review.urebForm11;
            let rType = isSecondarySubmission ? 'secondary' : 'preliminary';
            const key = `${email}_${rType}`;

            const protocolCode = (review.protocolCode || proposal.protocolCode || '').trim();
            const proposalId = pId || toRecordId(proposal._id) || protocolCode;

            // Secondary reviewers: assignments are the source of truth — skip review duplicates
            if (rType === 'secondary') {
              const hasAssignment = byKey[key]?.proposals.some(p =>
                (protocolCode && p.protocolCode === protocolCode) ||
                (proposalId && p.proposalId === proposalId)
              );
              if (hasAssignment) return;
            }

            const reviewerEmail = (review.reviewerEmail || '').trim() || email;

            if (!byKey[key]) {
              byKey[key] = {
                key,
                email,
                reviewerEmail,
                name: review.reviewerName || review.reviewer || acc.name || `${acc.firstName || ''} ${acc.lastName || ''}`.trim() || email,
                reviewerType: rType,
                department: normalizeFacultyKey(acc.department),
                proposals: [],
              };
            }

            const title = proposal.researchTitle || proposal.title || review.proposalTitle || review.title || 'Untitled Proposal';
            const leader = proposal.proponent || proposal.studentName || review.proponent || review.studentName || 'Unknown';
            const proposalCompleted = (proposal.status || '').toLowerCase() === 'completed';
            const completed = proposalCompleted;

            const effectiveTitle = title !== 'Untitled Proposal' ? title
              : (protocolCode ? `Protocol: ${protocolCode}` : 'Untitled Proposal');

            if (proposalId && !byKey[key].proposals.find(p => p.proposalId === proposalId)) {
              byKey[key].proposals.push({
                proposalId,
                protocolCode,
                assignmentStatus: proposal.status || 'Pending',
                title: effectiveTitle,
                leader,
                completed,
              });
            }
          });
        }

        const EXCLUDED = ['kristoff h. sarmiento'];
        const rows = Object.values(byKey)
          .filter(r => !EXCLUDED.includes(r.name.trim().toLowerCase()))
          .sort((a, b) => a.name.localeCompare(b.name));

        // Build status map from persisted assignment/proposal status in DB
        const initStatus = {};
        rows.forEach(row => {
          (row.proposals || []).forEach(p => {
            const key = getMcrRowKey(p);
            if (!key) return;
            initStatus[key] = p.assignmentStatus
              ? normalizeMcrStatus(p.assignmentStatus)
              : (p.completed ? 'completed' : 'under review');
          });
        });
        setProposalStatus(initStatus);
        setReviewerRows(rows);
      } catch (err) {
        console.error('Error fetching MCR data:', err);
      } finally {
        if (!silent) setLoading(false);
      }
  };

  useEffect(() => {
    fetchMcrData();
  }, []);

  const isMcrCompleted = (status) => String(status || '').toLowerCase() === 'completed';

  const handleProposalToggle = async (row, currentStatus, reviewer) => {
    const rowKey = getMcrRowKey(row);
    const proposalRef = row.proposalId || row.protocolCode;
    if (!rowKey || !reviewer) return;
    const markingComplete = !isMcrCompleted(currentStatus);
    const dbAssignmentStatus = markingComplete ? 'Completed' : 'Under Review';
    const dbProposalStatus = markingComplete ? 'completed' : 'Under Review';
    const isSecondary = reviewer.reviewerType === 'secondary';
    setUpdating(prev => ({ ...prev, [rowKey]: true }));
    try {
      let res;
      let data = {};
      if (isSecondary) {
        res = await fetch(`${import.meta.env.VITE_API_URL}/api/assignments/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignmentId: row.assignmentId || undefined,
            proposalId: proposalRef,
            protocolCode: row.protocolCode || undefined,
            reviewerEmail: reviewer.reviewerEmail || reviewer.email,
            status: dbAssignmentStatus,
          }),
        });
        data = await res.json().catch(() => ({}));
      } else {
        res = await fetch(`${import.meta.env.VITE_API_URL}/api/proposals/${encodeURIComponent(proposalRef)}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: dbProposalStatus }),
        });
        data = await res.json().catch(() => ({}));
        if (res.ok && data.success !== false) {
          const assignmentRes = await fetch(`${import.meta.env.VITE_API_URL}/api/assignments/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              assignmentId: row.assignmentId || undefined,
              proposalId: proposalRef,
              protocolCode: row.protocolCode || undefined,
              reviewerEmail: reviewer.reviewerEmail || reviewer.email,
              status: dbAssignmentStatus,
            }),
          });
          const assignmentData = await assignmentRes.json().catch(() => ({}));
          data = { ...data, ...assignmentData };
        }
      }
      if (!res.ok || data.success === false) {
        console.error('Failed to update status:', data.error || res.statusText);
      } else if (isSecondary && data.matchedCount === 0) {
        console.error('No assignment found for this reviewer and proposal');
      } else {
        await fetchMcrData(true);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdating(prev => ({ ...prev, [rowKey]: false }));
    }
  };

  const getRowStatus = (p) => {
    const rowKey = getMcrRowKey(p);
    if (proposalStatus[rowKey] !== undefined) return proposalStatus[rowKey];
    if (p.assignmentStatus) return normalizeMcrStatus(p.assignmentStatus);
    return p.completed ? 'completed' : 'under review';
  };

  // Submitted reviews only ever show as "Under Review" until the admin marks
  // them done — there is no separate "Pending" state in this panel.
  const getMcrStatusLabel = (status) => {
    return isMcrCompleted(status) ? '✓ Done' : 'Under Review';
  };

  const proposalMatchesFilter = (p) => {
    return Boolean(p.title || p.leader || p.researchTitle || p.protocolCode);
  };

  const reviewerOptions = reviewerRows
    .map(r => ({
      ...r,
      assignmentCount: (r.proposals || []).filter(proposalMatchesFilter).length,
    }))
    .filter(r => r.assignmentCount > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Full canonical faculty list, so every faculty is selectable even if it
  // currently has no reviewer assignments to show.
  const facultyOptions = STUDENT_PROPOSAL_DEPARTMENTS.map(d => ({ value: d.value, label: d.label }));

  const reviewerOptionsForFaculty = selectedFaculty === 'all'
    ? reviewerOptions
    : reviewerOptions.filter(r => (r.department || UNASSIGNED_FACULTY_KEY) === selectedFaculty);

  const allTableRows = reviewerOptions
    .flatMap(reviewer => (reviewer.proposals || []).filter(proposalMatchesFilter).map(p => ({ ...p, reviewer })))
    .sort((a, b) => {
      const deptCmp = (DEPARTMENT_ORDER[a.reviewer.department] ?? 999) - (DEPARTMENT_ORDER[b.reviewer.department] ?? 999);
      if (deptCmp !== 0) return deptCmp;
      const nameCmp = a.reviewer.name.localeCompare(b.reviewer.name);
      if (nameCmp !== 0) return nameCmp;
      return (a.title || a.researchTitle || '').localeCompare(b.title || b.researchTitle || '');
    });

  const facultyFilteredTableRows = selectedFaculty === 'all'
    ? allTableRows
    : allTableRows.filter(row => (row.reviewer.department || UNASSIGNED_FACULTY_KEY) === selectedFaculty);

  const hasReviewerSelected = selectedReviewerKey === 'all' || reviewerOptionsForFaculty.some(r => r.key === selectedReviewerKey);

  const tableRows = !hasReviewerSelected
    ? []
    : selectedReviewerKey === 'all'
      ? facultyFilteredTableRows
      : facultyFilteredTableRows.filter(row => row.reviewer.key === selectedReviewerKey);

  const selectedReviewer = selectedReviewerKey && selectedReviewerKey !== 'all'
    ? reviewerOptionsForFaculty.find(r => r.key === selectedReviewerKey) || null
    : null;

  useEffect(() => {
    if (!selectedReviewerKey) {
      setSelectedReviewerKey('all');
    }
  }, [selectedReviewerKey]);

  useEffect(() => {
    setSelectedReviewerKey('all');
  }, [selectedFaculty]);

  const completedCount = tableRows.filter(row => isMcrCompleted(getRowStatus(row))).length;
  const totalCount = tableRows.length;
  const underReviewCount = totalCount - completedCount;
  const facultySelected = selectedFaculty !== '';

  const MCR_PAGE_SIZE = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(tableRows.length / MCR_PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFaculty, selectedReviewerKey]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * MCR_PAGE_SIZE;
    return tableRows.slice(start, start + MCR_PAGE_SIZE);
  }, [tableRows, currentPage]);

  useEffect(() => {
    if (!onPaginationChange) return;
    if (loading || tableRows.length === 0) {
      onPaginationChange(null);
      return;
    }
    onPaginationChange({
      currentPage,
      totalPages,
      pageSize: MCR_PAGE_SIZE,
      pageCount: paginatedRows.length,
      total: tableRows.length,
      setCurrentPage,
    });
  }, [onPaginationChange, loading, tableRows.length, paginatedRows.length, currentPage, totalPages]);

  useEffect(() => () => onPaginationChange?.(null), [onPaginationChange]);

  return (
    <div className="mcr-wrapper">
      <div className="mcr-header">
        <h2 className="mcr-title">Mark Completed Review</h2>
        <p className="mcr-subtitle">
          {facultySelected
            ? 'Select a reviewer to view assignments and manage completed reviews.'
            : 'Select a faculty to begin — the reviewers under that faculty will then be listed.'}
        </p>
      </div>

      {loading ? (
        <div className="mcr-loading">
          <div className="mcr-spinner" />
          <span>Loading reviewer data…</span>
        </div>
      ) : (
        <>
          <div className="mcr-toolbar">
            <div className="mcr-toolbar-filters">
              <div className="mcr-dd-select-group mcr-toolbar-filter">
                <label className="mcr-dd-label" htmlFor="mcr-faculty-select">
                  Select Faculty
                </label>
                <div className="mcr-dd-select-wrapper">
                  <select
                    id="mcr-faculty-select"
                    className="mcr-dd-select"
                    value={selectedFaculty}
                    onChange={e => setSelectedFaculty(e.target.value)}
                  >
                    <option value="" disabled>-- Select Faculty --</option>
                    <option value="all">All Faculties</option>
                    {facultyOptions.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <svg className="mcr-dd-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {facultySelected && (
                <div className="mcr-dd-select-group mcr-toolbar-filter">
                  <label className="mcr-dd-label" htmlFor="mcr-reviewer-select">
                    Select Reviewer
                  </label>
                  <div className="mcr-dd-select-wrapper">
                    <select
                      id="mcr-reviewer-select"
                      className="mcr-dd-select"
                      value={selectedReviewerKey}
                      onChange={e => setSelectedReviewerKey(e.target.value)}
                    >
                      <option value="all">All Reviewers</option>
                      {reviewerOptionsForFaculty.map(r => (
                        <option key={r.key} value={r.key}>
                          {r.name} ({r.assignmentCount} assignment{r.assignmentCount !== 1 ? 's' : ''})
                        </option>
                      ))}
                    </select>
                    <svg className="mcr-dd-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            {facultySelected && (
              <div className="mcr-toolbar-stats">
                <span className="mcr-toolbar-stat">
                  <strong>{totalCount}</strong> assignment{totalCount !== 1 ? 's' : ''}
                </span>
                <span className="mcr-toolbar-stat mcr-toolbar-stat--pending">
                  <strong>{underReviewCount}</strong> under review
                </span>
                <span className="mcr-toolbar-stat mcr-toolbar-stat--done">
                  <strong>{completedCount}</strong> completed
                </span>
              </div>
            )}
          </div>

          {!facultySelected ? (
            <p className="mcr-no-data">Please select a faculty above to view its reviewers.</p>
          ) : (
          <div className="mcr-section">
            <div className="mcr-section-header">
              <span className="mcr-dot" style={{ background: '#2563eb' }} />
              <h3 className="mcr-section-title">
                {selectedReviewer
                  ? selectedReviewer.name
                  : selectedReviewerKey === 'all'
                    ? (selectedFaculty === 'all'
                      ? 'All Reviewers'
                      : `All Reviewers — ${getFacultyLabel(selectedFaculty)}`)
                    : 'Reviewer Assignments'}
              </h3>
              <span className="mcr-section-badge" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                {totalCount} record{totalCount !== 1 ? 's' : ''}
              </span>
            </div>

            {totalCount === 0 ? (
              <p className="mcr-no-data">
                {selectedReviewer
                  ? `No assignments found for ${selectedReviewer.name}.`
                  : selectedFaculty !== 'all'
                    ? `No reviewer assignments found for ${getFacultyLabel(selectedFaculty)}.`
                    : 'No reviewer assignments found.'}
              </p>
            ) : (
              <div className="mcr-table-wrap">
                <table className="mcr-table mcr-table--preliminary">
                  <colgroup>
                    <col className="mcr-col-num" />
                    <col className="mcr-col-reviewer" />
                    <col className="mcr-col-email" />
                    <col className="mcr-col-student" />
                    <col className="mcr-col-protocol" />
                    <col className="mcr-col-title" />
                    <col className="mcr-col-status" />
                    <col className="mcr-col-action" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="mcr-col-num">#</th>
                      <th className="mcr-col-reviewer">Reviewer</th>
                      <th className="mcr-col-email">Email</th>
                      <th className="mcr-col-student">Student (Proponent)</th>
                      <th className="mcr-col-protocol">Protocol Code</th>
                      <th className="mcr-col-title">Research Proposal Title</th>
                      <th className="mcr-col-status">Status</th>
                      <th className="mcr-col-action">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row, idx) => {
                      const rowNumber = (currentPage - 1) * MCR_PAGE_SIZE + idx + 1;
                      const rowKey = getMcrRowKey(row);
                      const pStatus = getRowStatus(row);
                      const isDone = isMcrCompleted(pStatus);
                      const isBusy = !!updating[rowKey];
                      const { reviewer } = row;

                      return (
                        <tr
                          key={`${reviewer.key}-${rowKey}-${idx}`}
                          className={`mcr-row ${idx % 2 === 1 ? 'mcr-row--alt' : ''} ${isDone ? 'mcr-row--done' : ''}`}
                        >
                          <td className="mcr-td-num">{rowNumber}</td>
                          <td className="mcr-td-name" title={reviewer.name}>{reviewer.name}</td>
                          <td className="mcr-td-email" title={reviewer.reviewerEmail || reviewer.email}>{reviewer.reviewerEmail || reviewer.email}</td>
                          <td className="mcr-td-student" title={row.leader}>{row.leader || 'N/A'}</td>
                          <td className="mcr-td-protocol">
                            <span className="mcr-protocol-code" title={row.protocolCode || 'N/A'}>{row.protocolCode || 'N/A'}</span>
                          </td>
                          <td className="mcr-td-title-cell">
                            <span className="mcr-td-title" title={row.title}>{row.title}</span>
                          </td>
                          <td className="mcr-td-status">
                            <span className={`mcr-status ${isDone ? 'mcr-status--completed' : 'mcr-status--review'}`}>
                              {getMcrStatusLabel(pStatus)}
                            </span>
                          </td>
                          <td className="mcr-td-action">
                            <button
                              type="button"
                              onClick={() => handleProposalToggle(row, pStatus, reviewer)}
                              disabled={isBusy || !(row.proposalId || row._id || row.protocolCode)}
                              className={`mcr-btn ${isDone ? 'mcr-btn--reset' : 'mcr-btn--complete'}`}
                            >
                              {isBusy ? (
                                <span className="mcr-btn-spinner" />
                              ) : isDone ? (
                                'Reset'
                              ) : (
                                'Mark Done'
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          )}
        </>
      )}
    </div>
  );
};

const AssignFileContent = () => null;







const MessageResearcherContent = () => {

  const [students, setStudents] = useState([]);

  const [filteredStudents, setFilteredStudents] = useState([]);

  const [selectedStudent, setSelectedStudent] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  const [message, setMessage] = useState('');

  const [attachedFiles, setAttachedFiles] = useState([]);

  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState('');

  const [error, setError] = useState('');

  const [isDragOver, setIsDragOver] = useState(false);

  const [isMessageSuccessModalOpen, setIsMessageSuccessModalOpen] = useState(false);

  const [messageSuccessRecipient, setMessageSuccessRecipient] = useState('');

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [messageHistory, setMessageHistory] = useState([]);

  const [historyLoading, setHistoryLoading] = useState(false);

  const [historyError, setHistoryError] = useState('');

  const [historySearch, setHistorySearch] = useState('');

  const [historySearchInput, setHistorySearchInput] = useState('');

  const [historyPage, setHistoryPage] = useState(1);

  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  const [historyTotal, setHistoryTotal] = useState(0);

  const [deletingMessageId, setDeletingMessageId] = useState('');

  const [deleteConfirmMsg, setDeleteConfirmMsg] = useState(null);

  const HISTORY_PAGE_SIZE = 20;



  const fetchHistoryPage = async (page, search) => {

    setHistoryLoading(true);

    setHistoryError('');

    try {

      const params = new URLSearchParams({ page: String(page), limit: String(HISTORY_PAGE_SIZE) });

      if (search) params.set('search', search);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/messages-to-student/history?${params.toString()}`);

      if (!response.ok) throw new Error('Failed to fetch history');

      const data = await response.json();

      setMessageHistory(data.messages || []);

      setHistoryPage(data.page || 1);

      setHistoryTotalPages(data.totalPages || 1);

      setHistoryTotal(data.total || 0);

    } catch (err) {

      console.error('Error fetching message history:', err);

      setHistoryError('Failed to load message history');

    } finally {

      setHistoryLoading(false);

    }

  };



  const openHistoryModal = () => {

    setIsHistoryModalOpen(true);

    setHistorySearch('');

    setHistorySearchInput('');

    fetchHistoryPage(1, '');

  };



  const requestDeleteMessage = (msg) => {

    setDeleteConfirmMsg(msg);

  };



  const cancelDeleteMessage = () => {

    setDeleteConfirmMsg(null);

  };



  const confirmDeleteMessage = async () => {

    const messageId = deleteConfirmMsg?._id;

    if (!messageId) return;

    setDeletingMessageId(messageId);

    try {

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/${messageId}`, {

        method: 'DELETE',

      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) throw new Error(data.error || 'Failed to delete message');

      setMessageHistory(prev => prev.filter(m => m._id !== messageId));

      setHistoryTotal(prev => Math.max(prev - 1, 0));

      setDeleteConfirmMsg(null);

    } catch (err) {

      console.error('Error deleting message:', err);

      setHistoryError('Failed to delete message');

    } finally {

      setDeletingMessageId('');

    }

  };



  // Debounce search-as-you-type so we don't hit the server on every keystroke

  useEffect(() => {

    if (!isHistoryModalOpen) return;

    if (historySearchInput === historySearch) return;

    const timer = setTimeout(() => {

      setHistorySearch(historySearchInput);

      fetchHistoryPage(1, historySearchInput);

    }, 400);

    return () => clearTimeout(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [historySearchInput, isHistoryModalOpen]);



  useEffect(() => {

    const fetchStudents = async () => {

      try {

        const data = await getAllStudents();

        setStudents(data);

        setFilteredStudents(data);

      } catch (error) {

        console.error('Error fetching students:', error);

        setError('Failed to fetch researchers');

      }

    };

    fetchStudents();

  }, []);



  // Filter students

  useEffect(() => {

    let filtered = students.filter(student => {

      const searchLower = searchQuery.toLowerCase();

      const name = (student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim()).toLowerCase();

      const email = (student.email || '').toLowerCase();

      const department = (student.department || '').toLowerCase();

      return name.includes(searchLower) ||

        email.includes(searchLower) ||

        department.includes(searchLower);

    });



    setFilteredStudents(filtered);

  }, [students, searchQuery]);



  const handleSubmit = (e) => {

    e.preventDefault();



    if (!selectedStudent || !message) {

      setError('Please select a researcher and enter a message');

      return;

    }

    setError('');

    const selectedStudentObj = students.find(s => s.email === selectedStudent);
    const recipientName = selectedStudentObj
      ? (selectedStudentObj.name || `${selectedStudentObj.firstName || ''} ${selectedStudentObj.lastName || ''}`.trim())
      : '';

    // Show success immediately — don't wait for file upload
    setMessageSuccessRecipient(recipientName || 'researcher');
    setIsMessageSuccessModalOpen(true);

    // Capture values before resetting form
    const studentEmail = selectedStudent;
    const messageText = message;
    const filesToSend = [...attachedFiles];

    // Reset form immediately
    setSelectedStudent('');
    setMessage('');
    setAttachedFiles([]);

    // Upload in background (fire-and-forget from client)
    const formDataToSend = new FormData();
    formDataToSend.append('studentEmail', studentEmail);
    formDataToSend.append('recipientName', recipientName);
    formDataToSend.append('message', messageText);
    filesToSend.forEach((file, index) => {
      formDataToSend.append(`file${index}`, file);
    });

    fetch(`${import.meta.env.VITE_API_URL}/api/send-message-to-student`, {
      method: 'POST',
      body: formDataToSend,
    }).catch(err => console.error('Message send failed:', err));
  };



  const MAX_MESSAGE_ATTACHMENTS = 3;

  const MAX_MESSAGE_TOTAL_BYTES = 12 * 1024 * 1024;

  const MESSAGE_ATTACHMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  const addValidatedFiles = (files) => {

    const room = MAX_MESSAGE_ATTACHMENTS - attachedFiles.length;

    if (room <= 0) {

      setError(`You can attach up to ${MAX_MESSAGE_ATTACHMENTS} files per message`);

      setTimeout(() => setError(''), 3000);

      return;

    }

    let runningTotal = attachedFiles.reduce((sum, f) => sum + f.size, 0);

    const accepted = [];

    let rejected = false;

    for (const file of files) {

      if (accepted.length >= room) { rejected = true; break; }

      if (!MESSAGE_ATTACHMENT_TYPES.includes(file.type)) { rejected = true; continue; }

      if (runningTotal + file.size > MAX_MESSAGE_TOTAL_BYTES) { rejected = true; break; }

      runningTotal += file.size;

      accepted.push(file);

    }

    if (accepted.length > 0) {

      setAttachedFiles(prev => [...prev, ...accepted]);

    }

    if (rejected) {

      setError(`Only PDF, DOC, and DOCX files are allowed, up to ${MAX_MESSAGE_ATTACHMENTS} files and 12MB combined`);

      setTimeout(() => setError(''), 3000);

    }

  };



  const handleFileChange = (e) => {

    const files = Array.from(e.target.files);

    addValidatedFiles(files);

    e.target.value = '';

  };



  const handleRemoveFile = (index) => {

    setAttachedFiles(prev => prev.filter((_, i) => i !== index));

  };



  const handleDragOver = (e) => {

    e.preventDefault();

    setIsDragOver(true);

  };



  const handleDragLeave = (e) => {

    e.preventDefault();

    setIsDragOver(false);

  };



  const handleDrop = (e) => {

    e.preventDefault();

    setIsDragOver(false);



    const files = Array.from(e.dataTransfer.files);

    addValidatedFiles(files);

  };



  return (

    <div className="form-content full-width">

      <div className="form-card">

        <div className="form-card-header-row">

          <h2>Message Researcher</h2>

          <button

            type="button"

            className="btn-secondary history-btn"

            onClick={openHistoryModal}

          >

            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

              <circle cx="12" cy="12" r="9" />

              <polyline points="12 7 12 12 16 14" />

            </svg>

            History

          </button>

        </div>

        <form className="message-form" onSubmit={handleSubmit}>

          <div className="form-group">

            <label>Select Researcher</label>

            <div className="student-selector">

              <div className="student-controls">

                <input

                  type="text"

                  placeholder="Search by name, email, or department..."

                  value={searchQuery}

                  onChange={(e) => setSearchQuery(e.target.value)}

                  className="student-search"

                />

              </div>



              {searchQuery && (

                <div className="search-results-info">

                  Found <span className="results-count">{filteredStudents.length}</span> researchers matching "{searchQuery}"

                  {filteredStudents.length === 0 && " - Try different keywords"}

                </div>

              )}



              <div className="student-dropdown">

                <select

                  value={selectedStudent}

                  onChange={(e) => setSelectedStudent(e.target.value)}

                  required

                  className="student-select"

                >

                  <option value="">

                    {filteredStudents.length === 0

                      ? 'No researchers found - adjust your search'

                      : `Select a researcher (${filteredStudents.length} available)`

                    }

                  </option>

                  {filteredStudents.map((student) => (

                    <option key={student._id} value={student.email}>

                      {student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email}

                      {student.department && ` - ${student.department}`}

                    </option>

                  ))}

                </select>

              </div>

            </div>

          </div>



          <div className="form-group">

            <label>Attached Files</label>

            <div

              className={`file-upload-area ${isDragOver ? 'dragover' : ''}`}

              onDragOver={handleDragOver}

              onDragLeave={handleDragLeave}

              onDrop={handleDrop}

              onClick={() => document.getElementById('message-file-upload').click()}

            >

              <input

                type="file"

                multiple

                onChange={handleFileChange}

                accept=".pdf,.doc,.docx"

                style={{ display: 'none' }}

                id="message-file-upload"

              />

              <div className="file-upload-label">

                <FilePlusIcon />

                <p>{isDragOver ? 'Drop files here' : 'Click to upload files or drag and drop'}</p>

                <span>PDF, DOC, DOCX (MAX. 3 files, 12MB total)</span>

              </div>

            </div>

          </div>



          {attachedFiles.length > 0 && (

            <div className="uploaded-files">

              <h4>Attached Files:</h4>

              <ul>

                {attachedFiles.map((file, index) => (

                  <li key={index}>

                    <span>{file.name}</span>

                    <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>

                    <button

                      type="button"

                      className="remove-file-btn"

                      onClick={() => handleRemoveFile(index)}

                    >

                      ×

                    </button>

                  </li>

                ))}

              </ul>

            </div>

          )}



          <div className="form-group">

            <label>Message</label>

            <textarea

              value={message}

              onChange={(e) => setMessage(e.target.value)}

              placeholder="Enter your message here..."

              rows="6"

              required

            />

          </div>



          {error && <div className="error-message">{error}</div>}



          <div className="form-actions">

            <button type="submit" className="btn-primary" disabled={loading}>

              {loading ? 'Sending...' : 'Send Message'}

            </button>

            <button

              type="button"

              className="btn-secondary"

              onClick={() => {

                setSelectedStudent('');

                setSearchQuery('');

                setMessage('');

                setAttachedFiles([]);

                setIsDragOver(false);

                setError('');

                setSuccess('');

              }}

            >

              Clear

            </button>

          </div>

        </form>

      </div>

      {/* Message Sent Success Modal */}

      {isMessageSuccessModalOpen && (

        <div className="success-modal-overlay" onClick={() => setIsMessageSuccessModalOpen(false)}>

          <div className="success-modal-container minimal" onClick={(e) => e.stopPropagation()}>

            <div className="success-content minimal">

              <div className="success-icon-minimal">

                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">

                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />

                  <polyline points="22 4 12 14.01 9 11.01" />

                </svg>

              </div>

              <h2>Message Sent</h2>

              <p>Your message was sent successfully to <strong>{messageSuccessRecipient}</strong>.</p>

              <div className="success-actions minimal">

                <button

                  className="success-btn-done"

                  onClick={() => setIsMessageSuccessModalOpen(false)}

                >

                  Done

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* Message History Modal */}

      {isHistoryModalOpen && (

        <div className="success-modal-overlay" onClick={() => setIsHistoryModalOpen(false)}>

          <div className="history-modal-container" onClick={(e) => e.stopPropagation()}>

            <div className="history-modal-header">

              <h2>Message History</h2>

              <button

                type="button"

                className="history-modal-close"

                onClick={() => setIsHistoryModalOpen(false)}

              >

                <XIcon />

              </button>

            </div>

            <div className="history-modal-search">

              <input

                type="text"

                placeholder="Search by researcher name or email..."

                value={historySearchInput}

                onChange={(e) => setHistorySearchInput(e.target.value)}

                className="student-search"

              />

              {historyTotal > 0 && (

                <span className="history-total-count">{historyTotal} message{historyTotal === 1 ? '' : 's'}</span>

              )}

            </div>

            <div className="history-modal-body">

              {historyLoading && <p className="history-empty-note">Loading message history...</p>}

              {!historyLoading && historyError && <p className="error-message">{historyError}</p>}

              {!historyLoading && !historyError && messageHistory.length === 0 && (

                <p className="history-empty-note">

                  {historySearch ? `No messages found matching "${historySearch}".` : 'No messages have been sent to researchers yet.'}

                </p>

              )}

              {!historyLoading && !historyError && messageHistory.map((msg) => (

                <div key={msg._id} className="history-item">

                  <div className="history-item-header">

                    <span className="history-item-recipient">To: {msg.recipientName || msg.recipientEmail}</span>

                    <div className="history-item-meta">

                      <span className="history-item-date">

                        {msg.sentAt ? new Date(msg.sentAt).toLocaleString() : ''}

                      </span>

                      <button

                        type="button"

                        className="history-item-delete"

                        title="Delete message"

                        disabled={deletingMessageId === msg._id}

                        onClick={() => requestDeleteMessage(msg)}

                      >

                        <TrashIcon />

                      </button>

                    </div>

                  </div>

                  <p className="history-item-message">{msg.message}</p>

                  {Array.isArray(msg.files) && msg.files.length > 0 && (

                    <div className="history-item-files">

                      {msg.files.map((file, i) => (

                        <div key={i} className="history-item-file">

                          <span className="history-item-file-name">{file.filename}</span>

                          {file.path && (

                            <div style={{ display: 'flex', gap: '8px' }}>

                              <button

                                type="button"

                                className="msg-file-download"

                                onClick={() => {

                                  import('../services/api.js').then(({ viewFile }) => {

                                    viewFile(file.path);

                                  });

                                }}

                              >

                                View

                              </button>

                              <button

                                type="button"

                                className="msg-file-download"

                                onClick={() => {

                                  import('../services/api.js').then(({ downloadReviewerFile }) => {

                                    downloadReviewerFile(file.path, file.filename);

                                  });

                                }}

                              >

                                Download

                              </button>

                            </div>

                          )}

                        </div>

                      ))}

                    </div>

                  )}

                </div>

              ))}

            </div>

            {!historyLoading && !historyError && historyTotalPages > 1 && (

              <div className="history-modal-pagination">

                <button

                  type="button"

                  className="btn-secondary"

                  disabled={historyPage <= 1}

                  onClick={() => fetchHistoryPage(historyPage - 1, historySearch)}

                >

                  Previous

                </button>

                <span className="history-page-indicator">Page {historyPage} of {historyTotalPages}</span>

                <button

                  type="button"

                  className="btn-secondary"

                  disabled={historyPage >= historyTotalPages}

                  onClick={() => fetchHistoryPage(historyPage + 1, historySearch)}

                >

                  Next

                </button>

              </div>

            )}

          </div>

        </div>

      )}

      {/* Delete Message Confirmation Modal */}
      {deleteConfirmMsg && (
        <div className="mini-modal-overlay delete-msg-modal-overlay" onClick={cancelDeleteMessage}>
          <div className="mini-modal" onClick={e => e.stopPropagation()}>
            <div className="mini-modal-icon mini-modal-icon--danger">
              <TrashIcon />
            </div>
            <h4 className="mini-modal-title">Delete Message</h4>
            <p className="mini-modal-text">
              Are you sure you want to delete this message to <strong>{deleteConfirmMsg.recipientName || deleteConfirmMsg.recipientEmail}</strong>? This action cannot be undone.
            </p>
            <div className="mini-modal-actions">
              <button
                type="button"
                className="mini-modal-btn mini-modal-btn--ghost"
                onClick={cancelDeleteMessage}
                disabled={deletingMessageId === deleteConfirmMsg._id}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mini-modal-btn mini-modal-btn--danger"
                onClick={confirmDeleteMessage}
                disabled={deletingMessageId === deleteConfirmMsg._id}
              >
                {deletingMessageId === deleteConfirmMsg._id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

  );

};



// Message Reviewer Content Component
const MessageReviewerContent = () => {

  const [reviewers, setReviewers] = useState([]);

  const [filteredReviewers, setFilteredReviewers] = useState([]);

  const [selectedReviewer, setSelectedReviewer] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  const [message, setMessage] = useState('');

  const [attachedFiles, setAttachedFiles] = useState([]);

  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState('');

  const [error, setError] = useState('');

  const [isDragOver, setIsDragOver] = useState(false);

  const [isMessageSuccessModalOpen, setIsMessageSuccessModalOpen] = useState(false);

  const [messageSuccessRecipient, setMessageSuccessRecipient] = useState('');

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [messageHistory, setMessageHistory] = useState([]);

  const [historyLoading, setHistoryLoading] = useState(false);

  const [historyError, setHistoryError] = useState('');

  const [historySearch, setHistorySearch] = useState('');

  const [historySearchInput, setHistorySearchInput] = useState('');

  const [historyPage, setHistoryPage] = useState(1);

  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  const [historyTotal, setHistoryTotal] = useState(0);

  const [deletingMessageId, setDeletingMessageId] = useState('');

  const [deleteConfirmMsg, setDeleteConfirmMsg] = useState(null);

  const HISTORY_PAGE_SIZE = 20;



  const fetchHistoryPage = async (page, search) => {

    setHistoryLoading(true);

    setHistoryError('');

    try {

      const params = new URLSearchParams({ page: String(page), limit: String(HISTORY_PAGE_SIZE) });

      if (search) params.set('search', search);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/messages-to-reviewer/history?${params.toString()}`);

      if (!response.ok) throw new Error('Failed to fetch history');

      const data = await response.json();

      setMessageHistory(data.messages || []);

      setHistoryPage(data.page || 1);

      setHistoryTotalPages(data.totalPages || 1);

      setHistoryTotal(data.total || 0);

    } catch (err) {

      console.error('Error fetching message history:', err);

      setHistoryError('Failed to load message history');

    } finally {

      setHistoryLoading(false);

    }

  };



  const openHistoryModal = () => {

    setIsHistoryModalOpen(true);

    setHistorySearch('');

    setHistorySearchInput('');

    fetchHistoryPage(1, '');

  };



  const requestDeleteMessage = (msg) => {

    setDeleteConfirmMsg(msg);

  };



  const cancelDeleteMessage = () => {

    setDeleteConfirmMsg(null);

  };



  const confirmDeleteMessage = async () => {

    const messageId = deleteConfirmMsg?._id;

    if (!messageId) return;

    setDeletingMessageId(messageId);

    try {

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/${messageId}`, {

        method: 'DELETE',

      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) throw new Error(data.error || 'Failed to delete message');

      setMessageHistory(prev => prev.filter(m => m._id !== messageId));

      setHistoryTotal(prev => Math.max(prev - 1, 0));

      setDeleteConfirmMsg(null);

    } catch (err) {

      console.error('Error deleting message:', err);

      setHistoryError('Failed to delete message');

    } finally {

      setDeletingMessageId('');

    }

  };



  // Debounce search-as-you-type so we don't hit the server on every keystroke

  useEffect(() => {

    if (!isHistoryModalOpen) return;

    if (historySearchInput === historySearch) return;

    const timer = setTimeout(() => {

      setHistorySearch(historySearchInput);

      fetchHistoryPage(1, historySearchInput);

    }, 400);

    return () => clearTimeout(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [historySearchInput, isHistoryModalOpen]);



  useEffect(() => {

    const fetchReviewers = async () => {

      try {

        const data = await getAllReviewers();

        setReviewers(data);

        setFilteredReviewers(data);

      } catch (error) {

        console.error('Error fetching reviewers:', error);

        setError('Failed to fetch reviewers');

      }

    };

    fetchReviewers();

  }, []);



  // Filter reviewers

  useEffect(() => {

    let filtered = reviewers.filter(reviewer => {

      const searchLower = searchQuery.toLowerCase();

      const name = (reviewer.name || `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim()).toLowerCase();

      const email = (reviewer.email || '').toLowerCase();

      const department = (reviewer.department || '').toLowerCase();

      const expertise = (reviewer.expertise || '').toLowerCase();

      return name.includes(searchLower) ||

        email.includes(searchLower) ||

        department.includes(searchLower) ||

        expertise.includes(searchLower);

    });

    setFilteredReviewers(filtered);

  }, [reviewers, searchQuery]);



  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedReviewer || !message) {
      setError('Please select a reviewer and enter a message');
      return;
    }

    setError('');
    const selectedReviewerObj = reviewers.find(r => r.email === selectedReviewer);
    const recipientName = selectedReviewerObj
      ? (selectedReviewerObj.name || `${selectedReviewerObj.firstName || ''} ${selectedReviewerObj.lastName || ''}`.trim())
      : '';

    // Show success immediately
    setMessageSuccessRecipient(recipientName || 'reviewer');
    setIsMessageSuccessModalOpen(true);

    // Capture values before resetting form
    const reviewerEmail = selectedReviewer;
    const messageText = message;
    const filesToSend = [...attachedFiles];

    // Reset form immediately
    setSelectedReviewer('');
    setMessage('');
    setAttachedFiles([]);

    // Upload in background via FormData
    const formDataToSend = new FormData();
    formDataToSend.append('reviewerEmail', reviewerEmail);
    formDataToSend.append('recipientName', recipientName);
    formDataToSend.append('message', messageText);
    filesToSend.forEach((file, index) => {
      formDataToSend.append(`file${index}`, file);
    });

    fetch(`${import.meta.env.VITE_API_URL}/api/send-message-to-reviewer`, {
      method: 'POST',
      body: formDataToSend,
    }).catch(err => console.error('Message send failed:', err));
  };

  const MAX_MESSAGE_ATTACHMENTS = 3;
  const MAX_MESSAGE_TOTAL_BYTES = 12 * 1024 * 1024;
  const MESSAGE_ATTACHMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  const addValidatedFiles = (files) => {
    const room = MAX_MESSAGE_ATTACHMENTS - attachedFiles.length;
    if (room <= 0) {
      setError(`You can attach up to ${MAX_MESSAGE_ATTACHMENTS} files per message`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    let runningTotal = attachedFiles.reduce((sum, f) => sum + f.size, 0);
    const accepted = [];
    let rejected = false;
    for (const file of files) {
      if (accepted.length >= room) { rejected = true; break; }
      if (!MESSAGE_ATTACHMENT_TYPES.includes(file.type)) { rejected = true; continue; }
      if (runningTotal + file.size > MAX_MESSAGE_TOTAL_BYTES) { rejected = true; break; }
      runningTotal += file.size;
      accepted.push(file);
    }

    if (accepted.length > 0) {
      setAttachedFiles(prev => [...prev, ...accepted]);
    }
    if (rejected) {
      setError(`Only PDF, DOC, and DOCX files are allowed, up to ${MAX_MESSAGE_ATTACHMENTS} files and 12MB combined`);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    addValidatedFiles(files);
    e.target.value = '';
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    addValidatedFiles(files);
  };

  return (
    <div className="form-content full-width">
      <div className="form-card">
        <div className="form-card-header-row">
          <h2>Message Reviewer</h2>
          <button
            type="button"
            className="btn-secondary history-btn"
            onClick={openHistoryModal}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 16 14" />
            </svg>
            History
          </button>
        </div>
        <form className="message-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Reviewer</label>
            <div className="student-selector">
              <div className="student-controls">
                <input
                  type="text"
                  placeholder="Search by name, email, department, or expertise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="student-search"
                />
              </div>

              {searchQuery && (
                <div className="search-results-info">
                  Found <span className="results-count">{filteredReviewers.length}</span> reviewers matching "{searchQuery}"
                  {filteredReviewers.length === 0 && " - Try different keywords"}
                </div>
              )}

              <div className="student-dropdown">
                <select
                  value={selectedReviewer}
                  onChange={(e) => setSelectedReviewer(e.target.value)}
                  required
                  className="student-select"
                >
                  <option value="">
                    {filteredReviewers.length === 0
                      ? 'No reviewers found - adjust your search'
                      : `Select a reviewer (${filteredReviewers.length} available)`
                    }
                  </option>
                  {filteredReviewers.map((reviewer) => (
                    <option key={reviewer._id} value={reviewer.email}>
                      {reviewer.name || `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim() || reviewer.email}
                      {reviewer.department && ` - ${reviewer.department}`}
                      {reviewer.expertise && ` - ${reviewer.expertise}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Attached Files</label>
            <div
              className={`file-upload-area ${isDragOver ? 'dragover' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('message-reviewer-file-upload').click()}
            >
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
                style={{ display: 'none' }}
                id="message-reviewer-file-upload"
              />
              <div className="file-upload-label">
                <FilePlusIcon />
                <p>{isDragOver ? 'Drop files here' : 'Click to upload files or drag and drop'}</p>
                <span>PDF, DOC, DOCX (MAX. 3 files, 12MB total)</span>
              </div>
            </div>
          </div>

          {attachedFiles.length > 0 && (
            <div className="uploaded-files">
              <h4>Attached Files:</h4>
              <ul>
                {attachedFiles.map((file, index) => (
                  <li key={index}>
                    <span>{file.name}</span>
                    <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={() => handleRemoveFile(index)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-group">
            <label>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message here..."
              rows="6"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Message'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSelectedReviewer('');
                setSearchQuery('');
                setMessage('');
                setAttachedFiles([]);
                setIsDragOver(false);
                setError('');
                setSuccess('');
              }}
            >
              Clear
            </button>
          </div>

        </form>

      </div>



      {/* Message Sent Success Modal */}

      {isMessageSuccessModalOpen && (

        <div className="success-modal-overlay" onClick={() => setIsMessageSuccessModalOpen(false)}>

          <div className="success-modal-container minimal" onClick={(e) => e.stopPropagation()}>

            <div className="success-content minimal">

              <div className="success-icon-minimal">

                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">

                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />

                  <polyline points="22 4 12 14.01 9 11.01" />

                </svg>

              </div>

              <h2>Message Sent</h2>

              <p>Your message was sent successfully to <strong>{messageSuccessRecipient}</strong>.</p>

              <div className="success-actions minimal">

                <button

                  className="success-btn-done"

                  onClick={() => setIsMessageSuccessModalOpen(false)}

                >

                  Done

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* Message History Modal */}
      {isHistoryModalOpen && (
        <div className="success-modal-overlay" onClick={() => setIsHistoryModalOpen(false)}>
          <div className="history-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-header">
              <h2>Message History</h2>
              <button
                type="button"
                className="history-modal-close"
                onClick={() => setIsHistoryModalOpen(false)}
              >
                <XIcon />
              </button>
            </div>
            <div className="history-modal-search">
              <input
                type="text"
                placeholder="Search by reviewer name or email..."
                value={historySearchInput}
                onChange={(e) => setHistorySearchInput(e.target.value)}
                className="student-search"
              />
              {historyTotal > 0 && (
                <span className="history-total-count">{historyTotal} message{historyTotal === 1 ? '' : 's'}</span>
              )}
            </div>
            <div className="history-modal-body">
              {historyLoading && <p className="history-empty-note">Loading message history...</p>}
              {!historyLoading && historyError && <p className="error-message">{historyError}</p>}
              {!historyLoading && !historyError && messageHistory.length === 0 && (
                <p className="history-empty-note">
                  {historySearch ? `No messages found matching "${historySearch}".` : 'No messages have been sent to reviewers yet.'}
                </p>
              )}
              {!historyLoading && !historyError && messageHistory.map((msg) => (
                <div key={msg._id} className="history-item">
                  <div className="history-item-header">
                    <span className="history-item-recipient">To: {msg.recipientName || msg.recipientEmail}</span>
                    <div className="history-item-meta">
                      <span className="history-item-date">
                        {msg.sentAt ? new Date(msg.sentAt).toLocaleString() : ''}
                      </span>
                      <button
                        type="button"
                        className="history-item-delete"
                        title="Delete message"
                        disabled={deletingMessageId === msg._id}
                        onClick={() => requestDeleteMessage(msg)}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                  <p className="history-item-message">{msg.message}</p>
                  {Array.isArray(msg.files) && msg.files.length > 0 && (
                    <div className="history-item-files">
                      {msg.files.map((file, i) => (
                        <div key={i} className="history-item-file">
                          <span className="history-item-file-name">{file.filename}</span>
                          {file.path && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                className="msg-file-download"
                                onClick={() => {
                                  import('../services/api.js').then(({ viewFile }) => {
                                    viewFile(file.path);
                                  });
                                }}
                              >
                                View
                              </button>
                              <button
                                type="button"
                                className="msg-file-download"
                                onClick={() => {
                                  import('../services/api.js').then(({ downloadReviewerFile }) => {
                                    downloadReviewerFile(file.path, file.filename);
                                  });
                                }}
                              >
                                Download
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {!historyLoading && !historyError && historyTotalPages > 1 && (
              <div className="history-modal-pagination">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={historyPage <= 1}
                  onClick={() => fetchHistoryPage(historyPage - 1, historySearch)}
                >
                  Previous
                </button>
                <span className="history-page-indicator">Page {historyPage} of {historyTotalPages}</span>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={historyPage >= historyTotalPages}
                  onClick={() => fetchHistoryPage(historyPage + 1, historySearch)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Message Confirmation Modal */}
      {deleteConfirmMsg && (
        <div className="mini-modal-overlay delete-msg-modal-overlay" onClick={cancelDeleteMessage}>
          <div className="mini-modal" onClick={e => e.stopPropagation()}>
            <div className="mini-modal-icon mini-modal-icon--danger">
              <TrashIcon />
            </div>
            <h4 className="mini-modal-title">Delete Message</h4>
            <p className="mini-modal-text">
              Are you sure you want to delete this message to <strong>{deleteConfirmMsg.recipientName || deleteConfirmMsg.recipientEmail}</strong>? This action cannot be undone.
            </p>
            <div className="mini-modal-actions">
              <button
                type="button"
                className="mini-modal-btn mini-modal-btn--ghost"
                onClick={cancelDeleteMessage}
                disabled={deletingMessageId === deleteConfirmMsg._id}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mini-modal-btn mini-modal-btn--danger"
                onClick={confirmDeleteMessage}
                disabled={deletingMessageId === deleteConfirmMsg._id}
              >
                {deletingMessageId === deleteConfirmMsg._id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

  );

};



function AdminProfileContent({
  userInfo,
  uploadingPic,
  picError,
  picSuccess,
  fileInputRef,
  handleProfilePicClick,
  handleProfilePicUpload,
  handleProfilePicDelete,
  showPasswordForm,
  setShowPasswordForm,
  pwdData,
  setPwdData,
  pwdError,
  pwdSuccess,
  pwdLoading,
  handlePasswordUpdate,
  showPasswords,
  setShowPasswords,
  fontScale,
  setFontScale
}) {
  const initials = (userInfo?.name || 'A').charAt(0).toUpperCase();
  const rawRole = (userInfo?.originalRole || userInfo?.role || 'admin').toLowerCase();
  const isSuperAdmin = rawRole === 'superadmin' || rawRole === 'super-admin' || rawRole === 'root' || rawRole === 'administrator';
  const roleText = isSuperAdmin ? 'Super Admin' : 'Admin Only';

  return (
    <div className="ap-wrapper">

      {/* ── Hero Card ── */}
      <div className="ap-hero-card">
        {/* Avatar with upload functionality */}
        <div
          className="ap-avatar-wrapper"
          onClick={!uploadingPic ? handleProfilePicClick : undefined}
          style={{ cursor: uploadingPic ? 'default' : 'pointer' }}
        >
          {/* Loading state */}
          {uploadingPic && (
            <div className="ap-avatar-loading">
              <div className="ap-avatar-spinner" />
            </div>
          )}

          {/* Profile image */}
          {!uploadingPic && userInfo?.profilePicture && (
            <img
              key={userInfo.profilePicture}
              src={getProfilePicUrl(userInfo.profilePicture)}
              alt="Admin Profile"
              className="ap-profile-picture"
              onLoad={(e) => {
                e.target.style.display = 'block';
                const fallback = e.target.parentElement?.querySelector('.ap-hero-avatar');
                if (fallback) fallback.style.display = 'none';
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                const fallback = e.target.parentElement?.querySelector('.ap-hero-avatar');
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          )}

          {/* Fallback initials */}
          <div
            className="ap-hero-avatar"
            style={{ display: (!uploadingPic && !userInfo?.profilePicture) ? 'flex' : 'none' }}
          >
            {initials}
          </div>

          {/* Hover overlay */}
          {!uploadingPic && (
            <div className="ap-avatar-hover-overlay">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              <span>Upload Photo</span>
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

        <div className="ap-hero-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
            <h2 className="ap-hero-name" style={{ margin: 0 }}>{userInfo?.name || 'Admin'}</h2>
            <span className={`ap-badge-role ${isSuperAdmin ? 'ap-badge-super' : 'ap-badge-normal'}`}>
              {roleText}
            </span>
          </div>
          <p className="ap-hero-role">{userInfo?.role || 'Administrator'}</p>
          <p className="ap-hero-email">{userInfo?.email || ''}</p>
        </div>

        {/* Remove photo button — only visible when photo exists */}
        {userInfo?.profilePicture && (
          <button
            className="ap-remove-btn"
            onClick={handleProfilePicDelete}
            title="Remove profile picture"
          >
            <TrashIcon />
            Remove Photo
          </button>
        )}
      </div>

      {/* ── Feedback Banners ── */}
      {picSuccess && <div className="ap-banner ap-banner--success">{picSuccess}</div>}
      {picError && <div className="ap-banner ap-banner--error">{picError}</div>}

      {/* ── Account Information Card ── */}
      <div className="ap-info-card">
        <div className="ap-card-header">
          <h3 className="ap-card-title">Account Information</h3>
        </div>

        <div className="ap-info-grid">
          {[
            { label: 'Full Name', value: userInfo?.name },
            { label: 'Email Address', value: userInfo?.email },
            { label: 'Account Role', value: userInfo?.role || 'Administrator' },
            { label: 'Access Level', value: roleText }
          ].map(({ label, value }) => (
            <div className="ap-info-item" key={label}>
              <span className="ap-info-label">{label}</span>
              <span className="ap-info-value">{value || <em style={{ color: '#b0b8c1' }}>Not set</em>}</span>
            </div>
          ))}
        </div>

        <p className="ap-info-note">
          Account details are managed by the system. Contact your system provider to make changes.
        </p>
      </div>

      {/* ── Security Card ── */}
      <div className="ap-info-card">
        <div className="ap-card-header">
          <div>
            <h3 className="ap-card-title">Security</h3>
            <p className="ap-card-subtitle">Manage your account password and security settings</p>
          </div>
          {!showPasswordForm && (
            <button
              className="ap-toggle-btn"
              onClick={() => { setShowPasswordForm(true); setPwdError(''); setPwdSuccess(''); }}
            >
              Change Password
            </button>
          )}
        </div>

        {pwdSuccess && <div className="ap-banner ap-banner--success" style={{ marginBottom: '1.5rem' }}>{pwdSuccess}</div>}
        {pwdError && <div className="ap-banner ap-banner--error" style={{ marginBottom: '1.5rem' }}>{pwdError}</div>}

        {showPasswordForm && (
          <form className="ap-password-form" onSubmit={handlePasswordUpdate}>
            <div className="ap-edit-grid">
              <div className="ap-field ap-field--wide">
                <label className="ap-field-label">Current Password</label>
                <div className="ap-password-input-wrapper">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    className="ap-field-input"
                    value={pwdData.current}
                    onChange={e => setPwdData(p => ({ ...p, current: e.target.value }))}
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    className="ap-password-toggle"
                    onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                  >
                    {showPasswords.current ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <div className="ap-field">
                <label className="ap-field-label">New Password</label>
                <div className="ap-password-input-wrapper">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    className="ap-field-input"
                    value={pwdData.new}
                    onChange={e => setPwdData(p => ({ ...p, new: e.target.value }))}
                    placeholder="At least 6 characters"
                    required
                  />
                  <button
                    type="button"
                    className="ap-password-toggle"
                    onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                  >
                    {showPasswords.new ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <div className="ap-field">
                <label className="ap-field-label">Confirm New Password</label>
                <div className="ap-password-input-wrapper">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    className="ap-field-input"
                    value={pwdData.confirm}
                    onChange={e => setPwdData(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Repeat new password"
                    required
                  />
                  <button
                    type="button"
                    className="ap-password-toggle"
                    onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                  >
                    {showPasswords.confirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            </div>
            <div className="ap-edit-actions">
              <button
                type="submit"
                className="ap-btn ap-btn--save"
                disabled={pwdLoading}
              >
                {pwdLoading ? 'Updating...' : 'Update Password'}
              </button>
              <button
                type="button"
                className="ap-btn ap-btn--cancel"
                onClick={() => setShowPasswordForm(false)}
                disabled={pwdLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Display Card ── */}
      <div className="ap-info-card">
        <div className="ap-card-header">
          <div>
            <h3 className="ap-card-title">Display</h3>
            <p className="ap-card-subtitle">Adjust the text size across your Admin Dashboard</p>
          </div>
        </div>

        <div className="ap-font-size-control">
          <span className="ap-font-size-icon ap-font-size-icon--small">A</span>
          <input
            type="range"
            className="ap-font-size-slider"
            min="80"
            max="150"
            step="5"
            value={fontScale}
            onChange={e => setFontScale(Number(e.target.value))}
            aria-label="Font size"
          />
          <span className="ap-font-size-icon ap-font-size-icon--large">A</span>
          <span className="ap-font-size-value">{fontScale}%</span>
          {fontScale !== 100 && (
            <button
              type="button"
              className="ap-toggle-btn"
              onClick={() => setFontScale(100)}
            >
              Reset
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

const ManageUsersContent = ({ onPaginationChange }) => {



  const [users, setUsers] = useState([]);



  const [reviewers, setReviewers] = useState([]);



  const [students, setStudents] = useState([]);



  const [loading, setLoading] = useState(true);



  const [activeTab, setActiveTab] = useState('admins');



  // Disable state
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [disablingStudent, setDisablingStudent] = useState(null);

  // Edit and Delete states

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isEditSuccessModalOpen, setIsEditSuccessModalOpen] = useState(false);

  const [isEditErrorModalOpen, setIsEditErrorModalOpen] = useState(false);

  const [isDeleteSuccessModalOpen, setIsDeleteSuccessModalOpen] = useState(false);

  const [isDeleteErrorModalOpen, setIsDeleteErrorModalOpen] = useState(false);

  const [editErrorMessage, setEditErrorMessage] = useState('');

  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');

  const [editingUser, setEditingUser] = useState(null);

  const [deletingUser, setDeletingUser] = useState(null);

  const [editFormData, setEditFormData] = useState({});

  const [editLoading, setEditLoading] = useState(false);

  const [newCoMember, setNewCoMember] = useState({ name: '', email: '', role: '' });

  const [showCoMemberForm, setShowCoMemberForm] = useState(false);

  const addCoMemberToEdit = () => {

    if (!newCoMember.name.trim() || !newCoMember.email.trim()) return;

    setEditFormData(prev => ({

      ...prev,

      coMembers: [...(prev.coMembers || []), { ...newCoMember, id: Date.now().toString() }]

    }));

    setNewCoMember({ name: '', email: '', role: '' });

    setShowCoMemberForm(false);

  };

  const removeCoMemberFromEdit = (id) => {

    setEditFormData(prev => ({

      ...prev,

      coMembers: (prev.coMembers || []).filter(m => m.id !== id)

    }));

  };



  // Search and sort states

  const [searchQuery, setSearchQuery] = useState('');

  const [sortBy, setSortBy] = useState('name');

  const [sortOrder, setSortOrder] = useState('asc');

  const MU_PAGE_SIZE = 15;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, sortBy, sortOrder]);



  // Disable / Enable handlers
  const handleDisable = (student) => {
    setDisablingStudent(student);
    setIsDisableModalOpen(true);
  };

  const confirmDisable = async () => {
    if (!disablingStudent) return;
    const willDisable = !disablingStudent.disabled;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/students/${disablingStudent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabled: willDisable }),
      });
      setStudents(prev =>
        prev.map(s => s._id === disablingStudent._id ? { ...s, disabled: willDisable } : s)
      );
    } catch (err) {
      console.error('Error toggling student disabled state:', err);
    } finally {
      setIsDisableModalOpen(false);
      setDisablingStudent(null);
    }
  };

  // Edit handlers

  const handleEdit = (user, userType) => {

    setEditingUser({ ...user, userType });

    // Students: do not preload reviewer/admin-only fields (`title`, full `name`) or they get $set on the student document.
    if (userType === 'student') {

      setEditFormData({

        firstName: user.firstName || '',

        middleName: user.middleName || '',

        lastName: user.lastName || '',

        suffix: user.suffix || '',

        email: user.email || '',

        sex: user.sex || user.gender || '',

        gender: user.gender || '',

        researcherType: user.researcherType || '',

        department: user.department || '',

        program: user.program || '',
        coMembers: user.coMembers || [],
        facebookLink: user.facebookLink || ''
      });

    } else if (userType === 'reviewer') {

      setEditFormData({

        firstName: user.firstName || '',

        middleName: user.middleName || '',

        lastName: user.lastName || '',

        suffix: user.suffix || '',

        title: user.title || '',

        name: user.name || '',

        email: user.email || '',

        department: user.department || '',

        role: user.role || '',

        gender: user.gender || '',

        reviewerType: user.reviewerType || ''

      });

    } else {

      setEditFormData({

        firstName: user.firstName || '',

        middleName: user.middleName || '',

        lastName: user.lastName || '',

        suffix: user.suffix || '',

        title: user.title || '',

        name: user.name || '',

        email: user.email || '',

        department: user.department || '',

        role: user.role || '',

        gender: user.gender || ''

      });

    }

    setIsEditModalOpen(true);

  };



  const closeEditModal = () => {

    setIsEditModalOpen(false);

    setEditingUser(null);

    setEditFormData({});

    setNewCoMember({ name: '', email: '', role: '' });

    setShowCoMemberForm(false);

  };



  const closeEditSuccessModal = () => {

    setIsEditSuccessModalOpen(false);

  };



  const closeEditErrorModal = () => {

    setIsEditErrorModalOpen(false);

    setEditErrorMessage('');

  };



  const handleEditInputChange = (e) => {

    const { name, value } = e.target;

    setEditFormData(prev => ({

      ...prev,

      [name]: value

    }));

  };



  // Researcher Type drives Affiliation Category here too: External Researcher
  // locks the Faculty field to Institution/Agency, while Faculty/Staff/Student
  // Researcher locks it back to a selectable Faculty (so admin picks the
  // specific faculty and program).
  const handleEditResearcherTypeChange = (e) => {

    const selectedType = e.target.value;

    setEditFormData(prev => ({

      ...prev,

      researcherType: selectedType,

      department: selectedType === 'External Researcher' ? 'Institution/Agency' : '',

      program: ''

    }));

  };



  const handleEditSubmit = async (e) => {

    e.preventDefault();

    setEditLoading(true);



    try {

      const { updateUser, updateReviewer, updateStudent } = await import('../services/api.js');

      let result;



      if (editingUser.userType === 'admin') {

        result = await updateUser(editingUser._id, editFormData);

      } else if (editingUser.userType === 'reviewer') {

        result = await updateReviewer(editingUser._id, editFormData);

      } else if (editingUser.userType === 'student') {

        result = await updateStudent(editingUser._id, editFormData);

      }



      if (result.success) {

        // Refresh the data

        const fetchUsers = async () => {

          const { getAllUsers, getAllReviewers, getAllStudents } = await import('../services/api.js');

          const [userList, reviewerList, studentList] = await Promise.all([

            getAllUsers(),

            getAllReviewers(),

            getAllStudents()

          ]);

          const nonReviewerUsers = userList.filter(user => user.role !== 'reviewer');

          setUsers(nonReviewerUsers);

          setReviewers(reviewerList);

          setStudents(studentList);

        };

        fetchUsers();



        closeEditModal();

        setIsEditSuccessModalOpen(true);

      } else {

        setEditErrorMessage(result.error || 'Failed to update user');

        setIsEditErrorModalOpen(true);

      }

    } catch (error) {

      console.error('Error updating user:', error);

      setEditErrorMessage('Error updating user. Please try again.');

      setIsEditErrorModalOpen(true);

    } finally {

      setEditLoading(false);

    }

  };



  // Delete handlers

  const handleDelete = (user, userType) => {

    setDeletingUser({ ...user, userType });

    setIsDeleteModalOpen(true);

  };



  const closeDeleteModal = () => {

    setIsDeleteModalOpen(false);

    setDeletingUser(null);

  };

  const closeDeleteSuccessModal = () => {

    setIsDeleteSuccessModalOpen(false);

  };

  const closeDeleteErrorModal = () => {

    setIsDeleteErrorModalOpen(false);

  };



  const confirmDelete = async () => {

    if (!deletingUser) return;

    try {

      const { deleteUser, deleteReviewer, deleteStudent } = await import('../services/api.js');

      let result;
      const userTypeStr = (deletingUser.userType || '').toLowerCase();

      if (userTypeStr.includes('reviewer')) {

        result = await deleteReviewer(deletingUser._id);

      } else if (userTypeStr.includes('student')) {

        result = await deleteStudent(deletingUser._id);

      } else {

        result = await deleteUser(deletingUser._id);

      }

      if (result && result.success) {

        const deletedId = deletingUser._id;

        // Optimistically filter local state immediately so table renders cleanly
        setReviewers(prev => (Array.isArray(prev) ? prev.filter(r => String(r._id) !== String(deletedId)) : []));
        setStudents(prev => (Array.isArray(prev) ? prev.filter(s => String(s._id) !== String(deletedId)) : []));
        setUsers(prev => (Array.isArray(prev) ? prev.filter(u => String(u._id) !== String(deletedId)) : []));

        // Close delete modal cleanly before opening success modal
        setIsDeleteModalOpen(false);
        setDeletingUser(null);
        setIsDeleteSuccessModalOpen(true);

        // Refresh data in background safely
        try {
          const { getAllUsers, getAllReviewers, getAllStudents } = await import('../services/api.js');

          const [userList, reviewerList, studentList] = await Promise.all([
            getAllUsers().catch(() => null),
            getAllReviewers().catch(() => null),
            getAllStudents().catch(() => null)
          ]);

          if (Array.isArray(userList)) {
            const nonReviewerUsers = userList.filter(user => user && user.role !== 'reviewer');
            setUsers(nonReviewerUsers);
          }

          if (Array.isArray(reviewerList)) {
            setReviewers(reviewerList);
          }

          if (Array.isArray(studentList)) {
            setStudents(studentList);
          }
        } catch (fetchErr) {
          console.warn('Background refresh error after delete:', fetchErr);
        }

      } else {

        setIsDeleteModalOpen(false);
        setDeletingUser(null);
        setDeleteErrorMessage(result?.error || 'Failed to delete user');
        setIsDeleteErrorModalOpen(true);

      }

    } catch (error) {

      console.error('Error deleting user:', error);
      setIsDeleteModalOpen(false);
      setDeletingUser(null);
      setDeleteErrorMessage('An unexpected error occurred while deleting the user. Please try again.');
      setIsDeleteErrorModalOpen(true);

    }

  };



  const tabs = [

    { id: 'admins', label: 'Admin' },

    { id: 'reviewers', label: 'Reviewers' },

    { id: 'students', label: 'Researchers' }

  ];







  useEffect(() => {



    const fetchUsers = async () => {



      try {



        const { getAllUsers, getAllReviewers, getAllStudents } = await import('../services/api.js');



        const [userList, reviewerList, studentList] = await Promise.all([

          getAllUsers(),

          getAllReviewers(),

          getAllStudents()

        ]);



        // Filter out reviewers from main users table (show only non-reviewer users)

        const nonReviewerUsers = userList.filter(user => user.role !== 'reviewer');

        setUsers(nonReviewerUsers);

        setReviewers(reviewerList);

        setStudents(studentList);



      } catch (error) {



        console.error('Error fetching users:', error);



      } finally {



        setLoading(false);



      }



    };







    fetchUsers();



  }, []);





  // Search and filter functions

  const handleSearch = (e) => {

    setSearchQuery(e.target.value);

  };



  const handleSort = (field) => {

    if (sortBy === field) {

      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');

    } else {

      setSortBy(field);

      setSortOrder('asc');

    }

  };



  const filterAndSortData = (data, type) => {

    let filteredData = Array.isArray(data) ? [...data].filter(Boolean) : [];



    // Search functionality

    if (searchQuery) {

      const query = searchQuery.toLowerCase().trim();
      const isSexSearch = ['male', 'female'].includes(query);

      filteredData = filteredData.filter(item => {

        const itemSex = (item.sex || item.gender || '').toLowerCase();

        if (type === 'reviewer') {

          return (

            (item.firstName && item.firstName.toLowerCase().includes(query)) ||

            (item.lastName && item.lastName.toLowerCase().includes(query)) ||

            (item.department && item.department.toLowerCase().includes(query)) ||

            (item.name && item.name.toLowerCase().includes(query)) ||

            (isSexSearch && itemSex === query)

          );

        } else if (type === 'student') {

          return (

            (item.firstName && item.firstName.toLowerCase().includes(query)) ||

            (item.lastName && item.lastName.toLowerCase().includes(query)) ||

            (item.department && item.department.toLowerCase().includes(query)) ||

            (item.name && item.name.toLowerCase().includes(query)) ||

            (isSexSearch && itemSex === query)

          );

        } else {

          return (

            (item.name && item.name.toLowerCase().includes(query)) ||

            (item.email && item.email.toLowerCase().includes(query)) ||

            (isSexSearch && itemSex === query)

          );

        }

      });

    }



    // Sort functionality

    filteredData.sort((a, b) => {

      let aValue, bValue;



      if (type === 'reviewer') {

        if (sortBy === 'name') {

          aValue = a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim();

          bValue = b.name || `${b.firstName || ''} ${b.lastName || ''}`.trim();

        } else if (sortBy === 'firstName') {

          aValue = a.firstName || '';

          bValue = b.firstName || '';

        } else if (sortBy === 'lastName') {

          aValue = a.lastName || '';

          bValue = b.lastName || '';

        } else if (sortBy === 'department') {

          aValue = a.department || '';

          bValue = b.department || '';

        }

      } else if (type === 'student') {

        if (sortBy === 'name') {

          aValue = a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim();

          bValue = b.name || `${b.firstName || ''} ${b.lastName || ''}`.trim();

        } else if (sortBy === 'firstName') {

          aValue = a.firstName || '';

          bValue = b.firstName || '';

        } else if (sortBy === 'lastName') {

          aValue = a.lastName || '';

          bValue = b.lastName || '';

        } else if (sortBy === 'department') {

          aValue = a.department || '';

          bValue = b.department || '';

        }

      } else {

        if (sortBy === 'name') {

          aValue = a.name || '';

          bValue = b.name || '';

        }

      }



      // Handle empty values for proper sorting

      if (aValue === undefined || aValue === null) aValue = '';

      if (bValue === undefined || bValue === null) bValue = '';



      const comparison = aValue.localeCompare(bValue);

      return sortOrder === 'asc' ? comparison : -comparison;

    });



    return filteredData;

  };

  const paginatableType = activeTab === 'reviewers' ? 'reviewer' : activeTab === 'students' ? 'student' : null;
  const paginatableSource = activeTab === 'reviewers' ? reviewers : activeTab === 'students' ? students : null;
  const filteredActiveList = paginatableSource ? filterAndSortData(paginatableSource, paginatableType) : null;
  const totalPages = filteredActiveList ? Math.max(1, Math.ceil(filteredActiveList.length / MU_PAGE_SIZE)) : 1;
  const paginatedActiveList = filteredActiveList
    ? filteredActiveList.slice((currentPage - 1) * MU_PAGE_SIZE, currentPage * MU_PAGE_SIZE)
    : null;

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!onPaginationChange) return;
    if (loading || !filteredActiveList || filteredActiveList.length === 0) {
      onPaginationChange(null);
      return;
    }
    onPaginationChange({
      currentPage,
      totalPages,
      pageSize: MU_PAGE_SIZE,
      pageCount: paginatedActiveList.length,
      total: filteredActiveList.length,
      label: paginatableType === 'reviewer' ? 'Reviewer' : 'Researcher',
      setCurrentPage,
    });
  }, [onPaginationChange, loading, filteredActiveList?.length, paginatedActiveList?.length, currentPage, totalPages, paginatableType]);

  useEffect(() => () => onPaginationChange?.(null), [onPaginationChange]);



  const renderTable = () => {

    if (loading) {

      return (

        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-medium)' }}>

          Loading users...

        </div>

      );

    }



    switch (activeTab) {

      case 'admins':

        return (

          <table className="users-table">

            <thead>

              <tr>

                <th>Name</th>

                <th>Email</th>

                <th>Role</th>

                <th>Last Login</th>

                <th>Status</th>

                <th>Actions</th>

              </tr>

            </thead>

            <tbody>

              {users.length === 0 ? (

                <tr>

                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-medium)' }}>

                    No admin users found.

                  </td>

                </tr>

              ) : (

                users.filter(user => user.role === 'admin' || user.role === 'superadmin').map((user, index) => (

                  <tr key={index}>

                    <td>{user.name}</td>

                    <td>{user.email}</td>

                    <td>

                      <span className={`role-badge ${user.role}`}>

                        {user.role === 'superadmin' ? 'Super Admin' : 'Administrator'}

                      </span>

                    </td>

                    <td>

                      {user.lastLogin ?

                        new Date(user.lastLogin).toLocaleDateString() + ' ' +

                        new Date(user.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                        : 'Never'

                      }

                    </td>

                    <td>

                      <span className="status-badge active">Active</span>

                    </td>

                    <td>

                      {user.role !== 'superadmin' && (

                        <div className="action-buttons">

                          <button className="btn-secondary" onClick={() => handleEdit(user, 'admin')}>Edit</button>

                          <button className="btn-danger" onClick={() => handleDelete(user, 'admin')}>Remove</button>

                        </div>

                      )}

                      {user.role === 'superadmin' && (

                        <span style={{ color: '#636e72', fontSize: '0.85rem', fontStyle: 'italic' }}>No actions available</span>

                      )}

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        );



      case 'reviewers':

        const filteredReviewers = filteredActiveList || [];
        const paginatedReviewers = paginatedActiveList || [];

        return (

          <div>

            {/* Search and Sort Controls */}

            <div className="search-sort-controls" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', overflowX: 'auto' }}>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'nowrap' }}>

                <div className="group">

                  <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">

                    <g>

                      <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"></path>

                    </g>

                  </svg>

                  <input

                    placeholder="Search"

                    type="search"

                    className="input"

                    value={searchQuery}

                    onChange={handleSearch}

                  />

                </div>

                <div className="sort-controls" style={{ display: 'flex', gap: '0.5rem' }}>

                  <button

                    className={`btn-secondary ${sortBy === 'name' ? 'active' : ''}`}

                    onClick={() => handleSort('name')}

                    title="Sort by Name"

                  >

                    Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}

                  </button>

                  <button

                    className={`btn-secondary ${sortBy === 'firstName' ? 'active' : ''}`}

                    onClick={() => handleSort('firstName')}

                    title="Sort by First Name"

                  >

                    First Name {sortBy === 'firstName' && (sortOrder === 'asc' ? '↑' : '↓')}

                  </button>

                  <button

                    className={`btn-secondary ${sortBy === 'lastName' ? 'active' : ''}`}

                    onClick={() => handleSort('lastName')}

                    title="Sort by Last Name"

                  >

                    Last Name {sortBy === 'lastName' && (sortOrder === 'asc' ? '↑' : '↓')}

                  </button>

                  <button

                    className={`btn-secondary ${sortBy === 'department' ? 'active' : ''}`}

                    onClick={() => handleSort('department')}

                    title="Sort by Faculty"

                  >

                    Faculty {sortBy === 'department' && (sortOrder === 'asc' ? '↑' : '↓')}

                  </button>

                </div>

              </div>

              <div style={{ marginLeft: 'auto', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-medium, #4b5563)', whiteSpace: 'nowrap' }}>

                Reviewers: {reviewers.length}

              </div>

            </div>



            <table className="users-table">

              <thead>

                <tr>

                  <th>Name</th>

                  <th>Email</th>

                  <th>Sex</th>

                  <th>Faculty</th>

                  <th>Created Date</th>

                  <th>Status</th>

                  <th>Actions</th>

                </tr>

              </thead>

              <tbody>

                {filteredReviewers.length === 0 ? (

                  <tr>

                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-medium)' }}>

                      No reviewers found.

                    </td>

                  </tr>

                ) : (

                  paginatedReviewers.map((reviewer, index) => (

                    <tr key={index}>

                      <td>{formatReviewerName(reviewer)}</td>

                      <td>{reviewer.email}</td>

                      <td>{reviewer.sex || reviewer.gender || 'Not set'}</td>

                      <td>{reviewer.department || 'Not specified'}</td>

                      <td>

                        {reviewer.createdAt ?

                          new Date(reviewer.createdAt).toLocaleDateString()

                          : 'Unknown'

                        }

                      </td>

                      <td>

                        <span className="status-badge active">Active</span>

                      </td>

                      <td>

                        <div className="action-buttons">

                          <button className="btn-secondary" onClick={() => handleEdit(reviewer, 'reviewer')}>Edit</button>

                          <button className="btn-danger" onClick={() => handleDelete(reviewer, 'reviewer')}>Remove</button>

                        </div>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        );



      case 'students':

        const filteredStudents = filteredActiveList || [];
        const paginatedStudents = paginatedActiveList || [];

        return (

          <div>

            {/* Search and Sort Controls */}

            <div className="search-sort-controls" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', overflowX: 'auto' }}>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'nowrap' }}>

                <div className="group">

                  <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">

                    <g>

                      <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"></path>

                    </g>

                  </svg>

                  <input

                    placeholder="Search"

                    type="search"

                    className="input"

                    value={searchQuery}

                    onChange={handleSearch}

                  />

                </div>

                <div className="sort-controls" style={{ display: 'flex', gap: '0.5rem' }}>

                  <button

                    className={`btn-secondary ${sortBy === 'name' ? 'active' : ''}`}

                    onClick={() => handleSort('name')}

                    title="Sort by Name"

                  >

                    Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}

                  </button>

                  <button

                    className={`btn-secondary ${sortBy === 'firstName' ? 'active' : ''}`}

                    onClick={() => handleSort('firstName')}

                    title="Sort by First Name"

                  >

                    First Name {sortBy === 'firstName' && (sortOrder === 'asc' ? '↑' : '↓')}

                  </button>

                  <button

                    className={`btn-secondary ${sortBy === 'lastName' ? 'active' : ''}`}

                    onClick={() => handleSort('lastName')}

                    title="Sort by Last Name"

                  >

                    Last Name {sortBy === 'lastName' && (sortOrder === 'asc' ? '↑' : '↓')}

                  </button>

                  <button

                    className={`btn-secondary ${sortBy === 'department' ? 'active' : ''}`}

                    onClick={() => handleSort('department')}

                    title="Sort by Faculty"

                  >

                    Faculty {sortBy === 'department' && (sortOrder === 'asc' ? '↑' : '↓')}

                  </button>

                </div>

              </div>

              <div style={{ marginLeft: 'auto', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-medium, #4b5563)', whiteSpace: 'nowrap' }}>

                Researchers: {students.length}

              </div>

            </div>



            <table className="users-table">

              <thead>

                <tr>

                  <th>Name</th>

                  <th>Sex</th>

                  <th>Email</th>

                  <th>Faculty</th>

                  <th>Program</th>

                  <th>Status</th>

                  <th>Actions</th>

                </tr>

              </thead>

              <tbody>

                {filteredStudents.length === 0 ? (

                  <tr>

                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-medium)' }}>

                      No researchers found.

                    </td>

                  </tr>

                ) : (

                  paginatedStudents.map((student, index) => (

                    <tr key={index}>

                      <td>{student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email || 'Unnamed Student'}</td>

                      <td>{student.sex || student.gender || 'Not set'}</td>

                      <td>{student.email}</td>

                      <td>{student.department}</td>

                      <td>{student.program}</td>

                      <td>

                        <span className={`status-badge ${student.disabled ? 'disabled' : 'active'}`}>
                          {student.disabled ? 'Disabled' : 'Active'}
                        </span>

                      </td>

                      <td>

                        <div className="action-buttons">

                          <button className="btn-secondary" onClick={() => handleEdit(student, 'student')}>Edit</button>

                          <button
                            className={student.disabled ? 'btn-enable' : 'btn-warning'}
                            onClick={() => handleDisable(student)}
                          >
                            {student.disabled ? 'Enable' : 'Disable'}
                          </button>

                          <button className="btn-danger" onClick={() => handleDelete(student, 'student')}>Remove</button>

                        </div>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        );



      default:

        return null;

    }

  };





  return (



    <div className="users-content">



      <div className="users-header">

        <h2>Manage Users</h2>

      </div>



      <div className="users-tabs">

        {tabs.map((tab) => (

          <button

            key={tab.id}

            className={`users-tab-btn ${activeTab === tab.id ? 'active' : ''}`}

            onClick={() => setActiveTab(tab.id)}

          >

            {tab.label}

          </button>

        ))}

      </div>



      <div className="users-table-container">

        {renderTable()}

      </div>



      {/* Edit User Modal */}

      {isEditModalOpen && (

        <div className="modal-overlay">

          <div className="modal-container edit-user-modal">

            <div className="modal-header">

              <h2>Edit {editingUser?.userType === 'admin' ? 'Admin' : editingUser?.userType === 'reviewer' ? 'Reviewer' : 'Researcher'}</h2>

              <button className="modal-close" onClick={closeEditModal}>

                <XIcon />

              </button>

            </div>



            <form onSubmit={handleEditSubmit} className="admin-form">

              <div className="edit-user-form-grid">

                <div className="form-group">

                  <label>First Name</label>

                  <input

                    type="text"

                    name="firstName"

                    value={editFormData.firstName || ''}

                    onChange={handleEditInputChange}

                    required

                  />

                </div>



                <div className="form-group">

                  <label>Middle Name (optional)</label>

                  <input

                    type="text"

                    name="middleName"

                    value={editFormData.middleName || ''}

                    onChange={handleEditInputChange}

                  />

                </div>



                <div className="form-group">

                  <label>Last Name</label>

                  <input

                    type="text"

                    name="lastName"

                    value={editFormData.lastName || ''}

                    onChange={handleEditInputChange}

                    required

                  />

                </div>



                <div className="form-group">

                  <label>Suffix (optional)</label>

                  <select

                    name="suffix"

                    value={editFormData.suffix || ''}

                    onChange={handleEditInputChange}

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



                {editingUser?.userType === 'reviewer' && (

                  <>

                    <div className="form-group">

                      <label>Title (optional)</label>

                      <select

                        name="title"

                        value={editFormData.title || ''}

                        onChange={handleEditInputChange}

                      >

                        <option value="">None</option>

                        <option value="Doctor">Doctor (Dr.)</option>

                        <option value="Engineer">Engineer (Engr.)</option>

                        <option value="Professor">Professor (Prof.)</option>

                        <option value="RN">RN</option>

                        <option value="LPT">LPT</option>

                        <option value="MSN">MSN</option>

                        <option value="RN/LPT">RN/LPT</option>

                        <option value="RN/MSN">RN/MSN</option>

                        <option value="MIT">MIT</option>

                        <option value="DBM">DBM</option>

                      </select>

                    </div>

                    <div className="form-group">

                      <label>Sex</label>

                      <select

                        name="gender"

                        value={editFormData.sex || editFormData.gender || ''}

                        onChange={handleEditInputChange}

                      >

                        <option value="">Select Sex</option>

                        <option value="Male">Male</option>

                        <option value="Female">Female</option>

                      </select>

                    </div>

                  </>

                )}




                {editingUser?.userType === 'student' && (

                  <>

                    <div className="form-group">

                      <label>Sex</label>

                      <select

                        name="gender"

                        value={editFormData.sex || editFormData.gender || ''}

                        onChange={handleEditInputChange}

                      >

                        <option value="">Select Sex</option>

                        <option value="Male">Male</option>

                        <option value="Female">Female</option>

                      </select>

                    </div>



                    <div className="form-group">

                      <label>Researcher Type</label>

                      <select

                        name="researcherType"

                        value={editFormData.researcherType || ''}

                        onChange={handleEditResearcherTypeChange}

                      >

                        <option value="">Select Researcher Type</option>

                        <option value="Faculty Researcher">Faculty Researcher</option>

                        <option value="Staff Researcher">Staff Researcher</option>

                        <option value="External Researcher">External Researcher</option>

                        <option value="Student Researcher">Student Researcher</option>

                      </select>

                    </div>

                  </>

                )}

                <div className="form-group">

                  <label>Email Address</label>

                  <input

                    type="email"

                    name="email"

                    value={editFormData.email || ''}

                    onChange={handleEditInputChange}

                    required

                  />

                </div>



                <div className="form-group">

                  <label>

                    {(editFormData.affiliationType === 'Institution/Agency' || editFormData.affiliationType === 'Institution' || editFormData.affiliationType === 'Agency' || editFormData.department === 'Institution/Agency')

                      ? 'Institution / Agency'

                      : 'Faculty'}

                  </label>

                  <select

                    name="department"

                    value={editFormData.department || ''}

                    onChange={handleEditInputChange}

                    disabled={editFormData.researcherType === 'External Researcher'}

                    required

                  >

                    <option value="">Select Faculty</option>

                    <option value="Institution/Agency">Institution/Agency</option>

                    <option value="FALS">FALS-Faculty of Agriculture and Life Sciences</option>

                    <option value="FTED">FTED- Faculty of Teacher Education</option>

                    <option value="FAIS">FAIS-Faculty of Advance and International Studies</option>

                    <option value="FNAHS">FNAHS-Faculty of Nursing and Allied Health Science</option>

                    <option value="FBM">FBM-Faculty of Business Management</option>

                    <option value="FCJE">FCJE-Faculty of Criminology Justice Education</option>

                    <option value="FACET">FACET-Faculty of Computing, Engineering, Technology</option>

                    <option value="FHUSOCOM">FHUSOCOM-Faculty of Humanities, Social Science & Communication</option>

                    <option value="SIEC">SIEC- San Isidro Extension Campus</option>

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



                {editingUser?.userType === 'student' && (

                  <>

                    <div className="form-group">

                      <label>Program</label>

                      <input

                        type="text"

                        name="program"

                        value={editFormData.program || ''}

                        onChange={handleEditInputChange}

                      />

                    </div>

                    <div className="form-group">

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                        <label>Facebook URL</label>

                        {editFormData.facebookLink && (

                          <a

                            href={editFormData.facebookLink.startsWith('http') ? editFormData.facebookLink : `https://${editFormData.facebookLink}`}

                            target="_blank"

                            rel="noopener noreferrer"

                            style={{ fontSize: '0.75rem', color: '#0866FF', fontWeight: 600, textDecoration: 'none' }}

                          >

                            Visit Profile ↗

                          </a>

                        )}

                      </div>

                      <input

                        type="url"

                        name="facebookLink"

                        value={editFormData.facebookLink || ''}

                        onChange={handleEditInputChange}

                        placeholder="https://facebook.com/profilename"

                      />

                    </div>

                  </>

                )}



                {editingUser?.userType === 'student' && (

                  <div className="form-group full-width" style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>

                      <label style={{ fontWeight: 600, color: '#495057', fontSize: '0.9rem', margin: 0 }}>

                        Research Co-Members

                      </label>

                      {!showCoMemberForm && (

                        <button

                          type="button"

                          className="btn-secondary"

                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}

                          onClick={() => setShowCoMemberForm(true)}

                        >

                          + Add Member

                        </button>

                      )}

                    </div>



                    {showCoMemberForm && (

                      <div style={{ background: '#fff', border: '1px solid #dee2e6', borderRadius: '6px', padding: '0.75rem', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>

                          <div className="form-group" style={{ margin: 0 }}>

                            <label style={{ fontSize: '0.7rem' }}>Name</label>

                            <input

                              type="text"

                              value={newCoMember.name}

                              onChange={e => setNewCoMember(p => ({ ...p, name: e.target.value }))}

                              placeholder="Full name"

                              style={{ padding: '0.3rem', fontSize: '0.85rem' }}

                            />

                          </div>

                          <div className="form-group" style={{ margin: 0 }}>

                            <label style={{ fontSize: '0.7rem' }}>Email</label>

                            <input

                              type="email"

                              value={newCoMember.email}

                              onChange={e => setNewCoMember(p => ({ ...p, email: e.target.value }))}

                              placeholder="Email address"

                              style={{ padding: '0.3rem', fontSize: '0.85rem' }}

                            />

                          </div>

                        </div>

                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>

                          <label style={{ fontSize: '0.7rem' }}>Role</label>

                          <input

                            type="text"

                            value={newCoMember.role}

                            onChange={e => setNewCoMember(p => ({ ...p, role: e.target.value }))}

                            placeholder="e.g. Co-Proponent"

                            style={{ padding: '0.3rem', fontSize: '0.85rem' }}

                          />

                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>

                          <button type="button" className="btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setShowCoMemberForm(false)}>Cancel</button>

                          <button type="button" className="btn-primary" style={{ padding: '2px 12px', fontSize: '0.75rem' }} onClick={addCoMemberToEdit}>Add</button>

                        </div>

                      </div>

                    )}



                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>

                      {Array.isArray(editFormData?.coMembers) && editFormData.coMembers.length > 0 ? (

                        editFormData.coMembers.map((m, idx) => (

                          <div key={m.id || idx} style={{ padding: '0.75rem', background: '#fff', borderRadius: '6px', border: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>

                              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#2d3436' }}>{m.name}</div>

                              <div style={{ fontSize: '0.75rem', color: '#636e72', display: 'flex', gap: '0.5rem' }}>

                                <span>{m.email}</span>

                                {m.role && <span style={{ color: '#b2bec3' }}>•</span>}

                                {m.role && <span>{m.role}</span>}

                              </div>

                            </div>

                            <button

                              type="button"

                              style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, padding: '4px' }}

                              onClick={() => removeCoMemberFromEdit(m.id || idx)}

                            >

                              Remove

                            </button>

                          </div>

                        ))

                      ) : (

                        <div style={{ textAlign: 'center', padding: '1rem', color: '#adb5bd', fontSize: '0.85rem', fontStyle: 'italic', background: '#fff', borderRadius: '6px', border: '1px dashed #dee2e6' }}>

                          No co-members listed

                        </div>

                      )}

                    </div>

                  </div>

                )}



                {editingUser?.userType === 'admin' && (

                  <div className="form-group full-width">

                    <label>Role</label>

                    <select

                      name="role"

                      value={editFormData.role || ''}

                      onChange={handleEditInputChange}

                      required

                    >

                      <option value="admin">Administrator</option>

                      <option value="superadmin">Super Administrator</option>

                    </select>

                  </div>

                )}



                <div className="modal-footer full-width">

                  <button type="button" className="btn-secondary" onClick={closeEditModal}>

                    Cancel

                  </button>

                  <button type="submit" className="btn-primary" disabled={editLoading}>

                    {editLoading ? 'Saving...' : 'Save Changes'}

                  </button>

                </div>

              </div>

            </form>

          </div>

        </div>

      )}



      {/* Disable / Enable Confirmation Modal */}
      {isDisableModalOpen && (
        <div className="logout-modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsDisableModalOpen(false)}>
          <div className="logout-modal-container">
            <div className="logout-modal-header">
              <h2>{disablingStudent?.disabled ? 'Enable Account' : 'Disable Account'}</h2>
            </div>
            <div className="logout-modal-body">
              <p>
                {disablingStudent?.disabled
                  ? 'Are you sure you want to enable this researcher\'s account? They will be able to log in again.'
                  : 'Are you sure you want to disable this researcher\'s account? They will not be able to log in.'}
              </p>
              <p><strong>{disablingStudent?.name || `${disablingStudent?.firstName || ''} ${disablingStudent?.lastName || ''}`.trim() || disablingStudent?.email}</strong></p>
            </div>
            <div className="logout-modal-footer">
              <button className="logout-modal-btn-secondary" onClick={() => setIsDisableModalOpen(false)}>
                Cancel
              </button>
              <button
                className={disablingStudent?.disabled ? 'logout-modal-btn-secondary' : 'logout-modal-btn-primary'}
                style={disablingStudent?.disabled ? { background: '#16a34a', color: '#fff', borderColor: '#16a34a' } : { background: '#d97706', borderColor: '#d97706' }}
                onClick={confirmDisable}
              >
                {disablingStudent?.disabled ? 'Yes, Enable' : 'Yes, Disable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}

      {isDeleteModalOpen && deletingUser && (

        <div className="logout-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeDeleteModal()}>

          <div className="logout-modal-container">

            <div className="logout-modal-header">

              <h2>Confirm Delete</h2>

            </div>

            <div className="logout-modal-body">

              <p>Are you sure you want to delete this {deletingUser?.userType === 'student' ? 'researcher' : deletingUser?.userType}?</p>

              <p><strong>{deletingUser?.name || deletingUser?.email}</strong></p>

              <p style={{ color: '#DC3545', marginTop: '1rem' }}>

                This action cannot be undone.

              </p>

            </div>

            <div className="logout-modal-footer">

              <button className="logout-modal-btn-secondary" onClick={closeDeleteModal}>

                Cancel

              </button>

              <button className="logout-modal-btn-primary" onClick={confirmDelete}>

                Delete {deletingUser?.userType === 'student' ? 'Researcher' : deletingUser?.userType === 'admin' ? 'Admin' : deletingUser?.userType === 'reviewer' ? 'Reviewer' : deletingUser?.userType}

              </button>

            </div>

          </div>

        </div>

      )}



      {/* Edit Success Modal */}

      {isEditSuccessModalOpen && (

        <div className="success-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeEditSuccessModal()}>

          <div className="success-modal-container">

            <div className="success-modal-content">

              <div className="success-icon">

                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />

                  <polyline points="22 4 12 14.01 9 11.01" />

                </svg>

              </div>

              <h3>User Updated Successfully!</h3>

              <p>The user information has been updated.</p>

              <button className="success-modal-btn" onClick={closeEditSuccessModal}>

                OK

              </button>

            </div>

          </div>

        </div>

      )}



      {/* Edit Error Modal */}

      {isEditErrorModalOpen && (

        <div className="error-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeEditErrorModal()}>

          <div className="error-modal-container">

            <div className="error-modal-content">

              <div className="error-icon">

                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F44336" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                  <circle cx="12" cy="12" r="10" />

                  <line x1="15" y1="9" x2="9" y2="15" />

                  <line x1="9" y1="9" x2="15" y2="15" />

                </svg>

              </div>

              <h3>Update Failed!</h3>

              <p>{editErrorMessage}</p>

              <button className="error-modal-btn" onClick={closeEditErrorModal}>

                OK

              </button>

            </div>

          </div>

        </div>

      )}



      {/* Delete Success Modal */}

      {isDeleteSuccessModalOpen && (

        <div className="success-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeDeleteSuccessModal()}>

          <div className="success-modal-container">

            <div className="success-modal-content">

              <div className="success-icon">

                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />

                  <polyline points="22 4 12 14.01 9 11.01" />

                </svg>

              </div>

              <h3>User Deleted Successfully!</h3>

              <p>The user has been removed from the system.</p>

              <button className="success-modal-btn" onClick={closeDeleteSuccessModal}>

                OK

              </button>

            </div>

          </div>

        </div>

      )}



      {/* Delete Error Modal */}

      {isDeleteErrorModalOpen && (

        <div className="error-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeDeleteErrorModal()}>

          <div className="error-modal-container">

            <div className="error-modal-content">

              <div className="error-icon">

                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F44336" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                  <circle cx="12" cy="12" r="10" />

                  <line x1="15" y1="9" x2="9" y2="15" />

                  <line x1="9" y1="9" x2="15" y2="15" />

                </svg>

              </div>

              <h3>Delete Failed!</h3>

              <p>{deleteErrorMessage}</p>

              <button className="error-modal-btn" onClick={closeDeleteErrorModal}>

                OK

              </button>

            </div>

          </div>

        </div>

      )}



    </div>



  );



};



function NotificationContent({ setActiveTab, onRefreshCount }) {

  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);

  const [expandedGroups, setExpandedGroups] = useState({}); // Track which reviewer groups are expanded
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {

    fetchNotifications();

  }, []);



  // One-time migration: notifications previously "deleted" only via the old
  // localStorage-based hiding never got soft-deleted (dismissed) server-side.
  // Push those into the real delete endpoint once, then drop the local list —
  // deletion is now always persisted to the database via confirmDeleteNotification.
  const migrateLegacyLocalDeletes = async (data) => {
    let legacyIds = [];
    try { legacyIds = JSON.parse(localStorage.getItem('deleted_notifications') || '[]'); }
    catch { legacyIds = []; }
    if (!legacyIds.length) return data;

    const stillPresent = data.filter(n => legacyIds.includes(n._id));
    if (stillPresent.length) {
      await Promise.all(stillPresent.map(n =>
        fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${n._id}/delete`, { method: 'POST' })
          .catch(err => console.error('Error migrating deleted notification:', err))
      ));
    }
    localStorage.removeItem('deleted_notifications');
    return data.filter(n => !legacyIds.includes(n._id));
  };

  const fetchNotifications = async () => {

    setLoading(true);

    try {

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`);

      const rawData = await response.json();

      const filtered = await migrateLegacyLocalDeletes(rawData);
      setNotifications(filtered);

      // Auto-expand all groups by default
      const groups = groupByReviewer(filtered);
      const allExpanded = {};
      Object.keys(groups).forEach(reviewer => {
        allExpanded[reviewer] = true;
      });
      setExpandedGroups(allExpanded);

    } catch (error) {

      console.error('Error fetching notifications:', error);

    } finally {

      setLoading(false);

    }

  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await fetchNotifications();
      if (onRefreshCount) onRefreshCount();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper to extract reviewer name from notification
  const getReviewerFromNotification = (notification) => {
    // Try different fields where reviewer info might be stored
    if (notification.reviewerName) return notification.reviewerName;
    if (notification.senderName) return notification.senderName;
    if (notification.recipientName) return notification.recipientName;
    if (notification.reviewerEmail) return notification.reviewerEmail;
    if (notification.senderEmail) return notification.senderEmail;
    // Extract from message if possible
    if (notification.message) {
      const match = notification.message.match(/^([^\s]+\s+[^\s]+)\s+submitted/);
      if (match) return match[1];
    }
    return 'System';
  };

  // Group notifications by reviewer
  const groupByReviewer = (notifs) => {
    return notifs.reduce((acc, notif) => {
      const reviewer = getReviewerFromNotification(notif);
      if (!acc[reviewer]) acc[reviewer] = [];
      acc[reviewer].push(notif);
      return acc;
    }, {});
  };

  const toggleGroup = (reviewer) => {
    setExpandedGroups(prev => ({
      ...prev,
      [reviewer]: !prev[reviewer]
    }));
  };

  const expandAll = () => {
    const groups = groupByReviewer(notifications);
    const allExpanded = {};
    Object.keys(groups).forEach(reviewer => {
      allExpanded[reviewer] = true;
    });
    setExpandedGroups(allExpanded);
  };

  const collapseAll = () => {
    const groups = groupByReviewer(notifications);
    const allCollapsed = {};
    Object.keys(groups).forEach(reviewer => {
      allCollapsed[reviewer] = false;
    });
    setExpandedGroups(allCollapsed);
  };



  const handleMarkAsRead = async (id) => {

    try {

      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, { method: 'PUT' });

      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
      if (onRefreshCount) onRefreshCount();

    } catch (error) {

      console.error('Error marking notification as read:', error);

    }

  };



  const handleMarkAllAsRead = async () => {

    try {

      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`, { method: 'PUT' });

      setNotifications(notifications.map(n => ({ ...n, read: true })));
      if (onRefreshCount) onRefreshCount();

    } catch (error) {

      console.error('Error marking all notifications as read:', error);

    }

  };



  const requestDeleteNotification = (e, id) => {

    e.stopPropagation();
    setDeleteConfirmId(id);

  };

  const confirmDeleteNotification = async () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/delete`, { method: 'POST' });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
    setNotifications(prev => prev.filter(n => n._id !== id));
    if (onRefreshCount) onRefreshCount();
  };



  const handleNotificationClick = (notification) => {

    // Mark as read

    if (!notification.read) {

      handleMarkAsRead(notification._id);

    }



    // Handle review notifications

    if (notification.type === 'review_submitted' && notification.reviewId) {

      // Navigate to Messages Inbox tab

      setActiveTab('messages-inbox');

      // Store the selected review ID to display specific review

      localStorage.setItem('selectedReviewId', notification.reviewId);

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



  const getNotificationIcon = (type) => {

    if (type === 'review_submitted') {

      return (

        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />

          <polyline points="22 4 12 14.01 9 11.01" />

        </svg>

      );

    }

    return <NotificationIcon />;

  };



  const unreadCount = notifications.filter(n => !n.read).length;

  // Group notifications by reviewer
  const groupedNotifications = groupByReviewer(notifications);
  const reviewers = Object.keys(groupedNotifications).sort();


  return (

    <div className="notification-content">

      <div className="notification-header">

        <h2>Notifications {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}</h2>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>

          <button
            className="btn-secondary"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh notifications"
            style={{ fontSize: '0.85rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={isRefreshing ? { animation: 'spin 0.8s linear infinite' } : undefined}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </button>

          {reviewers.length > 0 && (
            <>
              <button className="btn-secondary" onClick={expandAll} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                Expand All
              </button>
              <button className="btn-secondary" onClick={collapseAll} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                Collapse All
              </button>
            </>
          )}

          {unreadCount > 0 && (

            <button className="btn-primary" onClick={handleMarkAllAsRead}>Mark All as Read</button>

          )}

        </div>

      </div>

      <div className="notification-list">

        {loading ? (

          <div className="notification-item" style={{ justifyContent: 'center', padding: '2rem' }}>

            <p style={{ color: 'var(--text-medium)' }}>Loading notifications...</p>

          </div>

        ) : notifications.length === 0 ? (

          <div className="notification-item" style={{ justifyContent: 'center', padding: '2rem' }}>

            <p style={{ color: 'var(--text-medium)' }}>No notifications yet</p>

          </div>

        ) : (

          reviewers.map((reviewer) => {

            const reviewerNotifs = groupedNotifications[reviewer];

            const unreadInGroup = reviewerNotifs.filter(n => !n.read).length;

            const isExpanded = expandedGroups[reviewer] !== false;

            return (

              <div key={reviewer} style={{ marginBottom: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>

                {/* Reviewer Header - Click to toggle */}

                <div

                  onClick={() => toggleGroup(reviewer)}

                  style={{

                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: isExpanded ? '#f9fafb' : '#f3f4f6',
                    cursor: 'pointer',
                    borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none',
                    transition: 'background-color 0.2s'
                  }}

                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isExpanded ? '#f9fafb' : '#f3f4f6'}

                >

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                    <span style={{ fontWeight: 600, color: '#374151' }}>{reviewer}</span>

                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>({reviewerNotifs.length})</span>

                    {unreadInGroup > 0 && (

                      <span className="unread-badge" style={{ fontSize: '0.75rem' }}>{unreadInGroup} new</span>

                    )}

                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>

                      {isExpanded ? '▼' : '▶'}

                    </span>

                  </div>

                </div>

                {/* Notifications List for this reviewer */}

                {isExpanded && (

                  <div style={{ backgroundColor: '#fff' }}>

                    {reviewerNotifs.map((notification) => (

                      <div

                        key={notification._id}

                        className={`notification-item ${!notification.read ? 'unread' : ''}`}

                        onClick={() => handleNotificationClick(notification)}

                        style={{
                          cursor: notification.type === 'review_submitted' ? 'pointer' : (!notification.read ? 'pointer' : 'default'),
                          borderBottom: '1px solid #f3f4f6',
                          margin: 0,
                          borderRadius: 0
                        }}

                      >

                        <div className="notification-icon assigned">

                          {getNotificationIcon(notification.type)}

                        </div>

                        <div className="notification-info" style={{ flex: 1 }}>

                          <h4>{notification.title}</h4>

                          <p>{notification.message}</p>

                          <span className="activity-time">{formatTimeAgo(notification.createdAt)}</span>

                        </div>

                        {!notification.read && <span className="unread-badge">New</span>}

                        <button

                          className="notif-delete-btn"

                          onClick={(e) => requestDeleteNotification(e, notification._id)}

                          title="Delete notification"

                        >

                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                            <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />

                          </svg>

                        </button>

                      </div>

                    ))}

                  </div>

                )}

              </div>

            );

          })

        )}

      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="mini-modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="mini-modal" onClick={e => e.stopPropagation()}>
            <div className="mini-modal-icon" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14H6L5 6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
                <path d="M9 6V4h6v2"></path>
              </svg>
            </div>
            <h4 className="mini-modal-title">Delete Notification</h4>
            <p className="mini-modal-text">
              Are you sure you want to delete this notification? This action cannot be undone.
            </p>
            <div className="mini-modal-actions">
              <button
                className="mini-modal-btn mini-modal-btn--ghost"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                className="mini-modal-btn mini-modal-btn--danger"
                style={{ backgroundColor: '#dc2626', color: '#fff' }}
                onClick={confirmDeleteNotification}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

  );

};



const ReviewsFileContent = () => {

  const [reviews, setReviews] = useState([]);

  const [selectedReview, setSelectedReview] = useState(null);

  const [loading, setLoading] = useState(true);

  const [downloadStatus, setDownloadStatus] = useState({});



  useEffect(() => {

    fetchReviews();

    checkForSelectedReview();

  }, []);



  const checkForSelectedReview = () => {

    const selectedReviewId = localStorage.getItem('selectedReviewId');

    if (selectedReviewId) {

      fetchReviewById(selectedReviewId);

      localStorage.removeItem('selectedReviewId'); // Clear after using

    }

  };



  const fetchReviews = async () => {

    setLoading(true);

    try {

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews`);

      const data = await response.json();

      setReviews(data);

    } catch (error) {

      console.error('Error fetching reviews:', error);

    } finally {

      setLoading(false);

    }

  };



  const fetchReviewById = async (reviewId) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews/${reviewId}`);
      const data = await response.json();
      setSelectedReview(data);

      // Automatically change proposal status to 'Reviewed' if it was 'Review Submitted'
      if (data && data.proposalId) {
        try {
          const { updateProposalStatus, getAllProposals } = await import('../services/api.js');
          const allProposals = await getAllProposals();
          const proposal = allProposals.find(p => (p._id || p.id) === data.proposalId);

          if (proposal && (proposal.status === 'Review Submitted' || !proposal.status || proposal.status === 'pending')) {
            await updateProposalStatus(data.proposalId, 'Reviewed');
            console.log(`Status for proposal ${data.proposalId} updated to Reviewed via direct fetch`);
          }
        } catch (err) {
          console.error('Error auto-updating proposal status to Reviewed in fetchReviewById:', err);
        }
      }
    } catch (error) {
      console.error('Error fetching review:', error);

    } finally {

      setLoading(false);

    }

  };



  const handleReviewClick = async (review) => {
    setSelectedReview(review);

    // Automatically change proposal status to 'Reviewed' if it was 'Review Submitted'
    if (review.proposalId) {
      try {
        const { updateProposalStatus, getAllProposals } = await import('../services/api.js');

        // Check current status first to avoid redundant updates
        const allProposals = await getAllProposals();
        const proposal = allProposals.find(p => (p._id || p.id) === review.proposalId);

        if (proposal && (proposal.status === 'Review Submitted' || !proposal.status || proposal.status === 'pending')) {
          await updateProposalStatus(review.proposalId, 'Reviewed');
          console.log(`Status for proposal ${review.proposalId} updated to Reviewed`);
        }
      } catch (err) {
        console.error('Error auto-updating proposal status to Reviewed:', err);
      }
    }
  };



  const handleBackToList = () => {

    setSelectedReview(null);

  };

  // Check if review contains only UREB Form 10B and 11 files
  const isOnlyForm10BAnd11 = (review) => {
    if (!review.files || typeof review.files !== 'object') return false;

    const fileKeys = Object.keys(review.files);
    const hasForm10B = fileKeys.includes('urebForm10B') && review.files.urebForm10B;
    const hasForm11 = fileKeys.includes('urebForm11') && review.files.urebForm11;

    // Check if only these two files exist and both are present
    const otherFiles = fileKeys.filter(key => key !== 'urebForm10B' && key !== 'urebForm11');

    return hasForm10B && hasForm11 && otherFiles.length === 0;
  };


  const handleDownloadFile = async (file, fileKey) => {

    if (!file || !file.filename) return;



    const downloadKey = `${selectedReview._id}-${fileKey}`;

    setDownloadStatus(prev => ({ ...prev, [downloadKey]: 'downloading' }));



    try {

      const { downloadReviewerFile } = await import('../services/api.js');

      const result = await downloadReviewerFile(file.filename, file.originalname);



      if (result.success) {

        setDownloadStatus(prev => ({ ...prev, [downloadKey]: 'success' }));

        setTimeout(() => {

          setDownloadStatus(prev => ({ ...prev, [downloadKey]: null }));

        }, 2000);

      } else {

        setDownloadStatus(prev => ({ ...prev, [downloadKey]: 'error' }));

        setTimeout(() => {

          setDownloadStatus(prev => ({ ...prev, [downloadKey]: null }));

        }, 3000);

      }

    } catch (error) {

      console.error('Download error:', error);

      setDownloadStatus(prev => ({ ...prev, [downloadKey]: 'error' }));

      setTimeout(() => {

        setDownloadStatus(prev => ({ ...prev, [downloadKey]: null }));

      }, 3000);

    }

  };



  const getReviewerRole = (reviewer) => {

    if (reviewer.role === 'preliminary') return 'Preliminary Reviewer';

    if (reviewer.role === 'secondary') return 'Secondary Reviewer';

    return 'Reviewer';

  };



  if (selectedReview) {
    // Check if this review contains only UREB Form 10B and 11
    if (isOnlyForm10BAnd11(selectedReview)) {
      return (
        <div className="review-detail-content">
          <div className="review-detail-header">
            <button className="btn-secondary" onClick={handleBackToList}>
              ← Back to Reviews
            </button>
            <h2>
              <svg className="review-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10,9 9,9 8,9" />
              </svg>
              UREB Forms Review - {selectedReview.reviewer?.name || selectedReview.reviewerName || 'Reviewer'}
            </h2>
          </div>

          <div className="review-detail-card">
            <div className="reviewer-info">
              <h3>
                <svg className="reviewer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Reviewer Information
              </h3>
              <div className="reviewer-details">
                <p>
                  <svg className="reviewer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <strong>Name:</strong> {selectedReview.reviewer?.name || selectedReview.reviewerName || 'N/A'}
                </p>
                <p>
                  <svg className="reviewer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <strong>Email:</strong> {selectedReview.reviewer?.email || selectedReview.reviewerEmail || 'N/A'}
                </p>
                <p>
                  <svg className="reviewer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                  <strong>Role:</strong>
                  <span className="role-badge">
                    {getReviewerRole(selectedReview.reviewer || {})}
                  </span>
                </p>
                <p>
                  <svg className="reviewer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9,22 9,12 15,12 15,22" />
                  </svg>
                  <strong>Department:</strong> {selectedReview.reviewer?.department || selectedReview.department || 'N/A'}
                </p>
              </div>
            </div>

            <div className="review-content">
              {(selectedReview.comments || selectedReview.comment) && (
                <div className="review-comments-section">
                  <h4>Reviewer Comments</h4>
                  <div className="comments-box">
                    {selectedReview.comments || selectedReview.comment}
                  </div>
                </div>
              )}

              <div className="review-files-section">
                <h4>Submitted UREB Forms</h4>
                <div className="review-files-list">
                  {[
                    { key: 'urebForm10B', label: 'UREB Form 10-B' },
                    { key: 'urebForm11', label: 'UREB Form 11' }
                  ].map(({ key, label }) => {
                    const file = selectedReview.files?.[key] ||
                      (typeof selectedReview.files === 'object' && selectedReview.files[key]);

                    return (
                      <div key={key} className="review-file-item">
                        <div className="file-info">
                          <svg className="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14,2 14,8 20,8" />
                          </svg>
                          <div>
                            <p className="file-name">{file?.originalname || label}</p>
                            <p className="file-meta">
                              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'No file uploaded'}
                            </p>
                          </div>
                        </div>
                        {file && (
                          <button
                            className="review-file-download"
                            onClick={() => handleDownloadFile(file, key)}
                            disabled={downloadStatus[`${selectedReview._id}-${key}`] === 'downloading'}
                          >
                            {downloadStatus[`${selectedReview._id}-${key}`] === 'downloading' ? (
                              <>
                                <svg className="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                                </svg>
                                Downloading...
                              </>
                            ) : downloadStatus[`${selectedReview._id}-${key}`] === 'success' ? (
                              <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                                Downloaded!
                              </>
                            ) : downloadStatus[`${selectedReview._id}-${key}`] === 'error' ? (
                              <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="15" y1="9" x2="9" y2="15" />
                                  <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                Error
                              </>
                            ) : (
                              <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                                </svg>
                                Download
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (

      <div className="review-detail-content">

        <div className="review-detail-header">

          <button className="btn-secondary" onClick={handleBackToList}>

            ← Back to Reviews

          </button>

          <h2>

            <svg className="review-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />

              <polyline points="14,2 14,8 20,8" />

              <line x1="16" y1="13" x2="8" y2="13" />

              <line x1="16" y1="17" x2="8" y2="17" />

              <polyline points="10,9 9,9 8,9" />

            </svg>

            {selectedReview.title || 'Review Details'}

          </h2>

        </div>



        <div className="review-detail-card">

          <div className="reviewer-info">

            <h3>

              <svg className="reviewer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />

                <circle cx="12" cy="7" r="4" />

              </svg>

              Reviewer Information

            </h3>

            <div className="reviewer-details">

              <p>

                <svg className="reviewer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />

                  <circle cx="12" cy="7" r="4" />

                </svg>

                <strong>Name:</strong> {selectedReview.reviewer?.name || selectedReview.reviewerName || 'N/A'}

              </p>

              <p>

                <svg className="reviewer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />

                  <polyline points="22,6 12,13 2,6" />

                </svg>

                <strong>Email:</strong> {selectedReview.reviewer?.email || selectedReview.reviewerEmail || 'N/A'}

              </p>

              <p>

                <svg className="reviewer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />

                  <circle cx="8.5" cy="7" r="4" />

                  <line x1="20" y1="8" x2="20" y2="14" />

                  <line x1="23" y1="11" x2="17" y2="11" />

                </svg>

                <strong>Role:</strong>

                <span className="role-badge">

                  {getReviewerRole(selectedReview.reviewer || {})}

                </span>

              </p>

              <p>

                <svg className="reviewer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />

                  <polyline points="9,22 9,12 15,12 15,22" />

                </svg>

                <strong>Department:</strong> {selectedReview.reviewer?.department || selectedReview.department || 'N/A'}

              </p>

            </div>

          </div>



          <div className="review-content">

            <h3>

              <svg className="document-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />

                <polyline points="14,2 14,8 20,8" />

                <line x1="16" y1="13" x2="8" y2="13" />

                <line x1="16" y1="17" x2="8" y2="17" />

                <polyline points="10,9 9,9 8,9" />

              </svg>

              Review Content

            </h3>



            {/* Review Info */}

            <div className="review-info-grid">

              <div className="review-info-item">

                <span className="review-info-label">Protocol Code</span>

                <span className="review-info-value">{selectedReview.protocolCode || 'N/A'}</span>

              </div>

              <div className="review-info-item">

                <span className="review-info-label">Research Title</span>

                <span className="review-info-value">{selectedReview.researchTitle || selectedReview.title || 'N/A'}</span>

              </div>

              <div className="review-info-item">

                <span className="review-info-label">Submission Date</span>

                <span className="review-info-value">{selectedReview.createdAt ? new Date(selectedReview.createdAt).toLocaleDateString() : 'N/A'}</span>

              </div>

            </div>



            {/* Review Decision */}

            <div className="review-decision-section">

              <h4>Review Decision</h4>

              <span className={`decision-badge ${(selectedReview.decision || selectedReview.overallRating || '').toLowerCase()}`}>

                {selectedReview.decision || selectedReview.overallRating || 'Pending'}

              </span>

            </div>



            {/* Reviewer Comments */}

            {(selectedReview.comments || selectedReview.comment) && (

              <div className="review-comments-section">

                <h4>Reviewer's Comments</h4>

                <div className="comments-box">

                  {selectedReview.comments || selectedReview.comment}

                </div>

              </div>

            )}



            {/* Submitted Files */}

            <div className="review-files-section">

              <h4>Submitted Documents</h4>

              <div className="review-files-grid">

                {[

                  { key: 'proposal', label: 'Proposal' },

                  { key: 'approvalSheet', label: 'Approval Sheet' },

                  { key: 'urebForm2', label: 'UREB Form 2' },

                  { key: 'applicationForm6', label: 'Application for Research Ethics Review Form 6' },

                  { key: 'accomplishedForm8', label: 'Accomplished Form 8' },

                  { key: 'accomplishForm10A', label: 'Accomplish Form 10 A' },

                  { key: 'copyOfInstrument', label: 'Copy of Instrument/Tool' },

                  { key: 'ethicsReviewFee', label: 'Ethics Review Fee (Receipt)' }

                ].map(({ key, label }) => {

                  const file = selectedReview.files?.[key] ||

                    (typeof selectedReview.files === 'object' && selectedReview.files[key]);

                  return (

                    <div key={key} className={`review-file-item ${file ? 'has-file' : 'no-file'}`}>

                      <div className="review-file-info">

                        <svg className="review-file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />

                          <polyline points="14,2 14,8 20,8" />

                        </svg>

                        <div className="review-file-details">

                          <span className="review-file-label">{label}</span>

                          <span className="review-file-name">

                            {file ? file.originalname : 'No file submitted'}

                          </span>

                        </div>

                      </div>

                      {file && (

                        <button

                          className="review-file-download"

                          onClick={() => handleDownloadFile(file, key)}

                          disabled={downloadStatus[`${selectedReview._id}-${key}`] === 'downloading'}

                        >

                          {downloadStatus[`${selectedReview._id}-${key}`] === 'downloading' ? (

                            <>

                              <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">

                                <path d="M21 12a9 9 0 11-6.219-8.56" />

                              </svg>

                              Downloading...

                            </>

                          ) : downloadStatus[`${selectedReview._id}-${key}`] === 'success' ? (

                            <>

                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">

                                <polyline points="20,6 9,17 4,12"></polyline>

                              </svg>

                              Downloaded!

                            </>

                          ) : downloadStatus[`${selectedReview._id}-${key}`] === 'error' ? (

                            <>

                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">

                                <line x1="18" y1="6" x2="6" y2="18"></line>

                                <line x1="6" y1="6" x2="18" y2="18"></line>

                              </svg>

                              Retry

                            </>

                          ) : (

                            <>

                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />

                                <polyline points="7,10 12,15 17,10" />

                                <line x1="12" y1="15" x2="12" y2="3" />

                              </svg>

                              Download

                            </>

                          )}

                        </button>

                      )}

                    </div>

                  );

                })}

              </div>

            </div>

          </div>

        </div>

      </div>

    );

  }



  return (

    <div className="reviews-content">

      <div className="reviews-header">

        <h2>Reviews File</h2>

      </div>

      <div className="reviews-list">

        {loading ? (

          <div className="review-item" style={{ justifyContent: 'center', padding: '2rem' }}>

            <p style={{ color: 'var(--text-medium)' }}>Loading reviews...</p>

          </div>

        ) : reviews.length === 0 ? (

          <div className="review-item" style={{ justifyContent: 'center', padding: '2rem' }}>

            <p style={{ color: 'var(--text-medium)' }}>No reviews yet</p>

          </div>

        ) : (

          reviews.map((review) => (

            <div

              key={review._id}

              className="review-item clickable"

              onClick={() => handleReviewClick(review)}

              style={{ cursor: 'pointer' }}

            >

              <div className="review-info">

                <h4>{review.title || review.researchTitle || 'Untitled Review'}</h4>

                <p>{review.description || review.comments || 'No description available'}</p>

                <div className="review-meta">

                  <span className="reviewer-name">

                    {review.reviewer?.name || review.reviewerName || 'Unknown Reviewer'}

                  </span>

                  <span className="activity-time">

                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A'}

                  </span>

                </div>

              </div>

            </div>

          ))

        )}

      </div>

    </div>

  );

};







function MessagesInboxContent({ onMessageRead, onPaginationChange }) {

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({ email: 'admin@ureb.edu' });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [inboxDeleteModalOpen, setInboxDeleteModalOpen] = useState(false);
  const [inboxDeleteTargetId, setInboxDeleteTargetId] = useState(null);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // Search filter
  const [openFilesDropdownId, setOpenFilesDropdownId] = useState(null); // Files dropdown tracker
  const [isInboxReportOpen, setIsInboxReportOpen] = useState(false);

  // Click outside to close files dropdown
  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenFilesDropdownId(null);
    };
    if (openFilesDropdownId !== null) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, [openFilesDropdownId]);

  // Mapped user states
  const [allStudents, setAllStudents] = useState([]);
  const [allReviewers, setAllReviewers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Mapped filter states
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSenderType, setSelectedSenderType] = useState('');
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  const DEPARTMENT_NAMES = {
    'FALS': 'FALS-Faculty of Agriculture and Life Sciences',
    'FTED': 'FTED- Faculty of Teacher Education',
    'FAIS': 'FAIS-Faculty of Advance and International Studies',
    'FNAHS': 'FNAHS-Faculty of Nursing and Allied Health Science',
    'FBM': 'FBM-Faculty of Business Management',
    'FCJE': 'FCJE-Faculty of Criminology Justice Education',
    'FACET': 'FACET-Faculty of Computing, Engineering, Technology',
    'FHUSOCOM': 'FHUSOCOM-Faculty of Humanities, Social Science & Communication',
    'SIEC': 'SIEC- San Isidro Extension Campus',
    'BEC': 'BEC-BanayBanay Extension Campus',
    'CEC': 'CEC-Cateel Extension Campus',
    'BGEC': 'BGEC-Baganga Extension Campus',
    'TEC': 'TEC-Tarragona Extension Campus',
    'NSTP': 'NSTP-National Service Training Program',
    'ICS': 'ICS- Indigenous Community Studies',
    'Community Representatives': 'Community Representatives',
    'UREB Board': 'UREB Board - University Research Ethics Board'
  };
  const validDepartments = Object.keys(DEPARTMENT_NAMES);

  useEffect(() => {
    // Load user info from localStorage
    const savedUser = localStorage.getItem('ureb_user');
    if (savedUser) {
      setUserInfo(JSON.parse(savedUser));
    }
  }, []);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { getMessagesByUser } = await import('../services/api.js');
        const messageList = await getMessagesByUser(userInfo.email);
        const sorted = messageList.sort((a, b) =>
          new Date(b.createdAt || b.sentAt) - new Date(a.createdAt || a.sentAt)
        );

        // Apply localStorage read overrides so read state persists through refreshes
        const readIds = (() => { try { return JSON.parse(localStorage.getItem('read_messages') || '[]'); } catch { return []; } })();
        const processed = sorted.map(m => readIds.includes(String(m._id)) ? { ...m, read: true } : m);
        setMessages(processed);
        if (onMessageRead) onMessageRead();
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userInfo.email) {
      fetchMessages();
    }
  }, [userInfo.email, onMessageRead]);

  // Fetch all students and reviewers for mapping and dropdowns
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { getAllStudents, getAllReviewers } = await import('../services/api.js');
        const [studs, revs] = await Promise.all([
          getAllStudents(),
          getAllReviewers()
        ]);
        setAllStudents(studs || []);
        setAllReviewers(revs || []);
      } catch (err) {
        console.error('Error fetching students or reviewers for inbox mapping:', err);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Lookup map for student info by email
  const studentInfoMap = useMemo(() => {
    const map = {};
    allStudents.forEach(s => {
      if (s.email) {
        const emailKey = s.email.toLowerCase();
        map[emailKey] = {
          name: s.name || `${s.firstName} ${s.lastName}`.trim(),
          department: s.department || ''
        };
      }
    });
    return map;
  }, [allStudents]);

  // Lookup map for reviewer info by email
  const reviewerInfoMap = useMemo(() => {
    const map = {};
    allReviewers.forEach(r => {
      if (r.email) {
        const emailKey = r.email.toLowerCase();
        map[emailKey] = {
          name: formatReviewerName(r),
          department: r.department || ''
        };
      }
    });
    return map;
  }, [allReviewers]);

  // Resolve message sender type and department (message.type is source of truth)
  const getMessageMetadata = useCallback((msg) => {
    const email = (msg.senderEmail || '').toLowerCase().trim();
    const inReviewer = Boolean(reviewerInfoMap[email]);
    const inStudent = Boolean(studentInfoMap[email]);

    let type = null;
    if (msg.type === 'reviewer_to_admin') type = 'reviewer';
    else if (msg.type === 'student_to_admin') type = 'student';
    else if (inReviewer && !inStudent) type = 'reviewer';
    else if (inStudent && !inReviewer) type = 'student';
    else if (inReviewer && inStudent) type = 'reviewer';

    let name = msg.senderName || msg.senderEmail || 'Unknown';
    if (type === 'reviewer' && reviewerInfoMap[email]) {
      name = reviewerInfoMap[email].name;
    } else if (type === 'student' && studentInfoMap[email]) {
      name = studentInfoMap[email].name;
    }

    let department = '';
    if (type === 'reviewer' && reviewerInfoMap[email]) {
      department = reviewerInfoMap[email].department;
    } else if (type === 'student' && studentInfoMap[email]) {
      department = studentInfoMap[email].department;
    }

    return { type, name, department, inReviewer, inStudent };
  }, [studentInfoMap, reviewerInfoMap]);

  // Filter reviewers in the dropdown based on selected department
  const reviewersDropdownOptions = useMemo(() => {
    let list = allReviewers;
    if (selectedDepartment && selectedDepartment !== 'All') {
      list = list.filter(r => r.department === selectedDepartment);
    }
    return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [allReviewers, selectedDepartment]);

  // Filter students in the dropdown based on selected department
  const studentsDropdownOptions = useMemo(() => {
    let list = allStudents;
    if (selectedDepartment && selectedDepartment !== 'All') {
      list = list.filter(s => s.department === selectedDepartment);
    }
    return [...list].sort((a, b) => {
      const nameA = a.name || `${a.firstName} ${a.lastName}`.trim();
      const nameB = b.name || `${b.firstName} ${b.lastName}`.trim();
      return nameA.localeCompare(nameB);
    });
  }, [allStudents, selectedDepartment]);

  // Dropdown filter change handlers
  const handleDepartmentChange = (dept) => {
    setSelectedDepartment(dept);
    setSelectedSenderType('');
    setSelectedReviewer('');
    setSelectedStudent('');
  };

  const handleSenderTypeChange = (type) => {
    setSelectedSenderType(type);
    setSelectedReviewer('');
    setSelectedStudent('');
  };

  const handleReviewerChange = (email) => {
    setSelectedReviewer(email);
    setSelectedStudent('');
    if (email && email !== 'All') {
      setSelectedSenderType('Reviewer');
    }
  };

  const handleStudentChange = (email) => {
    setSelectedStudent(email);
    setSelectedReviewer('');
    if (email && email !== 'All') {
      setSelectedSenderType('Student');
    }
  };

  const [submissionCategoryFilter, setSubmissionCategoryFilter] = useState('All'); // 'All' | 'First' | 'Resubmission'

  // Filter messages for table view
  const filteredMessages = useMemo(() => {
    if (!selectedDepartment) {
      return [];
    }

    return messages.filter(message => {
      const { type, name, department } = getMessageMetadata(message);
      const email = (message.senderEmail || '').toLowerCase();
      const subject = (message.subject || '').toLowerCase();
      const text = (message.message || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const isResubmissionMsg = message.submissionType === 'resubmission' || subject.includes('resubmi') || text.includes('resubmi');
      if (submissionCategoryFilter === 'First' && isResubmissionMsg) return false;
      if (submissionCategoryFilter === 'Resubmission' && !isResubmissionMsg) return false;

      // 1. Search Query Filter
      if (query && !name.toLowerCase().includes(query) && !email.includes(query) && !subject.includes(query) && !text.includes(query)) {
        return false;
      }

      // 2. Department Filter
      if (selectedDepartment && selectedDepartment !== 'All') {
        if (department !== selectedDepartment) {
          return false;
        }
      }

      // 3. Sender Type Filter
      if (selectedSenderType && selectedSenderType !== 'All') {
        if (type !== selectedSenderType.toLowerCase()) {
          return false;
        }
      }

      // 4. Reviewer Filter
      if (selectedReviewer && selectedReviewer !== 'All') {
        if (email !== selectedReviewer.toLowerCase()) {
          return false;
        }
      }

      // 5. Student Filter
      if (selectedStudent && selectedStudent !== 'All') {
        if (email !== selectedStudent.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [messages, searchQuery, selectedDepartment, selectedSenderType, selectedReviewer, selectedStudent, getMessageMetadata]);

  const INBOX_PAGE_SIZE = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredMessages.length / INBOX_PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDepartment, selectedSenderType, selectedReviewer, selectedStudent, submissionCategoryFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedMessages = useMemo(() => {
    const start = (currentPage - 1) * INBOX_PAGE_SIZE;
    return filteredMessages.slice(start, start + INBOX_PAGE_SIZE);
  }, [filteredMessages, currentPage]);

  useEffect(() => {
    if (!onPaginationChange) return;
    if (loading || filteredMessages.length === 0) {
      onPaginationChange(null);
      return;
    }
    onPaginationChange({
      currentPage,
      totalPages,
      pageSize: INBOX_PAGE_SIZE,
      pageCount: paginatedMessages.length,
      total: filteredMessages.length,
      setCurrentPage,
    });
  }, [onPaginationChange, loading, filteredMessages.length, paginatedMessages.length, currentPage, totalPages]);

  useEffect(() => () => onPaginationChange?.(null), [onPaginationChange]);

  const formatInboxDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const openMessageModal = (message) => {
    setSelectedMessage(message);
    setIsMessageModalOpen(true);

    // Auto-mark as read when opening
    if (!message.read) {
      saveReadId(message._id);
      setMessages(prev => prev.map(m => m._id === message._id ? { ...m, read: true } : m));
      import('../services/api.js').then(({ markMessageAsRead }) => {
        markMessageAsRead(message._id).catch(err => console.error('Error marking as read:', err));
      });
      if (onMessageRead) onMessageRead();
    }
  };

  const closeMessageModal = () => {
    setSelectedMessage(null);
    setIsMessageModalOpen(false);
  };

  const markAsRead = async () => {
    if (selectedMessage && !selectedMessage.read) {
      saveReadId(selectedMessage._id);
      setMessages(prev => prev.map(m => m._id === selectedMessage._id ? { ...m, read: true } : m));
      setSelectedMessage(prev => ({ ...prev, read: true }));

      try {
        const { markMessageAsRead } = await import('../services/api.js');
        await markMessageAsRead(selectedMessage._id);

        if (onMessageRead) {
          onMessageRead();
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      const existing = JSON.parse(localStorage.getItem('read_messages') || '[]');
      const allIds = [...new Set([...existing, ...messages.map(m => String(m._id))])];
      localStorage.setItem('read_messages', JSON.stringify(allIds));
    } catch { }
    setMessages(prev => prev.map(m => ({ ...m, read: true })));

    try {
      const { markAllMessagesAsRead } = await import('../services/api.js');
      await markAllMessagesAsRead(userInfo.email);

      if (onMessageRead) {
        onMessageRead();
      }
    } catch (error) {
      console.error('Error marking all messages as read:', error);
    }
  };

  const openInboxDeleteModal = (e, messageId) => {
    e.stopPropagation();
    setInboxDeleteTargetId(messageId);
    setInboxDeleteModalOpen(true);
  };

  const confirmInboxDelete = async () => {
    try {
      const { deleteMessage } = await import('../services/api.js');
      await deleteMessage(inboxDeleteTargetId);
      setMessages(prev => prev.filter(m => m._id !== inboxDeleteTargetId));
      if (onMessageRead) onMessageRead();
    } catch (err) {
      console.error('Error deleting message:', err);
    } finally {
      setInboxDeleteModalOpen(false);
      setInboxDeleteTargetId(null);
    }
  };

  const confirmDeleteAll = async () => {
    try {
      const { deleteMessage } = await import('../services/api.js');
      await Promise.all(messages.map(m => deleteMessage(m._id)));
      setMessages([]);
      if (onMessageRead) onMessageRead();
    } catch (err) {
      console.error('Error deleting all messages:', err);
    } finally {
      setDeleteAllModalOpen(false);
    }
  };

  const saveReadId = (id) => {
    try {
      const ids = JSON.parse(localStorage.getItem('read_messages') || '[]');
      if (!ids.includes(String(id))) {
        localStorage.setItem('read_messages', JSON.stringify([...ids, String(id)]));
      }
    } catch { }
  };

  const markSingleAsRead = async (e, msg) => {
    e.stopPropagation();
    saveReadId(msg._id);
    setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, read: true } : m));

    try {
      const { markMessageAsRead } = await import('../services/api.js');
      await markMessageAsRead(msg._id);

      if (onMessageRead) {
        onMessageRead();
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const renderMessageFilesTableCell = (message) => {
    let fileList = [];
    if (message.files) {
      if (Array.isArray(message.files)) {
        fileList = message.files;
      } else {
        fileList = Object.values(message.files).filter(Boolean);
      }
    }

    const isResubmission = message.submissionType === 'resubmission';

    if (fileList.length === 0 && !isResubmission) {
      return <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>No files</span>;
    }

    const isOpen = openFilesDropdownId === message._id;

    return (
      <div className="inbox-files-dropdown-container">
        <button
          className="inbox-files-dropdown-trigger"
          onClick={(e) => {
            e.stopPropagation();
            setOpenFilesDropdownId(isOpen ? null : message._id);
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ marginRight: '2px' }}>
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
          {fileList.length} {fileList.length === 1 ? 'file' : 'files'}
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" style={{ marginLeft: '4px', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isOpen && (
          <div className="inbox-files-dropdown-menu" onClick={(e) => e.stopPropagation()}>
            {fileList.map((file, idx) => {
              const storedName = file.filename;
              const displayName = file.originalname || file.filename;
              return (
                <div key={idx} className="inbox-table-file-chip" style={{ width: '100%' }}>
                  <span className="inbox-table-file-chip-name" title={displayName}>
                    {displayName}
                  </span>
                  <div className="inbox-table-file-chip-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        import('../services/api.js').then(({ viewFile }) => {
                          viewFile(storedName);
                        });
                      }}
                      title="View file"
                      className="inbox-table-file-btn view"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const { downloadReviewerFile } = await import('../services/api.js');
                          await downloadReviewerFile(storedName, displayName);
                        } catch (err) {
                          console.error('Error downloading:', err);
                        }
                      }}
                      title="Download file"
                      className="inbox-table-file-btn download"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const unreadCount = messages.filter(m => !m.read).length;

  const inboxReportFilterSummary = useMemo(() => {
    const deptLabel =
      !selectedDepartment
        ? 'None selected'
        : selectedDepartment === 'All'
          ? 'All Departments'
          : DEPARTMENT_NAMES[selectedDepartment] || selectedDepartment;

    const reviewerLabel =
      selectedReviewer && selectedReviewer !== 'All'
        ? reviewersDropdownOptions.find((r) => r.email === selectedReviewer)?.name || selectedReviewer
        : selectedReviewer === 'All'
          ? 'All Reviewers'
          : '';

    const studentLabel =
      selectedStudent && selectedStudent !== 'All'
        ? (() => {
            const s = studentsDropdownOptions.find((st) => st.email === selectedStudent);
            return s?.name || `${s?.firstName || ''} ${s?.lastName || ''}`.trim() || selectedStudent;
          })()
        : selectedStudent === 'All'
          ? 'All Researchers'
          : '';

    return {
      department: deptLabel,
      senderType: selectedSenderType || 'All',
      reviewer: reviewerLabel,
      student: studentLabel,
      search: searchQuery.trim(),
    };
  }, [
    selectedDepartment,
    selectedSenderType,
    selectedReviewer,
    selectedStudent,
    searchQuery,
    reviewersDropdownOptions,
    studentsDropdownOptions,
  ]);

  return (
    <>
      <div className="inbox-wrapper">
        {/* Header */}
        <div className="inbox-header">
          <div className="inbox-title-group">
            <h2>Files And Messages Submitted</h2>
            {unreadCount > 0 && (
              <span className="inbox-unread-count">{unreadCount} unread</span>
            )}
          </div>

          {/* Search Input */}
          <div className="inbox-search" style={{ flex: '1', maxWidth: '300px', margin: '0 16px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ position: 'absolute', left: '12px', color: '#9ca3af', pointerEvents: 'none' }}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 40px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Clear search"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="inbox-header-actions">
            <button
              type="button"
              className="inbox-generate-report-btn"
              onClick={() => setIsInboxReportOpen(true)}
              disabled={!selectedDepartment}
              title={
                selectedDepartment
                  ? 'Generate report with analytics and export'
                  : 'Select a faculty first'
              }
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Generate Report
            </button>

            {unreadCount > 0 && (
              <button className="inbox-mark-all-btn" onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}

            {messages.length > 0 && (
              <button className="inbox-delete-all-btn" onClick={() => setDeleteAllModalOpen(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
                Delete All
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Bar */}
        <div className="inbox-filters-bar">
          {/* Faculty Dropdown */}
          <div className="inbox-filter-group">
            <label className="inbox-filter-label">Select Faculty</label>
            <select
              value={selectedDepartment}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="inbox-filter-select"
            >
              <option value="">Select...</option>
              <option value="All">All Faculties</option>
              {validDepartments.map(dept => (
                <option key={dept} value={dept}>{DEPARTMENT_NAMES[dept]}</option>
              ))}
            </select>
          </div>

          {/* Submission Category Dropdown */}
          <div className="inbox-filter-group">
            <label className="inbox-filter-label">Submission Category</label>
            <select
              value={submissionCategoryFilter}
              onChange={(e) => setSubmissionCategoryFilter(e.target.value)}
              className="inbox-filter-select"
              disabled={!selectedDepartment}
              style={{ fontWeight: '600', color: submissionCategoryFilter === 'Resubmission' ? '#7c3aed' : submissionCategoryFilter === 'First' ? '#2563eb' : 'inherit' }}
            >
              <option value="All">All Categories</option>
              <option value="First">First Submissions Only</option>
              <option value="Resubmission">Resubmissions Only</option>
            </select>
          </div>

          {/* Sender Type Dropdown */}
          <div className="inbox-filter-group">
            <label className="inbox-filter-label">Select Sender Type</label>
            <select
              value={selectedSenderType}
              onChange={(e) => handleSenderTypeChange(e.target.value)}
              className="inbox-filter-select"
              disabled={!selectedDepartment}
            >
              <option value="">Select...</option>
              <option value="All">All Senders</option>
              <option value="Reviewer">Reviewers</option>
              <option value="Student">Researchers</option>
            </select>
          </div>

          {/* Reviewers Dropdown */}
          <div className="inbox-filter-group">
            <label className="inbox-filter-label">Select Reviewer</label>
            <select
              value={selectedReviewer}
              onChange={(e) => handleReviewerChange(e.target.value)}
              className="inbox-filter-select"
              disabled={!selectedDepartment || selectedSenderType === 'Student'}
            >
              <option value="">Select...</option>
              <option value="All">All Reviewers</option>
              {reviewersDropdownOptions.map(rev => (
                <option key={rev.email} value={rev.email}>
                  {rev.name || rev.email}
                </option>
              ))}
            </select>
          </div>

          {/* Researchers Dropdown */}
          <div className="inbox-filter-group">
            <label className="inbox-filter-label">Select Researcher</label>
            <select
              value={selectedStudent}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="inbox-filter-select"
              disabled={!selectedDepartment || selectedSenderType === 'Reviewer'}
            >
              <option value="">Select...</option>
              <option value="All">All Researchers</option>
              {studentsDropdownOptions.map(stud => {
                const studentName = stud.name || `${stud.firstName} ${stud.lastName}`.trim();
                return (
                  <option key={stud.email} value={stud.email}>
                    {studentName || stud.email}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Message Table list */}
        <div className="inbox-list">
          {loading || usersLoading ? (
            <div className="inbox-empty">
              <div className="inbox-empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p>Loading messages and filters...</p>
            </div>
          ) : !selectedDepartment ? (
            <div className="inbox-empty">
              <div className="inbox-empty-icon" style={{ opacity: 0.5 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p style={{ fontWeight: 500 }}>Please select a Faculty first</p>
              <span style={{ color: '#6b7280' }}>Choose a faculty from the filters above to load the messages.</span>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="inbox-empty">
              <div className="inbox-empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p>No messages found</p>
              <span>Verify your filters or search query above.</span>
            </div>
          ) : (
            <div className="inbox-table-container">
              <table className="inbox-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}></th>
                    <th style={{ width: '110px' }}>Date</th>
                    <th style={{ width: '180px' }}>Sender</th>
                    <th style={{ width: '130px' }}>Role</th>
                    <th style={{ width: '110px' }}>Dept</th>
                    <th style={{ width: '180px' }}>Subject</th>
                    <th>Message</th>
                    <th style={{ width: '130px' }}>Files</th>
                    <th style={{ width: '140px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMessages.map((message) => {
                    const { type, name, department } = getMessageMetadata(message);
                    return (
                      <tr
                        key={message._id}
                        className={!message.read ? 'unread' : ''}
                        onClick={() => openMessageModal(message)}
                      >
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          {!message.read && <span className="inbox-unread-dot" />}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                          {formatInboxDate(message.createdAt || message.sentAt)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="inbox-avatar" style={{ flexShrink: 0, width: '28px', height: '28px', fontSize: '0.8rem' }}>
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ overflow: 'hidden', minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={message.senderEmail}>{message.senderEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ overflow: 'hidden' }}>
                          <span className={`inbox-table-badge ${type}`}>
                            {type === 'reviewer' ? 'Reviewer' : 'Researcher'}
                          </span>
                        </td>
                        <td style={{ overflow: 'hidden' }}>
                          <span
                            style={{ fontSize: '0.8rem', fontWeight: 500, color: '#4b5563', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={DEPARTMENT_NAMES[department] || department}
                          >
                            {department || 'N/A'}
                          </span>
                        </td>
                        <td
                          style={{ fontWeight: !message.read ? 600 : 400, color: '#1f2937', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={message.subject}
                        >
                          {message.subject}
                        </td>
                        <td className="inbox-table-message-cell">
                          {message.message}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {renderMessageFilesTableCell(message)}
                        </td>
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <div className="inbox-table-actions-container">
                            {!message.read && (
                              <button
                                className="inbox-table-action-icon-btn mark-read"
                                onClick={(e) => markSingleAsRead(e, message)}
                                title="Mark as read"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </button>
                            )}
                            <button
                              className="inbox-table-action-icon-btn view"
                              onClick={() => openMessageModal(message)}
                              title="View details"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <button
                              className="inbox-table-action-icon-btn delete"
                              onClick={(e) => openInboxDeleteModal(e, message._id)}
                              title="Delete message"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                                <path d="M10 11v6M14 11v6" />
                                <path d="M9 6V4h6v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <MessageViewModal

        isOpen={isMessageModalOpen}

        onClose={closeMessageModal}

        message={selectedMessage}

        userInfo={userInfo}

        onMarkAsRead={markAsRead}

        onMessageRead={onMessageRead}

        setSuccessMessage={setSuccessMessage}

        setIsSuccessModalOpen={setIsSuccessModalOpen}

        setMessages={setMessages}

      />

      <InboxReportModal
        isOpen={isInboxReportOpen}
        onClose={() => setIsInboxReportOpen(false)}
        messages={filteredMessages}
        getMessageMetadata={getMessageMetadata}
        departmentNames={DEPARTMENT_NAMES}
        filterSummary={inboxReportFilterSummary}
      />



      <SuccessModal

        isOpen={isSuccessModalOpen}

        onClose={() => setIsSuccessModalOpen(false)}

        message={successMessage}

      />

      {/* Delete confirmation modal */}
      {inboxDeleteModalOpen && (
        <div className="inbox-delete-overlay" onClick={() => setInboxDeleteModalOpen(false)}>
          <div className="inbox-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="inbox-delete-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </div>
            <h4 className="inbox-delete-title">Delete Message?</h4>
            <p className="inbox-delete-text">This message will be permanently removed.</p>
            <div className="inbox-delete-actions">
              <button className="inbox-delete-btn inbox-delete-btn--ghost" onClick={() => setInboxDeleteModalOpen(false)}>Cancel</button>
              <button className="inbox-delete-btn inbox-delete-btn--danger" onClick={confirmInboxDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All confirmation modal */}
      {deleteAllModalOpen && (
        <div className="inbox-delete-overlay" onClick={() => setDeleteAllModalOpen(false)}>
          <div className="inbox-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="inbox-delete-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </div>
            <h4 className="inbox-delete-title">Delete All Messages?</h4>
            <p className="inbox-delete-text">All {messages.length} message{messages.length !== 1 ? 's' : ''} will be permanently removed.</p>
            <div className="inbox-delete-actions">
              <button className="inbox-delete-btn inbox-delete-btn--ghost" onClick={() => setDeleteAllModalOpen(false)}>Cancel</button>
              <button className="inbox-delete-btn inbox-delete-btn--danger" onClick={confirmDeleteAll}>Delete All</button>
            </div>
          </div>
        </div>
      )}

    </>

  );



};







function MessageViewModal({ isOpen, onClose, message, userInfo, onMarkAsRead, onMessageRead, setSuccessMessage, setIsSuccessModalOpen, setMessages }) {

  const [proposalFiles, setProposalFiles] = useState(null);

  const [filesLoading, setFilesLoading] = useState(false);



  // Fetch proposal files when message is a resubmission

  useEffect(() => {

    const fetchProposalFiles = async () => {

      if (message && message.submissionType === 'resubmission' && message.relatedProposalId) {

        setFilesLoading(true);

        try {

          const { getProposalById } = await import('../services/api.js');

          const proposal = await getProposalById(message.relatedProposalId);



          if (proposal && proposal.files) {

            setProposalFiles(proposal.files);

          } else {

            setProposalFiles({});

          }

        } catch (error) {

          console.error('Error fetching proposal files:', error);

          setProposalFiles({});

        } finally {

          setFilesLoading(false);

        }

      } else {

        setProposalFiles(null);

      }

    };



    fetchProposalFiles();

  }, [message]);



  if (!isOpen || !message) return null;



  const handleMarkAsRead = async () => {
    await onMarkAsRead();
    // Refresh sidebar badge count
    if (onMessageRead) onMessageRead();
  };



  const handleDownloadFile = async (fileKey, fileData, messageType = null) => {
    try {
      console.log('Downloading file:', { fileKey, fileData, messageType });

      // Get the filename from fileData - handle different possible structures
      const filename = fileData.filename || fileData.originalname || fileKey;
      const originalName = fileData.originalname || filename;

      if (!filename) {
        throw new Error('File name not found');
      }

      // Use the unified download endpoint for all files
      const { downloadReviewerFile } = await import('../services/api.js');
      const result = await downloadReviewerFile(filename, originalName);

      if (!result.success) {
        throw new Error(result.error || 'Download failed');
      }

      console.log('Download successful:', result);

    } catch (error) {
      console.error('Error downloading file:', error);
      alert(`Failed to download file: ${error.message || 'Unknown error'}. Please try again.`);
    }
  };



  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

  const fmtTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });



  return (

    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>

      <div className="msg-modal">



        {/* ── Header: sender info ── */}

        <div className="msg-modal-header">

          <div className="msg-modal-sender">

            <div className="msg-modal-avatar">

              {(message.senderName || message.senderEmail).charAt(0).toUpperCase()}

            </div>

            <div className="msg-modal-sender-info">

              <span className="msg-modal-sender-name">{message.senderName || message.senderEmail}</span>

              <span className="msg-modal-sender-email">{message.senderEmail}</span>

              <span className="msg-modal-date">{fmtDate(message.createdAt || message.sentAt)} · {fmtTime(message.createdAt || message.sentAt)}</span>

            </div>

          </div>

          <div className="msg-modal-header-right">

            {!message.read && <span className="msg-modal-badge new">New</span>}

            {message.submissionType === 'resubmission' && <span className="msg-modal-badge resubmit">Resubmission</span>}

            <button className="msg-modal-close" onClick={onClose} aria-label="Close">
              ✕
            </button>

          </div>

        </div>



        {/* ── Subject bar ── */}

        <div className="msg-modal-subject-bar">

          <h3 className="msg-modal-subject">{message.subject}</h3>

        </div>



        {/* ── Scrollable body ── */}

        <div className="msg-modal-body">



          {/* Message text */}

          <div className="msg-modal-message">

            <p>{message.message}</p>

          </div>



          {/* Attached files (resubmission) */}

          {message.submissionType === 'resubmission' && (

            <div className="msg-modal-files">

              <p className="msg-modal-files-label">Attached Files</p>

              {filesLoading ? (

                <p className="msg-modal-files-note">Loading files...</p>

              ) : proposalFiles && Object.keys(proposalFiles).length > 0 ? (

                <div className="msg-modal-files-list">

                  {Object.entries(proposalFiles).map(([fileKey, fileData]) => (

                    <div key={fileKey} className="msg-file-card">

                      <div className="msg-file-icon">

                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">

                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />

                          <polyline points="14 2 14 8 20 8" />

                        </svg>

                      </div>

                      <div className="msg-file-info">

                        <span className="msg-file-name">{fileData.originalname || fileKey}</span>

                        <span className="msg-file-meta">{(fileData.size / 1024).toFixed(1)} KB · {fileData.mimetype || 'Unknown'}</span>

                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {/* View File Button */}
                        <button
                          className="msg-file-download"
                          onClick={() => {
                            import('../services/api.js').then(({ viewFile }) => {
                              viewFile(fileData.filename);
                            });
                          }}
                          title="View file"
                          style={{ backgroundColor: '#3b82f6', color: '#fff' }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          View
                        </button>
                        {/* Download File Button */}
                        <button className="msg-file-download" onClick={() => handleDownloadFile(fileKey, fileData)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                          </svg>
                          Download
                        </button>
                      </div>

                    </div>

                  ))}

                </div>

              ) : (

                <p className="msg-modal-files-note">No files found for this resubmission.</p>

              )}

            </div>

          )}



          {/* Show files for student replies */}

          {message.type === 'student_to_admin' && Array.isArray(message.files) && message.files.length > 0 && (

            <div className="msg-modal-files">

              <p className="msg-modal-files-label">Attached Files from Researcher</p>

              <div className="msg-modal-files-list">

                {message.files.map((file, i) => {
                  const storedName = file.filename;
                  const displayName = file.originalname || file.filename;
                  return (
                    <div key={i} className="msg-file-card">

                      <div className="msg-file-icon">

                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">

                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />

                          <polyline points="14 2 14 8 20 8" />

                        </svg>

                      </div>

                      <div className="msg-file-info">

                        <span className="msg-file-name">{displayName}</span>

                        <span className="msg-file-meta">{(file.size / 1024).toFixed(1)} KB · {file.mimetype || 'File'}</span>

                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {/* View File Button */}
                        <button
                          className="msg-file-download"
                          onClick={() => {
                            import('../services/api.js').then(({ viewFile }) => {
                              viewFile(storedName);
                            });
                          }}
                          title="View file"
                          style={{ backgroundColor: '#3b82f6', color: '#fff' }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          View
                        </button>
                        {/* Download File Button */}
                        <button className="msg-file-download" onClick={() => handleDownloadFile(storedName, { filename: storedName, originalname: displayName })}>

                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">

                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />

                          </svg>

                          Download

                        </button>
                      </div>

                    </div>
                  );
                })}

              </div>

            </div>

          )}



          {/* Show files for reviewer-submitted reviews */}

          {message.type === 'reviewer_to_admin' && message.files && Object.keys(message.files).length > 0 && (

            <div className="msg-modal-files">

              <p className="msg-modal-files-label">Submitted Review Files</p>

              <div className="msg-modal-files-list">

                {Object.entries(message.files).map(([fileKey, fileData]) => (

                  <div key={fileKey} className="msg-file-card">

                    <div className="msg-file-icon">

                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">

                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />

                        <polyline points="14 2 14 8 20 8" />

                      </svg>

                    </div>

                    <div className="msg-file-info">

                      <span className="msg-file-name">{fileData.originalname || fileKey}</span>

                      <span className="msg-file-meta">{(fileData.size / 1024).toFixed(1)} KB · {fileData.mimetype || 'Unknown'}</span>

                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {/* View File Button */}
                      <button
                        className="msg-file-download"
                        onClick={() => {
                          import('../services/api.js').then(({ viewFile }) => {
                            viewFile(fileData.filename);
                          });
                        }}
                        title="View file"
                        style={{ backgroundColor: '#3b82f6', color: '#fff' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        View
                      </button>
                      {/* Download File Button */}
                      <button className="msg-file-download" onClick={() => handleDownloadFile(fileKey, fileData)}>

                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">

                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />

                        </svg>

                        Download

                      </button>
                    </div>

                  </div>

                ))}

              </div>

            </div>

          )}



          {/* Message actions */}

          <div className="msg-modal-footer">
            <div className="msg-modal-footer-left">
              {!message.read && (
                <button className="msg-btn-ghost" onClick={handleMarkAsRead}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Mark as Read
                </button>
              )}
            </div>
            <div className="msg-modal-footer-right"></div>
          </div>

        </div>



      </div>

    </div>

  );

};







function SuccessModal({ isOpen, onClose, message }) {

  if (!isOpen) return null;



  return (

    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>

      <div className="modal-container small">

        <button className="modal-close" onClick={onClose} aria-label="Close modal">

          <XIcon />

        </button>

        <div className="modal-header">

          <h2>Success</h2>

        </div>

        <div className="modal-body">

          <div className="success-content" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

            <div className="success-icon" style={{ marginBottom: '16px' }}>

              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#009130ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                <circle cx="12" cy="12" r="10" />

                <path d="M9 12 11 14 15 10" />

              </svg>

            </div>

            <p className="success-message" style={{ textAlign: 'center', margin: '0' }}>{message}</p>

          </div>

        </div>

        <div className="modal-footer">

          <button className="btn-primary" onClick={onClose}>OK</button>

        </div>

      </div>

    </div>

  );

};





function DeleteActivityModal({ isOpen, onClose, onConfirm }) {

  if (!isOpen) return null;



  return (

    <div className="logout-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>

      <div className="logout-modal-container">

        <div className="logout-modal-header delete-header">

          <div className="delete-icon-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC3545" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </div>
          <h2>Remove Activity</h2>

        </div>

        <div className="logout-modal-body">

          <p>Are you sure you want to remove this activity from your recent list? This action cannot be undone.</p>

        </div>

        <div className="logout-modal-footer">

          <button className="logout-modal-btn-secondary" onClick={onClose}>Cancel</button>

          <button className="logout-modal-btn-danger" onClick={onConfirm}>Remove</button>

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
          <p>Are you sure you want to log out of the admin dashboard?</p>
        </div>
        <div className="logout-modal-footer">
          <button className="logout-modal-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="logout-modal-btn-primary" onClick={onConfirm}>Logout</button>
        </div>
      </div>
    </div>
  );
};

function ConfirmDeletePhotoModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="logout-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="logout-modal-container">
        <div className="logout-modal-header">
          <h2>Remove Photo</h2>
        </div>
        <div className="logout-modal-body">
          <p>Are you sure you want to remove your profile picture? This action cannot be undone.</p>
        </div>
        <div className="logout-modal-footer">
          <button className="logout-modal-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="logout-modal-btn-danger" onClick={onConfirm}>Remove</button>
        </div>
      </div>
    </div>
  );
};



// Pending Proposals Modal Component

function PendingProposalsModal({ isOpen, onClose }) {

  const [proposals, setProposals] = useState([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    if (isOpen) {

      fetchPendingProposals();

    }

  }, [isOpen]);



  const fetchPendingProposals = async () => {

    setLoading(true);

    try {

      const { getAllProposals } = await import('../services/api.js');

      const allProposals = await getAllProposals();

      // Filter proposals that are pending review

      const pendingProposals = allProposals.filter(proposal => {
        const s = (proposal.status || '').toLowerCase();
        return s === 'pending' || s === 'pending review' || s === 'in progress' || s === 'under review';
      });

      setProposals(pendingProposals);

    } catch (error) {

      console.error('Error fetching pending proposals:', error);

    } finally {

      setLoading(false);

    }

  };



  if (!isOpen) return null;



  return (

    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>

      <div className="modal-container large">

        <button className="modal-close" onClick={onClose} aria-label="Close modal">

          <XIcon />

        </button>

        <div className="modal-header">

          <h2>Pending Proposals</h2>

          <p>Review proposals that are pending evaluation</p>

        </div>

        <div className="modal-body">

          {loading ? (

            <div className="loading-state">Loading pending proposals...</div>

          ) : proposals.length === 0 ? (

            <div className="empty-state">No pending proposals found.</div>

          ) : (

            <div className="proposals-list">

              {proposals.map((proposal) => (

                <div className="proposal-card" key={proposal._id || proposal.id}>

                  <div className="proposal-header">

                    <h3>{proposal.protocolCode || proposal._id}</h3>

                    <span
                      className="status-badge"
                      style={getStatusStyle(proposal.status || 'Pending Review')}
                    >
                      {proposal.status || 'Pending Review'}
                    </span>

                  </div>

                  <div className="proposal-content">

                    <h4>{proposal.researchTitle || 'Untitled Proposal'}</h4>

                    <p><strong>Proponent:</strong> {proposal.proponent || 'N/A'}</p>

                    <p><strong>Department:</strong> {proposal.department || 'N/A'}</p>

                    <div className="proposal-meta">

                      <span>Submitted: {proposal.submissionDate ? new Date(proposal.submissionDate).toLocaleDateString() : 'N/A'}</span>

                      <span>Date of Application: {proposal.dateOfApplication ? new Date(proposal.dateOfApplication).toLocaleDateString() : 'N/A'}</span>

                    </div>

                    {proposal.reviewers && (

                      <div className="reviewer-assignment">

                        <p><strong>Assigned Reviewers:</strong></p>

                        <ul>

                          {proposal.reviewers.reviewer1 && <li>{proposal.reviewers.reviewer1}</li>}

                          {proposal.reviewers.reviewer2 && <li>{proposal.reviewers.reviewer2}</li>}

                          {proposal.reviewers.reviewer3 && <li>{proposal.reviewers.reviewer3}</li>}

                        </ul>

                      </div>

                    )}

                  </div>

                </div>

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



// Generate Report Modal Component

function GenerateReportModal({ isOpen, onClose }) {

  const [reviews, setReviews] = useState([]);

  const [reviewerGroups, setReviewerGroups] = useState([]);

  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  const [selectedReviews, setSelectedReviews] = useState([]);

  const [filterStatus, setFilterStatus] = useState('all');

  const [sortBy, setSortBy] = useState('date');

  const [isExporting, setIsExporting] = useState(false);



  useEffect(() => {

    if (isOpen) {

      fetchAllReviews();

    }

  }, [isOpen]);



  const fetchAllReviews = async () => {

    setLoading(true);

    try {

      // Fetch reviews, proposals, AND reviewers in parallel
      const [reviewsRes, proposalsRes, allReviewerAccounts] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/reviews`),
        fetch(`${import.meta.env.VITE_API_URL}/api/proposals`),
        getAllReviewers(), // uses admin auth header — /api/reviewers 404s without it
      ]);

      if (!reviewsRes.ok) {
        console.error('Error fetching reviews:', reviewsRes.status);
        setReviews([]);
        return;
      }

      const allReviews = await reviewsRes.json();
      const allProposals = proposalsRes.ok ? await proposalsRes.json() : [];

      if (!Array.isArray(allReviews)) {
        console.error('Unexpected reviews format:', allReviews);
        setReviews([]);
        setReviewerGroups([]);
        return;
      }

      // Build reviewer email → actual profile name lookup
      const reviewerNameMap = {};
      if (Array.isArray(allReviewerAccounts)) {
        allReviewerAccounts.forEach(acc => {
          const email = (acc.email || '').trim().toLowerCase();
          if (!email) return;
          const fullName = acc.name
            || [acc.firstName, acc.middleName, acc.lastName].filter(Boolean).join(' ')
            || '';
          if (fullName) reviewerNameMap[email] = fullName;
        });
      }

      // Build reviewer-type map from proposals:
      // reviewer1 slot = preliminary, reviewer2/reviewer3 = secondary
      const reviewerTypeMap = {};
      if (Array.isArray(allProposals)) {
        allProposals.forEach(proposal => {
          const reviewers = proposal.reviewers || {};
          if (reviewers.reviewer1) {
            const key = reviewers.reviewer1.trim().toLowerCase();
            if (!reviewerTypeMap[key]) reviewerTypeMap[key] = 'preliminary';
          }
          ['reviewer2', 'reviewer3'].forEach(slot => {
            if (reviewers[slot]) {
              const key = reviewers[slot].trim().toLowerCase();
              if (!reviewerTypeMap[key]) reviewerTypeMap[key] = 'secondary';
            }
          });
        });
      }

      // Enrich each review with reviewerType AND resolved reviewer name
      const enrichedReviews = allReviews.map(review => {
        const emailKey = (review.reviewerEmail || '').trim().toLowerCase();
        const nameKey = (review.reviewerName || '').trim().toLowerCase();
        const reviewerType = reviewerTypeMap[emailKey] || reviewerTypeMap[nameKey] || 'preliminary';
        // Resolve name from reviewer profile (authoritative), fall back to stored name
        const resolvedName = reviewerNameMap[emailKey] || review.reviewerName || review.reviewerEmail;
        return { ...review, reviewerType, reviewerName: resolvedName };
      });

      setReviews(enrichedReviews);

      // Group by reviewer for stats
      const reviewerStats = {};
      enrichedReviews.forEach(review => {
        const reviewerName = review.reviewerName || review.reviewer || 'Unknown Reviewer';
        if (!reviewerStats[reviewerName]) {
          reviewerStats[reviewerName] = { name: reviewerName, completedReviews: 0, pendingReviews: 0, totalReviews: 0, reviews: [] };
        }
        reviewerStats[reviewerName].totalReviews++;
        reviewerStats[reviewerName].reviews.push(review);
        if (review.status === 'completed' || review.decision) {
          reviewerStats[reviewerName].completedReviews++;
        } else {
          reviewerStats[reviewerName].pendingReviews++;
        }
      });
      const reviewerGroups = Object.values(reviewerStats).sort((a, b) => b.totalReviews - a.totalReviews);
      setReviewerGroups(reviewerGroups);

    } catch (error) {

      console.error('Error fetching reviews:', error);

      setReviews([]);

      setReviewerGroups([]);

    } finally {

      setLoading(false);

    }

  };




  const filteredReviews = reviews.filter(review => {
    const searchLower = searchQuery.toLowerCase();

    // Handle both enriched (from /api/reviews/all) and raw (from /api/reviews) data structures
    const titleMatch = review.proposalTitle?.toLowerCase().includes(searchLower) ||
      review.proposal?.researchTitle?.toLowerCase().includes(searchLower) ||
      review.title?.toLowerCase().includes(searchLower);

    const reviewerMatch = review.reviewerName?.toLowerCase().includes(searchLower) ||
      review.reviewer?.toLowerCase().includes(searchLower);

    const proponentMatch = review.proponent?.toLowerCase().includes(searchLower) ||
      review.proposal?.proponent?.toLowerCase().includes(searchLower) ||
      review.student?.toLowerCase().includes(searchLower);

    const protocolMatch = review.protocolCode?.toLowerCase().includes(searchLower) ||
      review.proposal?.protocolCode?.toLowerCase().includes(searchLower) ||
      review.protocol?.toLowerCase().includes(searchLower);

    const statusMatch = filterStatus === 'all' ||
      review.status?.toLowerCase() === filterStatus.toLowerCase() ||
      review.decision?.toLowerCase() === filterStatus.toLowerCase();

    return (titleMatch || reviewerMatch || proponentMatch || protocolMatch) && statusMatch;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = a.completedDate || a.createdAt || a.submissionDate || 0;
      const dateB = b.completedDate || b.createdAt || b.submissionDate || 0;
      return new Date(dateB) - new Date(dateA);
    } else if (sortBy === 'title') {
      const titleA = a.proposalTitle || a.proposal?.researchTitle || a.title || '';
      const titleB = b.proposalTitle || b.proposal?.researchTitle || b.title || '';
      return titleA.localeCompare(titleB);
    } else if (sortBy === 'status') {
      const statusA = a.status || a.decision || '';
      const statusB = b.status || b.decision || '';
      return statusA.localeCompare(statusB);
    }
    return 0;
  });

  const filteredReviewerGroups = reviewerGroups.filter(group => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = group.name?.toLowerCase().includes(searchLower);
    const statusMatch = filterStatus === 'all' || group.reviews.some(review =>
      (review.status?.toLowerCase() === filterStatus.toLowerCase()) ||
      (review.decision?.toLowerCase() === filterStatus.toLowerCase())
    );
    return nameMatch && statusMatch;
  }).sort((a, b) => {
    if (sortBy === 'count') {
      return b.totalReviews - a.totalReviews;
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const getReviewerName = (r) => r.reviewerName || r.reviewer || 'Unknown';
  const getReviewerType = (r) => (r.reviewerType || '').toLowerCase();

  const completedReviews = reviews.filter(review => {
    const isCompleted = review.status === 'completed' || review.decision;
    if (!isCompleted) return false;
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return getReviewerName(review).toLowerCase().includes(searchLower);
  });

  const preliminaryCompleted = completedReviews.filter(r => getReviewerType(r) === 'preliminary');
  const secondaryCompleted = completedReviews.filter(r => getReviewerType(r) === 'secondary');
  const uniquePreliminary = [...new Map(preliminaryCompleted.map(r => [getReviewerName(r), r])).values()];
  const uniqueSecondary = [...new Map(secondaryCompleted.map(r => [getReviewerName(r), r])).values()];

  const handleSelectReview = (reviewId) => {
    setSelectedReviews(prev =>
      prev.includes(reviewId)
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReviews.length === filteredReviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(filteredReviews.map(r => r._id || r.id));
    }
  };

  const handleExport = async (format, specificData = null) => {
    setIsExporting(true);
    try {
      const selectedReviewData = specificData || reviews.filter(review =>
        selectedReviews.includes(review._id || review.id)
      );

      if (format === 'excel') {
        await exportToExcel(selectedReviewData);
      } else if (format === 'pdf') {
        await exportToPDF(selectedReviewData);
      }



      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'grm-export-success-card';
      successMessage.innerHTML = `
        <svg class="grm-export-success-wave" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0,256L11.4,240C22.9,224,46,192,69,192C91.4,192,114,224,137,234.7C160,245,183,235,206,213.3C228.6,192,251,160,274,149.3C297.1,139,320,149,343,181.3C365.7,213,389,267,411,282.7C434.3,299,457,277,480,250.7C502.9,224,526,192,549,181.3C571.4,171,594,181,617,208C640,235,663,277,686,256C708.6,235,731,149,754,122.7C777.1,96,800,128,823,165.3C845.7,203,869,245,891,224C914.3,203,937,117,960,112C982.9,107,1006,181,1029,197.3C1051.4,213,1074,171,1097,144C1120,117,1143,107,1166,133.3C1188.6,160,1211,224,1234,218.7C1257.1,213,1280,139,1303,133.3C1325.7,128,1349,192,1371,192C1394.3,192,1417,128,1429,96L1440,64L1440,320L1428.6,320C1417.1,320,1394,320,1371,320C1348.6,320,1326,320,1303,320C1280,320,1257,320,1234,320C1211.4,320,1189,320,1166,320C1142.9,320,1120,320,1097,320C1074.3,320,1051,320,1029,320C1005.7,320,983,320,960,320C937.1,320,914,320,891,320C868.6,320,846,320,823,320C800,320,777,320,754,320C731.4,320,709,320,686,320C662.9,320,640,320,617,320C594.3,320,571,320,549,320C525.7,320,503,320,480,320C457.1,320,434,320,411,320C388.6,320,366,320,343,320C320,320,297,320,274,320C251.4,320,229,320,206,320C182.9,320,160,320,137,320C114.3,320,91,320,69,320C45.7,320,23,320,11,320L0,320Z"
            fill-opacity="1"
            fill="#04e4003a"
          ></path>
        </svg>

        <div class="grm-export-success-icon-container">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            stroke-width="0"
            fill="currentColor"
            stroke="currentColor"
            class="grm-export-success-icon"
          >
            <path
              d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z"
            ></path>
          </svg>
        </div>
        <div class="grm-export-success-message-text-container">
          <p class="grm-export-success-message-text">Export Successful!</p>
          <p class="grm-export-success-sub-text">${selectedReviewData.length} reviews exported to ${format.toUpperCase()}</p>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 15 15"
          stroke-width="0"
          fill="none"
          stroke="currentColor"
          class="grm-export-success-cross-icon"
          onclick="this.parentElement.remove()"
        >
          <path
            fill="currentColor"
            d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
            clip-rule="evenodd"
            fill-rule="evenodd"
          ></path>
        </svg>
      `;

      successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        animation: grm-slideIn 0.3s ease;
      `;

      document.body.appendChild(successMessage);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          successMessage.style.animation = 'grm-slideOut 0.3s ease';
          setTimeout(() => {
            if (document.body.contains(successMessage)) {
              document.body.removeChild(successMessage);
            }
          }, 300);
        }
      }, 5000);



    } catch (error) {

      console.error('Export failed:', error);



      // Show error message

      const errorMessage = document.createElement('div');

      errorMessage.className = 'export-error-message';

      errorMessage.innerHTML = `

        <div class="error-content">

          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">

            <circle cx="12" cy="12" r="10"/>

            <line x1="15" y1="9" x2="9" y2="15"/>

            <line x1="9" y1="9" x2="15" y2="15"/>

          </svg>

          <span>Failed to export proposals. Please try again.</span>

        </div>

      `;

      errorMessage.style.cssText = `

        position: fixed;

        top: 20px;

        right: 20px;

        background: #fef2f2;

        border: 1px solid #fca5a5;

        border-radius: 8px;

        padding: 12px 16px;

        color: #dc2626;

        font-weight: 500;

        z-index: 10000;

        display: flex;

        align-items: center;

        gap: 8px;

        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

        animation: slideIn 0.3s ease;

      `;

      document.body.appendChild(errorMessage);



      setTimeout(() => {

        errorMessage.style.animation = 'slideOut 0.3s ease';

        setTimeout(() => {

          document.body.removeChild(errorMessage);

        }, 3000);

      }, 3000);



    } finally {

      setIsExporting(false);

    }

  };



  const exportToExcel = async (data) => {
    // Create CSV content for Excel
    const headers = [
      'Protocol Code',
      'Research Title',
      'Proponent',
      'Reviewer Name',
      'Reviewer Type',
      'Decision',
      'Review Date',
      'Comments'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(review => [
        `"${review.protocolCode || review.proposal?.protocolCode || review.protocol || 'N/A'}"`,
        `"${(review.proposalTitle || review.proposal?.researchTitle || review.title || '').replace(/"/g, '""')}"`,
        `"${review.proponent || review.proposal?.proponent || review.student || 'N/A'}"`,
        `"${review.reviewerName || review.reviewer || 'N/A'}"`,
        `"${review.reviewerType || 'Reviewer'}"`,
        `"${review.decision || review.status || 'No decision'}"`,
        `"${(review.completedDate || review.createdAt || review.submissionDate) ? new Date(review.completedDate || review.createdAt || review.submissionDate).toLocaleDateString() : 'N/A'}"`,
        `"${(review.comment || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reviewer_reports_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  const exportToPDF = async (data) => {
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const preliminary = data.filter(r => (r.reviewerType || '').toLowerCase() === 'preliminary');
    const secondary = data.filter(r => (r.reviewerType || '').toLowerCase() === 'secondary');

    const renderRows = (reviews) => reviews.map(review => {
      const decision = review.decision || review.status || 'N/A';
      const date = (review.completedDate || review.createdAt)
        ? new Date(review.completedDate || review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'N/A';
      const comment = (review.comment || review.comments || '—').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `
        <tr>
          <td>${(review.reviewerName || review.reviewer || 'N/A').replace(/</g, '&lt;')}</td>
          <td><span class="badge badge-${decision.toLowerCase().replace(/\s+/g, '-')}">${decision}</span></td>
          <td>${review.overallRating || '—'}</td>
          <td>${date}</td>
          <td>${comment}</td>
        </tr>`;
    }).join('');

    const renderSection = (title, reviews) => {
      if (reviews.length === 0) return `<h2>${title}</h2><p class="empty">No completed reviews.</p>`;
      return `
        <h2>${title}</h2>
        <table>
          <thead>
            <tr>
              <th>Reviewer</th><th>Decision</th><th>Overall Rating</th>
              <th>Date Completed</th><th>Comments</th>
            </tr>
          </thead>
          <tbody>${renderRows(reviews)}</tbody>
        </table>`;
    };

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Reviewer Report — ${dateStr}</title>
  <style>
    @page { size: A4 landscape; margin: 1.5cm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 0; }
    header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e293b; padding-bottom: 10px; }
    header h1 { font-size: 18px; margin: 0 0 4px; }
    header p  { font-size: 11px; color: #64748b; margin: 0; }
    h2 { font-size: 13px; margin: 20px 0 6px; background: #f1f5f9; padding: 6px 10px; border-left: 4px solid #3b82f6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; page-break-inside: auto; }
    th { background: #e2e8f0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px;
         padding: 6px 8px; text-align: left; border: 1px solid #cbd5e1; }
    td { padding: 5px 8px; border: 1px solid #e2e8f0; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    .badge { display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 10px; font-weight: 600; }
    .badge-approve,.badge-approved { background:#dcfce7; color:#166534; }
    .badge-revision,.badge-needs-revision { background:#fef3c7; color:#92400e; }
    .badge-reject,.badge-rejected { background:#fee2e2; color:#991b1b; }
    .badge-secondary_file { background:#e0e7ff; color:#3730a3; }
    .badge-completed { background:#d1fae5; color:#065f46; }
    .empty { color:#94a3b8; font-style:italic; }
    @media print { h2 { page-break-before: auto; } }
  </style>
</head>
<body>
  <header>
    <h1>Reviewer Completed Reviews Report</h1>
    <p>Generated on ${dateStr} &nbsp;|&nbsp; Total: ${data.length} review(s)</p>
  </header>
  ${renderSection('Preliminary Reviewers', preliminary)}
  ${renderSection('Secondary Reviewers', secondary)}
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=1100,height=700');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 600);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'under review': '#3b82f6',
      'review submitted': '#f59e0b',
      'reviewed': '#10b981',
      'approved': '#10b981',
      'rejected': '#ef4444',
      'revision required': '#8b5cf6'
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  if (!isOpen) return null;

  const sections = [
    { label: 'Preliminary Reviewers', key: 'preliminary', data: preliminaryCompleted, unique: uniquePreliminary, accent: '#2563eb' },
    { label: 'Secondary Reviewers', key: 'secondary', data: secondaryCompleted, unique: uniqueSecondary, accent: '#7c3aed' },
  ];

  const getDecisionInfo = (decision) => {
    const d = (decision || '').toLowerCase();
    if (d === 'approve' || d === 'approved') return { label: 'Approved', cls: 'decision-approve' };
    if (d === 'revision' || d === 'needs revision') return { label: 'Revision', cls: 'decision-revision' };
    if (d === 'reject' || d === 'rejected') return { label: 'Rejected', cls: 'decision-reject' };
    if (d === 'secondary_file') return { label: 'Secondary File', cls: 'decision-secondary' };
    return { label: decision || 'Pending', cls: 'decision-default' };
  };

  const handleSectionSelectAll = (sectionData) => {
    const filtered = sectionData.filter(r => !searchQuery || getReviewerName(r).toLowerCase().includes(searchQuery.toLowerCase()));
    const ids = filtered.map(r => r._id || r.id);
    const allChecked = ids.every(id => selectedReviews.includes(id));
    if (allChecked) {
      setSelectedReviews(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedReviews(prev => [...new Set([...prev, ...ids])]);
    }
  };

  return (
    <div className="grm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="grm-modal">

        {/* ── Header ── */}
        <div className="grm-header">
          <div className="grm-header-left">
            <div className="grm-header-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h2 className="grm-title">Generate Report</h2>
              <p className="grm-subtitle">Completed reviews by Preliminary and Secondary Reviewers</p>
            </div>
          </div>
          <div className="grm-stats">
            <div className="grm-stat">
              <span className="grm-stat-val">{completedReviews.length}</span>
              <span className="grm-stat-lbl">Total Reviews</span>
            </div>
            <div className="grm-stat grm-stat--blue">
              <span className="grm-stat-val">{preliminaryCompleted.length}</span>
              <span className="grm-stat-lbl">Preliminary</span>
            </div>
            <div className="grm-stat grm-stat--purple">
              <span className="grm-stat-val">{secondaryCompleted.length}</span>
              <span className="grm-stat-lbl">Secondary</span>
            </div>
            <div className="grm-stat grm-stat--orange">
              <span className="grm-stat-val">{uniquePreliminary.length + uniqueSecondary.length}</span>
              <span className="grm-stat-lbl">Total Reviewers</span>
            </div>
            <div className="grm-stat grm-stat--green">
              <span className="grm-stat-val">{selectedReviews.length}</span>
              <span className="grm-stat-lbl">Selected</span>
            </div>
          </div>
          <button className="grm-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* ── Search ── */}
        <div className="grm-search-bar">
          <svg className="grm-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="grm-search-input"
            type="text"
            placeholder="Search by reviewer name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="grm-search-clear" onClick={() => setSearchQuery('')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          )}
        </div>

        {/* ── Body ── */}
        <div className="grm-body">
          {loading ? (
            <div className="grm-loading">
              <div className="grm-spinner" />
              <p>Loading reviews…</p>
            </div>
          ) : completedReviews.length === 0 ? (
            <div className="grm-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <h3>No completed reviews found</h3>
              <p>{searchQuery ? 'Try a different search term.' : 'No reviewers have completed reviews yet.'}</p>
            </div>
          ) : (
            <div className="grm-sections">
              {sections.map(({ label, key, data, unique, accent }) => {
                const filtered = data.filter(r => !searchQuery || getReviewerName(r).toLowerCase().includes(searchQuery.toLowerCase()));
                const sectionIds = filtered.map(r => r._id || r.id);
                const allSectionChecked = sectionIds.length > 0 && sectionIds.every(id => selectedReviews.includes(id));

                return (
                  <div key={key} className="grm-section">
                    <div className="grm-section-header" style={{ borderLeftColor: accent }}>
                      <div className="grm-section-title-row">
                        <span className="grm-section-dot" style={{ background: accent }} />
                        <h3 className="grm-section-title">{label}</h3>
                        <span className="grm-section-badge" style={{ background: accent + '1a', color: accent }}>
                          {filtered.length} {filtered.length === 1 ? 'review' : 'reviews'}
                        </span>
                      </div>
                      {filtered.length > 0 && (
                        <label className="grm-select-all">
                          <input
                            type="checkbox"
                            checked={allSectionChecked}
                            onChange={() => handleSectionSelectAll(data)}
                          />
                          <span>Select all</span>
                        </label>
                      )}
                    </div>

                    {unique.length === 0 ? (
                      <p className="grm-no-data">No {label.toLowerCase()} have completed reviews.</p>
                    ) : filtered.length === 0 ? (
                      <p className="grm-no-data">No results match your search.</p>
                    ) : (
                      <div className="grm-table-wrap">
                        <table className="grm-table">
                          <colgroup>
                            <col style={{ width: '44px' }} />
                            <col style={{ width: '200px' }} />
                            <col style={{ width: '120px' }} />
                            <col style={{ width: '140px' }} />
                            <col style={{ width: '200px' }} />
                          </colgroup>
                          <thead>
                            <tr>
                              <th />
                              <th>Reviewer Name</th>
                              <th>Decision</th>
                              <th>Date Completed</th>
                              <th>Comments</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((review, idx) => {
                              const id = review._id || review.id;
                              const isChecked = selectedReviews.includes(id);
                              const { label: decLabel, cls: decCls } = getDecisionInfo(review.decision || review.status);
                              const dateVal = review.completedDate || review.createdAt;
                              const dateStr = dateVal ? new Date(dateVal).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
                              return (
                                <tr key={id} className={`grm-row${isChecked ? ' grm-row--checked' : ''}${idx % 2 === 1 ? ' grm-row--alt' : ''}`}>
                                  <td className="grm-td-check">
                                    <input type="checkbox" checked={isChecked} onChange={() => handleSelectReview(id)} />
                                  </td>
                                  <td className="grm-td-name">{getReviewerName(review)}</td>
                                  <td><span className={`grm-badge ${decCls}`}>{decLabel}</span></td>
                                  <td className="grm-td-date">{dateStr}</td>
                                  <td className="grm-td-text">{review.comment || review.comments || <span className="grm-muted">—</span>}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="grm-footer">
          <div className="grm-footer-info">
            {selectedReviews.length > 0
              ? <><span className="grm-footer-count">{selectedReviews.length}</span> review{selectedReviews.length !== 1 ? 's' : ''} selected for export</>
              : 'Select reviews to export'}
          </div>
          <div className="grm-footer-actions">
            <button className="grm-btn grm-btn--ghost" onClick={onClose}>Cancel</button>
            <button
              className="grm-btn grm-btn--excel"
              onClick={() => handleExport('excel')}
              disabled={selectedReviews.length === 0 || isExporting}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" />
              </svg>
              {isExporting ? 'Exporting…' : `Export CSV`}
            </button>
            <button
              className="grm-btn grm-btn--pdf"
              onClick={() => handleExport('pdf')}
              disabled={selectedReviews.length === 0 || isExporting}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" /><polyline points="9 15 12 18 15 15" />
              </svg>
              {isExporting ? 'Exporting…' : `Export PDF`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );

};



function ViewReviewerSubmissionsModal({ isOpen, onClose }) {

  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    if (isOpen) {

      fetchAllReviews();

    }

  }, [isOpen]);



  const fetchAllReviews = async () => {

    setLoading(true);

    try {

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews/all`);

      const data = await res.json();

      setReviews(data);

    } catch (error) {

      console.error('Error fetching reviewer submissions:', error);

    } finally {

      setLoading(false);

    }

  };



  const formatDate = (date) => {

    if (!date) return 'N/A';

    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  };



  const formatTime = (date) => {

    if (!date) return '';

    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  };



  const getDecisionStyle = (decision) => {

    const d = (decision || '').toLowerCase();

    if (d === 'approve' || d === 'approved') return { backgroundColor: '#388E3C', color: '#fff' };

    if (d === 'revision' || d === 'needs revision') return { backgroundColor: '#F57C00', color: '#fff' };

    if (d === 'reject' || d === 'rejected') return { backgroundColor: '#D32F2F', color: '#fff' };

    return { backgroundColor: '#757575', color: '#fff' };

  };



  const getDecisionLabel = (decision) => {

    const d = (decision || '').toLowerCase();

    if (d === 'approve' || d === 'approved') return 'Approved';

    if (d === 'revision' || d === 'needs revision') return 'Request Revision';

    if (d === 'reject' || d === 'rejected') return 'Rejected';

    return decision || 'Pending';

  };



  if (!isOpen) return null;



  return (

    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>

      <div className="modal-container large">

        <button className="modal-close" onClick={onClose} aria-label="Close modal">

          <XIcon />

        </button>

        <div className="modal-header">

          <h2>Reviewer Submissions</h2>

          <p>View all reviewer submissions and their status</p>

        </div>

        <div className="modal-body">

          {loading ? (

            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading submissions...</div>

          ) : (

            <table className="submissions-table">

              <thead>

                <tr>

                  <th>Protocol Code</th>

                  <th>Reviewer</th>

                  <th>Decision</th>

                  <th>Comments</th>

                  <th>Date Submitted</th>

                  <th>Time Submitted</th>

                </tr>

              </thead>

              <tbody>

                {reviews.length === 0 ? (

                  <tr>

                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-medium)' }}>

                      No submissions found.

                    </td>

                  </tr>

                ) : (

                  reviews.map((review) => (

                    <tr key={review._id}>

                      <td>{review.protocolCode || 'N/A'}</td>

                      <td>{review.reviewerName || review.reviewerEmail}</td>

                      <td>

                        <span style={{ ...getDecisionStyle(review.decision), padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' }}>

                          {getDecisionLabel(review.decision)}

                        </span>

                      </td>

                      <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>

                        {review.comment || review.comments || 'No comments'}

                      </td>

                      <td>{formatDate(review.completedDate || review.createdAt)}</td>

                      <td>{formatTime(review.completedDate || review.createdAt)}</td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          )}

        </div>

      </div>

    </div>

  );

};







function StudentSubmissionsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('payment-receipts');
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingFile, setViewingFile] = useState(null);

  useEffect(() => {
    if (isOpen) fetchProposals();
  }, [isOpen]);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/proposals`);
      const data = await res.json();
      setProposals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'payment-receipts', label: 'Payment Receipts', icon: '💳', color: '#2563eb', filter: (p) => p.files?.paymentReceipt },
    { id: 'resubmitted-manuscripts', label: 'Resubmitted Manuscripts', icon: '📄', color: '#7c3aed', filter: (p) => p.status === 'Resubmitted' || p.submissionType === 'resubmission' },
    { id: 'response-letters', label: 'Response Letters', icon: '✉️', color: '#0891b2', filter: (p) => p.files?.reviewResults || p.files?.decisionOfInitialReview || p.files?.responseLetter },
    { id: 'completed-manuscripts', label: 'Completed Manuscripts', icon: '✅', color: '#16a34a', filter: (p) => p.files?.ethicalClearance || p.files?.releaseOfCompletedEthicalReview },
  ];

  const activeTabData = tabs.find((t) => t.id === activeTab);

  const getTabRows = (tab) =>
    proposals.filter(tab.filter).filter((p) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (p.proponent || '').toLowerCase().includes(q) ||
        (p.protocolCode || '').toLowerCase().includes(q) ||
        (p.researchTitle || '').toLowerCase().includes(q);
    });

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
  const formatSize = (b) => {
    if (!b) return '';
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
  };
  const getFileIcon = (mime = '') => {
    if (mime.includes('pdf')) return '📕';
    if (mime.includes('word') || mime.includes('docx')) return '📘';
    if (mime.includes('sheet') || mime.includes('excel')) return '📗';
    if (mime.includes('image')) return '🖼️';
    return '📎';
  };
  const buildDownloadUrl = (file) =>
    `${import.meta.env.VITE_API_URL}/api/download/${file.filename}?name=${encodeURIComponent(file.originalname || file.filename)}`;
  const buildViewUrl = (file) =>
    `${import.meta.env.VITE_API_URL}/api/view/${file.filename}`;

  const getFilesForTab = (tab, proposal) => {
    if (tab.id === 'resubmitted-manuscripts')
      return Object.entries(proposal.files || {}).filter(([k]) => k.startsWith('file')).map(([, v]) => v);
    const keys = {
      'payment-receipts': ['paymentReceipt'],
      'response-letters': ['reviewResults', 'decisionOfInitialReview', 'responseLetter'],
      'completed-manuscripts': ['ethicalClearance', 'releaseOfCompletedEthicalReview'],
    }[tab.id] || [];
    return keys.map((k) => proposal.files?.[k]).filter(Boolean);
  };

  const statusColors = {
    pending: { bg: '#fef3c7', color: '#92400e' },
    'submitted to admin': { bg: '#e0e7ff', color: '#4338ca' },
    'review submitted': { bg: '#fffbeb', color: '#b45309' },
    reviewed: { bg: '#dcfce7', color: '#166534' },
    approved: { bg: '#dcfce7', color: '#166534' },
    rejected: { bg: '#fee2e2', color: '#991b1b' },
    resubmitted: { bg: '#ede9fe', color: '#6d28d9' },
    'under review': { bg: '#dbeafe', color: '#1e40af' },
  };
  const getStatusStyle = (s = '') => statusColors[s.toLowerCase()] || { bg: '#f1f5f9', color: '#475569' };

  const rows = getTabRows(activeTabData);

  return (
    <div className="ssm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ssm-modal">

        {/* Header */}
        <div className="ssm-header">
          <div className="ssm-header-left">
            <div className="ssm-header-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
              </svg>
            </div>
            <div>
              <h2 className="ssm-title">Student Submissions</h2>
              <p className="ssm-subtitle">View and download all student-submitted documents by category</p>
            </div>
          </div>
          <div className="ssm-header-stats">
            {tabs.map((t) => (
              <div key={t.id} className="ssm-stat" style={{ borderColor: t.color + '40', background: t.color + '0d' }}>
                <span className="ssm-stat-val" style={{ color: t.color }}>{proposals.filter(t.filter).length}</span>
                <span className="ssm-stat-lbl">{t.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
          <button className="ssm-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="ssm-tabs">
          {tabs.map((tab) => {
            const count = proposals.filter(tab.filter).length;
            return (
              <button
                key={tab.id}
                className={`ssm-tab${activeTab === tab.id ? ' ssm-tab--active' : ''}`}
                style={activeTab === tab.id ? { borderBottomColor: tab.color, color: tab.color } : {}}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className="ssm-tab-count" style={activeTab === tab.id ? { background: tab.color, color: '#fff' } : {}}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="ssm-search-bar">
          <svg className="ssm-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="ssm-search-input"
            type="text"
            placeholder="Search by proponent, protocol code, or title…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="ssm-search-clear" onClick={() => setSearchQuery('')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="ssm-body">
          {loading ? (
            <div className="ssm-loading">
              <div className="ssm-spinner" />
              <p>Loading submissions…</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="ssm-empty">
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <h3>No {activeTabData.label.toLowerCase()} found</h3>
              <p>{searchQuery ? 'Try a different search term.' : 'No submissions in this category yet.'}</p>
            </div>
          ) : (
            <div className="ssm-table-wrap">
              <table className="ssm-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Protocol Code</th>
                    <th>Proponent</th>
                    <th>Research Title</th>
                    <th>Status</th>
                    <th>Date Submitted</th>
                    <th>Files</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((proposal, idx) => {
                    const files = getFilesForTab(activeTabData, proposal);
                    const statusStyle = getStatusStyle(proposal.status);
                    return (
                      <tr key={proposal._id} className={`ssm-row${idx % 2 === 1 ? ' ssm-row--alt' : ''}`}>
                        <td className="ssm-td-num">{idx + 1}</td>
                        <td className="ssm-td-code">
                          <span className="ssm-protocol-badge">{proposal.protocolCode || '—'}</span>
                        </td>
                        <td className="ssm-td-name">{proposal.proponent || '—'}</td>
                        <td className="ssm-td-title">{proposal.researchTitle || '—'}</td>
                        <td className="ssm-td-status">
                          <span className="ssm-status-badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                            {(proposal.status || 'Pending').replace(/Pending Preliminary Reviewer/gi, 'Pending Reviewer')}
                          </span>
                          {(proposal.resubmissionCount > 0 || proposal.resubmissionLabel) && (
                            <span className="ssm-status-badge" style={{ background: '#ede9fe', color: '#6d28d9', marginLeft: '0.35rem' }}>
                              {proposal.resubmissionLabel || `Resubmission ${proposal.resubmissionCount}`}
                            </span>
                          )}
                        </td>
                        <td className="ssm-td-date">{formatDate(proposal.submissionDate || proposal.createdAt)}</td>
                        <td className="ssm-td-files">
                          {files.length === 0 ? (
                            <span className="ssm-no-file">No file</span>
                          ) : (
                            <div className="ssm-file-list">
                              {files.map((file, fi) => (
                                <span key={fi} className="ssm-file-chip">
                                  <span className="ssm-file-name">{file.originalname || file.filename}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="ssm-footer">
          <span className="ssm-footer-info">
            Showing <strong>{rows.length}</strong> {activeTabData.label.toLowerCase()} submission{rows.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
          <button className="ssm-btn-close" onClick={onClose}>Close</button>
        </div>

      </div>

      {/* ── File Viewer Modal ── */}
      {viewingFile && (
        <div className="ssm-viewer-overlay" onClick={(e) => e.target === e.currentTarget && setViewingFile(null)}>
          <div className="ssm-viewer-modal">

            {/* Viewer Header */}
            <div className="ssm-viewer-header">
              <div className="ssm-viewer-file-info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="ssm-viewer-filename">{viewingFile.originalname || viewingFile.filename}</span>
                {viewingFile.size > 0 && <span className="ssm-viewer-filesize">{formatSize(viewingFile.size)}</span>}
              </div>
              <div className="ssm-viewer-actions">
                <a
                  href={buildDownloadUrl(viewingFile)}
                  className="ssm-viewer-btn ssm-viewer-btn--download"
                  download={viewingFile.originalname || viewingFile.filename}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </a>
                <button className="ssm-viewer-close" onClick={() => setViewingFile(null)} aria-label="Close viewer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Viewer Body */}
            <div className="ssm-viewer-body">
              {viewingFile.mimetype?.includes('pdf') ? (
                <embed
                  src={buildViewUrl(viewingFile)}
                  type="application/pdf"
                  className="ssm-viewer-iframe"
                />
              ) : viewingFile.mimetype?.includes('image') ? (
                <div className="ssm-viewer-image-wrap">
                  <img
                    src={buildViewUrl(viewingFile)}
                    className="ssm-viewer-image"
                    alt={viewingFile.originalname || viewingFile.filename}
                  />
                </div>
              ) : (
                <div className="ssm-viewer-unsupported">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <p className="ssm-viewer-unsupported-title">Preview not available</p>
                  <p className="ssm-viewer-unsupported-sub">This file type cannot be displayed in the browser.</p>
                  <a
                    href={buildDownloadUrl(viewingFile)}
                    className="ssm-viewer-btn ssm-viewer-btn--download"
                    download={viewingFile.originalname || viewingFile.filename}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download File
                  </a>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};



function AdminWelcomeModal({ firstName, onClose }) {

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

          <h2>WELCOME BACK, ADMIN!</h2>

          <p>We're excited to have you here. Manage proposals, reviewers, and oversee the UREB system with powerful admin tools.</p>

          <button className="welcome-close-btn" onClick={onClose}>

            Let's Start

          </button>

        </div>

      </div>

    </div>

  );

};







export default AdminDashboard;



