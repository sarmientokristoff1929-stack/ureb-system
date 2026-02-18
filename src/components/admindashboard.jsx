import { useState, useEffect, useRef } from 'react';

import './admindashboard.css';
import './AddAdminModal.css';



// Helper to format reviewer name with title prefix/suffix
const formatReviewerName = (reviewer) => {
  const firstName = reviewer.firstName || '';
  const middleName = reviewer.middleName || '';
  const lastName = reviewer.lastName || '';
  const title = reviewer.title || '';

  const baseName = [firstName, middleName, lastName].filter(Boolean).join(' ');
  const fallbackName = reviewer.name || baseName;

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

  // Suffix titles: RN, LPT, MSN, RN/LPT, RN/MSN
  if (title === 'RN' || title === 'LPT' || title === 'MSN' || title === 'RN/LPT' || title === 'RN/MSN') {
    // Check if name already ends with the title to avoid duplication
    if (fallbackName.endsWith(', ' + title)) {
      return fallbackName;
    }
    return `${fallbackName}, ${title}`;
  }

  return fallbackName;
};

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

    <rect x="3" y="3" width="7" height="7"/>

    <rect x="14" y="3" width="7" height="7"/>

    <rect x="14" y="14" width="7" height="7"/>

    <rect x="3" y="14" width="7" height="7"/>

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



const UserPlusIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>

    <circle cx="8.5" cy="7" r="4"/>

    <line x1="20" y1="8" x2="20" y2="14"/>

    <line x1="23" y1="11" x2="17" y2="11"/>

  </svg>

);



const AssignIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>

    <circle cx="9" cy="7" r="4"/>

    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>

    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>

  </svg>

);



const UsersIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>

    <circle cx="9" cy="7" r="4"/>

    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>

    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>

  </svg>

);



const LogOutIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>

    <polyline points="16 17 21 12 16 7"/>

    <line x1="21" y1="12" x2="9" y2="12"/>

  </svg>

);



const ShieldIcon = () => (

  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>

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

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
    <path d="M2 2l20 20"/>
  </svg>
);



const NotificationIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>

    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>

  </svg>

);



const MessageIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>

    <polyline points="22,6 12,13 2,6"/>

  </svg>

);

const ReviewsIcon = () => (

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>

    <polyline points="14,2 14,8 20,8"/>

    <line x1="16" y1="13" x2="8" y2="13"/>

    <line x1="16" y1="17" x2="8" y2="17"/>

    <polyline points="10,9 9,9 8,9"/>

  </svg>

);

const SearchIcon = () => (

  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <circle cx="11" cy="11" r="8"/>

    <path d="m21 21-4.35-4.35"/>

  </svg>

);



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
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

  // Load user info from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('ureb_user');
    if (savedUser) {
      setUserInfo(JSON.parse(savedUser));
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



  const menuItems = [

    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },

    { id: 'assign-file', label: 'Assign File', icon: <AssignIcon /> },

    { id: 'message-researcher', label: 'Message Student', icon: <MessageIcon /> },

    { id: 'add-reviewer', label: 'Add Reviewer', icon: <UserPlusIcon /> },

    { id: 'manage-users', label: 'Manage Users', icon: <UsersIcon /> },

    { id: 'notification', label: 'Notification (File)', icon: <NotificationIcon /> },

    { id: 'reviews-file', label: 'Reviews File', icon: <ReviewsIcon /> },

    { id: 'messages-inbox', label: 'Messages Inbox', icon: <MessageIcon /> },

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



  const renderContent = () => {

    switch (activeTab) {

      case 'dashboard':

        return <DashboardContent />;

      case 'add-reviewer':

        return <AddReviewerContent />;

      case 'assign-file':

        return <AssignFileContent />;

      case 'message-researcher':

        return <MessageResearcherContent />;

      case 'manage-users':

        return <ManageUsersContent />;

      case 'notification':

        return <NotificationContent setActiveTab={setActiveTab} />;

      case 'reviews-file':

        return <ReviewsFileContent />;

      case 'messages-inbox':

        return <MessagesInboxContent />;

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

            <ShieldIcon />

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

              onClick={() => setActiveTab(item.id)}

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

            <div className="user-avatar">{userInfo.name.charAt(0).toUpperCase()}</div>

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

    activeReviewers: 0

  });

  const [recentActivity, setRecentActivity] = useState([]);

  const [activityLoading, setActivityLoading] = useState(true);



  useEffect(() => {

    // Fetch dashboard stats from API

    const fetchStats = async () => {

      try {

        const { getDashboardStats } = await import('../services/api.js');

        const statsData = await getDashboardStats();

        setStats(statsData);

      } catch (error) {

        console.error('Error fetching stats:', error);

      }

    };

    

    fetchStats();

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

          .sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate))

          .slice(0, 5)

          .map(proposal => ({

            type: 'proposal',

            title: 'New Proposal Submitted',

            description: `${proposal.protocolCode}: "${proposal.title}"`,

            timestamp: proposal.submissionDate,

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

        <div className="stat-card">

          <div className="stat-icon pending">

            <DashboardIcon />

          </div>

          <div className="stat-info">

            <h3>{stats.pendingReviews}</h3>

            <p>Pending Review</p>

          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon approved">

            <ShieldIcon />

          </div>

          <div className="stat-info">

            <h3>{stats.approved}</h3>

            <p>Approved</p>

          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon reviewers">

            <UsersIcon />

          </div>

          <div className="stat-info">

            <h3>{stats.activeReviewers}</h3>

            <p>Active Reviewers</p>

          </div>

        </div>

      </div>

      

      <div className="dashboard-search">

        <div className="search-bar">

          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

            <circle cx="11" cy="11" r="8"/>

            <path d="m21 21-4.35-4.35"/>

          </svg>

          <input

            type="text"

            placeholder="Search proposals, reviewers, or activities..."

            value={searchQuery}

            onChange={(e) => setSearchQuery(e.target.value)}

          />

        </div>

      </div>

      

      <div className="dashboard-sections">

        <div className="recent-activity">

          <h2>Recent Activity</h2>

          <div className="activity-list">

            {activityLoading ? (

              <div className="activity-item" style={{justifyContent: 'center', padding: '2rem'}}>

                <p style={{color: 'var(--text-medium)'}}>Loading activity...</p>

              </div>

            ) : recentActivity.length === 0 ? (

              <div className="activity-item" style={{justifyContent: 'center', padding: '2rem'}}>

                <p style={{color: 'var(--text-medium)'}}>No recent activity</p>

              </div>

            ) : (

              recentActivity.map((activity, index) => (

                <div key={index} className="activity-item">

                  <div className="activity-icon">

                    {activity.icon === 'FilePlus' ? <FilePlusIcon /> : <DashboardIcon />}

                  </div>

                  <div className="activity-content">

                    <h4>{activity.title}</h4>

                    <p>{activity.description}</p>

                    <span className="activity-time">

                      {new Date(activity.timestamp).toLocaleDateString()} • {new Date(activity.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}

                    </span>

                  </div>

                </div>

              ))

            )}

          </div>

        </div>

        

        <div className="quick-actions">

          <h2>Quick Actions</h2>

          <div className="action-buttons">

            <button className="action-btn primary" onClick={openPendingProposalsModal}>Review Pending Proposals</button>

            <button className="action-btn secondary" onClick={openGenerateReportModal}>Generate Report</button>

            <button className="action-btn secondary">Send Reminders</button>

            <button className="action-btn secondary" onClick={openReviewerModal}>View Reviewer Submissions</button>

            <button className="action-btn secondary" onClick={openStudentModal}>Student Submissions</button>

          </div>

        </div>

      </div>

      

      <ViewReviewerSubmissionsModal isOpen={isReviewerModalOpen} onClose={closeReviewerModal} />

      <StudentSubmissionsModal isOpen={isStudentModalOpen} onClose={closeStudentModal} />

      <PendingProposalsModal isOpen={isPendingProposalsModalOpen} onClose={closePendingProposalsModal} />

      <GenerateReportModal isOpen={isGenerateReportModalOpen} onClose={closeGenerateReportModal} />

    </div>

  );
};



const AddReviewerContent = () => {
  // Initialize state with localStorage data if available
  const getInitialFormData = () => {
    const savedFormData = localStorage.getItem('addReviewerForm');
    if (savedFormData) {
      try {
        return JSON.parse(savedFormData);
      } catch (error) {
        console.error('Error parsing saved form data:', error);
        localStorage.removeItem('addReviewerForm');
      }
    }
    return {
      firstName: '',
      middleName: '',
      lastName: '',
      title: '',
      email: '',
      password: '',
      department: ''
    };
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
      'FALS', 'FTED', 'FAIS', 'FNAS', 'FBM', 'FCJE', 'FACET',
      'FHUSOCOM', 'SEIC', 'BEC', 'CEC', 'BGEC', 'TEC', 
      'NSTP', 'ICS', 'Community Representatives'
    ];
    if (!validDepartments.includes(formData.department)) {
      setErrorMessage('Please select a valid department from the list.');
      setShowErrorModal(true);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/users/detailed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          middleName: formData.middleName || '',
          lastName: formData.lastName,
          title: formData.title || '',
          email: formData.email,
          password: formData.password,
          role: 'reviewer',
          department: formData.department
        }),
      });

      if (response.ok) {
        setFormData({
          firstName: '',
          middleName: '',
          lastName: '',
          title: '',
          email: '',
          password: '',
          department: ''
        });
        localStorage.removeItem('addReviewerForm');
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to add reviewer');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error adding reviewer:', error);
      setErrorMessage('Error adding reviewer. Please try again.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Clear form and localStorage
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      title: '',
      email: '',
      password: '',
      department: ''
    });
    localStorage.removeItem('addReviewerForm');
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
              <label>Department</label>
              <select 
                name="department"
                value={formData.department}
                onChange={handleInputChange}
              >
                <option value="">Select Department</option>
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
              <h3>Email Already Exists</h3>
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



const AssignFileContent = () => {
  // Initialize state with localStorage data if available
  const getInitialFormData = () => {
    const savedFormData = localStorage.getItem('assignFileForm');
    if (savedFormData) {
      try {
        return JSON.parse(savedFormData);
      } catch (error) {
        console.error('Error parsing saved form data:', error);
        localStorage.removeItem('assignFileForm');
      }
    }
    return {
      protocolCode: '',
      reviewerUsername: '',
      startDate: '',
      endDate: '',
      files: []
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviewers, setReviewers] = useState([]);
  const [reviewersLoading, setReviewersLoading] = useState(true);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('assignFileForm', JSON.stringify(formData));
  }, [formData]);

  // Fetch reviewers on component mount
  useEffect(() => {
    const fetchReviewers = async () => {
      try {
        const { getAllUsers } = await import('../services/api.js');
        const userList = await getAllUsers();
        // Filter only reviewers
        const reviewerUsers = userList.filter(user => user.role === 'reviewer');
        setReviewers(reviewerUsers);
      } catch (error) {
        console.error('Error fetching reviewers:', error);
      } finally {
        setReviewersLoading(false);
      }
    };
    fetchReviewers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const errors = {};
    if (!formData.protocolCode.trim()) errors.protocolCode = 'Protocol Code is required';
    if (!formData.reviewerUsername.trim()) errors.reviewerUsername = 'Reviewer Username is required';
    if (!formData.startDate) errors.startDate = 'Start Date is required';
    if (!formData.endDate) errors.endDate = 'End Date is required';
    if (files.length === 0) errors.files = 'At least one file must be uploaded';
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors({});
    setLoading(true);
    
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add form fields
      formDataToSend.append('protocolCode', formData.protocolCode);
      formDataToSend.append('reviewerUsername', formData.reviewerUsername);
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('endDate', formData.endDate);
      
      // Add files
      files.forEach((file, index) => {
        formDataToSend.append(`file${index}`, file);
      });
      
      // Import and call API
      const { assignFileToReviewer } = await import('../services/api.js');
      const result = await assignFileToReviewer(formDataToSend);
      
      if (result.success) {
        setIsSuccessModalOpen(true);
        // Reset form
        setFormData({
          protocolCode: '',
          reviewerUsername: '',
          startDate: '',
          endDate: '',
          files: []
        });
        setFiles([]);
        localStorage.removeItem('assignFileForm');
      } else {
        setIsSuccessModalOpen(true);
      }
    } catch (error) {
      console.error('Error assigning file:', error);
      setIsSuccessModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Clear form and localStorage
    setFormData({
      protocolCode: '',
      reviewerUsername: '',
      startDate: '',
      endDate: '',
      files: []
    });
    setFiles([]);
    localStorage.removeItem('assignFileForm');
  };

  return (
    <div className="form-content full-width">
      <div className="form-card">
        <h2>Assign Files to Reviewer</h2>
        <form className="assign-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Protocol Code </label>
            <input 
              type="text" 
              name="protocolCode"
              placeholder="e.g., UREB-2026-001" 
              value={formData.protocolCode}
              onChange={handleInputChange}
              required
            />
            {validationErrors.protocolCode && <span className="error-text">{validationErrors.protocolCode}</span>}
          </div>
          <div className="form-group">
            <label>Reviewer Username </label>
            <select 
              name="reviewerUsername"
              value={formData.reviewerUsername}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Reviewer</option>
              {reviewersLoading ? (
                <option>Loading reviewers...</option>
              ) : (
                reviewers.map(reviewer => (
                  <option key={reviewer.id} value={reviewer.username}>
                    {formatReviewerName(reviewer)} ({reviewer.username})
                  </option>
                ))
              )}
            </select>
            {validationErrors.reviewerUsername && <span className="error-text">{validationErrors.reviewerUsername}</span>}
          </div>
          <div className="form-group">
            <label>Review Period (Philippine Time) </label>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input 
                  type="date" 
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
                {validationErrors.startDate && <span className="error-text">{validationErrors.startDate}</span>}
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input 
                  type="date" 
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                />
                {validationErrors.endDate && <span className="error-text">{validationErrors.endDate}</span>}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Upload Files</label>
            <div className="file-upload-area">
              <input 
                type="file" 
                multiple
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt"
                style={{ display: 'none' }}
                id="file-upload"
              />
              <div className="file-upload-label" onClick={() => document.getElementById('file-upload').click()}>
                <FilePlusIcon />
                <p>Click to upload files or drag and drop</p>
                <span>PDF, DOC, DOCX, TXT (MAX. 10MB per file)</span>
              </div>
            </div>
            {validationErrors.files && <span className="error-text">{validationErrors.files}</span>}
          </div>
          
          {files.length > 0 && (
            <div className="uploaded-files">
              <h4>Selected Files:</h4>
              <ul>
                {files.map((file, index) => (
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
          
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Assigning...' : 'Assign Files'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleCancel}>Cancel</button>
          </div>
        </form>
      </div>
      
      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container small">
            <div className="modal-header">
              <h2>Assignment Status</h2>
            </div>
            <div className="modal-body">
              <p>Files have been successfully assigned to the reviewer!</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-primary" 
                onClick={() => setIsSuccessModalOpen(false)}
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

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/students');
        const data = await response.json();
        setStudents(data);
        setFilteredStudents(data);
      } catch (error) {
        console.error('Error fetching students:', error);
        setError('Failed to fetch students');
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
      const studentId = (student.studentId || '').toLowerCase();
      
      return name.includes(searchLower) || 
             email.includes(searchLower) || 
             department.includes(searchLower) ||
             studentId.includes(searchLower);
    });

    setFilteredStudents(filtered);
  }, [students, searchQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent || !message) {
      setError('Please select a student and enter a message');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('studentEmail', selectedStudent);
      formDataToSend.append('message', message);
      
      // Add files
      attachedFiles.forEach((file, index) => {
        formDataToSend.append(`file${index}`, file);
      });

      const response = await fetch('http://localhost:5001/api/send-message-to-student', {
        method: 'POST',
        body: formDataToSend,
      });

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Message sending endpoint not found. Please restart the server.');
        } else if (response.status === 500) {
          throw new Error('Server error occurred while sending message.');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      // Check if response content type is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid server response. Please restart the server.');
      }

      const result = await response.json();
      
      if (result.success) {
        setSuccess(`Message sent successfully to ${result.recipientName || 'student'}!`);
        setSelectedStudent('');
        setMessage('');
        setAttachedFiles([]);
      } else {
        setError(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Handle different types of errors
      if (error.message.includes('SyntaxError') || error.message.includes('<!DOCTYPE')) {
        setError('Server returned invalid response. Please restart the server and try again.');
      } else if (error.message.includes('404') || error.message.includes('endpoint not found')) {
        setError('Message sending feature not available. Please restart the server to load the new endpoint.');
      } else if (error.message.includes('Failed to fetch')) {
        setError('Cannot connect to server. Please check if the server is running.');
      } else {
        setError(error.message || 'Failed to send message');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachedFiles(prev => [...prev, ...files]);
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
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/jpg', 'image/png'];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB limit
    });
    
    if (validFiles.length > 0) {
      setAttachedFiles(prev => [...prev, ...validFiles]);
    }
    
    if (validFiles.length !== files.length) {
      setError('Some files were invalid or too large and were not added');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="form-content full-width">
      <div className="form-card">
        <h2>Message Student</h2>
        <form className="message-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Student</label>
            <div className="student-selector">
              <div className="student-controls">
                <input
                  type="text"
                  placeholder="Search by name, email, department, or student ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="student-search"
                />
              </div>
              
              {searchQuery && (
                <div className="search-results-info">
                  Found <span className="results-count">{filteredStudents.length}</span> students matching "{searchQuery}"
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
                      ? 'No students found - adjust your search' 
                      : `Select a student (${filteredStudents.length} available)`
                    }
                  </option>
                  {filteredStudents.map((student) => (
                    <option key={student._id} value={student.email}>
                      {student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email}
                      {student.department && ` - ${student.department}`}
                      {student.studentId && ` - ${student.studentId}`}
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
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                id="message-file-upload"
              />
              <div className="file-upload-label">
                <FilePlusIcon />
                <p>{isDragOver ? 'Drop files here' : 'Click to upload files or drag and drop'}</p>
                <span>PDF, DOC, DOCX, TXT, JPG, PNG (MAX. 10MB per file)</span>
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
          {success && <div className="success-message">{success}</div>}

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
    </div>
  );
};

const ManageUsersContent = () => {

  const [users, setUsers] = useState([]);

  const [reviewers, setReviewers] = useState([]);

  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('admins');

  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);

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

  // Search and sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const openAddAdminModal = () => setIsAddAdminModalOpen(true);

  const closeAddAdminModal = () => setIsAddAdminModalOpen(false);

  // Edit handlers
  const handleEdit = (user, userType) => {
    setEditingUser({ ...user, userType });
    setEditFormData({
      firstName: user.firstName || '',
      middleName: user.middleName || '',
      lastName: user.lastName || '',
      title: user.title || '',
      name: user.name || '',
      email: user.email || '',
      department: user.department || '',
      role: user.role || '',
      studentId: user.studentId || '',
      program: user.program || ''
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    setEditFormData({});
  };

  const closeEditSuccessModal = () => {
    setIsEditSuccessModalOpen(false);
  };

  const closeEditErrorModal = () => {
    setIsEditErrorModalOpen(false);
    setEditErrorMessage('');
  };

  const closeDeleteSuccessModal = () => {
    setIsDeleteSuccessModalOpen(false);
  };

  const closeDeleteErrorModal = () => {
    setIsDeleteErrorModalOpen(false);
    setDeleteErrorMessage('');
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
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

  const confirmDelete = async () => {
    if (!deletingUser) return;

    try {
      const { deleteUser, deleteReviewer, deleteStudent } = await import('../services/api.js');
      let result;

      if (deletingUser.userType === 'admin') {
        result = await deleteUser(deletingUser._id);
      } else if (deletingUser.userType === 'reviewer') {
        result = await deleteReviewer(deletingUser._id);
      } else if (deletingUser.userType === 'student') {
        result = await deleteStudent(deletingUser._id);
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
        
        closeDeleteModal();
        setIsDeleteSuccessModalOpen(true);
      } else {
        setDeleteErrorMessage(result.error || 'Failed to delete user');
        setIsDeleteErrorModalOpen(true);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setDeleteErrorMessage('Error deleting user. Please try again.');
      setIsDeleteErrorModalOpen(true);
    }
  };

  const tabs = [
    { id: 'admins', label: 'Admin' },
    { id: 'reviewers', label: 'Reviewer' },
    { id: 'students', label: 'Students' }
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
    let filteredData = data;

    // Search functionality
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredData = filteredData.filter(item => {
        if (type === 'reviewer') {
          return (
            (item.firstName && item.firstName.toLowerCase().includes(query)) ||
            (item.lastName && item.lastName.toLowerCase().includes(query)) ||
            (item.department && item.department.toLowerCase().includes(query)) ||
            (item.name && item.name.toLowerCase().includes(query))
          );
        } else if (type === 'student') {
          return (
            (item.firstName && item.firstName.toLowerCase().includes(query)) ||
            (item.lastName && item.lastName.toLowerCase().includes(query)) ||
            (item.department && item.department.toLowerCase().includes(query)) ||
            (item.name && item.name.toLowerCase().includes(query))
          );
        } else {
          return (
            (item.name && item.name.toLowerCase().includes(query)) ||
            (item.email && item.email.toLowerCase().includes(query))
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
                        new Date(user.lastLogin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
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
                        <span style={{color: '#636e72', fontSize: '0.85rem', fontStyle: 'italic'}}>No actions available</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        );

      case 'reviewers':
        const filteredReviewers = filterAndSortData(reviewers, 'reviewer');
        return (
          <div>
            {/* Search and Sort Controls */}
            <div className="search-sort-controls" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
                  title="Sort by Department"
                >
                  Department {sortBy === 'department' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>
            
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Created Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviewers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-medium)' }}>
                      No reviewers found.
                    </td>
                  </tr>
                ) : (
                  filteredReviewers.map((reviewer, index) => (
                    <tr key={index}>
                      <td>{formatReviewerName(reviewer)}</td>
                      <td>{reviewer.email}</td>
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
        const filteredStudents = filterAndSortData(students, 'student');
        return (
          <div>
            {/* Search and Sort Controls */}
            <div className="search-sort-controls" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
                  title="Sort by Department"
                >
                  Department {sortBy === 'department' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>
            
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Student ID</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Program</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-medium)' }}>
                      No students found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => (
                    <tr key={index}>
                      <td>{student.name || `${student.firstName} ${student.lastName}`}</td>
                      <td>{student.studentId}</td>
                      <td>{student.email}</td>
                      <td>{student.department}</td>
                      <td>{student.program}</td>
                      <td>
                        <span className="status-badge active">Active</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-secondary" onClick={() => handleEdit(student, 'student')}>Edit</button>
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
        <button className="btn-primary" onClick={openAddAdminModal}>Add Admin</button>
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

      <AddAdminModal 
        isOpen={isAddAdminModalOpen} 
        onClose={closeAddAdminModal} 
        onAdminAdded={() => {
          closeAddAdminModal();
          // Refresh users list
          const fetchUsers = async () => {
            try {
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
            } catch (error) {
              console.error('Error fetching users:', error);
            }
          };
          fetchUsers();
        }} 
      />

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Edit {editingUser?.userType === 'admin' ? 'Admin' : editingUser?.userType === 'reviewer' ? 'Reviewer' : 'Student'}</h2>
              <button className="modal-close" onClick={closeEditModal}>
                <XIcon />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="admin-form">
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

              {editingUser?.userType === 'reviewer' && (
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
                  </select>
                </div>
              )}

              {editingUser?.userType === 'student' && (
                <div className="form-group">
                  <label>Student ID</label>
                  <input
                    type="text"
                    name="studentId"
                    value={editFormData.studentId || ''}
                    onChange={handleEditInputChange}
                  />
                </div>
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
                <label>Department</label>
                <select
                  name="department"
                  value={editFormData.department || ''}
                  onChange={handleEditInputChange}
                  required
                >
                  <option value="">Select Department</option>
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
                </select>
              </div>

              {editingUser?.userType === 'student' && (
                <div className="form-group">
                  <label>Program</label>
                  <input
                    type="text"
                    name="program"
                    value={editFormData.program || ''}
                    onChange={handleEditInputChange}
                  />
                </div>
              )}

              {editingUser?.userType === 'admin' && (
                <div className="form-group">
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

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="logout-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeDeleteModal()}>
          <div className="logout-modal-container">
            <div className="logout-modal-header">
              <h2>Confirm Delete</h2>
            </div>
            <div className="logout-modal-body">
              <p>Are you sure you want to delete this {deletingUser?.userType}?</p>
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
                Delete {deletingUser?.userType}
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
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
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
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
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
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
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
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
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

const AddAdminModal = ({ isOpen, onClose, onAdminAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          role: 'admin'
        }),
      });

      if (response.ok) {
        setFormData({ name: '', email: '', password: '' });
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json();
        console.error('Error adding admin:', errorData);
        alert(`Error: ${errorData.error || 'Failed to add admin'}`);
      }
    } catch (error) {
      console.error('Error adding admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="add-admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="add-admin-modal-container">
        <button className="add-admin-modal-close" onClick={onClose} aria-label="Close modal">
          <XIcon />
        </button>
        <div className="add-admin-modal-header">
          <h2>Add Admin Account</h2>
        </div>
        <div className="add-admin-modal-body">
          <form onSubmit={handleSubmit} className="add-admin-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            <div className="add-admin-modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Adding...' : 'Add Admin'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="admin-success-modal-overlay">
          <div className="admin-success-modal-container">
            <div className="admin-success-content">
              <div className="admin-success-checkmark">✓</div>
              <h3>Admin Added Successfully!</h3>
              <p>The new administrator account has been created successfully.</p>
              <button 
                className="admin-success-close-btn" 
                onClick={() => {
                  setShowSuccessModal(false);
                  onAdminAdded();
                }}
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


const NotificationContent = ({ setActiveTab }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/notifications');
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await fetch(`http://localhost:5001/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('http://localhost:5001/api/notifications/read-all', { method: 'PUT' });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    
    // Handle review notifications
    if (notification.type === 'review_submitted' && notification.reviewId) {
      // Navigate to Reviews File tab
      setActiveTab('reviews-file');
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
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      );
    }
    return <NotificationIcon />;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notification-content">
      <div className="notification-header">
        <h2>Notifications {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}</h2>
        {unreadCount > 0 && (
          <button className="btn-primary" onClick={handleMarkAllAsRead}>Mark All as Read</button>
        )}
      </div>
      <div className="notification-list">
        {loading ? (
          <div className="notification-item" style={{justifyContent: 'center', padding: '2rem'}}>
            <p style={{color: 'var(--text-medium)'}}>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-item" style={{justifyContent: 'center', padding: '2rem'}}>
            <p style={{color: 'var(--text-medium)'}}>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
              style={{ cursor: notification.type === 'review_submitted' ? 'pointer' : (!notification.read ? 'pointer' : 'default') }}
            >
              <div className="notification-icon assigned">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-info">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <span className="activity-time">{formatTimeAgo(notification.createdAt)}</span>
              </div>
              {!notification.read && <span className="unread-badge">New</span>}
            </div>
          ))
        )}
      </div>
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
      const response = await fetch('http://localhost:5001/api/reviews');
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
      const response = await fetch(`http://localhost:5001/api/reviews/${reviewId}`);
      const data = await response.json();
      setSelectedReview(data);
    } catch (error) {
      console.error('Error fetching review:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (review) => {
    setSelectedReview(review);
  };

  const handleBackToList = () => {
    setSelectedReview(null);
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
    return (
      <div className="review-detail-content">
        <div className="review-detail-header">
          <button className="btn-secondary" onClick={handleBackToList}>
            ← Back to Reviews
          </button>
          <h2>
            <svg className="review-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
            {selectedReview.title || 'Review Details'}
          </h2>
        </div>
        
        <div className="review-detail-card">
          <div className="reviewer-info">
            <h3>
              <svg className="reviewer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Reviewer Information
            </h3>
            <div className="reviewer-details">
              <p>
                <svg className="reviewer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <strong>Name:</strong> {selectedReview.reviewer?.name || selectedReview.reviewerName || 'N/A'}
              </p>
              <p>
                <svg className="reviewer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <strong>Email:</strong> {selectedReview.reviewer?.email || selectedReview.reviewerEmail || 'N/A'}
              </p>
              <p>
                <svg className="reviewer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <line x1="20" y1="8" x2="20" y2="14"/>
                  <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                <strong>Role:</strong> 
                <span className="role-badge">
                  {getReviewerRole(selectedReview.reviewer || {})}
                </span>
              </p>
              <p>
                <svg className="reviewer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
                <strong>Department:</strong> {selectedReview.reviewer?.department || selectedReview.department || 'N/A'}
              </p>
            </div>
          </div>

          <div className="review-content">
            <h3>
              <svg className="document-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
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
                  { key: 'ethicsReviewFee', label: 'Ethics Review Fee (Receipt)' },
                  { key: 'form7', label: 'Form 7' }
                ].map(({ key, label }) => {
                  const file = selectedReview.files?.[key] || 
                    (typeof selectedReview.files === 'object' && selectedReview.files[key]);
                  return (
                    <div key={key} className={`review-file-item ${file ? 'has-file' : 'no-file'}`}>
                      <div className="review-file-info">
                        <svg className="review-file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14,2 14,8 20,8"/>
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
                                <path d="M21 12a9 9 0 11-6.219-8.56"/>
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
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7,10 12,15 17,10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
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
          <div className="review-item" style={{justifyContent: 'center', padding: '2rem'}}>
            <p style={{color: 'var(--text-medium)'}}>Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="review-item" style={{justifyContent: 'center', padding: '2rem'}}>
            <p style={{color: 'var(--text-medium)'}}>No reviews yet</p>
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



const MessagesInboxContent = () => {

  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);

  const [userInfo, setUserInfo] = useState({ email: 'admin@ureb.edu' });

  const [selectedMessage, setSelectedMessage] = useState(null);

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');



  useEffect(() => {

    // Load user info from localStorage

    const savedUser = localStorage.getItem('ureb_user');

    if (savedUser) {

      setUserInfo(JSON.parse(savedUser));

    }

  }, []);



  useEffect(() => {

    const fetchMessages = async () => {

      try {

        const { getMessagesByUser } = await import('../services/api.js');

        const messageList = await getMessagesByUser(userInfo.email);

        setMessages(messageList);

      } catch (error) {

        console.error('Error fetching messages:', error);

      } finally {

        setLoading(false);

      }

    };



    if (userInfo.email) {

      fetchMessages();

    }

  }, [userInfo.email]);

  const openMessageModal = (message) => {
    setSelectedMessage(message);
    setIsMessageModalOpen(true);
  };

  const closeMessageModal = () => {
    setSelectedMessage(null);
    setIsMessageModalOpen(false);
  };

  const markAsRead = async () => {
    if (selectedMessage && !selectedMessage.read) {
      try {
        // Here you would add API call to mark message as read
        // For now, just update local state
        setMessages(messages.map(msg => 
          msg._id === selectedMessage._id ? { ...msg, read: true } : msg
        ));
        setSelectedMessage({ ...selectedMessage, read: true });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  return (
    <>
      <div className="messages-content">

        <div className="messages-header">

          <h2>Messages Inbox</h2>

          <div className="messages-actions">

            <button className="btn-primary">Compose New</button>

            <button className="btn-secondary">Mark All Read</button>

          </div>

        </div>

        <div className="messages-list">

          {loading ? (

            <div className="message-item" style={{justifyContent: 'center', padding: '2rem'}}>

              <p style={{color: 'var(--text-medium)'}}>Loading messages...</p>

            </div>

          ) : messages.length === 0 ? (

            <div className="message-item" style={{justifyContent: 'center', padding: '2rem'}}>

              <p style={{color: 'var(--text-medium)'}}>No messages yet</p>

            </div>

          ) : (

            messages.map((message, index) => (

              <div key={index} className={`message-item ${!message.read ? 'unread' : ''}`} onClick={() => openMessageModal(message)} style={{ cursor: 'pointer' }}>

                <div className="message-header">

                  <div className="message-sender">

                    <div className="sender-avatar">

                      {message.senderEmail === userInfo.email ? 'Me' : message.senderEmail.charAt(0).toUpperCase()}

                    </div>

                    <div className="sender-info">

                      <h4>{message.senderEmail === userInfo.email ? 'Me' : message.senderEmail}</h4>

                      <span>{new Date(message.createdAt).toLocaleDateString()}</span>

                    </div>

                  </div>

                  {!message.read && <span className="unread-badge">New</span>}

                </div>

                <div className="message-content">

                  <h4>{message.subject}</h4>

                  <p>{message.message}</p>

                </div>

                <div className="message-actions">

                  {!message.read && <button className="btn-primary" onClick={(e) => { e.stopPropagation(); markAsRead(); }}>Mark as Read</button>}

                </div>

              </div>

            ))

          )}

        </div>

      </div>

      <MessageViewModal 
        isOpen={isMessageModalOpen} 
        onClose={closeMessageModal} 
        message={selectedMessage}
        userInfo={userInfo}
        onMarkAsRead={markAsRead}
        setSuccessMessage={setSuccessMessage}
        setIsSuccessModalOpen={setIsSuccessModalOpen}
        setMessages={setMessages}
      />
      
      <SuccessModal 
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        message={successMessage}
      />
    </>
  );

};



const MessageViewModal = ({ isOpen, onClose, message, userInfo, onMarkAsRead, setSuccessMessage, setIsSuccessModalOpen, setMessages }) => {
  if (!isOpen || !message) return null;

  const [isReplying, setIsReplying] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  const handleMarkAsRead = () => {
    onMarkAsRead();
  };

  const handleReply = () => {
    setIsReplying(true);
    setReplyMessage('');
  };

  const sendReply = async () => {
    if (!replyMessage.trim()) return;

    try {
      // Import the sendEmail and deleteMessage API functions
      const { sendEmail, deleteMessage } = await import('../services/api.js');
      
      // Prepare email data
      const subject = `Re: ${message.subject}`;
      const body = `${replyMessage}\n\n---\nOn ${new Date(message.createdAt).toLocaleDateString()}, ${message.senderEmail} wrote:\n${message.message}`;
      
      // Send email automatically
      const emailResult = await sendEmail({
        to: message.senderEmail,
        subject: subject,
        body: body,
        fromEmail: userInfo.email,
        fromName: userInfo.name || 'UREB Admin'
      });
      
      if (emailResult.success) {
        // Delete the message after sending reply
        console.log('Attempting to delete message with ID:', message._id);
        const deleteResult = await deleteMessage(message._id);
        console.log('Delete result:', deleteResult);
        
        if (deleteResult.success) {
          // Show success modal
          setSuccessMessage('Reply sent successfully and message deleted!');
          setIsSuccessModalOpen(true);
          
          // Update local state to remove the deleted message
          const messageIdString = message._id.toString();
          setMessages(prevMessages => prevMessages.filter(msg => msg._id.toString() !== messageIdString));
        } else {
          console.warn('Email sent but failed to delete message:', deleteResult.error);
          setSuccessMessage('Reply sent successfully, but failed to delete message.');
          setIsSuccessModalOpen(true);
        }
        
        // Close reply form
        setIsReplying(false);
        setReplyMessage('');
        
        // Close modal
        onClose();
      } else {
        alert('Failed to send reply: ' + emailResult.error);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    }
  };

  const cancelReply = () => {
    setIsReplying(false);
    setReplyMessage('');
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container large">
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <XIcon />
        </button>
        <div className="modal-header">
          <h2>Message Details</h2>
        </div>
        <div className="modal-body">
          <div className="message-detail">
            <div className="message-detail-header">
              <div className="message-detail-sender">
                <div className="sender-avatar">
                  {message.senderEmail === userInfo.email ? 'Me' : message.senderEmail.charAt(0).toUpperCase()}
                </div>
                <div className="sender-info">
                  <h4>{message.senderEmail === userInfo.email ? 'Me' : message.senderEmail}</h4>
                  <span>{new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
              {!message.read && <span className="unread-badge">New</span>}
            </div>
            
            <div className="message-detail-content">
              <h3>{message.subject}</h3>
              <div className="message-detail-body">
                <p>{message.message}</p>
              </div>
            </div>

            {isReplying && (
              <div className="reply-section">
                <h4>Reply to {message.senderEmail}</h4>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply here..."
                  className="reply-textarea"
                  rows="6"
                />
                <div className="reply-actions">
                  <button className="btn-secondary" onClick={cancelReply}>Cancel</button>
                  <button className="btn-primary" onClick={sendReply} disabled={!replyMessage.trim()}>
                    Send Reply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          {!message.read && <button className="btn-primary" onClick={handleMarkAsRead}>Mark as Read</button>}
          {!isReplying && <button className="btn-primary" onClick={handleReply}>Reply</button>}
        </div>
      </div>
    </div>
  );
};



const SuccessModal = ({ isOpen, onClose, message }) => {
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
                <circle cx="12" cy="12" r="10"/>
                <path d="M9 12 11 14 15 10"/>
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


const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
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

// Pending Proposals Modal Component
const PendingProposalsModal = ({ isOpen, onClose }) => {
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
      const pendingProposals = allProposals.filter(proposal => 
        proposal.status === 'pending' || 
        proposal.status === 'Pending Review' || 
        proposal.status === 'In Progress'
      );
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
                    <span className={`status-badge ${proposal.status?.toLowerCase().replace(' ', '-') || 'pending'}`}>
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
                  <div className="proposal-actions">
                    <button className="btn-primary">Review Details</button>
                    <button className="btn-secondary">View Files</button>
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
const GenerateReportModal = ({ isOpen, onClose }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAllProposals();
    }
  }, [isOpen]);

  const fetchAllProposals = async () => {
    setLoading(true);
    try {
      const { getAllProposals } = await import('../services/api.js');
      const allProposals = await getAllProposals();
      setProposals(allProposals);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = proposal.researchTitle?.toLowerCase().includes(searchLower);
    const reviewerMatch = 
      (proposal.reviewers?.reviewer1?.toLowerCase().includes(searchLower)) ||
      (proposal.reviewers?.reviewer2?.toLowerCase().includes(searchLower)) ||
      (proposal.reviewers?.reviewer3?.toLowerCase().includes(searchLower));
    const proponentMatch = proposal.proponent?.toLowerCase().includes(searchLower);
    const protocolMatch = proposal.protocolCode?.toLowerCase().includes(searchLower);
    
    return titleMatch || reviewerMatch || proponentMatch || protocolMatch;
  });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container large">
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <XIcon />
        </button>
        <div className="modal-header">
          <h2>Generate Report</h2>
          <p>View and search all proposals</p>
        </div>
        <div className="modal-body">
          <div className="report-search">
            <div className="search-bar">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search by title, reviewer name, proponent, or protocol code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {loading ? (
            <div className="loading-state">Loading proposals...</div>
          ) : filteredProposals.length === 0 ? (
            <div className="empty-state">
              {searchQuery ? 'No proposals found matching your search.' : 'No proposals found.'}
            </div>
          ) : (
            <div className="proposals-table">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Protocol Code</th>
                    <th>Research Title</th>
                    <th>Proponent</th>
                    <th>Status</th>
                    <th>Assigned Reviewers</th>
                    <th>Submission Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProposals.map((proposal) => (
                    <tr key={proposal._id || proposal.id}>
                      <td>{proposal.protocolCode || 'N/A'}</td>
                      <td>{proposal.researchTitle || 'Untitled'}</td>
                      <td>{proposal.proponent || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${proposal.status?.toLowerCase().replace(' ', '-') || 'pending'}`}>
                          {proposal.status || 'Pending'}
                        </span>
                      </td>
                      <td>
                        <div className="reviewer-list">
                          {proposal.reviewers?.reviewer1 && <span>{proposal.reviewers.reviewer1}</span>}
                          {proposal.reviewers?.reviewer2 && <span>{proposal.reviewers.reviewer2}</span>}
                          {proposal.reviewers?.reviewer3 && <span>{proposal.reviewers.reviewer3}</span>}
                          {!proposal.reviewers?.reviewer1 && !proposal.reviewers?.reviewer2 && !proposal.reviewers?.reviewer3 && (
                            <span className="no-reviewer">Not assigned</span>
                          )}
                        </div>
                      </td>
                      <td>{proposal.submissionDate ? new Date(proposal.submissionDate).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-primary btn-sm">View Details</button>
                          <button className="btn-secondary btn-sm">Download</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
          <button className="btn-primary">Export to PDF</button>
          <button className="btn-primary">Export to Excel</button>
        </div>
      </div>
    </div>
  );
};

const ViewReviewerSubmissionsModal = ({ isOpen, onClose }) => {
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
      const res = await fetch('http://localhost:5001/api/reviews/all');
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



const StudentSubmissionsModal = ({ isOpen, onClose }) => {

  const [activeTab, setActiveTab] = useState('payment-receipts');



  if (!isOpen) return null;



  const tabs = [

    { id: 'payment-receipts', label: 'Payment Receipts' },

    { id: 'resubmitted-manuscripts', label: 'Resubmitted Manuscripts' },

    { id: 'response-letters', label: 'Response Letters' },

    { id: 'completed-manuscripts', label: 'Completed Manuscripts' },

  ];



  const renderTable = () => (

    <table className="submissions-table">

      <thead>

        <tr>

          <th>Protocol Code</th>

          <th>Proponent</th>

          <th>Upload Date</th>

          <th>File</th>

          <th>Actions</th>

        </tr>

      </thead>

      <tbody>

        <tr>

          <td colSpan="5" style={{textAlign: 'center', padding: '2rem', color: 'var(--text-medium)'}}>

            No submissions found.

          </td>

        </tr>

      </tbody>

    </table>

  );



  return (

    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>

      <div className="modal-container large">

        <button className="modal-close" onClick={onClose} aria-label="Close modal">

          <XIcon />

        </button>

        <div className="modal-header">

          <h2>Student Submissions</h2>

          <p>View all student submissions by category</p>

        </div>

        <div className="modal-tabs">

          {tabs.map((tab) => (

            <button

              key={tab.id}

              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}

              onClick={() => setActiveTab(tab.id)}

            >

              {tab.label}

            </button>

          ))}

        </div>

        <div className="modal-body">

          {renderTable()}

        </div>

      </div>

    </div>

  );

};

const AdminWelcomeModal = ({ firstName, onClose }) => {
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
            Let's Get Started
          </button>
        </div>
      </div>
    </div>
  );
};



export default AdminDashboard;

