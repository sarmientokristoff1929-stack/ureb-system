import { useState, useEffect, useRef, useCallback } from 'react';

import '../styles/reviewerdashboard.css';

import { getProposalsByReviewer, getReviewsByReviewer, getMessagesByUser, submitReview, resubmitReview, getCompletedReviews, getReviewerAssignments, downloadReviewerFile, deleteMessage, editMessage, markMessageAsRead, changeReviewerPassword, getReviewerProfile, getUserNotifications, markNotificationAsRead, deleteNotification, viewFile, getReviewerConversation, markAdminMessagesReadForReviewer, sendReviewerMessageToAdmin } from '../services/api';

const formatAssignmentStatus = (status) => {
  if (!status) return 'Under Review';
  const normalized = String(status).toLowerCase().trim();
  if (normalized === 'completed') return 'Completed';
  if (normalized === 'pending') return 'Under Review';
  if (normalized === 'under review') return 'Under Review';
  if (normalized === 'review submitted') return 'Review Submitted';
  if (normalized === 'submitted to admin') return 'Review Submitted';
  return status;
};

const isAssignmentCompleted = (status) => String(status || '').toLowerCase().trim() === 'completed';

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



const ResubmissionIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />

    <path d="M3 3v5h5" />

    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />

    <path d="M16 21h5v-5" />

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

// These lists must be scoped per reviewer account, not shared globally in localStorage.
// Without this, testing/using more than one reviewer login in the same browser leaks
// "already read"/"deleted" state across accounts — e.g. swapping Reviewer 2 for a
// different reviewer in Reassign would show the new reviewer's freshly-assigned proposal
// as already "Done" simply because some other reviewer had viewed a proposal with the
// same content on this browser before.
const getCurrentReviewerEmail = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('ureb_user') || 'null');
    return (saved?.email || '').toLowerCase().trim();
  } catch { return ''; }
};

const scopedStorageKey = (baseKey) => {
  const email = getCurrentReviewerEmail();
  return email ? `${baseKey}_${email}` : baseKey;
};

const getDeletedAssignmentIds = () => {
  try {
    return JSON.parse(localStorage.getItem(scopedStorageKey(DELETED_ASSIGNMENTS_KEY)) || '[]');
  } catch { return []; }
};

const getReadAssignmentIds = () => {
  try {
    return JSON.parse(localStorage.getItem(scopedStorageKey(READ_ASSIGNMENTS_KEY)) || '[]');
  } catch { return []; }
};

const setReadAssignmentIds = (ids) => {
  try {
    localStorage.setItem(scopedStorageKey(READ_ASSIGNMENTS_KEY), JSON.stringify(ids));
  } catch { /* ignore quota/serialization errors */ }
};

// "Read"/"Done" tracking keys off the proposal's content, not just its id or the
// assignment document's own _id. The admin can re-save a proposal (edit attachments,
// swap reviewers, etc.) which may recreate/replace the underlying assignment record with
// a new _id — keying off proposalId alone keeps a reviewer's "already viewed this" state
// intact across no-op saves instead of the card flipping back to "New" every time the
// admin merely touches the proposal. But a real reassignment — new protocol code, added/
// removed files, or a moved review period — SHOULD flip the card back to "New" until the
// reviewer opens the updated files again, so those fields are folded into the key too.
const getAssignmentReadKey = (assignment) => {
  const proposalKey = String(assignment?.proposalId || assignment?._id || '');
  const protocolCode = String(assignment?.protocolCode || '');
  const fileKeys = Object.keys(assignment?.assignedFiles || {}).sort().join(',');
  const startDate = assignment?.reviewPeriod?.startDate ? new Date(assignment.reviewPeriod.startDate).getTime() : '';
  const endDate = assignment?.reviewPeriod?.endDate ? new Date(assignment.reviewPeriod.endDate).getTime() : '';
  return `${proposalKey}|${protocolCode}|${fileKeys}|${startDate}|${endDate}`;
};

const deduplicateAssignments = (rawList) => {
  if (!Array.isArray(rawList)) return [];
  const uniqueMap = new Map();
  rawList.forEach((item) => {
    const pId = item.proposalId ? String(item.proposalId).trim() : '';
    const pTitle = item.researchTitle ? String(item.researchTitle).trim().toLowerCase() : '';
    const pCode = item.protocolCode ? String(item.protocolCode).trim().toUpperCase() : '';
    const key = pId || pTitle || pCode || String(item._id);

    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    } else {
      const existing = uniqueMap.get(key);
      const itemFiles = Object.keys(item.assignedFiles || {}).length;
      const existingFiles = Object.keys(existing.assignedFiles || {}).length;
      const itemIsAdmin = item.assignmentSource === 'admin' || String(item.assignedBy || '').toLowerCase() === 'admin';
      const existingIsAdmin = existing.assignmentSource === 'admin' || String(existing.assignedBy || '').toLowerCase() === 'admin';

      if (itemIsAdmin && !existingIsAdmin) {
        uniqueMap.set(key, item);
      } else if (!itemIsAdmin && existingIsAdmin) {
        // Keep existing admin assignment
      } else if (itemFiles > existingFiles) {
        uniqueMap.set(key, item);
      }
    }
  });
  return Array.from(uniqueMap.values());
};

// Stale-while-revalidate cache: lets tabs that share the same underlying data
// (Assigned Proposals / Submit Review) show cached results instantly when switching
// back and forth, instead of re-showing a full "Loading..." state on every mount,
// while still refreshing the data silently in the background.
const createSwrCache = (fetcher) => {
  const cache = new Map();
  return {
    get: (key) => cache.get(key),
    has: (key) => cache.has(key),
    set: (key, value) => cache.set(key, value),
    async load(key, { onBackgroundUpdate } = {}) {
      const hasCached = cache.has(key);
      const cached = cache.get(key);
      if (hasCached) {
        fetcher(key).then((fresh) => {
          cache.set(key, fresh);
          if (onBackgroundUpdate) onBackgroundUpdate(fresh);
        }).catch(() => {});
        return { data: cached, fromCache: true };
      }
      const fresh = await fetcher(key);
      cache.set(key, fresh);
      return { data: fresh, fromCache: false };
    },
    // Unlike load(), always awaits a fresh network response before resolving —
    // used for explicit "Refresh" actions where stale cached data must not be shown.
    async refresh(key) {
      const fresh = await fetcher(key);
      cache.set(key, fresh);
      return { data: fresh, fromCache: false };
    }
  };
};

const reviewerAssignmentsSwr = createSwrCache((email) => getReviewerAssignments(email));
const reviewerCompletedReviewsSwr = createSwrCache(async (email) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews/completed/${encodeURIComponent(email)}`);
  return response.json();
});
const reviewerMessagesSwr = createSwrCache((email) => getMessagesByUser(email));
const reviewerProfileSwr = createSwrCache((email) => getReviewerProfile(email));
const reviewerReviewsSwr = createSwrCache((email) => getReviewsByReviewer(email));
const reviewerDbNotificationsSwr = createSwrCache((email) => getUserNotifications(email));
const reviewerHiddenItemsSwr = createSwrCache(async (email) => {
  const API_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, '') + '/api'
    : '/api';
  const res = await fetch(`${API_URL}/user-hidden-items/${encodeURIComponent(email)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data?.hiddenIds) ? data.hiddenIds.map(String) : [];
});

// Keeps the notification caches in sync immediately after a delete so a cached
// re-render (switching tabs away and back) doesn't briefly resurrect items the
// user just removed, before the background refresh has a chance to catch up.
const markNotificationsHiddenInCache = (email, ids) => {
  if (!email) return;
  const idSet = new Set(ids.map(String));

  const cachedHidden = reviewerHiddenItemsSwr.get(email) || [];
  reviewerHiddenItemsSwr.set(email, Array.from(new Set([...cachedHidden, ...idSet])));

  const cachedRaw = reviewerDbNotificationsSwr.get(email);
  if (Array.isArray(cachedRaw)) {
    reviewerDbNotificationsSwr.set(email, cachedRaw.filter(n => !idSet.has(String(n._id))));
  }
};

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
  const [messageCount, setMessageCount] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSecondaryReviewer, setIsSecondaryReviewer] = useState(true);
  const [isPreliminaryReviewer, setIsPreliminaryReviewer] = useState(true);
  const [reviewerType, setReviewerType] = useState('');
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

  // Load the logged-in reviewer's info from localStorage (name/email/department for Profile Settings, etc.)
  useEffect(() => {
    const savedUser = localStorage.getItem('ureb_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setUserInfo(user);
      const userIsSecondary = secondaryReviewers.includes(user.name);
      setIsSecondaryReviewer(userIsSecondary);
    }
  }, []);

  // Fetch reviewer type from API to determine menu visibility
  useEffect(() => {
    const fetchReviewerType = async () => {
      const savedUser = localStorage.getItem('ureb_user');
      if (!savedUser) return;

      const user = JSON.parse(savedUser);
      try {
        const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
        const listRes = await fetch(`${API_BASE}/reviewers/by-email/${encodeURIComponent(user?.email || '')}`);
        const reviewer = listRes.ok ? await listRes.json() : null;

        if (reviewer?.reviewerType) {
          setReviewerType(reviewer.reviewerType);
          // Set flags based on reviewer type
          setIsPreliminaryReviewer(reviewer.reviewerType === 'preliminary' || reviewer.reviewerType === 'both');
          setIsSecondaryReviewer(reviewer.reviewerType === 'secondary' || reviewer.reviewerType === 'both');
        } else {
          // Fallback: if no reviewerType, check secondary list for backward compatibility
          const userIsSecondary = secondaryReviewers.includes(user.name);
          setIsSecondaryReviewer(userIsSecondary);
          setIsPreliminaryReviewer(!userIsSecondary); // Assume preliminary if not in secondary list
          setReviewerType(userIsSecondary ? 'secondary' : 'preliminary');
        }
      } catch (err) {
        console.error('Error fetching reviewer type:', err);
        // Fallback on error
        const userIsSecondary = secondaryReviewers.includes(user.name);
        setIsSecondaryReviewer(userIsSecondary);
        setIsPreliminaryReviewer(!userIsSecondary);
      }
    };
    fetchReviewerType();
  }, []);

  const CheckIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'assigned-proposals', label: 'Assigned Proposals', icon: <FileCheckIcon />, badge: assignedCount > 0 ? assignedCount : null },
    { id: 'submit-secondary-file', label: 'Submit Review', icon: <SubmitSecondaryFileIcon /> },
    { id: 'submitted-reviews', label: 'Submitted Reviews', icon: <CheckIcon /> },
    { id: 'resubmission', label: 'Resubmission', icon: <ResubmissionIcon /> },
    { id: 'file-templates', label: 'File Templates', icon: <FileTemplatesIcon /> },
    { id: 'messages', label: 'Messages', icon: <MessageIcon />, badge: messageCount > 0 ? messageCount : null },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon />, badge: notifCount > 0 ? notifCount : null },
    { id: 'profile-settings', label: 'Profile Settings', icon: <ProfileIcon /> }
  ];

  const refreshBadgeCounts = useCallback(async () => {
    const savedUser = localStorage.getItem('ureb_user');
    if (!savedUser) return;
    try {
      const user = JSON.parse(savedUser);
      const { getReviewerAssignments, getUserNotifications, getMessagesByUser } = await import('../services/api');

      const assignments = await getReviewerAssignments(user.email);
      const deletedIds = getDeletedAssignmentIds();
      const readIds = getReadAssignmentIds();
      const uniqueAssignments = deduplicateAssignments(assignments);
      const activeAssignments = uniqueAssignments.filter((a) => !deletedIds.includes(String(a._id)) && !readIds.includes(getAssignmentReadKey(a)));
      setAssignedCount(activeAssignments.length);

      // Fetch hidden IDs from DB so badge count matches what's actually visible
      let hiddenIds = [];
      try {
        const apiUrl = import.meta.env.VITE_API_URL
          ? import.meta.env.VITE_API_URL.replace(/\/$/, '') + '/api'
          : '/api';
        const hiddenRes = await fetch(`${apiUrl}/user-hidden-items/${encodeURIComponent(user.email)}`);
        if (hiddenRes.ok) {
          const hiddenData = await hiddenRes.json();
          if (Array.isArray(hiddenData.hiddenIds)) hiddenIds = hiddenData.hiddenIds.map(String);
        }
      } catch { /* non-fatal */ }

      const notifications = await getUserNotifications(user.email);
      const visibleUnread = (notifications || [])
        .filter(n => !n.read && !hiddenIds.includes(String(n._id)))
        .length;
      setNotifCount(visibleUnread);

      const messages = await getMessagesByUser(user.email);
      setMessageCount((messages || []).filter(m => m.type === 'admin_to_reviewer' && !m.read).length);
    } catch (error) {
      console.error('Error refreshing reviewer badge counts:', error);
    }
  }, []);

  useEffect(() => {
    refreshBadgeCounts();
    const interval = setInterval(refreshBadgeCounts, 10000);
    return () => clearInterval(interval);
  }, [refreshBadgeCounts, activeTab]);

  useEffect(() => {
    // Check if welcome modal has been shown in this login session
    const welcomeShown = sessionStorage.getItem('reviewer_welcome_shown');
    if (welcomeShown) {
      setShowWelcomeModal(false);
    }
  }, []);

  // Refresh message count for badge
  const refreshMessageCount = () => {
    const savedUser = localStorage.getItem('ureb_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      import('../services/api').then(({ getMessagesByUser }) => {
        getMessagesByUser(user.email).then((messages) => {
          const adminUnreadCount = messages.filter(m => m.type === 'admin_to_reviewer' && !m.read).length;
          setMessageCount(adminUnreadCount);
        }).catch(() => { });
      });
    }
  };

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
        const updatedUser = { ...userInfo, ...result.reviewer };
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

      case 'resubmission':

        return <ResubmissionContent userInfo={userInfo} />;

      case 'notifications':

        return <ReviewerNotificationsContent userInfo={userInfo} onNotifDeleted={refreshBadgeCounts} />;

      case 'profile-settings':

        return <ReviewerProfileContent userInfo={userInfo} setUserInfo={setUserInfo} />;

      case 'messages':

        return <MessagesContent userInfo={userInfo} onMessageRead={refreshMessageCount} />;

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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span>{item.label}</span>
                {item.subtext && <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{item.subtext}</span>}
              </div>
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
              {userInfo.profilePicture ? (
                <img
                  key={userInfo.profilePicture}
                  src={getProfilePicUrl(userInfo.profilePicture)}
                  alt="Profile"
                  className="header-profile-pic"
                  onLoad={(e) => {
                    e.target.style.display = 'block';
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = 'none';
                    }
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <span style={{ display: userInfo.profilePicture ? 'none' : 'flex' }}>
                {userInfo.name.charAt(0).toUpperCase()}
              </span>
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



const ReviewerNotificationsContent = ({ userInfo, onNotifDeleted }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifToDelete, setNotifToDelete] = useState(null);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const [deletingSingle, setDeletingSingle] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, '') + '/api'
    : '/api';

  const buildNotifs = (dbNotifs, hiddenIds, assignments) => {
    const safeDbNotifs = Array.isArray(dbNotifs) ? dbNotifs : [];
    const safeAssignments = Array.isArray(assignments) ? assignments : [];

    const notifs = safeDbNotifs
      .filter(n => !hiddenIds.includes(String(n._id)))
      .map(n => ({
        id: String(n._id),   // Always store as string to avoid ObjectId comparison bugs
        type: n.type === 'review_deadline' ? 'warning' : (n.type === 'assignment' ? 'info' : (n.type || 'info')),
        title: n.title,
        message: n.message,
        time: new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        read: n.read,
        isDbNotif: true,
        _raw: n
      }));

    // Also check for expiring proposals (1-year validity)
    const today = new Date();

    safeAssignments.forEach((proposal) => {
      const submittedDate = new Date(proposal.submissionDate || proposal.createdAt || Date.now());
      const deadlineDate = new Date(submittedDate);
      deadlineDate.setFullYear(deadlineDate.getFullYear() + 1);
      const daysRemaining = Math.ceil((deadlineDate - today) / (1000 * 3600 * 24));
      const expId = `exp-${proposal._id}`;

      if (hiddenIds.includes(expId)) return; // Hidden by user

      if (daysRemaining <= 14 && daysRemaining > 0) {
        // Avoid duplicate if DB notification already covers this
        const exists = notifs.some(n => n._raw?.proposalId?.toString() === (proposal.proposalId?.toString?.() || proposal.proposalId));
        if (!exists) {
          notifs.push({
            id: expId,
            type: 'warning',
            title: 'Proposal Expiring Soon',
            message: `"${proposal.researchTitle || 'Untitled'}" is expiring in ${daysRemaining} day(s). The 1-year review period ends on ${deadlineDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`,
            time: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            read: false,
            isDbNotif: false,
          });
        }
      } else if (daysRemaining <= 0) {
        const exists = notifs.some(n => n._raw?.proposalId?.toString() === (proposal.proposalId?.toString?.() || proposal.proposalId));
        if (!exists) {
          notifs.push({
            id: expId,
            type: 'danger',
            title: 'Proposal Expired',
            message: `"${proposal.researchTitle || 'Untitled'}" has exceeded the 1-year review validity period (expired ${deadlineDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}).`,
            time: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            read: false,
            isDbNotif: false,
          });
        }
      }
    });

    setNotifications(notifs);
  };

  const fetchNotifications = useCallback(async ({ force = false } = {}) => {
    if (!userInfo?.email) return;
    const email = userInfo.email;

    // These three sources are each cached, so a repeat visit to this tab (or a switch
    // from Dashboard/Assigned Proposals, which share the assignments cache) can render
    // immediately instead of showing "Loading notifications..." again. A manual refresh
    // skips this shortcut so the click visibly waits on a fresh network response.
    const allCached = !force
      && reviewerDbNotificationsSwr.has(email)
      && reviewerHiddenItemsSwr.has(email)
      && reviewerAssignmentsSwr.has(email);

    if (allCached) {
      buildNotifs(
        reviewerDbNotificationsSwr.get(email),
        reviewerHiddenItemsSwr.get(email),
        reviewerAssignmentsSwr.get(email)
      );
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      // Assignments are fetched first: the server creates review_deadline reminders
      // as a side effect of this call, so notifications must be fetched afterward
      // to pick up any reminder created on this same visit instead of the next one.
      // A forced refresh uses refresh() instead of load() — load() would otherwise
      // resolve immediately with the stale cached value for any source already cached,
      // updating it only in the background, which defeats the point of a Refresh click.
      const assignResult = force
        ? await reviewerAssignmentsSwr.refresh(email)
        : await reviewerAssignmentsSwr.load(email);
      const [dbResult, hiddenResult] = force
        ? await Promise.all([
            reviewerDbNotificationsSwr.refresh(email),
            reviewerHiddenItemsSwr.refresh(email)
          ])
        : await Promise.all([
            reviewerDbNotificationsSwr.load(email),
            reviewerHiddenItemsSwr.load(email)
          ]);
      buildNotifs(dbResult.data, hiddenResult.data, assignResult.data);
    } catch (err) {
      console.error('Error loading reviewer notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      const idStr = String(id);
      // Only call API for real DB notifications (24-char hex ObjectId)
      if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
        await markNotificationAsRead(idStr);
      }
      setNotifications((prev) => prev.map((n) => String(n.id) === idStr ? { ...n, read: true } : n));

      const cachedRaw = reviewerDbNotificationsSwr.get(userInfo?.email);
      if (Array.isArray(cachedRaw)) {
        reviewerDbNotificationsSwr.set(userInfo.email, cachedRaw.map(n => String(n._id) === idStr ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const performDelete = async (id) => {
    try {
      setDeletingSingle(true);
      const idStr = String(id);
      const deletePromises = [];

      // Delete from DB if it's a real DB notification (24-char hex ObjectId)
      if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
        deletePromises.push(
          deleteNotification(idStr).catch(err => console.error('DB notif delete failed:', err))
        );
      }

      // Always persist hide to user-hidden-items for cross-device persistence
      if (userInfo?.email) {
        deletePromises.push(
          fetch(`${API_URL}/user-hidden-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userInfo.email, itemId: idStr, itemType: 'notification' })
          }).catch(err => console.error('Hidden item save failed:', err))
        );
      }

      await Promise.all(deletePromises);
      setNotifications((prev) => prev.filter((n) => String(n.id) !== idStr));
      markNotificationsHiddenInCache(userInfo?.email, [idStr]);
      if (onNotifDeleted) onNotifDeleted(); // Refresh sidebar badge count
    } catch (err) {
      console.error('Error deleting notification:', err);
    } finally {
      setDeletingSingle(false);
      setNotifToDelete(null);
    }
  };

  const performDeleteAll = async () => {
    try {
      setDeletingAll(true);
      const toDelete = [...notifications];
      const deletePromises = [];

      for (const n of toDelete) {
        const idStr = String(n.id);
        if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
          deletePromises.push(
            deleteNotification(idStr).catch(err => console.error('DB notif delete failed:', err))
          );
        }
      }

      // Bulk-save all hidden IDs to DB for cross-device persistence
      if (userInfo?.email && toDelete.length > 0) {
        const allIds = toDelete.map(n => String(n.id));
        deletePromises.push(
          fetch(`${API_URL}/user-hidden-items/clear-all`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userInfo.email, itemIds: allIds, itemType: 'notification' })
          }).catch(err => console.error('Hidden items bulk save failed:', err))
        );
      }

      await Promise.all(deletePromises);
      setNotifications([]);
      markNotificationsHiddenInCache(userInfo?.email, toDelete.map(n => String(n.id)));
      if (onNotifDeleted) onNotifDeleted(); // Refresh sidebar badge count
    } catch (err) {
      console.error('Error deleting all notifications:', err);
    } finally {
      setDeletingAll(false);
      setDeleteAllConfirmOpen(false);
    }
  };

  // Trash/Delete icon component
  const TrashIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );

  const RefreshIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={isRefreshing ? { animation: 'sr-spin 0.8s linear infinite' } : undefined}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await fetchNotifications({ force: true });
      if (onNotifDeleted) onNotifDeleted(); // also resync the sidebar badge count
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="content-section">
      <div className="sm-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Notifications</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          className="hist-refresh-btn"
          title="Refresh notifications"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshIcon />
          <span>Refresh</span>
        </button>
        {notifications.length > 0 && (
          <button
            className="hist-delete-all-btn"
            title="Delete all notifications"
            onClick={() => setDeleteAllConfirmOpen(true)}
          >
            <TrashIcon />
            <span>Delete All</span>
          </button>
        )}
        </div>
      </div>
      <div className="notifications-list">
        {loading ? (
          <div className="loading-state">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="loading-state">No notifications at this time.</div>
        ) : (
          notifications.map((notif) => (
            <div
              key={String(notif.id)}
              className={`notification-item ${!notif.read ? 'unread' : ''} ${notif.type}`}
              style={{ position: 'relative' }}
            >
              <div className="notification-icon">
                {notif.type === 'warning' && <span>!</span>}
                {notif.type === 'danger' && <span>✕</span>}
                {notif.type === 'info' && <span>i</span>}
                {notif.type === 'success' && <span>✓</span>}
              </div>
              <div className="notification-content" style={{ position: 'relative', paddingRight: notif.read ? '46px' : '170px' }}>
                <div className="notif-action-bar">
                  {!notif.read && (
                    <button
                      type="button"
                      className="notif-action-btn notif-action-btn--read notif-action-btn--text"
                      onClick={() => markAsRead(notif.id)}
                      title="Mark this notification as read"
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    type="button"
                    className="notif-action-btn notif-action-btn--delete"
                    onClick={() => setNotifToDelete(notif)}
                    title="Delete notification"
                  >
                    <TrashIcon />
                  </button>
                </div>
                <h4>{notif.title}</h4>
                <p>{notif.message}</p>
                <span className="notification-time">{notif.time}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Single Notification Confirmation Modal */}
      {notifToDelete && (
        <div className="logout-modal-overlay" onClick={() => !deletingSingle && setNotifToDelete(null)}>
          <div className="logout-modal-container" onClick={e => e.stopPropagation()}>
            <div className="logout-modal-header">
              <h2>Delete Notification</h2>
            </div>
            <div className="logout-modal-body">
              <p>Are you sure you want to delete <strong>{notifToDelete.title}</strong>?</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>This action cannot be undone.</p>
            </div>
            <div className="logout-modal-footer">
              <button
                className="logout-modal-btn-secondary"
                onClick={() => setNotifToDelete(null)}
                disabled={deletingSingle}
              >
                Cancel
              </button>
              <button
                className="logout-modal-btn-primary"
                style={{ backgroundColor: '#dc2626' }}
                onClick={() => performDelete(notifToDelete.id)}
                disabled={deletingSingle}
              >
                {deletingSingle ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Notifications Confirmation Modal */}
      {deleteAllConfirmOpen && (
        <div className="logout-modal-overlay" onClick={() => !deletingAll && setDeleteAllConfirmOpen(false)}>
          <div className="logout-modal-container" onClick={e => e.stopPropagation()}>
            <div className="logout-modal-header">
              <h2>Delete All Notifications</h2>
            </div>
            <div className="logout-modal-body">
              <p>Are you sure you want to delete <strong>all {notifications.length} notification{notifications.length === 1 ? '' : 's'}</strong>?</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>This action cannot be undone.</p>
            </div>
            <div className="logout-modal-footer">
              <button
                className="logout-modal-btn-secondary"
                onClick={() => setDeleteAllConfirmOpen(false)}
                disabled={deletingAll}
              >
                Cancel
              </button>
              <button
                className="logout-modal-btn-primary"
                style={{ backgroundColor: '#dc2626' }}
                onClick={performDeleteAll}
                disabled={deletingAll}
              >
                {deletingAll ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Faculty display label mapping
const FACULTY_MAP = {
  'FALS': 'FALS - Faculty of Agriculture and Life Sciences',
  'FTED': 'FTED - Faculty of Teacher Education',
  'FAIS': 'FAIS - Faculty of Advance and International Studies',
  'FNAHS': 'FNAHS - Faculty of Nursing and Allied Health Science',
  'FBM': 'FBM - Faculty of Business Management',
  'FCJE': 'FCJE - Faculty of Criminology Justice Education',
  'FACET': 'FACET - Faculty of Computing, Engineering, Technology',
  'FHUSOCOM': 'FHUSOCOM - Faculty of Humanities, Social Science & Communication',
  'SIEC': 'SIEC - San Isidro Extension Campus',
  'BEC': 'BEC - BanayBanay Extension Campus',
  'CEC': 'CEC - Cateel Extension Campus',
  'BGEC': 'BGEC - Baganga Extension Campus',
  'TEC': 'TEC - Tarragona Extension Campus',
  'NSTP': 'NSTP - National Service Training Program',
  'ICS': 'ICS - Indigenous Community Studies',
  'Community Representatives': 'Community Representatives',
  'UREB Board': 'UREB Board - University Research Ethics Board'
};

// ── Reviewer Profile Settings Content ──
const ReviewerProfileContent = ({ userInfo, setUserInfo }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({ name: userInfo?.name || '', email: userInfo?.email || '', department: userInfo?.department || '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [reviewerType, setReviewerType] = useState('');

  // Profile picture state
  const [reviewerData, setReviewerData] = useState(null);

  // Only sync profileData from userInfo when NOT editing (prevents resetting while user types)
  useEffect(() => {
    if (!isEditing && userInfo?.name) {
      setProfileData(prev => ({
        name: userInfo.name,
        email: userInfo.email || '',
        department: prev.department || userInfo.department || ''
      }));
    }
  }, [userInfo, isEditing]);

  // Fetch reviewer data including profile picture and department assigned by admin
  useEffect(() => {
    const fetchReviewerData = async () => {
      if (!userInfo?.email) return;
      try {
        const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
        const res = await fetch(`${API_BASE}/reviewers/by-email/${encodeURIComponent(userInfo.email)}`);
        if (res.ok) {
          const reviewer = await res.json();
          if (reviewer) {
            // Add cache-busting timestamp to profile picture URL if it exists
            if (reviewer.profilePicture) {
              reviewer.profilePicture = `${reviewer.profilePicture}?t=${Date.now()}`;
            }
            setReviewerData(reviewer);
            if (reviewer.department) {
              setProfileData(prev => ({ ...prev, department: reviewer.department }));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching reviewer data:', err);
      }
    };
    fetchReviewerData();
  }, [userInfo?.email]);

  // Fetch reviewer type when component mounts
  useEffect(() => {
    const fetchReviewerType = async () => {
      if (!userInfo?.email) return;
      try {
        const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
        const listRes = await fetch(`${API_BASE}/reviewers/by-email/${encodeURIComponent(userInfo.email)}`);
        if (listRes.ok) {
          const reviewer = await listRes.json();
          if (reviewer?.reviewerType) {
            setReviewerType(reviewer.reviewerType);
          }
        }
      } catch (err) {
        console.error('Error fetching reviewer type:', err);
      }
    };
    fetchReviewerType();
  }, [userInfo?.email]);

  // Hero card always shows the saved userInfo name; edit field uses profileData for live input
  const fullName = userInfo?.name || profileData.name || 'Reviewer';
  const initials = fullName.charAt(0).toUpperCase();
  const profilePicUrl = reviewerData?.profilePicture || userInfo?.profilePicture;

  const handleEdit = () => { setIsEditing(true); setError(''); setSuccessMsg(''); };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setProfileData({ name: userInfo?.name || '', email: userInfo?.email || '', department: reviewerData?.department || userInfo?.department || '' });
  };

  const handleSave = async () => {
    if (!profileData.name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    if (!profileData.email.trim()) {
      setError('Email cannot be empty.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

      const newEmail = profileData.email.trim().toLowerCase();
      const updateData = {
        email: (userInfo?.email || '').toLowerCase(),
        name: profileData.name.trim(),
        department: profileData.department
      };

      const updateRes = await fetch(`${API_BASE}/reviewers/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const result = await updateRes.json();

      if (result.success) {
        const updatedUser = { ...userInfo, name: profileData.name.trim(), email: newEmail, department: profileData.department };
        setUserInfo(updatedUser);
        localStorage.setItem('ureb_user', JSON.stringify(updatedUser));
        setIsEditing(false);
        setSuccessMsg('Profile updated successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(result.error || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Error updating reviewer profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFacultyLabel = (deptKey) => {
    if (!deptKey) return '';
    const key = String(deptKey).trim();
    if (FACULTY_MAP[key]) return FACULTY_MAP[key];
    const upperKey = key.toUpperCase();
    const mapMatchKey = Object.keys(FACULTY_MAP).find(k => k.toUpperCase() === upperKey);
    return mapMatchKey ? FACULTY_MAP[mapMatchKey] : key;
  };

  const facultyDisplay = getFacultyLabel(profileData.department || reviewerData?.department || userInfo?.department);

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
      console.log('=== REVIEWER PASSWORD CHANGE ===');
      console.log('Email:', userInfo?.email);
      console.log('Has current password:', !!currentPassword);
      console.log('Has new password:', !!newPassword);
      
      const result = await changeReviewerPassword(userInfo?.email, currentPassword, newPassword);
      console.log('Password change result:', result);
      
      if (result.success) {
        setPwdSuccess('Password changed successfully.');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswords({ current: false, new: false, confirm: false });
        setShowPasswordForm(false);
        setTimeout(() => setPwdSuccess(''), 4000);
      } else {
        console.error('Password change failed:', result.error);
        setPwdError(result.error || 'Failed to change password.');
      }
    } catch (err) {
      console.error('Password change error:', err);
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
        {/* Avatar (display only) */}
        <div className="sp-avatar-wrapper">
          {/* Profile image - shown when URL exists */}
          {profilePicUrl && (
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
            style={{ display: profilePicUrl ? 'none' : 'flex' }}
          >
            {initials}
          </div>
        </div>
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
              { label: 'Faculty', value: facultyDisplay },
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
                <label htmlFor="rp-email">Email Address</label>
                <input
                  id="rp-email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                />
                <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Email must be unique</small>
              </div>
            </div>
            <div className="sp-field-row">
              <div className="sp-field">
                <label htmlFor="rp-dept">Faculty</label>
                <select
                  id="rp-dept"
                  value={profileData.department}
                  onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
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



  const applyDashboardData = (assignments, reviews, messages, reviewerProfile) => {
    const deletedIds = getDeletedAssignmentIds();
    const uniqueAssignments = deduplicateAssignments(assignments);
    const activeAssignments = uniqueAssignments.filter(a => !deletedIds.includes(String(a._id)));

    const pendingReviewsCount = reviews.filter(r => r.status === 'pending').length;
    const pendingAssignmentsCount = activeAssignments.filter(a => {
      const s = (a.status || '').toLowerCase();
      return !s || s === 'pending';
    }).length;

    // If admin has marked this reviewer as completed, count all their assignments as done
    const isMarkedComplete = (reviewerProfile?.status || '').toLowerCase() === 'completed';
    const completedReviews = isMarkedComplete
      ? activeAssignments.length
      : activeAssignments.filter(a => isAssignmentCompleted(a.status)).length;

    const unreadMessages = messages.filter(m => !m.read).length;

    const activities = generateRecentActivity(activeAssignments, reviews, messages);

    setStats({
      assignedProposals: activeAssignments.length,
      pendingReviews: pendingReviewsCount + pendingAssignmentsCount,
      completedReviews,
      unreadMessages
    });
    setRecentActivity(activities);
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

  const fetchDashboardData = async (userEmail) => {
    if (!userEmail) return;

    // Warm the caches used by Assigned Proposals / Submit Review / Notifications in the
    // background as soon as the dashboard (the first screen after login) loads, so
    // switching to those tabs right away finds data already cached instead of kicking
    // off a fresh fetch and showing "Loading..." for the first time.
    reviewerCompletedReviewsSwr.load(userEmail).catch(() => {});
    reviewerDbNotificationsSwr.load(userEmail).catch(() => {});
    reviewerHiddenItemsSwr.load(userEmail).catch(() => {});

    // If already cached (e.g. came back from another tab this session), paint instantly
    // instead of showing "Loading..." again — then always follow up with a real network
    // fetch below regardless. This component fully unmounts whenever the reviewer switches
    // tabs (Dashboard is one case in a switch, not a hidden-but-mounted view), so a
    // submission made from Submit Review while Dashboard wasn't mounted would otherwise
    // never be picked up — refetching fresh on every mount is what makes the stat cards
    // reflect a submission as soon as the reviewer comes back to this tab.
    const hasCached = reviewerAssignmentsSwr.has(userEmail)
      && reviewerReviewsSwr.has(userEmail)
      && reviewerMessagesSwr.has(userEmail)
      && reviewerProfileSwr.has(userEmail);

    if (hasCached) {
      applyDashboardData(
        reviewerAssignmentsSwr.get(userEmail),
        reviewerReviewsSwr.get(userEmail),
        reviewerMessagesSwr.get(userEmail),
        reviewerProfileSwr.get(userEmail)
      );
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const [assignmentsResult, reviewsResult, messagesResult, profileResult] = await Promise.all([
        reviewerAssignmentsSwr.refresh(userEmail),
        reviewerReviewsSwr.refresh(userEmail),
        reviewerMessagesSwr.refresh(userEmail),
        reviewerProfileSwr.refresh(userEmail)
      ]);

      applyDashboardData(assignmentsResult.data, reviewsResult.data, messagesResult.data, profileResult.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

            <p>Under Review</p>

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
              <span className={`status-badge ${formatAssignmentStatus(proposal.status).toLowerCase().replace(/\s+/g, '-')}`}>
                {formatAssignmentStatus(proposal.status)}
              </span>
              {(proposal.resubmissionCount > 0 || proposal.resubmissionLabel) && (
                <span className="status-badge" style={{ backgroundColor: '#ede9fe', color: '#6d28d9', marginLeft: '0.35rem' }}>
                  {proposal.resubmissionLabel || `Resubmission ${proposal.resubmissionCount}`}
                </span>
              )}
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

const getReviewerRole = (assignment, userEmail) => {
  if (assignment?.reviewerRole) return assignment.reviewerRole;
  const user = (userEmail || '').toLowerCase().trim();
  const sec1 = (assignment?.secondaryReviewer1 || assignment?.proposal?.secondaryReviewer1 || assignment?.reviewers?.reviewer2 || '').toLowerCase().trim();
  const sec2 = (assignment?.secondaryReviewer2 || assignment?.proposal?.secondaryReviewer2 || assignment?.reviewers?.reviewer3 || '').toLowerCase().trim();
  if (user && sec1 && user === sec1) return 'Chair';
  if (user && sec2 && user === sec2) return 'Member';
  return null;
};

const AssignedProposalsContent = ({ setAssignedCount }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [readIds, setReadIds] = useState([]);
  const [submittedProtocolCodes, setSubmittedProtocolCodes] = useState(new Set());

  useEffect(() => {
    setReadIds(getReadAssignmentIds());
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('ureb_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      fetchAssignments(user.email);
      fetchSubmittedProtocolCodes(user.email);
    }
  }, []);

  const normalizeProtocolCode = (code) => String(code || '').toUpperCase().replace(/\s+/g, '');

  const fetchSubmittedProtocolCodes = async (userEmail) => {
    if (!userEmail) return;
    const applyCodes = (data) => {
      const codes = new Set(
        (Array.isArray(data) ? data : [])
          .map((r) => normalizeProtocolCode(r.protocolCode))
          .filter(Boolean)
      );
      setSubmittedProtocolCodes(codes);
    };
    try {
      const { data } = await reviewerCompletedReviewsSwr.load(userEmail, { onBackgroundUpdate: applyCodes });
      applyCodes(data);
    } catch (error) {
      console.error('Error fetching submitted protocol codes:', error);
    }
  };

  // Listen for reviewSubmitted events dispatched after a reviewer submits a review
  // and update the matching assignment's status locally so the sidebar reflects it instantly
  useEffect(() => {
    const handleReviewSubmitted = (e) => {
      const { proposalId, protocolCode } = e.detail || {};
      setAssignments(prev => prev.map(a => {
        const matchById = proposalId && (String(a._id) === String(proposalId) || String(a.proposalId) === String(proposalId));
        const matchByCode = protocolCode && a.protocolCode && a.protocolCode === protocolCode;
        if (matchById || matchByCode) {
          return { ...a, status: 'Review Submitted' };
        }
        return a;
      }));
    };

    window.addEventListener('reviewSubmitted', handleReviewSubmitted);
    return () => window.removeEventListener('reviewSubmitted', handleReviewSubmitted);
  }, []);

  const fetchAssignments = async (userEmail) => {
    if (!userEmail) return;

    const applyData = (data) => {
      const deletedIds = getDeletedAssignmentIds();
      const rawList = (Array.isArray(data) ? data : []).filter(a => !deletedIds.includes(String(a._id)));

      // Deduplicate by proposalId / protocolCode / researchTitle to prevent duplicate entries
      const active = deduplicateAssignments(rawList);
      // Student submissions first, then admin assignments; newest first within each group
      active.sort((a, b) => {
        const aStudent = a.assignmentSource === 'student' || String(a.assignedBy || '').toLowerCase() !== 'admin';
        const bStudent = b.assignmentSource === 'student' || String(b.assignedBy || '').toLowerCase() !== 'admin';
        if (aStudent !== bStudent) return aStudent ? -1 : 1;
        return new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0);
      });
      setAssignments(active);
    };

    // Show cached data instantly (if we have it from a prior visit to this tab or
    // Submit Review, which shares the same assignments data) instead of blanking
    // the screen with a loading spinner every time the tab is switched to.
    const cached = reviewerAssignmentsSwr.get(userEmail);
    if (cached) {
      applyData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const { data } = await reviewerAssignmentsSwr.load(userEmail, { onBackgroundUpdate: applyData });
      applyData(data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getEffectiveEndDate = (assignment) => {
    if (assignment.reviewPeriod?.endDate) {
      return assignment.reviewPeriod.endDate;
    }
    // Default: 2 weeks from startDate or createdAt
    const baseDate = new Date(assignment.reviewPeriod?.startDate || assignment.createdAt || Date.now());
    const twoWeeksLater = new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    return twoWeeksLater.toISOString();
  };

  const handleDownload = async (file) => {
    if (!file?.filename) return;
    const result = await downloadReviewerFile(file.filename, file.originalname || file.filename);
    if (!result?.success) {
      alert(`Could not download "${file.originalname || file.filename}". The file may no longer be available.`);
    }
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
      // Student-submitted files
      proposal: 'Research Proposal',
      approvalSheet: 'Approval Sheet',
      applicationForm6: 'Application Form 6 (UREB Form 6)',
      accomplishedForm8: 'Accomplished Form 8 (UREB Form 8)',
      accomplishedForm10A: 'Accomplished Form 10-A (UREB Form 10-A)',
      instrumentTool: 'Research Instrument / Tool',
      ethicsReviewFee: 'Ethics Review Fee Receipt',
      sampleForm1: 'Sample Form 1',
      sampleForm2: 'Sample Form 2'
    };
    if (labels[key]) return labels[key];
    if (key.startsWith('attachment')) {
      const parts = key.split('_');
      const num = parts[parts.length - 1];
      return !isNaN(num) ? `Admin Attachment ${parseInt(num, 10) + 1}` : 'Admin Attachment';
    }
    if (key.startsWith('adminAttachment')) return 'Admin Attachment';
    return key;
  };

  const STUDENT_FILE_KEYS_SET = new Set([
    'proposal', 'approvalSheet', 'urebForm2', 'applicationForm6',
    'accomplishedForm8', 'accomplishedForm10A', 'instrumentTool', 'ethicsReviewFee',
    'sampleForm1', 'sampleForm2'
  ]);

  const isStudentFileKey = (key) => {
    if (STUDENT_FILE_KEYS_SET.has(key)) return true;
    if (String(key).toLowerCase().startsWith('student')) return true;
    return false;
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

      <div className="proposals-list">
        {assignments.map((assignment) => {
          const files = assignment.assignedFiles || {};
          const fileEntries = Object.entries(files);
          const studentFileEntries = fileEntries.filter(([k]) => isStudentFileKey(k));
          const adminFileEntries = fileEntries.filter(([k]) => !isStudentFileKey(k));
          const isExpanded = expandedId === String(assignment._id);
          const isAdminAssignment = assignment.assignmentSource === 'admin'
            || (assignment.assignmentSource !== 'student' && String(assignment.assignedBy || '').toLowerCase() === 'admin');
          const isStudentSubmission = !isAdminAssignment;
          const submitterName = assignment.proponent
            || (isStudentSubmission && assignment.assignedBy && assignment.assignedBy !== 'Student'
              ? assignment.assignedBy
              : null)
            || assignment.studentEmail
            || 'Student';

          const isRead = readIds.includes(getAssignmentReadKey(assignment));
          const isProtocolAlreadySubmitted = assignment.protocolCode
            && submittedProtocolCodes.has(normalizeProtocolCode(assignment.protocolCode));
          const displayStatus = isAssignmentCompleted(assignment.status)
            ? 'Completed'
            : isProtocolAlreadySubmitted
              ? 'Submitted to Admin'
              : formatAssignmentStatus(assignment.status);

          return (
            <div className={`proposal-card ${!isRead ? 'unread' : ''}`} key={String(assignment._id)}>
              <div className="proposal-header">
                <div className="proposal-header-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h3><span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#000000', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{isStudentSubmission ? 'Proposal Title:' : (assignment.protocolCode ? 'Protocol Code:' : 'Proposal Title:')}</span> <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#6b7280' }}>{isStudentSubmission ? (assignment.researchTitle || 'No Title') : (assignment.protocolCode || assignment.researchTitle || 'No Title')}</span></h3>
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
                    className={`status-badge ${displayStatus.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {displayStatus}
                  </span>
                </div>
              </div>
              <div className="proposal-content">
                {isStudentSubmission && (
                  <p>
                    <strong>Submitted by:</strong> {submitterName}
                    <span
                      style={{
                        marginLeft: '8px',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        color: '#065f46',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}
                    >
                      Student Submitted
                    </span>
                  </p>
                )}
                {isAdminAssignment && assignment.protocolCode && (
                  <p style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>Protocol Code:</span>
                    <span style={{
                      backgroundColor: '#eff6ff',
                      color: '#1e40af',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      border: '1px solid #dbeafe',
                      fontFamily: 'monospace'
                    }}>
                      {assignment.protocolCode}
                    </span>
                  </p>
                )}
                {(() => {
                  const savedUserStr = localStorage.getItem('ureb_user');
                  const curEmail = savedUserStr ? JSON.parse(savedUserStr).email : '';
                  const role = getReviewerRole(assignment, curEmail);
                  if (!role) return null;
                  const isChair = role === 'Chair';

                  // The co-reviewer is whichever of Chair/Member isn't the current user.
                  const coReviewerRole = isChair ? 'Member' : 'Chair';
                  const coReviewerName = isChair
                    ? (assignment.secondaryReviewer2Name || assignment.secondaryReviewer2)
                    : (assignment.secondaryReviewer1Name || assignment.secondaryReviewer1);

                  return (
                    <>
                      <p style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>Assigned Reviewer Role:</span>
                        <span style={{
                          backgroundColor: isChair ? '#fef3c7' : '#e0e7ff',
                          color: isChair ? '#92400e' : '#3730a3',
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          border: `1px solid ${isChair ? '#fde68a' : '#c7d2fe'}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {isChair ? 'Chair Reviewer' : 'Member Reviewer'}
                        </span>
                      </p>
                      {coReviewerName && (
                        <p style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>
                            {coReviewerRole === 'Chair' ? 'Chair Reviewer:' : 'Member Reviewer:'}
                          </span>
                          <span style={{
                            backgroundColor: coReviewerRole === 'Chair' ? '#fef3c7' : '#e0e7ff',
                            color: coReviewerRole === 'Chair' ? '#92400e' : '#3730a3',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            border: `1px solid ${coReviewerRole === 'Chair' ? '#fde68a' : '#c7d2fe'}`
                          }}>
                            {coReviewerName}
                          </span>
                        </p>
                      )}
                    </>
                  );
                })()}
                {(assignment.initialReviewDecision || assignment.proposal?.initialReviewDecision) && (
                  <p style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>Initial Review Decision:</span>
                    <span style={{
                      backgroundColor: '#f0fdf4',
                      color: '#166534',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      border: '1px solid #bbf7d0'
                    }}>
                      {assignment.initialReviewDecision || assignment.proposal?.initialReviewDecision}
                    </span>
                  </p>
                )}
                <div className="proposal-meta">
                  <span><strong>Review Start:</strong> {formatDate(assignment.reviewPeriod?.startDate)}</span>
                  <span><strong>Review End:</strong> {formatDate(getEffectiveEndDate(assignment))}</span>
                  <span><strong>{isStudentSubmission ? 'Submitted:' : 'Assigned:'}</strong> {formatDate(assignment.createdAt)}</span>
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
                        const readKey = getAssignmentReadKey(assignment);
                        if (!readIds.includes(readKey)) {
                          const newReadIds = [...readIds, readKey];
                          setReadAssignmentIds(newReadIds);
                          setReadIds(newReadIds);
                          if (setAssignedCount) setAssignedCount(prev => Math.max(0, prev - 1));

                          // Status stays 'Pending' for reviewer until submission.
                          // Student already sees 'Under Review' from the initial submission.
                        }
                      }
                    }}
                  >
                    {isExpanded ? 'Hide Files' : `View Files (${fileEntries.length})`}
                  </button>

                  {isExpanded && (
                    <div className="assigned-files-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {/* STUDENT SUBMITTED FILES */}
                      {studentFileEntries.length > 0 && (
                        <div className="assigned-file-group">
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0.45rem 0.85rem',
                              backgroundColor: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: '8px',
                              marginBottom: '0.65rem',
                            }}
                          >
                            <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#166534', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Student Submitted Files ({studentFileEntries.length})
                            </h4>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {studentFileEntries.map(([key, file]) => (
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
                                      onClick={() => viewFile(file.filename)}
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
                        </div>
                      )}

                      {/* ADMIN ATTACHMENTS */}
                      {adminFileEntries.length > 0 && (
                        <div className="assigned-file-group">
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0.45rem 0.85rem',
                              backgroundColor: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '8px',
                              marginBottom: '0.65rem',
                            }}
                          >
                            <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#1e40af', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Admin Attachments ({adminFileEntries.length})
                            </h4>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {adminFileEntries.map(([key, file]) => (
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
                                      onClick={() => viewFile(file.filename)}
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
                        </div>
                      )}
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
          maxWidth: '98vw',
          width: '98vw',
          maxHeight: '96vh',
          height: '96vh',
          margin: '0 auto',
          padding: '1rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div className="modal-header" style={{ overflow: 'hidden', flexShrink: 0, margin: 0 }}>
          <h2
            title={viewingFile.originalname || viewingFile.filename}
            style={{
              fontSize: '1.1rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
              marginBottom: 0
            }}
          >
            {viewingFile.originalname || viewingFile.filename}
          </h2>
        </div>
        <div className="modal-body" style={{ padding: '0.5rem 0', flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <FileViewer file={viewingFile} onClose={onClose} />
        </div>
        <div className="modal-footer" style={{ flexShrink: 0, margin: 0, paddingTop: '0.75rem' }}>
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
        // Use templates endpoint for template files (identified by "Form " prefix), download endpoint for uploaded files
        const isTemplate = file.filename.includes('Form ');
        const downloadUrl = isTemplate
          ? `${import.meta.env.VITE_API_URL}/api/templates/${encodeURIComponent(file.filename)}`
          : `${import.meta.env.VITE_API_URL}/api/download/${encodeURIComponent(file.filename)}`;
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
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <ZoomControls />
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', borderRadius: '8px' }}>
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
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <ZoomControls />
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', borderRadius: '8px' }}>
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
      <div style={{ height: '100%', width: '100%', minHeight: 0, overflow: 'auto' }}>
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
    // Check if running locally - Office Viewer can't access localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      return (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
          <h3 style={{ color: '#1e293b', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Document Preview</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            Preview is not available for local files. Microsoft Office Viewer requires a publicly accessible URL.
          </p>
          <a href={fileUrl} download={file.originalname || file.filename} style={{
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download {file.originalname || file.filename}
          </a>
        </div>
      );
    }

    // For production, use a component that handles viewer errors
    return <OfficeDocumentViewer file={file} fileUrl={fileUrl} />;
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

// Office Document Viewer Component with error handling for production
const OfficeDocumentViewer = ({ file, fileUrl }) => {
  const [viewerFailed, setViewerFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getMicrosoftViewerUrl = (url) => {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  };

  const getGoogleDocsViewerUrl = (url) => {
    return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
  };

  useEffect(() => {
    // Set a timeout to detect if the viewer fails to load properly
    const timer = setTimeout(() => {
      // If still loading after 8 seconds, consider it failed
      if (isLoading) {
        setViewerFailed(true);
        setIsLoading(false);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Construct the public URL for the file (for external viewers like Microsoft/Google)
  const isTemplate = file.filename.includes('Form ');
  const fileApiUrl = isTemplate
    ? `${import.meta.env.VITE_API_URL}/api/templates/${encodeURIComponent(file.filename)}`
    : `${import.meta.env.VITE_API_URL}/api/download/${encodeURIComponent(file.filename)}`;

  // If Microsoft viewer fails, try Google Docs viewer as fallback
  const viewerUrl = viewerFailed
    ? getGoogleDocsViewerUrl(fileApiUrl)
    : getMicrosoftViewerUrl(fileApiUrl);

  if (viewerFailed && isLoading === false) {
    // Both viewers failed, show download fallback
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
        <h3 style={{ color: '#1e293b', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Document Preview</h3>
        <p style={{ color: '#64748b', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
          The document viewer could not load this file. Please download it to view.
        </p>
        <a href={fileUrl} download={file.originalname || file.filename} style={{
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download {file.originalname || file.filename}
        </a>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', minHeight: 0 }}>
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          <div style={{ marginBottom: '1rem' }}>Loading document preview...</div>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#4a7c59', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        </div>
      )}
      <iframe
        src={viewerUrl}
        width="100%"
        height={isLoading ? '0' : '100%'}
        style={{ border: 'none', borderRadius: '8px', display: isLoading ? 'none' : 'block' }}
        title="Office Document Viewer"
        allow="fullscreen"
        onLoad={handleIframeLoad}
        onError={() => {
          setViewerFailed(true);
          setIsLoading(false);
        }}
      />
      {!isLoading && (
        <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-medium)' }}>
          If the document doesn't load, please use the Download button below.
        </p>
      )}
    </div>
  );
};

const SubmitReviewContent = ({ onShowSuccessModal, onNavigateToSubmitted }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [reviewerName, setReviewerName] = useState('');

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
      decision: 'approved_no_revision',
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
      setReviewerName(user.name || user.email);

      console.log('User:', user.name, 'isSecondaryReviewer:', userIsSecondary);

      fetchProposals(user.email);
    }
  }, []);

  const fetchProposals = async (userEmail) => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const assignments = await getReviewerAssignments(userEmail);
      const safeAssignments = Array.isArray(assignments) ? assignments : [];

      // Include all active assignments for this reviewer (both student-submitted and admin-assigned)
      const validAssignments = safeAssignments.filter((a) => {
        return (a.proposalId || a._id) && (a.researchTitle || a.protocolCode);
      });

      // Deduplicate by proposalId or protocolCode + title to avoid duplicates
      const proposalMap = new Map();
      validAssignments.forEach((a) => {
        const key =
          String(a.proposalId || a._id || a.protocolCode || a.researchTitle || '').toLowerCase();
        if (!proposalMap.has(key)) {
          proposalMap.set(key, {
            _id: a.proposalId || a._id,
            researchTitle: a.researchTitle || 'Untitled Proposal',
            protocolCode: a.protocolCode || '',
            proponent: a.proponent || a.studentName || 'Unknown',
          });
        }
      });

      setProposals(Array.from(proposalMap.values()));
    } catch (error) {
      console.error('Error fetching assignments for review submission:', error);
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
        protocolCode: selectedProposal?.protocolCode || '',
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

      // Update assignment status to 'Review Submitted' after successful submission
      if (selectedProposal?._id && user?.email) {
        try {
          await fetch(`${import.meta.env.VITE_API_URL}/api/assignments/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              proposalId: selectedProposal._id,
              protocolCode: selectedProposal.protocolCode || undefined,
              reviewerEmail: user.email,
              status: 'Review Submitted'
            })
          });
        } catch (statusErr) {
          console.error('Failed to update assignment status to Review Submitted:', statusErr);
        }

        // Notify AssignedProposalsContent to update its local state instantly
        window.dispatchEvent(new CustomEvent('reviewSubmitted', {
          detail: { proposalId: selectedProposal._id, protocolCode: selectedProposal.protocolCode }
        }));
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
        decision: 'approved_no_revision',
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
              <span>PDF, DOC, DOCX (MAX. 12MB)</span>
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
        {/* Proposal Selection Dropdown */}
        <div className="form-section" style={{ overflow: 'hidden' }}>
          <label className="form-label" style={{ fontWeight: '600', color: '#000', marginBottom: '0.5rem', display: 'block' }}>
            Select Assigned Proposal
            {reviewerName && proposals.length > 0 && (
              <span style={{ fontWeight: '500', color: '#6b7280', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                - {reviewerName} ({proposals.length} proposal{proposals.length !== 1 ? 's' : ''} assigned)
              </span>
            )}
          </label>
          <select
            className="form-input"
            style={{ width: '100%', maxWidth: '100%', padding: '0.75rem', fontSize: '0.95rem', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', display: 'block' }}
            value={selectedProposal?._id || ''}
            onChange={(e) => {
              const selected = proposals.find(p => p._id === e.target.value);
              setSelectedProposal(selected || null);

              // Cleanly trigger 'Under Review' status when a proposal is selected for review
              if (selected && selected._id) {
                const savedUser = localStorage.getItem('ureb_user');
                const user = savedUser ? JSON.parse(savedUser) : null;

                if (user?.email) {
                  try {
                    fetch(`${import.meta.env.VITE_API_URL}/api/assignments/status`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        proposalId: selected._id,
                        reviewerEmail: user.email,
                        status: 'Under Review'
                      })
                    });
                  } catch (err) {
                    console.error('Failed to update status to Under Review:', err);
                  }
                }
              }
            }}
            required
          >
            <option value="">-- Choose a proposal --</option>
            {proposals.map((proposal) => (
              <option key={proposal._id} value={proposal._id}>
                {proposal.researchTitle || proposal.protocolCode || 'Untitled Proposal'} {proposal.protocolCode ? `(Code: ${proposal.protocolCode})` : ''}
              </option>
            ))}
          </select>
          {proposals.length === 0 && (
            <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              No assigned proposals found. Please check your assignments.
            </p>
          )}
        </div>

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
                  value="approved_no_revision"
                  checked={reviewData.decision === 'approved_no_revision'}
                  onChange={(e) => setReviewData(prev => ({ ...prev, decision: e.target.value }))}
                />
                <span className="decision-label approve">Approved with no Revision</span>
              </label>
              <label className="decision-option">
                <input
                  type="radio"
                  name="decision"
                  value="approved_minor_revision"
                  checked={reviewData.decision === 'approved_minor_revision'}
                  onChange={(e) => setReviewData(prev => ({ ...prev, decision: e.target.value }))}
                />
                <span className="decision-label revision">Approved with minor Revision</span>
              </label>
              <label className="decision-option">
                <input
                  type="radio"
                  name="decision"
                  value="approved_major_revision"
                  checked={reviewData.decision === 'approved_major_revision'}
                  onChange={(e) => setReviewData(prev => ({ ...prev, decision: e.target.value }))}
                />
                <span className="decision-label revision">Approved with Major revision</span>
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
                decision: 'approved_no_revision',
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
}

const SubmitSecondaryFileContent = ({ onShowSuccessModal, onNavigateToSubmitted }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [submittedProtocolCodes, setSubmittedProtocolCodes] = useState(new Set());

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
          urebForm11: null,
          additionalFiles: []
        };
      } catch (error) {
        console.error('Error parsing saved secondary file data:', error);
      }
    }
    return {
      protocolCode: '',
      urebForm10B: null,
      urebForm11: null,
      additionalFiles: []
    };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Save data to localStorage whenever secondaryFileData changes
  useEffect(() => {
    const dataToSave = {
      protocolCode: secondaryFileData.protocolCode || '',
      urebForm10BFileName: secondaryFileData.urebForm10B?.name || null,
      urebForm11FileName: secondaryFileData.urebForm11?.name || null,
      additionalFileNames: secondaryFileData.additionalFiles.map(f => f?.name || null)
    };
    localStorage.setItem('secondaryFileDraftData', JSON.stringify(dataToSave));
  }, [secondaryFileData]);

  useEffect(() => {
    const savedUser = localStorage.getItem('ureb_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      fetchProposals(user.email);
      fetchSubmittedProtocolCodes(user.email);
    }
  }, []);

  const normalizeProtocolCode = (code) => String(code || '').toUpperCase().replace(/\s+/g, '');

  const fetchSubmittedProtocolCodes = async (userEmail) => {
    if (!userEmail) return;
    const applyCodes = (data) => {
      const codes = new Set(
        (Array.isArray(data) ? data : [])
          .map((r) => normalizeProtocolCode(r.protocolCode))
          .filter(Boolean)
      );
      setSubmittedProtocolCodes(codes);
    };
    try {
      const { data } = await reviewerCompletedReviewsSwr.load(userEmail, { onBackgroundUpdate: applyCodes });
      applyCodes(data);
    } catch (error) {
      console.error('Error fetching submitted protocol codes:', error);
    }
  };

  const fetchProposals = async (userEmail) => {
    if (!userEmail) return;

    const applyData = (assignments) => {
      const safeAssignments = Array.isArray(assignments) ? assignments : [];
      const mappedProposals = safeAssignments
        // Secondary submission should only show admin/secondary assignments that have protocol codes
        .filter((a) => {
          const source = a.assignmentSource
            || (String(a.assignedBy || '').toLowerCase() === 'admin' ? 'admin' : 'student');
          return source === 'admin' && a.protocolCode && String(a.protocolCode).trim() !== '';
        })
        .map((a) => ({
          _id: a.proposalId || a._id,
          researchTitle: a.researchTitle || 'Untitled Proposal',
          protocolCode: String(a.protocolCode || '').trim(),
          proponent: a.proponent || a.studentName || 'Unknown',
        }));

      // Deduplicate by protocol code (same protocol can appear from multiple admin assignments)
      const byProtocol = new Map();
      mappedProposals.forEach((p) => {
        const key = p.protocolCode.toUpperCase();
        if (!byProtocol.has(key)) byProtocol.set(key, p);
      });

      setProposals(Array.from(byProtocol.values()));
    };

    // Assigned Proposals and Submit Review both read from the same assignments data,
    // so reuse whatever's cached instead of showing "Loading proposals..." on every switch.
    const cached = reviewerAssignmentsSwr.get(userEmail);
    if (cached) {
      applyData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const { data } = await reviewerAssignmentsSwr.load(userEmail, { onBackgroundUpdate: applyData });
      applyData(data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
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

  const handleAdditionalFileChange = (index, file) => {
    setSecondaryFileData(prev => {
      const newFiles = [...prev.additionalFiles];
      newFiles[index] = file;
      return { ...prev, additionalFiles: newFiles };
    });
  };

  const addAdditionalFile = () => {
    setSecondaryFileData(prev => ({
      ...prev,
      additionalFiles: [...prev.additionalFiles, null]
    }));
  };

  const removeAdditionalFile = (index) => {
    setSecondaryFileData(prev => {
      const newFiles = prev.additionalFiles.filter((_, i) => i !== index);
      return { ...prev, additionalFiles: newFiles };
    });
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
        comment: `Secondary files submitted for Protocol Code: ${secondaryFileData.protocolCode}`,
        protocolCode: secondaryFileData.protocolCode,
        urebForm10B: secondaryFileData.urebForm10B,
        urebForm11: secondaryFileData.urebForm11,
        additionalFiles: secondaryFileData.additionalFiles.filter(f => f !== null)
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit secondary files');
      }

      // Update assignment status to 'Review Submitted' after successful secondary submission
      if (selectedProposal?._id && user?.email) {
        try {
          await fetch(`${import.meta.env.VITE_API_URL}/api/assignments/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              proposalId: selectedProposal._id,
              protocolCode: secondaryFileData.protocolCode || undefined,
              reviewerEmail: user.email,
              status: 'Review Submitted'
            })
          });
        } catch (statusErr) {
          console.error('Failed to update assignment status to Review Submitted:', statusErr);
        }

        // Notify AssignedProposalsContent to update its local state instantly
        window.dispatchEvent(new CustomEvent('reviewSubmitted', {
          detail: { proposalId: selectedProposal._id, protocolCode: secondaryFileData.protocolCode }
        }));
      }

      // Show success modal
      onShowSuccessModal();

      // Clear localStorage after successful submission
      localStorage.removeItem('secondaryFileDraftData');

      // Reset form
      setSecondaryFileData({
        protocolCode: '',
        urebForm10B: null,
        urebForm11: null,
        additionalFiles: []
      });
      setSelectedProposal(null);

    } catch (error) {
      console.error('Error submitting secondary files:', error);
      alert('Error: ' + (error.message || 'Failed to submit secondary files. Please try again.'));
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

  const AdditionalFileUpload = ({ index, file, onChange, onRemove }) => {
    const [isDragging, setIsDragging] = useState(false);
    const inputId = `additional-file-${index}`;

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
        onChange(index, files[0]);
      }
    };

    return (
      <div className="form-group" style={{ marginBottom: 0, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Additional File #{index + 1}</label>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            title="Remove file"
          >
            Remove
          </button>
        </div>
        <div
          className={`file-upload ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id={inputId}
            accept=".pdf,.doc,.docx"
            onChange={(e) => onChange(index, e.target.files[0])}
            className="file-input"
            style={{ display: 'none' }}
          />
          <label htmlFor={inputId} className="file-upload-label">
            <div className="file-upload-icon">
              <FileUploadIcon />
            </div>
            <div className="file-upload-text">
              <p>Attach file or drag and drop here</p>
              <span>PDF, DOC, DOCX (MAX. 12MB)</span>
            </div>
          </label>
          {file && (
            <div className="attached-file">
              <span>
                <FileIcon /> {file.name}
              </span>
              <button
                type="button"
                onClick={() => onChange(index, null)}
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
              <span>PDF, DOC, DOCX (MAX. 12MB)</span>
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
        <h2>Submit Review</h2>
        <div className="loading-state">Loading proposals...</div>
      </div>
    );
  }

  return (
    <div className="content-section">
      <h2>Submit Review</h2>

      <form onSubmit={handleSubmit} className="review-form">
        {/* Protocol Code Dropdown */}
        <div className="form-section" style={{ overflow: 'hidden' }}>
          <label className="form-label" style={{ fontWeight: '600', color: '#000', marginBottom: '0.5rem', display: 'block' }}>
            Protocol Code
          </label>
          <select
            className="form-input"
            style={{ width: '100%', maxWidth: '100%', padding: '0.75rem', fontSize: '0.95rem', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', display: 'block' }}
            value={secondaryFileData.protocolCode}
            onChange={(e) => {
              const code = e.target.value;
              setSecondaryFileData(prev => ({ ...prev, protocolCode: code }));

              // Cleanly trigger 'Under Review' status when a protocol code is selected for secondary submission
              if (code) {
                const selected = proposals.find(p => p.protocolCode === code);
                const savedUser = localStorage.getItem('ureb_user');
                const user = savedUser ? JSON.parse(savedUser) : null;

                if (user?.email && selected) {
                  try {
                    fetch(`${import.meta.env.VITE_API_URL}/api/assignments/status`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        proposalId: selected._id,
                        reviewerEmail: user.email,
                        status: 'Under Review'
                      })
                    });
                  } catch (err) {
                    console.error('Failed to update status to Under Review:', err);
                  }
                }
              }
            }}

            required
            disabled={loading}
          >
            <option value="">{loading ? 'Loading...' : '-- Select Protocol Code --'}</option>
            {proposals.filter(p => p.protocolCode).map((proposal, index) => (
              <option key={index} value={proposal.protocolCode}>
                {proposal.protocolCode}{submittedProtocolCodes.has(normalizeProtocolCode(proposal.protocolCode)) ? ' — Already Submitted to Admin ✓' : ''}
              </option>
            ))}
          </select>
          {proposals.length === 0 && !loading && (
            <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              No protocol codes found. Please check your assignments.
            </p>
          )}
          {secondaryFileData.protocolCode && submittedProtocolCodes.has(normalizeProtocolCode(secondaryFileData.protocolCode)) && (
            <div style={{
              marginTop: '0.6rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 0.9rem',
              borderRadius: '8px',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              color: '#92400e',
              fontSize: '0.85rem',
              fontWeight: 500
            }}>
              <span>You already submitted this Protocol Code to the Admin.</span>
              <span style={{ fontSize: '1rem', lineHeight: 1 }}>✅</span>
            </div>
          )}
        </div>

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

          {/* Additional Files Section */}
          <div className="additional-files-section" style={{ marginTop: '24px' }}>
            <div className="documents-grid secondary-reviewer-layout">
              {secondaryFileData.additionalFiles.map((file, index) => (
                <AdditionalFileUpload
                  key={index}
                  index={index}
                  file={file}
                  onChange={handleAdditionalFileChange}
                  onRemove={removeAdditionalFile}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={addAdditionalFile}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px', padding: '10px 16px' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Another File
            </button>
          </div>
        </div>

        {/* Show proposal info only when a proposal is selected */}
        {selectedProposal && (
          <div className="proposal-info-card">
            <h3>{selectedProposal.protocolCode}</h3>
            <p><strong>Title:</strong> {selectedProposal.researchTitle}</p>
            <p><strong>Proponent:</strong> {selectedProposal.proponent}</p>
            {(selectedProposal.initialReviewDecision || selectedProposal.proposal?.initialReviewDecision) && (
              <p><strong>Initial Review Decision:</strong> <span style={{ color: '#166534', fontWeight: '700' }}>{selectedProposal.initialReviewDecision || selectedProposal.proposal?.initialReviewDecision}</span></p>
            )}
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
              setSecondaryFileData({
                protocolCode: '',
                urebForm10B: null,
                urebForm11: null,
                additionalFiles: []
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
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

// --- Small inline icons used only by the reviewer <-> admin chat UI ---
const ChatEditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const ChatPaperclipIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
  </svg>
);

const ChatSendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.5 12L21 3l-6 18-4-7-8-2z" />
  </svg>
);

// Reviewer <-> Admin Messenger-style chat: a single conversation with the UREB admin
const MessagesContent = ({ onMessageRead, userInfo }) => {
  const [thread, setThread] = useState([]);
  const [threadLoading, setThreadLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingFiles, setEditingFiles] = useState([]);
  const [editingRemovedKeys, setEditingRemovedKeys] = useState(new Set());
  const [editingNewFiles, setEditingNewFiles] = useState([]);
  const [deleteConfirmMsg, setDeleteConfirmMsg] = useState(null);

  const sendingRef = useRef(false);
  const threadEndRef = useRef(null);

  const myEmail = userInfo?.email || '';

  const MAX_MESSAGE_ATTACHMENTS = 3;
  const MAX_MESSAGE_TOTAL_BYTES = 12 * 1024 * 1024;
  const MESSAGE_ATTACHMENT_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);

  const formatBubbleTime = (dateVal) => {
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const formatDaySeparator = (dateVal) => {
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return 'Today';
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    const sameYear = date.getFullYear() === now.getFullYear();
    return date.toLocaleDateString([], sameYear ? { month: 'long', day: 'numeric' } : { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const loadThread = async () => {
    if (!myEmail) return;
    try {
      const data = await getReviewerConversation(myEmail);
      setThread(data);
    } catch (err) {
      console.error('Error loading conversation with admin:', err);
    }
  };

  // Initial load + mark admin's messages as read
  useEffect(() => {
    if (!myEmail) return undefined;
    let cancelled = false;

    const init = async () => {
      setThreadLoading(true);
      try {
        const data = await getReviewerConversation(myEmail);
        if (!cancelled) setThread(data);
      } catch (err) {
        console.error('Error loading conversation with admin:', err);
      } finally {
        if (!cancelled) setThreadLoading(false);
      }
      markAdminMessagesReadForReviewer(myEmail).catch((err) => console.error('Error marking admin messages read:', err));
      if (onMessageRead) onMessageRead();
    };

    init();

    const pollInterval = setInterval(() => {
      if (sendingRef.current) return;
      loadThread();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myEmail]);

  useEffect(() => {
    if (threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ block: 'end' });
    }
  }, [thread]);

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
      if (!MESSAGE_ATTACHMENT_TYPES.has(file.type)) { rejected = true; continue; }
      if (runningTotal + file.size > MAX_MESSAGE_TOTAL_BYTES) { rejected = true; break; }
      runningTotal += file.size;
      accepted.push(file);
    }
    if (accepted.length > 0) setAttachedFiles((prev) => [...prev, ...accepted]);
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
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const text = messageText.trim();
    if ((!text && attachedFiles.length === 0) || !myEmail || sending) return;

    const tempId = `temp-${Date.now()}`;
    const filesToSend = [...attachedFiles];

    const optimisticMsg = {
      _id: tempId,
      type: 'reviewer_chat_to_admin',
      message: text,
      senderEmail: myEmail,
      senderName: userInfo?.name || 'Reviewer',
      createdAt: new Date().toISOString(),
      files: filesToSend.map((f) => ({ originalname: f.name, filename: f.name, size: f.size })),
      _pending: true,
    };

    setThread((prev) => [...prev, optimisticMsg]);
    setMessageText('');
    setAttachedFiles([]);
    setError('');
    sendingRef.current = true;
    setSending(true);

    try {
      const result = await sendReviewerMessageToAdmin({
        senderEmail: myEmail,
        senderName: userInfo?.name || 'Reviewer',
        message: text,
        attachments: filesToSend,
      });
      if (result?.success === false) throw new Error(result.error || 'Failed to send message');

      await loadThread();
    } catch (err) {
      console.error('Error sending message to admin:', err);
      setThread((prev) => prev.map((m) => (m._id === tempId ? { ...m, _pending: false, _failed: true } : m)));
      setError('Failed to send message. Please try again.');
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const startEditMessage = (msg) => {
    setEditingMessageId(msg._id);
    setEditingText(msg.message);
    setEditingFiles(Array.isArray(msg.files) ? msg.files : []);
    setEditingRemovedKeys(new Set());
    setEditingNewFiles([]);
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingText('');
    setEditingFiles([]);
    setEditingRemovedKeys(new Set());
    setEditingNewFiles([]);
  };

  const addValidatedEditFiles = (files) => {
    const keptCount = editingFiles.filter((f) => !editingRemovedKeys.has(f.filename) && !editingRemovedKeys.has(f.path)).length;
    const room = MAX_MESSAGE_ATTACHMENTS - keptCount - editingNewFiles.length;
    if (room <= 0) {
      setError(`You can attach up to ${MAX_MESSAGE_ATTACHMENTS} files per message`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    let runningTotal = editingNewFiles.reduce((sum, f) => sum + f.size, 0);
    const accepted = [];
    let rejected = false;
    for (const file of files) {
      if (accepted.length >= room) { rejected = true; break; }
      if (!MESSAGE_ATTACHMENT_TYPES.has(file.type)) { rejected = true; continue; }
      if (runningTotal + file.size > MAX_MESSAGE_TOTAL_BYTES) { rejected = true; break; }
      runningTotal += file.size;
      accepted.push(file);
    }
    if (accepted.length > 0) setEditingNewFiles((prev) => [...prev, ...accepted]);
    if (rejected) {
      setError(`Only PDF, DOC, and DOCX files are allowed, up to ${MAX_MESSAGE_ATTACHMENTS} files and 12MB combined`);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEditFileChange = (e) => {
    const files = Array.from(e.target.files);
    addValidatedEditFiles(files);
    e.target.value = '';
  };

  const handleRemoveEditNewFile = (index) => {
    setEditingNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleRemoveExistingEditFile = (file) => {
    const key = file.filename || file.path;
    if (!key) return;
    setEditingRemovedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const saveEditMessage = async (msg) => {
    const text = editingText.trim();
    const remainingKept = editingFiles.filter((f) => !editingRemovedKeys.has(f.filename) && !editingRemovedKeys.has(f.path));
    const hasChanges = text !== (msg.message || '') || editingRemovedKeys.size > 0 || editingNewFiles.length > 0;
    if (!hasChanges) {
      cancelEditMessage();
      return;
    }
    if (!text && remainingKept.length === 0 && editingNewFiles.length === 0) {
      setError('Message must have text or at least one attachment.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    try {
      const result = await editMessage(msg._id, text, {
        files: editingNewFiles,
        removeFiles: [...editingRemovedKeys],
      });
      if (result?.success === false) throw new Error(result.error || 'Failed to edit message');
      await loadThread();
      cancelEditMessage();
    } catch (err) {
      console.error('Error editing message:', err);
      setError('Failed to edit message. Please try again.');
    }
  };

  const requestDeleteMessage = (msg) => setDeleteConfirmMsg(msg);
  const cancelDeleteMessage = () => setDeleteConfirmMsg(null);

  const confirmDeleteMessage = async () => {
    const msg = deleteConfirmMsg;
    if (!msg) return;
    try {
      const result = await deleteMessage(msg._id);
      if (result?.success === false) throw new Error(result.error || 'Failed to delete message');
      setThread((prev) => prev.map((m) => (m._id === msg._id ? { ...m, deleted: true, message: '', files: [] } : m)));
      setDeleteConfirmMsg(null);
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Failed to delete message. Please try again.');
      setDeleteConfirmMsg(null);
    }
  };

  let lastDayKey = null;

  return (
    <div className="content-section msg-chat-section">
      <div className="msg-chat-header">
        <div className="sender-avatar msg-chat-avatar">A</div>
        <div className="msg-chat-header-info">
          <span className="msg-chat-header-name">UREB Administrator</span>
          <span className="msg-chat-header-sub">University Research Ethics Board</span>
        </div>
      </div>

      <div className="msg-chat-body">
        {threadLoading && <p className="msg-chat-status">Loading conversation...</p>}
        {!threadLoading && thread.length === 0 && (
          <p className="msg-chat-status">No messages yet. Send the admin a message to get started.</p>
        )}

        {!threadLoading && thread.map((msg) => {
          const dateVal = msg.createdAt || msg.sentAt;
          const dayKey = dateVal ? new Date(dateVal).toDateString() : null;
          const showSeparator = dayKey && dayKey !== lastDayKey;
          if (dayKey) lastDayKey = dayKey;
          const isOut = msg.type === 'reviewer_chat_to_admin';
          const canModify = isOut && !msg._pending && !msg._failed && !msg.deleted;
          const isEditing = editingMessageId === msg._id;

          return (
            <div key={msg._id}>
              {showSeparator && <div className="chat-day-separator"><span>{formatDaySeparator(dateVal)}</span></div>}
              <div className={`chat-bubble-row ${isOut ? 'out' : 'in'}`}>
                {canModify && !isEditing && (
                  <div className="chat-bubble-actions">
                    <button type="button" className="chat-bubble-action-btn" onClick={() => startEditMessage(msg)} title="Edit message">
                      <ChatEditIcon />
                    </button>
                    <button type="button" className="chat-bubble-action-btn" onClick={() => requestDeleteMessage(msg)} title="Delete message">
                      <TrashIcon />
                    </button>
                  </div>
                )}
                <div className={`chat-bubble ${isOut ? 'out' : 'in'} ${msg._failed ? 'failed' : ''} ${msg.deleted ? 'removed' : ''}`}>
                  {isEditing ? (
                    <div className="chat-bubble-edit">
                      <input
                        type="text"
                        className="chat-bubble-edit-input"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); saveEditMessage(msg); }
                          if (e.key === 'Escape') cancelEditMessage();
                        }}
                        autoFocus
                      />
                      {(editingFiles.length > 0 || editingNewFiles.length > 0) && (
                        <div className="chat-bubble-edit-files">
                          {editingFiles.map((file, i) => {
                            const key = file.filename || file.path;
                            const displayName = file.originalname || file.filename;
                            const removed = editingRemovedKeys.has(key);
                            return (
                              <span key={`existing-${i}`} className={`chat-bubble-edit-file-chip${removed ? ' removed' : ''}`}>
                                {displayName}
                                <button
                                  type="button"
                                  className="remove-file-btn"
                                  onClick={() => toggleRemoveExistingEditFile(file)}
                                  title={removed ? 'Keep file' : 'Remove file'}
                                >
                                  {removed ? '↺' : '×'}
                                </button>
                              </span>
                            );
                          })}
                          {editingNewFiles.map((file, i) => (
                            <span key={`new-${i}`} className="chat-bubble-edit-file-chip">
                              {file.name}
                              <button type="button" className="remove-file-btn" onClick={() => handleRemoveEditNewFile(i)}>×</button>
                            </span>
                          ))}
                        </div>
                      )}
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx"
                        id={`edit-attach-input-${msg._id}`}
                        style={{ display: 'none' }}
                        onChange={handleEditFileChange}
                      />
                      <div className="chat-bubble-edit-actions">
                        <button
                          type="button"
                          className="chat-bubble-edit-attach-btn"
                          title="Attach PDF, DOC, or DOCX"
                          onClick={() => document.getElementById(`edit-attach-input-${msg._id}`).click()}
                        >
                          <ChatPaperclipIcon />
                        </button>
                        <button type="button" className="chat-bubble-edit-cancel" onClick={cancelEditMessage}>Cancel</button>
                        <button type="button" className="chat-bubble-edit-save" onClick={() => saveEditMessage(msg)}>Save</button>
                      </div>
                    </div>
                  ) : msg.deleted ? (
                    <p className="chat-bubble-removed-text">
                      {isOut ? 'You removed this message' : 'This message was removed'}
                    </p>
                  ) : (
                    <>
                      <p>{msg.message}</p>
                      {Array.isArray(msg.files) && msg.files.length > 0 && (
                        <div className="chat-bubble-files">
                          {msg.files.map((file, i) => {
                            const storedName = file.filename || file.path;
                            const displayName = file.originalname || file.filename;
                            return (
                              <div key={i} className="chat-bubble-file">
                                <span className="chat-bubble-file-name" title={displayName}>{displayName}</span>
                                {!msg._pending && storedName && (
                                  <span className="chat-bubble-file-actions">
                                    <button type="button" className="chat-bubble-file-action" onClick={() => viewFile(storedName)}>View</button>
                                    <button type="button" className="chat-bubble-file-action" onClick={() => downloadReviewerFile(storedName, displayName)}>Download</button>
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <span className="chat-bubble-time">
                        {msg._pending ? 'Sending…' : msg._failed ? 'Failed to send' : formatBubbleTime(dateVal)}
                        {!msg._pending && !msg._failed && msg.edited ? ' · edited' : ''}
                        {isOut && !msg._pending && !msg._failed && (
                          <span className={`chat-bubble-status ${msg.read ? 'seen' : 'sent'}`}> · {msg.read ? 'Seen' : 'Sent'}</span>
                        )}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={threadEndRef} />
      </div>

      {error && <div className="chat-error-message">{error}</div>}

      {attachedFiles.length > 0 && (
        <div className="chat-composer-files">
          {attachedFiles.map((file, index) => (
            <span key={index} className="chat-composer-file-chip">
              {file.name}
              <button type="button" className="remove-file-btn" onClick={() => handleRemoveFile(index)}>×</button>
            </span>
          ))}
        </div>
      )}

      <div className="chat-composer">
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx"
          id="msg-reviewer-attach-input"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button
          type="button"
          className="chat-composer-attach-btn"
          title="Attach PDF, DOC, or DOCX"
          onClick={() => document.getElementById('msg-reviewer-attach-input').click()}
        >
          <ChatPaperclipIcon />
        </button>
        <input
          type="text"
          className="chat-composer-input"
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleInputKeyDown}
        />
        <button
          type="button"
          className="chat-composer-send-btn"
          onClick={handleSend}
          disabled={sending || (!messageText.trim() && attachedFiles.length === 0)}
        >
          <ChatSendIcon />
        </button>
      </div>

      {deleteConfirmMsg && (
        <div className="logout-modal-overlay" onClick={cancelDeleteMessage}>
          <div className="logout-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-header">
              <h2>Confirm Delete Message</h2>
            </div>
            <div className="logout-modal-body">
              <p>Are you sure you want to delete this message? This action cannot be undone.</p>
            </div>
            <div className="logout-modal-footer">
              <button className="logout-modal-btn-secondary" onClick={cancelDeleteMessage}>Cancel</button>
              <button className="logout-modal-btn-primary" onClick={confirmDeleteMessage}>Delete</button>
            </div>
          </div>
        </div>
      )}
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
            Let's Start
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
      case 'approved_no_revision':
      case 'approved_minor_revision':
      case 'approved_major_revision':
        return 'sr-decision--approved';
      case 'reject':
        return 'sr-decision--rejected';
      default:
        return 'sr-decision--pending';
    }
  };

  const getDecisionLabel = (decision) => {
    switch (decision) {
      case 'approved_no_revision':
        return 'Approved with no Revision';
      case 'approved_minor_revision':
        return 'Approved with minor Revision';
      case 'approved_major_revision':
        return 'Approved with Major revision';
      case 'reject':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  const getDecisionIcon = (decision) => {
    switch (decision) {
      case 'approved_no_revision':
      case 'approved_minor_revision':
      case 'approved_major_revision':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
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
    total: submittedReviews.length
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


// ── Reviewer Resubmission Content (mirrors the Researcher Resubmission Portal) ──
const RESUBMISSION_FILE_LABELS = {
  proposal: 'Proposal',
  approvalSheet: 'Approval Sheet',
  urebForm2: 'UREB Form 2',
  urebForm10B: 'UREB Form 10B',
  urebForm11: 'UREB Form 11',
  applicationForm6: 'Application for Research Ethics Review Form 6',
  accomplishedForm8: 'Accomplished Form 8',
  accomplishForm10A: 'Accomplish Form 10 A',
  copyOfInstrument: 'Copy of Instrument/Tool',
  ethicsReviewFee: 'Ethics Review Fee (Receipt)',
  form7: 'Form 7',
};

const getResubmissionFileLabel = (key) => {
  if (RESUBMISSION_FILE_LABELS[key]) return RESUBMISSION_FILE_LABELS[key];
  return String(key || 'Document').replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
};

const ResubmissionContent = ({ userInfo }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReviewId, setSelectedReviewId] = useState('');
  const [formFiles, setFormFiles] = useState({});
  const [resubmissionReason, setResubmissionReason] = useState('');
  const [uploading, setUploading] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState(null); // { type: 'success' | 'error', message }

  useEffect(() => {
    fetchReviews();
  }, [userInfo?.email]);

  const fetchReviews = async () => {
    if (!userInfo?.email) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getCompletedReviews(userInfo.email);
      const list = Array.isArray(data) ? data : [];
      setReviews(list);
      setSelectedReviewId((prev) => (prev && list.some((r) => String(r._id) === String(prev)) ? prev : (list[0]?._id || '')));
    } catch (err) {
      console.error('Error fetching reviews for resubmission:', err);
    } finally {
      setLoading(false);
    }
  };

  const normalizeProtocolCode = (code) => String(code || '').toUpperCase().replace(/\s+/g, '');

  const selectedReview = reviews.find((r) => String(r._id) === String(selectedReviewId)) || null;

  // A reviewer may submit a proposal review and later submit additional/secondary
  // files (e.g. via "Add Another File") as their own separate record. Gather every
  // record that shares the same Protocol Code so all of their files show up together.
  const groupKeyFor = (r) => (r?.protocolCode ? normalizeProtocolCode(r.protocolCode) : `id-${r?._id}`);
  const groupRecords = selectedReview
    ? reviews.filter((r) => groupKeyFor(r) === groupKeyFor(selectedReview))
    : [];

  const history = groupRecords
    .flatMap((r) => (Array.isArray(r.resubmissionHistory) ? r.resubmissionHistory : []))
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

  // Map each file field key to its file info + the specific record that owns it,
  // so a resubmitted replacement is written back to the correct original record.
  const fileKeyOwners = {};
  groupRecords.forEach((r) => {
    Object.entries(r.files || {}).forEach(([key, fileInfo]) => {
      fileKeyOwners[key] = { file: fileInfo, reviewId: r._id };
    });
  });
  const fileFieldKeys = Object.keys(fileKeyOwners);

  const handleReviewChange = (id) => {
    setSelectedReviewId(id);
    setFormFiles({});
    setResubmissionReason('');
  };

  const handleFileChange = (key, file) => {
    setFormFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReview) return;

    const changedEntries = Object.entries(formFiles).filter(([, f]) => f instanceof File);
    if (changedEntries.length === 0) {
      setFeedbackModal({ type: 'error', message: 'Please attach at least one updated file before resubmitting.' });
      return;
    }

    setUploading(true);
    try {
      // Files shown together for this Protocol Code may originally belong to different
      // underlying records (e.g. a later "Add Another File" secondary submission), so
      // send each file back to the specific record that actually owns that slot.
      const filesByReviewId = new Map();
      changedEntries.forEach(([key, file]) => {
        const ownerId = String(fileKeyOwners[key]?.reviewId || selectedReview._id);
        if (!filesByReviewId.has(ownerId)) filesByReviewId.set(ownerId, {});
        filesByReviewId.get(ownerId)[key] = file;
      });

      const results = await Promise.all(
        Array.from(filesByReviewId.entries()).map(([reviewId, files]) =>
          resubmitReview(reviewId, {
            reviewerEmail: userInfo?.email,
            reviewerName: userInfo?.name,
            resubmissionReason: resubmissionReason || 'Resubmitted updated review file',
            files,
          })
        )
      );
      const failed = results.find((r) => !r.success);

      if (!failed) {
        setFormFiles({});
        setResubmissionReason('');
        await fetchReviews();
        setFeedbackModal({ type: 'success', message: 'Your updated review has been resubmitted to the Admin.' });
      } else {
        setFeedbackModal({ type: 'error', message: failed.error || 'Failed to resubmit review.' });
      }
    } catch (err) {
      console.error('Error resubmitting review:', err);
      setFeedbackModal({ type: 'error', message: 'Failed to resubmit review. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const UploadIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );

  const FileIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );

  const DownloadIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );

  const renderFileInput = (key) => {
    const existingFile = fileKeyOwners[key]?.file;
    const label = getResubmissionFileLabel(key);

    return (
      <div className="form-group" key={key}>
        <label htmlFor={`resub-${key}`} className="form-label">{label}</label>
        {existingFile && !formFiles[key] && (
          <p className="rs-current-file">
            Current File: <strong>{existingFile.originalname || existingFile.filename}</strong>
          </p>
        )}
        <div className="rs-upload-area">
          <input
            type="file"
            id={`resub-${key}`}
            onChange={(e) => handleFileChange(key, e.target.files[0])}
            accept=".pdf,.doc,.docx,.txt"
          />
          <div className="rs-upload-label">
            <UploadIcon />
            <p>{formFiles[key] ? formFiles[key].name : 'Click to select replacement file'}</p>
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
        <p>Loading your submitted reviews...</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="content-section">
        <div className="rs-empty-state">
          <div className="rs-empty-icon"><ResubmissionIcon /></div>
          <h3>No Reviews Available for Resubmission</h3>
          <p>You haven't submitted any reviews yet. Once you submit a review under "Submit Review", you can manage resubmissions here anytime.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Resubmission Portal</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Resubmit updated review documents to the Admin cleanly.
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
            • Select the submitted review you want to update below.
          </p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e40af', fontWeight: '500' }}>
            • You may select only the specific files that require resubmission. Unchanged files can be left blank.
          </p>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="rs-review-select" className="form-label">Select Submitted Review</label>
        <select
          id="rs-review-select"
          className="rs-review-select"
          value={selectedReviewId}
          onChange={(e) => handleReviewChange(e.target.value)}
        >
          {reviews
            .filter((r, index) => index === reviews.findIndex((other) => groupKeyFor(other) === groupKeyFor(r)))
            .map((r) => (
              <option key={r._id} value={r._id}>
                {r.protocolCode ? `[${r.protocolCode}]` : (r.proposalTitle || 'Untitled')}
              </option>
            ))}
        </select>
      </div>

      {selectedReview && (
        <form className="add-files-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="resubmissionReason" className="form-label">Reason</label>
            <textarea
              id="resubmissionReason"
              value={resubmissionReason}
              onChange={(e) => setResubmissionReason(e.target.value)}
              placeholder="State the reason for this resubmission (e.g. corrected review comments, replaced wrong document)"
              rows={2}
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
            />
          </div>

          {fileFieldKeys.length > 0 ? (
            fileFieldKeys.map((key) => renderFileInput(key))
          ) : (
            renderFileInput('resubmissionFile')
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
                setFormFiles({});
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
            <h3 className="resub-history-title">Resubmission History Log</h3>
            <span className="resub-history-count-badge">
              {history.length} {history.length === 1 ? 'Entry' : 'Entries'}
            </span>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="resub-empty-state">
            <p style={{ margin: 0, fontWeight: '600', color: '#475569' }}>No resubmission history logged yet for this review.</p>
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
                {history.map((h, i) => {
                  const itemFiles = Object.entries(h.files || {}).map(([key, f]) => ({
                    key,
                    label: getResubmissionFileLabel(key),
                    filename: f.filename,
                    originalname: f.originalname || f.filename,
                  }));
                  return (
                    <tr key={i}>
                      <td>
                        <span className="resub-badge resub-badge--purple">
                          {h.label || (h.resubmissionNumber ? `Resubmission ${h.resubmissionNumber}` : `Resubmission ${i + 1}`)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#475569', whiteSpace: 'nowrap' }}>
                          {h.date ? new Date(h.date).toLocaleString() : 'N/A'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '240px' }}>
                        <span style={{ fontSize: '0.825rem', color: '#334155', display: 'block', wordBreak: 'break-word' }}>
                          {h.reason || 'Updated review file resubmitted'}
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
                                        onClick={() => setViewingFile({ filename: file.filename, originalname: file.originalname })}
                                      >
                                        <EyeIcon /> View
                                      </button>
                                      <button
                                        type="button"
                                        className="resub-action-btn resub-action-btn--download"
                                        title="Download Document"
                                        onClick={async () => {
                                          const result = await downloadReviewerFile(file.filename, file.originalname || file.filename);
                                          if (!result?.success) {
                                            alert(`Could not download "${file.originalname || file.filename}". The file may no longer be available.`);
                                          }
                                        }}
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
                          ✓ Sent to Admin
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

      {viewingFile && (
        <FileViewerModal
          viewingFile={viewingFile}
          onClose={() => setViewingFile(null)}
          onDownload={async () => {
            const result = await downloadReviewerFile(viewingFile.filename, viewingFile.originalname || viewingFile.filename);
            if (!result?.success) {
              alert(`Could not download "${viewingFile.originalname || viewingFile.filename}". The file may no longer be available.`);
            }
          }}
        />
      )}

      {feedbackModal && (
        <div className="logout-modal-overlay" onClick={() => setFeedbackModal(null)}>
          <div className="logout-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-header">
              <h2>{feedbackModal.type === 'success' ? 'Resubmission Successful' : 'Resubmission Failed'}</h2>
            </div>
            <div className="logout-modal-body">
              <p>{feedbackModal.message}</p>
            </div>
            <div className="logout-modal-footer">
              <button
                className="logout-modal-btn-primary"
                style={feedbackModal.type === 'error' ? { backgroundColor: '#dc2626' } : undefined}
                onClick={() => setFeedbackModal(null)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FileTemplatesContent = () => {
  const [viewingFile, setViewingFile] = useState(null);

  const templates = [
    {
      id: 2,
      name: 'Form 8 (A) — Checklist for Investigations',
      description: 'Checklist for investigations involving human participants.',
      filename: 'Form 8 (A) CHECKLIST FOR INVESTIGATIONS INVOLVING (3).docx',
      category: 'Review',
      color: '#0891b2',
    },
    {
      id: 1,
      name: 'Form 10 (A) — Informed Consent Form',
      description: 'Informed Consent Form for research participants.',
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
    Review: { bg: '#f0f9ff', text: '#0c4a6e', border: '#bae6fd' },
  };

  const DownloadIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );

  const ViewIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
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
                      href={`${import.meta.env.VITE_API_URL || ''}/api/templates/${encodeURIComponent(tpl.filename)}`}
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
          viewingFile={viewingFile}
          onClose={() => setViewingFile(null)}
          onDownload={() => {
            const link = document.createElement('a');
            link.href = `${import.meta.env.VITE_API_URL || ''}/api/templates/${encodeURIComponent(viewingFile.filename)}`;
            link.download = viewingFile.filename;
            link.click();
          }}
        />
      )}
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