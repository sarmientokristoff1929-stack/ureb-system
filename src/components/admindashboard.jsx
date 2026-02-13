import { useState, useEffect, useRef } from 'react';

import './admindashboard.css';
import './AddAdminModal.css';



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

    { id: 'add-reviewer', label: 'Add Reviewer', icon: <UserPlusIcon /> },

    { id: 'manage-users', label: 'Manage Users', icon: <UsersIcon /> },

    { id: 'notification', label: 'Notification (File)', icon: <NotificationIcon /> },

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

      case 'manage-users':

        return <ManageUsersContent />;

      case 'notification':

        return <NotificationContent />;

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
      email: '',
      password: '',
      department: '',
      specialization: ''
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
          email: formData.email,
          password: formData.password,
          role: 'reviewer',
          department: formData.department,
          specialization: formData.specialization
        }),
      });

      if (response.ok) {
        setFormData({
          firstName: '',
          middleName: '',
          lastName: '',
          email: '',
          password: '',
          department: '',
          specialization: ''
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
      email: '',
      password: '',
      department: '',
      specialization: ''
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
                <option value="SIEC">SIEC-San Isidro Campus</option>
                <option value="BEC">BEC-BanayBanay Extension Campus</option>
                <option value="CEC">CEC-Cateel Extension Campus</option>
                <option value="BGEC">BGEC-Baganga Extension Campus</option>
                <option value="TEC">TEC-Tarragona Extension Campus</option>
                <option value="Community Representatives">Community Representatives</option>
              </select>
            </div>
            <div className="form-group">
              <label>Specialization</label>
              <input 
                type="text" 
                name="specialization"
                placeholder="e.g., Ethics, Methodology" 
                value={formData.specialization}
                onChange={handleInputChange}
              />
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
            <label>Protocol Code *</label>
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
            <label>Reviewer Username *</label>
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
                    {reviewer.name} ({reviewer.username})
                  </option>
                ))
              )}
            </select>
            {validationErrors.reviewerUsername && <span className="error-text">{validationErrors.reviewerUsername}</span>}
          </div>
          <div className="form-group">
            <label>Review Period (Philippine Time) *</label>
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



const ManageUsersContent = () => {

  const [users, setUsers] = useState([]);

  const [reviewers, setReviewers] = useState([]);

  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('admins');

  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);

  const openAddAdminModal = () => setIsAddAdminModalOpen(true);

  const closeAddAdminModal = () => setIsAddAdminModalOpen(false);

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
                      <div className="action-buttons">
                        <button className="btn-secondary">Edit</button>
                        <button className="btn-danger">Remove</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        );

      case 'reviewers':
        return (
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Specialization</th>
                <th>Created Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviewers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-medium)' }}>
                    No reviewers found.
                  </td>
                </tr>
              ) : (
                reviewers.map((reviewer, index) => (
                  <tr key={index}>
                    <td>{reviewer.name || `${reviewer.firstName} ${reviewer.lastName}`}</td>
                    <td>{reviewer.email}</td>
                    <td>{reviewer.department || 'Not specified'}</td>
                    <td>{reviewer.specialization || 'Not specified'}</td>
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
                        <button className="btn-secondary">Edit</button>
                        <button className="btn-danger">Remove</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        );

      case 'students':
        return (
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
              {students.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-medium)' }}>
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student, index) => (
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
                        <button className="btn-secondary">Edit</button>
                        <button className="btn-danger">Remove</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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


const NotificationContent = () => (

  <div className="notification-content">

    <div className="notification-header">

      <h2>Notifications</h2>

      <button className="btn-primary">Mark All as Read</button>

    </div>

    <div className="notification-list">

      <div className="notification-item" style={{justifyContent: 'center', padding: '2rem'}}>

        <p style={{color: 'var(--text-medium)'}}>No notifications yet</p>

      </div>

    </div>

  </div>

);



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

          <table className="submissions-table">

            <thead>

              <tr>

                <th>Protocol Code</th>

                <th>Reviewer</th>

                <th>File</th>

                <th>Comments</th>

                <th>Upload Date</th>

                <th>Status</th>

                <th>Actions</th>

              </tr>

            </thead>

            <tbody>

              <tr>

                <td colSpan="7" style={{textAlign: 'center', padding: '2rem', color: 'var(--text-medium)'}}>

                  No submissions found.

                </td>

              </tr>

            </tbody>

          </table>

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

