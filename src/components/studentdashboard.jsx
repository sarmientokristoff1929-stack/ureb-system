import { useState, useEffect } from 'react';
import './studentdashboard.css';

// Icons as simple SVG components
const DashboardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const BellIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
);

const FilePlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="12" y1="18" x2="12" y2="12"/>
    <line x1="9" y1="15" x2="15" y2="15"/>
  </svg>
);

const HistoryIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M12 7v5l3 3"/>
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

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const ProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const MailIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const StudentDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedFiles, setSubmittedFiles] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('ureb_user');
    if (savedUser) {
      setUserInfo(JSON.parse(savedUser));
    }

    // Check if welcome modal has been shown in this login session
    const welcomeShown = sessionStorage.getItem('welcome_shown');
    if (welcomeShown) {
      setShowWelcomeModal(false);
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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon /> },
    { id: 'add-files', label: 'Add Files', icon: <FilePlusIcon /> },
    { id: 'messages', label: 'Messages', icon: <MailIcon /> },
    { id: 'history', label: 'History', icon: <HistoryIcon /> },
    { id: 'profile', label: 'Profile', icon: <ProfileIcon /> },
  ];

  // Handle tab changes and save to sessionStorage
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    sessionStorage.setItem('activeTab', tabId);
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent userInfo={userInfo} onTabChange={handleTabChange} />;
      case 'notifications':
        return <NotificationsContent />;
      case 'add-files':
        return <AddFilesContent setSubmittedFiles={setSubmittedFiles} setShowSuccessModal={setShowSuccessModal} />;
      case 'messages':
        return <MessagesContent userInfo={userInfo} />;
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
          <h2>Student Portal</h2>
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
            <div className="user-avatar">{userInfo?.name?.charAt(0).toUpperCase() || 'S'}</div>
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

// Content Components
const ProfileContent = ({ userInfo, setUserInfo, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState({
    firstName: '', middleName: '', lastName: '',
    studentId: '', department: '', program: '', gmail: '',
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

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/student/profile?email=${encodeURIComponent(userInfo.email)}`);
        const result = await response.json();
        if (result.success) {
          setStudentData(result.student);
          setEditedInfo({
            firstName: result.student.firstName || '',
            middleName: result.student.middleName || '',
            lastName: result.student.lastName || '',
            studentId: result.student.studentId || '',
            department: result.student.department || '',
            program: result.student.program || '',
            gmail: result.student.gmail || '',
          });
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
  }, [userInfo]);

  const getFullName = () => {
    if (!studentData) return userInfo?.name || 'Student';
    const parts = [studentData.firstName, studentData.middleName, studentData.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : (studentData.name || userInfo?.name || 'Student');
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
        studentId: studentData.studentId || '',
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
      const response = await fetch('http://localhost:5001/api/student/profile', {
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
          studentId: result.student.studentId,
          department: result.student.department,
          program: result.student.program,
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
    setPwdError('');
    if (!pwdData.current || !pwdData.newPwd || !pwdData.confirm) {
      setPwdError('All password fields are required.');
      return;
    }
    if (pwdData.newPwd !== pwdData.confirm) {
      setPwdError('New passwords do not match.');
      return;
    }
    if (pwdData.newPwd.length < 6) {
      setPwdError('New password must be at least 6 characters.');
      return;
    }
    setPwdLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/student/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userInfo.email, currentPassword: pwdData.current, newPassword: pwdData.newPwd }),
      });
      const result = await response.json();
      if (result.success) {
        setPwdSuccess('Password changed successfully.');
        setPwdData({ current: '', newPwd: '', confirm: '' });
        setShowPasswordForm(false);
        setTimeout(() => setPwdSuccess(''), 4000);
      } else {
        setPwdError(result.error || 'Failed to change password.');
      }
    } catch (err) {
      setPwdError('Failed to change password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (!deletePassword) { setDeleteError('Please enter your password to confirm.'); return; }
    setDeleteLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/student/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userInfo.email, password: deletePassword }),
      });
      const result = await response.json();
      if (result.success) {
        localStorage.removeItem('ureb_user');
        sessionStorage.removeItem('welcome_shown');
        onLogout();
      } else {
        setDeleteError(result.error || 'Failed to delete account.');
      }
    } catch (err) {
      setDeleteError('Failed to delete account.');
    } finally {
      setDeleteLoading(false);
    }
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

  return (
    <div className="sp-wrapper">

      {/* ── Hero Card ── */}
      <div className="sp-hero-card">
        <div className="sp-avatar">{initials}</div>
        <div className="sp-hero-info">
          <h2 className="sp-hero-name">{fullName}</h2>
          {studentData?.studentId && (
            <span className="sp-id-badge">ID&nbsp;{studentData.studentId}</span>
          )}
          <p className="sp-hero-email">{studentData?.gmail || userInfo?.email || '—'}</p>
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
              { label: 'Full Name',   value: fullName },
              { label: 'Student ID',  value: studentData?.studentId },
              { label: 'Department',  value: studentData?.department },
              { label: 'Program',     value: studentData?.program },
              { label: 'Gmail',       value: studentData?.gmail },
            ].map(({ label, value }) => (
              <div className="sp-info-row" key={label}>
                <span className="sp-info-label">{label}</span>
                <span className="sp-info-value">{value || <em className="sp-not-set">Not set</em>}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="sp-edit-form">
            <p className="sp-edit-hint">Update your personal information below.</p>

            <div className="sp-field-row sp-field-row--3">
              {[
                { id: 'sp-fn', key: 'firstName',  label: 'First Name',  ph: 'First name' },
                { id: 'sp-mn', key: 'middleName', label: 'Middle Name', ph: 'Middle name (optional)' },
                { id: 'sp-ln', key: 'lastName',   label: 'Last Name',   ph: 'Last name' },
              ].map(({ id, key, label, ph }) => (
                <div className="sp-field" key={key}>
                  <label htmlFor={id}>{label}</label>
                  <input id={id} type="text" value={editedInfo[key]}
                    onChange={e => setEditedInfo(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={ph} />
                </div>
              ))}
            </div>

            <div className="sp-field-row sp-field-row--2">
              <div className="sp-field">
                <label htmlFor="sp-sid">Student ID</label>
                <input id="sp-sid" type="text" value={editedInfo.studentId}
                  onChange={e => setEditedInfo(p => ({ ...p, studentId: e.target.value }))}
                  placeholder="e.g. 2023-00001" />
              </div>
              <div className="sp-field">
                <label htmlFor="sp-gmail">Gmail Address</label>
                <input id="sp-gmail" type="email" value={editedInfo.gmail}
                  onChange={e => setEditedInfo(p => ({ ...p, gmail: e.target.value }))}
                  placeholder="example@gmail.com" />
              </div>
            </div>

            <div className="sp-field-row sp-field-row--2">
              <div className="sp-field">
                <label htmlFor="sp-dept">Department</label>
                <input id="sp-dept" type="text" value={editedInfo.department}
                  onChange={e => setEditedInfo(p => ({ ...p, department: e.target.value }))}
                  placeholder="e.g. Faculty of Teacher Education" />
              </div>
              <div className="sp-field">
                <label htmlFor="sp-prog">Program</label>
                <input id="sp-prog" type="text" value={editedInfo.program}
                  onChange={e => setEditedInfo(p => ({ ...p, program: e.target.value }))}
                  placeholder="e.g. BS Computer Science" />
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
              <div className="sp-field">
                <label>Current Password</label>
                <input type="password" value={pwdData.current}
                  onChange={e => setPwdData(p => ({ ...p, current: e.target.value }))}
                  placeholder="Current password" />
              </div>
              <div className="sp-field">
                <label>New Password</label>
                <input type="password" value={pwdData.newPwd}
                  onChange={e => setPwdData(p => ({ ...p, newPwd: e.target.value }))}
                  placeholder="New password (min. 6 chars)" />
              </div>
              <div className="sp-field">
                <label>Confirm New Password</label>
                <input type="password" value={pwdData.confirm}
                  onChange={e => setPwdData(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="Repeat new password" />
              </div>
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

      {/* ── Danger Zone Card ── */}
      <div className="sp-card sp-card--danger">
        <div className="sp-card-header">
          <h3 className="sp-card-title sp-card-title--danger">Danger Zone</h3>
        </div>
        <div className="sp-danger-row">
          <div className="sp-danger-text">
            <p className="sp-danger-label">Delete Account</p>
            <p className="sp-danger-desc">
              Permanently remove your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <button className="sp-btn sp-btn--danger"
            onClick={() => { setShowDeleteModal(true); setDeleteError(''); setDeletePassword(''); }}>
            Delete Account
          </button>
        </div>
      </div>

      {/* ── Delete Confirm Modal ── */}
      {showDeleteModal && (
        <div className="sp-modal-overlay" onClick={() => !deleteLoading && setShowDeleteModal(false)}>
          <div className="sp-modal" onClick={e => e.stopPropagation()}>
            <div className="sp-modal-icon">⚠</div>
            <h3 className="sp-modal-title">Delete Your Account?</h3>
            <p className="sp-modal-desc">
              This will permanently delete your account and all your submitted research data.
              This action <strong>cannot</strong> be undone.
            </p>
            <div className="sp-field sp-modal-field">
              <label>Enter your password to confirm</label>
              <input type="password" value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                placeholder="Your current password" />
            </div>
            {deleteError && <div className="sp-banner sp-banner--error">{deleteError}</div>}
            <div className="sp-modal-actions">
              <button className="sp-btn sp-btn--danger" onClick={handleDeleteAccount} disabled={deleteLoading}>
                {deleteLoading ? 'Deleting…' : 'Yes, Delete My Account'}
              </button>
              <button className="sp-btn sp-btn--ghost"
                onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardContent = ({ userInfo, onTabChange }) => {
  const [stats, setStats] = useState({
    totalProposals: 0,
    pendingReviews: 0,
    approvedProposals: 0,
    notifications: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userInfo?.email) return;
      
      try {
        // Fetch real data from APIs
        const [proposalsResponse, reviewsResponse, notificationsResponse] = await Promise.all([
          fetch(`http://localhost:5001/api/proposals/student/${encodeURIComponent(userInfo.email)}`),
          fetch(`http://localhost:5001/api/reviews/student/${encodeURIComponent(userInfo.email)}`),
          fetch(`http://localhost:5001/api/messages/${encodeURIComponent(userInfo.email)}`)
        ]);

        // Check responses are OK before parsing
        if (!proposalsResponse.ok || !reviewsResponse.ok || !notificationsResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const proposalsData = await proposalsResponse.json();
        const reviewsData = await reviewsResponse.json();
        const notificationsData = await notificationsResponse.json();

        // Calculate actual stats
        const pendingReviews = reviewsData.filter(review => review.status === 'pending').length;
        const approvedProposals = proposalsData.filter(proposal => proposal.status === 'approved').length;
        const notificationsCount = notificationsData.filter(msg => msg.type === 'admin_to_student').length;

        setStats({
          totalProposals: proposalsData.length,
          pendingReviews: pendingReviews,
          approvedProposals: approvedProposals,
          notifications: notificationsCount
        });
        
        setProposals(proposalsData);
        setRecentActivity([]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set default values on error
        setStats({
          totalProposals: 0,
          pendingReviews: 0,
          approvedProposals: 0,
          notifications: 0
        });
        setRecentActivity([]);
        setProposals([]);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userInfo]);

  if (loading) {
    return (
      <div className="content-section">
        <h2>Dashboard</h2>
        <div className="loading-state">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
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
            <h3>{stats.pendingReviews}</h3>
            <p>Pending Reviews</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon approved">
            <DashboardIcon />
          </div>
          <div className="stat-info">
            <h3>{stats.approvedProposals}</h3>
            <p>Approved</p>
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
      
      <div className="dashboard-sections">
        <div className="up-section">
          <div className="up-header">
            <div>
              <h2 className="up-title">Uploaded Proposals</h2>
              <p className="up-subtitle">Track all your submitted research proposals</p>
            </div>
            {proposals.length > 0 && (
              <span className="up-count">{proposals.length} proposal{proposals.length !== 1 ? 's' : ''}</span>
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
          ) : (
            <div className="up-list">
              {proposals.map((proposal) => {
                const status = (proposal.status || 'Pending').toLowerCase();
                const fileCount = proposal.files ? Object.keys(proposal.files).length : 0;
                const submittedDate = new Date(proposal.createdAt || proposal.uploadDate || Date.now());
                return (
                  <div key={proposal._id} className={`up-card up-card--${status}`}>
                    <div className="up-card-accent" />
                    <div className="up-card-body">
                      <div className="up-card-top">
                        <div className="up-card-title-group">
                          <h3 className="up-card-title">{proposal.researchTitle || 'Untitled Proposal'}</h3>
                          <span className="up-card-id">#{proposal._id?.slice(-8) || 'N/A'}</span>
                        </div>
                        <span className={`up-status up-status--${status}`}>
                          {proposal.status || 'Pending'}
                        </span>
                      </div>

                      <div className="up-card-meta">
                        <div className="up-meta-item">
                          <span className="up-meta-label">Department</span>
                          <span className="up-meta-value up-dept">{proposal.department || 'N/A'}</span>
                        </div>
                        <div className="up-meta-item">
                          <span className="up-meta-label">Reviewer</span>
                          <span className="up-meta-value">{proposal.preliminaryReviewer || 'Not assigned'}</span>
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
                        <span className="up-files-chip">
                          <FileIcon />
                          {fileCount > 0 ? `${fileCount} file${fileCount !== 1 ? 's' : ''} attached` : 'No files'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const NotificationsContent = () => {
  const [notifications, setNotifications] = useState([]);

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  return (
    <div className="content-section">
      <h2>Notifications</h2>
      <div className="notifications-list">
        {notifications.length === 0 ? (
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
              <div className="notification-actions">
                {!notification.read && (
                  <button 
                    className="btn-secondary" 
                    onClick={() => markAsRead(notification.id)}
                  >
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

const DEPARTMENT_REVIEWERS = {
  FAIS: ['Helina Jean P. Dupa'],
  FALS: ['Henzel P. Bongas', 'Jefferson A. Centro', 'Harvy B. Desales'],
  FTED: ['Emellie D. Careña'],
  FBM: ['Gary L. Bastidan', 'Catharine G. Cabellero'],
  FCJE: ['Ruther P. Manaopanao', 'Jessa Mae P. Macapanas'],
  FACET: ['Rod Ryan B. Mendoza', 'Emmanuel B. Barbas'],
  SIEC: ['Lester B. Argawanon', 'Elven Bugwak', 'Hepsiva T. Albizo', 'Aldan G. Namis', 'Jenet Grace B. Fuentes'],
  FHUSOCOM: ['Renato Valdez'],
  BEC: ['Niel A. Mutia', 'Cherime P. Bautista', 'Jenny Lou A. Milagrosa'],
  CEC: ['Kevin P. Banudan', 'Judy Mae C. Apostol', 'Jhanny S. Bongo', 'Mary Ann Mabagod'],
  BGEC: ['Purisima N. Tampus', 'Jerel M. Menendez'],
  TEC: ['Aileen R. Artazo', 'Janennica Q. Manaytay'],
  FNAS: ['FNAS Reviewer 1', 'FNAS Reviewer 2'] // Temporary placeholder for FNAS
};

const AddFilesContent = ({ setSubmittedFiles, setShowSuccessModal }) => {
  const [formData, setFormData] = useState({
    proposal: null,
    approvalSheet: null,
    urebForm2: null,
    applicationForm6: null,
    accomplishedForm8: null,
    accomplishedForm10A: null,
    instrumentTool: null,
    ethicsReviewFee: null,
    preliminaryReviewer: '',
    department: '',
    proposalTitle: ''
  });
  const [uploading, setUploading] = useState(false);
  const [reviewers, setReviewers] = useState([]);
  const [loadingReviewers, setLoadingReviewers] = useState(true);

  // Fetch reviewers from database on component mount
  useEffect(() => {
    const fetchReviewers = async () => {
      try {
        const { getAllReviewers } = await import('../services/api.js');
        const reviewersData = await getAllReviewers();
        setReviewers(reviewersData);
      } catch (error) {
        console.error('Error fetching reviewers:', error);
        setReviewers([]);
      } finally {
        setLoadingReviewers(false);
      }
    };
    
    fetchReviewers();
  }, []);

  // Reviewers excluded from the preliminary reviewer dropdown
  const EXCLUDED_REVIEWERS = [
    'Dr. Emily S. Antonio',
    'Dr. Jeralyn N. Hemillan',
    'Dr. Rose Anelyn V. Ceniza',
    'Dr. Roselyn V. Regino',
    'Dr. Maria Gloria R. Lugo',
    'Prof. Djoanna S. Mama',
    'Dr. Sharmaine Anne C. Argawanon',
  ];

  // Filter reviewers based on selected department, excluding specific names
  const filteredReviewers = reviewers.filter(reviewer =>
    reviewer.department === formData.department && reviewer.role === 'reviewer'
  ).map(reviewer => ({
    name: reviewer.name || `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim(),
    email: reviewer.email || ''
  }))
  .filter(r => !EXCLUDED_REVIEWERS.includes(r.name) && r.email);

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

    // Check if at least one file is uploaded
    const hasFiles = Object.values(formData).some(value => value instanceof File);
    if (!hasFiles) {
      alert('Please upload at least one file');
      return;
    }

    setUploading(true);
    try {
      const savedUser = localStorage.getItem('ureb_user');
      const user = savedUser ? JSON.parse(savedUser) : null;

      const submitData = new FormData();
      // Append files
      const fileFields = ['proposal', 'approvalSheet', 'urebForm2', 'applicationForm6', 'accomplishedForm8', 'accomplishedForm10A', 'instrumentTool', 'ethicsReviewFee'];
      fileFields.forEach(field => {
        if (formData[field] instanceof File) {
          submitData.append(field, formData[field]);
        }
      });

      // Append text fields
      submitData.append('department', formData.department);
      submitData.append('preliminaryReviewer', formData.preliminaryReviewer); // email
      const selectedReviewerName = filteredReviewers.find(r => r.email === formData.preliminaryReviewer)?.name || '';
      submitData.append('preliminaryReviewerName', selectedReviewerName);
      submitData.append('proposalTitle', formData.proposalTitle);
      submitData.append('studentEmail', user?.email || '');
      submitData.append('studentName', user?.name || '');

      const response = await fetch('http://localhost:5001/api/student/submit-files', {
        method: 'POST',
        body: submitData
      });

      const result = await response.json();

      if (result.success) {
        // Collect submitted files for modal display
        const submittedFilesList = fileFields.filter(field => formData[field] instanceof File)
          .map(field => ({
            name: formData[field].name,
            size: (formData[field].size / 1024).toFixed(1) + ' KB'
          }));
        
        setSubmittedFiles(submittedFilesList);
        setShowSuccessModal(true);
        
        setFormData({
          proposal: null,
          approvalSheet: null,
          urebForm2: null,
          applicationForm6: null,
          accomplishedForm8: null,
          accomplishedForm10A: null,
          instrumentTool: null,
          ethicsReviewFee: null,
          preliminaryReviewer: '',
          department: '',
          proposalTitle: ''
        });
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
    <div className="form-group">
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
      <h2>Add Files</h2>
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

        {renderFileInput('proposal', 'Proposal')}
        {renderFileInput('approvalSheet', 'Approval Sheet')}
        {renderFileInput('urebForm2', 'UREB Form 2')}
        {renderFileInput('applicationForm6', 'Application for Research Ethics Review Form 6')}
        {renderFileInput('accomplishedForm8', 'Accomplished Form 8', 'See attached form and accomplish only applicable pages')}
        {renderFileInput('accomplishedForm10A', 'Accomplish Form 10 A', 'See attached form')}
        {renderFileInput('instrumentTool', 'Copy of instrument/tool', 'e.g. questionnaire that will be administered to participants, if study entails human participants. Provide a link if instrument is administered online')}
        {renderFileInput('ethicsReviewFee', 'Ethics Review Fee (Receipt)')}
        
        <div className="form-group">
          <label htmlFor="department">Department</label>
          <select
            id="department"
            value={formData.department}
            onChange={(e) => {
              handleInputChange('department', e.target.value);
              handleInputChange('preliminaryReviewer', '');
            }}
            required
          >
            <option value="">Select Department</option>
            <option value="FTED">FTED- Faculty of Teacher Education</option>
            <option value="FALS">FALS-Faculty of Agriculture and Life Science</option>
            <option value="FAIS">FAIS-Faculty of Advance and International Studies</option>
            <option value="FNAS">FNAS-Faculty of Nursing and Allied Health Science</option>
            <option value="FBM">FBM-Faculty of Business Management</option>
            <option value="FCJE">FCJE-Faculty of Criminology Justice Education</option>
            <option value="FACET">FACET-Faculty of Computing, Engineering, Technology</option>
            <option value="FHUSOCOM">FHUSOCOM-Faculty of Humanities, Social Science & Communication</option>
            <option value="SIEC">SIEC-San Isidro Campus</option>
            <option value="BEC">BEC-BanayBanay Extension Campus</option>
            <option value="CEC">CEC-Cateel Extension Campus</option>
            <option value="BGEC">BGEC-Baganga Extension Campus</option>
            <option value="TEC">TEC-Tarragona Extension Campus</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="preliminaryReviewer">Preliminary Reviewer</label>
          <select
            id="preliminaryReviewer"
            value={formData.preliminaryReviewer}
            onChange={(e) => handleInputChange('preliminaryReviewer', e.target.value)}
            required
          >
            <option value="">Select a reviewer</option>
            {loadingReviewers ? (
              <option value="" disabled>Loading reviewers...</option>
            ) : filteredReviewers.length > 0 ? (
              filteredReviewers.map((reviewer) => (
                <option key={reviewer.email} value={reviewer.email}>
                  {reviewer.name}
                </option>
              ))
            ) : (
              <option value="" disabled>No reviewers available for this department</option>
            )}
          </select>
        </div>

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
            onClick={() => {
              setFormData({
                proposal: null,
                approvalSheet: null,
                urebForm2: null,
                applicationForm6: null,
                accomplishedForm8: null,
                accomplishedForm10A: null,
                instrumentTool: null,
                ethicsReviewFee: null,
                preliminaryReviewer: '',
                department: '',
                proposalTitle: ''
              });
            }}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const MessagesContent = ({ userInfo }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!userInfo?.email) return;
      try {
        const response = await fetch(`http://localhost:5001/api/messages/${encodeURIComponent(userInfo.email)}`);
        const data = await response.json();
        const adminMessages = data
          .filter((m) => m.recipientEmail === userInfo.email && m.type === 'admin_to_student')
          .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
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
                      const storedName = getStoredFilename(file.path);
                      const downloadUrl = storedName
                        ? `http://localhost:5001/api/download/${storedName}?name=${encodeURIComponent(file.filename)}`
                        : null;
                      return (
                        <div key={i} className="sm-file-chip">
                          <FileIcon />
                          <span className="sm-file-name">{file.filename}</span>
                          <span className="sm-file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                          {downloadUrl && (
                            <a
                              href={downloadUrl}
                              download={file.filename}
                              className="sm-download-btn"
                              title="Download file"
                            >
                              <DownloadIcon />
                              Download
                            </a>
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
    </div>
  );
};

const HistoryContent = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Get user info from localStorage (using ureb_user like other parts of the app)
    const userData = JSON.parse(localStorage.getItem('ureb_user') || '{}');
    setUserInfo(userData);
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userInfo?.email) return;
      
      try {
        // Fetch student's proposals and reviews
        const [proposalsResponse, reviewsResponse] = await Promise.all([
          fetch(`http://localhost:5001/api/proposals/student/${encodeURIComponent(userInfo.email)}`),
          fetch(`http://localhost:5001/api/reviews/student/${encodeURIComponent(userInfo.email)}`)
        ]);

        // Check if responses are OK before parsing JSON
        if (!proposalsResponse.ok || !reviewsResponse.ok) {
          throw new Error('Server endpoints not available. Please restart the server.');
        }

        // Check if responses are JSON
        const proposalsContentType = proposalsResponse.headers.get('content-type');
        const reviewsContentType = reviewsResponse.headers.get('content-type');
        
        if (!proposalsContentType?.includes('application/json') || !reviewsContentType?.includes('application/json')) {
          throw new Error('Invalid server response. Please restart the server.');
        }

        const proposals = await proposalsResponse.json();
        const reviews = await reviewsResponse.json();

        // Combine and format activities
        const activities = [];

        // Add proposal submissions
        proposals.forEach(proposal => {
          activities.push({
            id: proposal._id,
            type: 'proposal',
            title: proposal.researchTitle || 'Untitled Proposal',
            action: 'Submitted research proposal',
            date: proposal.createdAt || proposal.submittedAt || new Date(),
            status: proposal.status || 'pending',
            details: {
              department: proposal.department || 'Unknown',
              abstract: 'Research proposal submitted for review'
            }
          });
        });

        // Add review submissions
        reviews.forEach(review => {
          activities.push({
            id: review._id,
            type: 'review',
            title: review.proposalTitle || 'Research Proposal',
            action: `Submitted file for review`,
            date: review.createdAt || review.submittedAt,
            status: review.status || 'pending',
            details: {
              reviewer: review.reviewerName || review.reviewerEmail,
              files: review.files ? Object.keys(review.files).length : 0,
              feedback: review.feedback ? 'Feedback provided' : 'No feedback yet'
            }
          });
        });

        // Sort by date (most recent first)
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        setHistory(activities);
      } catch (error) {
        console.error('Error fetching history:', error);
        // Don't set error state, just log it and show empty state
      } finally {
        setLoading(false);
      }
    };

    if (userInfo) {
      fetchHistory();
    }
  }, [userInfo]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown date';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      case 'completed':
        return '#10b981';
      case 'in_review':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'proposal':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        );
      case 'review':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
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
        {history.length > 0 && (
          <span className="sm-count-badge">{history.length} activities</span>
        )}
      </div>

      {history.length === 0 ? (
        <div className="sm-empty">
          <div className="sm-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h3>No activity yet</h3>
          <p>When you submit proposals or files, your activity will appear here.</p>
        </div>
      ) : (
        <div className="sm-timeline">
          {history.map((activity, index) => (
            <div key={activity.id} className="sm-timeline-item">
              <div className="sm-timeline-marker" style={{ color: getStatusColor(activity.status) }}>
                {getStatusIcon(activity.type)}
              </div>
              
              <div className="sm-timeline-content">
                <div className="sm-timeline-header">
                  <div>
                    <h4 className="sm-timeline-title">{activity.title}</h4>
                    <p className="sm-timeline-action">{activity.action}</p>
                  </div>
                  <div className="sm-timeline-meta">
                    <span className="sm-timeline-date">{formatDate(activity.date)}</span>
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
    </div>
  );
};

const WelcomeModal = ({ firstName, onClose }) => {
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
          <p>We're excited to have you here. Explore features, manage your account, and get started on achieving your goals today</p>
          <button className="welcome-close-btn" onClick={onClose}>
            Let's Started
          </button>
        </div>
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

const SuccessModal = ({ onClose, submittedFiles }) => {
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