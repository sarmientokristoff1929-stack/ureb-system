import { useState, useEffect, useRef } from 'react';



import './admindashboard.css';

import './AddAdminModal.css';

import './GenerateReportModal.css';







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



const EyeIcon = () => (

  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />

    <circle cx="12" cy="12" r="3" />

  </svg>

);



const EyeOffIcon = () => (

  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />

    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />

    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />

    <path d="M2 2l20 20" />

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

const SearchIcon = () => (



  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">



    <circle cx="11" cy="11" r="8" />



    <path d="m21 21-4.35-4.35" />



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

  const [messageCount, setMessageCount] = useState(0);

  const [notifCount, setNotifCount] = useState(0);



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

  // Fetch message count for badge
  const refreshMessageCount = async () => {
    if (!userInfo?.email) return;
    try {
      const { getMessagesByUser } = await import('../services/api.js');
      const messageList = await getMessagesByUser(userInfo.email);
      // Count unread messages
      const unreadMessages = messageList.filter(m => !m.read);
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
      const deletedIdsStr = localStorage.getItem('deleted_notifications') || '[]';
      const deletedIds = JSON.parse(deletedIdsStr);
      const unreadNotifs = data.filter(n => !n.read && !deletedIds.includes(n._id));
      setNotifCount(unreadNotifs.length);
    } catch (error) {
      console.error('Error fetching notification count:', error);
      setNotifCount(0);
    }
  };

  useEffect(() => {
    refreshMessageCount();
    refreshNotifCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo]);







  const menuItems = [



    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },



    { id: 'assign-file', label: 'Submit File', icon: <AssignIcon /> },



    { id: 'message-researcher', label: 'Message Student', icon: <MessageIcon /> },



    { id: 'add-reviewer', label: 'Add Reviewer', icon: <UserPlusIcon /> },



    { id: 'mark-completed-review', label: 'Mark Completed Review', icon: <CheckCircleIcon /> },



    { id: 'manage-users', label: 'Manage Users', icon: <UsersIcon /> },



    { id: 'notification', label: 'Notification (File)', icon: <NotificationIcon />, badge: notifCount > 0 ? notifCount : null },



    { id: 'messages-inbox', label: 'Messages Inbox', icon: <MessageIcon />, badge: messageCount > 0 ? messageCount : null },



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



      case 'mark-completed-review':

        return <MarkCompletedReviewContent />;

      case 'assign-file':



        return <AssignFileContent />;



      case 'message-researcher':



        return <MessageResearcherContent />;



      case 'manage-users':



        return <ManageUsersContent />;



      case 'notification':



        return <NotificationContent setActiveTab={setActiveTab} onRefreshCount={refreshNotifCount} />;



      case 'messages-inbox':



        return <MessagesInboxContent onMessageRead={refreshMessageCount} />;



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
  const [showAllActivity, setShowAllActivity] = useState(false);
  const ACTIVITY_LIMIT = 5;

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



            description: `${proposal.protocolCode ? 'Protocol ' + proposal.protocolCode : 'Proposal'}: "${proposal.title || 'Untitled'}"`,



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



                  {(showAllActivity ? recentActivity : recentActivity.slice(0, ACTIVITY_LIMIT)).map((activity, index) => (



                    <div key={index} className="activity-item">



                      <div className="activity-icon">



                        {activity.icon === 'FilePlus' ? <FilePlusIcon /> : <DashboardIcon />}



                      </div>



                      <div className="activity-content">



                        <h4>{activity.title}</h4>



                        <p>{activity.description}</p>



                        <span className="activity-time">



                          {new Date(activity.timestamp).toLocaleDateString()} • {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}



                        </span>



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







        <div className="quick-actions">



          <h2>Quick Actions</h2>



          <div className="action-buttons">



            <button className="action-btn primary" onClick={openPendingProposalsModal}>Review Pending Proposals</button>



            <button className="action-btn secondary" onClick={openGenerateReportModal}>Generate Report</button>



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

      department: '',

      reviewerType: ''

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

  const handleCancel = () => {
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      title: '',
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

      'FALS', 'FTED', 'FAIS', 'FNAS', 'FBM', 'FCJE', 'FACET',

      'FHUSOCOM', 'SEIC', 'BEC', 'CEC', 'BGEC', 'TEC',

      'NSTP', 'ICS', 'Community Representatives'

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

            <div className="form-group">

              <label>Reviewer Type</label>

              <select

                name="reviewerType"

                value={formData.reviewerType}

                onChange={handleInputChange}

                required

              >

                <option value="">Select Reviewer Type</option>

                <option value="preliminary">Preliminary Reviewer</option>

                <option value="secondary">Secondary Reviewer</option>

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







// ── Mark Completed Review ──────────────────────────────────────────────────
const MarkCompletedReviewContent = () => {
  const [reviewerRows, setReviewerRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API = import.meta.env.VITE_API_URL;
        const [reviewsRes, proposalsRes, reviewersRes] = await Promise.all([
          fetch(`${API}/api/reviews`),
          fetch(`${API}/api/proposals`),
          fetch(`${API}/api/reviewers`),
        ]);

        const allReviews = reviewsRes.ok ? await reviewsRes.json() : [];
        const allProposals = proposalsRes.ok ? await proposalsRes.json() : [];
        const allAccounts = reviewersRes.ok ? await reviewersRes.json() : [];

        // Build reviewer-type map from proposals (reviewer1 → preliminary, reviewer2/3 → secondary)
        const reviewerTypeMap = {};
        if (Array.isArray(allProposals)) {
          allProposals.forEach(proposal => {
            const slots = proposal.reviewers || {};
            if (slots.reviewer1) {
              const key = slots.reviewer1.trim().toLowerCase();
              if (!reviewerTypeMap[key]) reviewerTypeMap[key] = 'preliminary';
            }
            ['reviewer2', 'reviewer3'].forEach(slot => {
              if (slots[slot]) {
                const key = slots[slot].trim().toLowerCase();
                if (!reviewerTypeMap[key]) reviewerTypeMap[key] = 'secondary';
              }
            });
          });
        }

        // Group reviews by reviewer email → unique reviewers with review count
        const byEmail = {};
        if (Array.isArray(allReviews)) {
          allReviews.forEach(review => {
            const email = (review.reviewerEmail || '').trim().toLowerCase();
            if (!email) return;
            if (!byEmail[email]) {
              byEmail[email] = {
                email,
                name: review.reviewerName || review.reviewer || email,
                reviewCount: 0,
              };
            }
            byEmail[email].reviewCount++;
          });
        }

        // Build account lookup by email
        const accountMap = {};
        if (Array.isArray(allAccounts)) {
          allAccounts.forEach(acc => {
            const key = (acc.email || '').trim().toLowerCase();
            accountMap[key] = acc;
          });
        }

        // Build final rows: only reviewers who have actual reviews
        const EXCLUDED_FROM_MCR = ['kristoff h. sarmiento'];
        const rows = Object.values(byEmail).filter(r =>
          !EXCLUDED_FROM_MCR.includes(r.name.trim().toLowerCase())
        ).map(r => {
          const acc = accountMap[r.email] || {};
          const nameKey = r.name.trim().toLowerCase();
          const reviewerType =
            reviewerTypeMap[r.email] ||
            reviewerTypeMap[nameKey] ||
            (acc.reviewerType || '').toLowerCase() ||
            'unknown';
          return {
            _id: acc._id,
            name: r.name,
            email: r.email,
            department: acc.department || '—',
            reviewerType,
            reviewCount: r.reviewCount,
            status: acc.status || 'pending',
          };
        });

        setReviewerRows(rows);
      } catch (err) {
        console.error('Error fetching review data:', err);
        setReviewerRows([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggle = async (row) => {
    if (!row._id) return;
    const newStatus = row.status === 'completed' ? 'pending' : 'completed';
    setUpdating(prev => ({ ...prev, [row.email]: true }));
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/reviewers/${row._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setReviewerRows(prev =>
        prev.map(r => r.email === row.email ? { ...r, status: newStatus } : r)
      );
    } catch (err) {
      console.error('Error updating reviewer status:', err);
    } finally {
      setUpdating(prev => ({ ...prev, [row.email]: false }));
    }
  };

  const preliminary = reviewerRows.filter(r => r.reviewerType === 'preliminary');
  const secondary = reviewerRows.filter(r => r.reviewerType === 'secondary');

  const renderSection = (title, list, accent) => {
    const completedReviewsCount = list
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.reviewCount, 0);
    return (
      <div className="mcr-section">
        <div className="mcr-section-header" style={{ borderLeftColor: accent }}>
          <span className="mcr-dot" style={{ background: accent }} />
          <h3 className="mcr-section-title">{title}</h3>
          <span className="mcr-section-badge" style={{ background: accent + '1a', color: accent }}>
            {list.length} reviewer{list.length !== 1 ? 's' : ''}
          </span>
          <span className="mcr-completed-badge">
            <span className="mcr-completed-badge__count">{completedReviewsCount}</span>
            Completed Reviews
          </span>
        </div>

        {list.length === 0 ? (
          <p className="mcr-no-data">No {title.toLowerCase()} with assignments found.</p>
        ) : (
          <div className="mcr-table-wrap">
            <table className="mcr-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Reviews</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row, idx) => {
                  const isCompleted = row.status === 'completed';
                  const isBusy = updating[row.email];
                  return (
                    <tr key={row.email} className={`mcr-row${isCompleted ? ' mcr-row--done' : ''}${idx % 2 === 1 ? ' mcr-row--alt' : ''}`}>
                      <td className="mcr-td-name">{row.name}</td>
                      <td className="mcr-td-email">{row.email}</td>
                      <td>{row.department}</td>
                      <td>{row.reviewCount}</td>
                      <td>
                        <span className={`mcr-status ${isCompleted ? 'mcr-status--completed' : 'mcr-status--pending'}`}>
                          {isCompleted ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`mcr-btn ${isCompleted ? 'mcr-btn--reset' : 'mcr-btn--complete'}`}
                          onClick={() => handleToggle(row)}
                          disabled={isBusy || !row._id}
                        >
                          {isBusy ? 'Saving…' : isCompleted ? 'Reset' : 'Mark Completed'}
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
    );
  };

  return (
    <div className="mcr-wrapper">
      <div className="mcr-header">
        <h2 className="mcr-title">Mark Completed Review</h2>
        <p className="mcr-subtitle">Reviewers with active assignments. Mark them completed when their review work is done.</p>
      </div>

      {loading ? (
        <div className="mcr-loading">
          <div className="mcr-spinner" />
          <span>Loading reviewers…</span>
        </div>
      ) : reviewerRows.length === 0 ? (
        <div className="mcr-empty-state">
          <p>No reviewers with review assignments found.</p>
        </div>
      ) : (
        <div className="mcr-sections">
          {renderSection('Preliminary Reviewers', preliminary, '#4A6B4E')}
          {renderSection('Secondary Reviewers', secondary, '#7A9E7E')}
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

      secondaryReviewer1: '',

      secondaryReviewer2: '',

      startDate: '',

      endDate: '',

      urebForm16: null,

      urebForm10B: null,

      urebForm11: null,

      urebForm2: null,

      urebForm6: null,

      urebForm7: null,

      urebForm8A: null,

      urebForm10A: null,

      approvedProposal: null,

      questionnaire: null,

      cvOfProponent: null

    };

  };



  const [formData, setFormData] = useState(getInitialFormData());

  const [files, setFiles] = useState([]);

  const [loading, setLoading] = useState(false);

  const [reviewers, setReviewers] = useState([]);

  const [loadingReviewers, setLoadingReviewers] = useState(true);



  // Fetch reviewers from database on component mount

  useEffect(() => {

    const fetchReviewers = async () => {

      try {

        const { getAllReviewers } = await import('../services/api.js');

        const reviewersData = await getAllReviewers();

        console.log('All reviewers from database:', reviewersData);

        console.log('Reviewers with reviewerType:', reviewersData.map(r => ({ name: r.name || `${r.firstName} ${r.lastName}`, reviewerType: r.reviewerType })));

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



  // Show all reviewers (both Preliminary and Secondary) in the dropdown

  // This allows Preliminary Reviewers to be selected as Secondary Reviewers when needed

  const allReviewers = reviewers;



  const documentTypes = [

    { key: 'urebForm16', label: 'UREB Form 16' },

    { key: 'urebForm10B', label: 'UREB Form 10-B' },

    { key: 'urebForm11', label: 'UREB Form 11' },

    { key: 'urebForm2', label: 'UREB Form 2' },

    { key: 'urebForm6', label: 'UREB Form 6' },

    { key: 'urebForm7', label: 'UREB Form 7' },

    { key: 'urebForm8A', label: 'UREB Form 8(A)' },

    { key: 'urebForm10A', label: 'UREB Form 10(A)' },

    { key: 'approvedProposal', label: 'Approved Proposal' },

    { key: 'questionnaire', label: 'Questionnaire' },

    { key: 'cvOfProponent', label: 'CV of Proponent' }

  ];



  const [reviewersLoading, setReviewersLoading] = useState(false);

  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [validationErrors, setValidationErrors] = useState({});



  // Save form data to localStorage whenever it changes

  useEffect(() => {

    localStorage.setItem('assignFileForm', JSON.stringify(formData));

  }, [formData]);



  const handleInputChange = (e) => {

    const { name, value } = e.target;

    setFormData(prev => ({

      ...prev,

      [name]: value

    }));

  };



  const handleFileChange = (fieldName, file) => {

    setFormData(prev => ({

      ...prev,

      [fieldName]: file

    }));

  };



  const handleRemoveFile = (fieldName) => {

    setFormData(prev => ({

      ...prev,

      [fieldName]: null

    }));

  };



  const renderFileInput = (fieldName, label) => (

    <div className="form-group">

      <label htmlFor={fieldName}>{label}</label>

      <div className="file-upload-area">

        <input

          type="file"

          id={fieldName}

          onChange={(e) => handleFileChange(fieldName, e.target.files[0])}

          accept=".pdf,.doc,.docx,.txt"

        />

        <div className="file-upload-label">

          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">

            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />

          </svg>

          <p>{formData[fieldName] ? formData[fieldName].name : 'Click to upload file'}</p>

          <span>PDF, DOC, DOCX, TXT (MAX. 10MB)</span>

        </div>

      </div>

    </div>

  );



  const handleSubmit = async (e) => {

    e.preventDefault();



    // Validation

    const errors = {};

    if (!formData.protocolCode.trim()) errors.protocolCode = 'Protocol Code is required';

    if (!formData.secondaryReviewer1.trim()) errors.secondaryReviewer1 = 'Secondary Reviewer 1 is required';

    if (!formData.secondaryReviewer2.trim()) errors.secondaryReviewer2 = 'Secondary Reviewer 2 is required';

    if (!formData.startDate) errors.startDate = 'Start Date is required';

    if (!formData.endDate) errors.endDate = 'End Date is required';



    // Check if at least one file is uploaded

    const hasFiles = documentTypes.some(docType => formData[docType.key] instanceof File);

    if (!hasFiles) errors.files = 'At least one document must be uploaded';



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

      formDataToSend.append('secondaryReviewer1', formData.secondaryReviewer1);

      formDataToSend.append('secondaryReviewer2', formData.secondaryReviewer2);

      formDataToSend.append('startDate', formData.startDate);

      formDataToSend.append('endDate', formData.endDate);



      // Add document files

      documentTypes.forEach(docType => {

        if (formData[docType.key] instanceof File) {

          formDataToSend.append(docType.key, formData[docType.key]);

        }

      });



      // Import and call API

      const { assignFileToReviewer } = await import('../services/api.js');

      const result = await assignFileToReviewer(formDataToSend);



      if (result.success) {

        setIsSuccessModalOpen(true);

        // Reset form

        setFormData({

          protocolCode: '',

          secondaryReviewer1: '',

          secondaryReviewer2: '',

          startDate: '',

          endDate: '',

          urebForm16: null,

          urebForm10B: null,

          urebForm11: null,

          urebForm2: null,

          urebForm6: null,

          urebForm7: null,

          urebForm8A: null,

          urebForm10A: null,

          approvedProposal: null,

          questionnaire: null,

          cvOfProponent: null

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

      secondaryReviewer1: '',

      secondaryReviewer2: '',

      startDate: '',

      endDate: '',

      urebForm16: null,

      urebForm10B: null,

      urebForm11: null,

      urebForm2: null,

      urebForm6: null,

      urebForm7: null,

      urebForm8A: null,

      urebForm10A: null,

      approvedProposal: null,

      questionnaire: null,

      cvOfProponent: null

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

            <label>Secondary Reviewer 1</label>

            <select

              name="secondaryReviewer1"

              value={formData.secondaryReviewer1}

              onChange={handleInputChange}

            >

              <option value="">Select Reviewer</option>

              {loadingReviewers ? (

                <option value="" disabled>Loading reviewers...</option>

              ) : allReviewers.length > 0 ? (

                allReviewers.filter(r => r.email).map((reviewer, index) => {

                  const reviewerName = reviewer.name ||

                    `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim() ||

                    reviewer.email;



                  return (

                    <option key={reviewer._id || index} value={reviewer.email}>

                      {reviewerName}

                    </option>

                  );

                })

              ) : (

                <option value="" disabled>No reviewers available</option>

              )}

            </select>

            {validationErrors.secondaryReviewer1 && <span className="error-text">{validationErrors.secondaryReviewer1}</span>}

          </div>

          <div className="form-group">

            <label>Secondary Reviewer 2</label>

            <select

              name="secondaryReviewer2"

              value={formData.secondaryReviewer2}

              onChange={handleInputChange}

            >

              <option value="">Select Reviewer</option>

              {loadingReviewers ? (

                <option value="" disabled>Loading reviewers...</option>

              ) : allReviewers.length > 0 ? (

                allReviewers.filter(r => r.email).map((reviewer, index) => {

                  const reviewerName = reviewer.name ||

                    `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim() ||

                    reviewer.email;



                  return (

                    <option key={reviewer._id || index} value={reviewer.email}>

                      {reviewerName}

                    </option>

                  );

                })

              ) : (

                <option value="" disabled>No reviewers available</option>

              )}

            </select>

            {validationErrors.secondaryReviewer2 && <span className="error-text">{validationErrors.secondaryReviewer2}</span>}

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



          {/* Individual Document Upload Areas */}

          <div className="documents-section">

            <h3>Upload Documents</h3>

            {documentTypes.map(docType => (

              <div key={docType.key}>

                {renderFileInput(docType.key, docType.label)}

              </div>

            ))}

            {validationErrors.files && <span className="error-text">{validationErrors.files}</span>}

          </div>



          <div className="form-actions">

            <button type="submit" className="btn-primary" disabled={loading}>

              {loading ? 'Submitting...' : 'Submit File'}

            </button>

            <button type="button" className="btn-secondary" onClick={handleCancel}>Cancel</button>

          </div>

        </form>

      </div>



      {/* Success Modal */}

      {isSuccessModalOpen && (

        <div className="success-modal-overlay">

          <div className="success-modal-container minimal">

            <div className="success-content minimal">

              <div className="success-icon-minimal">

                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">

                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />

                  <polyline points="22 4 12 14.01 9 11.01" />

                </svg>

              </div>

              <h2>Files Assigned Successfully</h2>

              <p>Documents have been assigned to reviewers. They will receive notifications shortly.</p>

              <div className="success-actions minimal">

                <button

                  className="success-btn-done"

                  onClick={() => setIsSuccessModalOpen(false)}

                >

                  Done

                </button>

              </div>

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

  const [isMessageSuccessModalOpen, setIsMessageSuccessModalOpen] = useState(false);

  const [messageSuccessRecipient, setMessageSuccessRecipient] = useState('');



  useEffect(() => {

    const fetchStudents = async () => {

      try {

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/students`);

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



  const handleSubmit = (e) => {

    e.preventDefault();



    if (!selectedStudent || !message) {

      setError('Please select a student and enter a message');

      return;

    }

    setError('');

    const selectedStudentObj = students.find(s => s.email === selectedStudent);
    const recipientName = selectedStudentObj
      ? (selectedStudentObj.name || `${selectedStudentObj.firstName || ''} ${selectedStudentObj.lastName || ''}`.trim())
      : '';

    // Show success immediately — don't wait for file upload
    setMessageSuccessRecipient(recipientName || 'student');
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



  // Search and sort states

  const [searchQuery, setSearchQuery] = useState('');

  const [sortBy, setSortBy] = useState('name');

  const [sortOrder, setSortOrder] = useState('asc');



  const openAddAdminModal = () => setIsAddAdminModalOpen(true);



  const closeAddAdminModal = () => setIsAddAdminModalOpen(false);

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

        email: user.email || '',

        department: user.department || '',

        role: user.role || '',

        studentId: user.studentId || '',

        gender: user.gender || '',

        program: user.program || ''

      });

    } else {

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

        gender: user.gender || '',

        program: user.program || ''

      });

    }

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

                  <th>Gender</th>

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

                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-medium)' }}>

                      No students found.

                    </td>

                  </tr>

                ) : (

                  filteredStudents.map((student, index) => (

                    <tr key={index}>

                      <td>{student.name || `${student.firstName} ${student.lastName}`}</td>

                      <td>{student.studentId}</td>

                      <td>{student.gender || 'Not set'}</td>

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



              {editingUser?.userType === 'student' && (

                <div className="form-group">

                  <label>Gender</label>

                  <select

                    name="gender"

                    value={editFormData.gender || ''}

                    onChange={handleEditInputChange}

                  >

                    <option value="">Select Gender</option>

                    <option value="Male">Male</option>

                    <option value="Female">Female</option>

                    <option value="LGBTQ">LGBTQ</option>

                    <option value="Other">Other</option>

                    <option value="Prefer not to say">Prefer not to say</option>

                  </select>

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
                  ? 'Are you sure you want to enable this student\'s account? They will be able to log in again.'
                  : 'Are you sure you want to disable this student\'s account? They will not be able to log in.'}
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

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {

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





const NotificationContent = ({ setActiveTab, onRefreshCount }) => {

  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    fetchNotifications();

  }, []);



  const getDeletedIds = () => {
    try { return JSON.parse(localStorage.getItem('deleted_notifications') || '[]'); }
    catch { return []; }
  };

  const fetchNotifications = async () => {

    setLoading(true);

    try {

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`);

      const data = await response.json();

      const deleted = getDeletedIds();

      setNotifications(data.filter(n => !deleted.includes(n._id)));

    } catch (error) {

      console.error('Error fetching notifications:', error);

    } finally {

      setLoading(false);

    }

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



  const handleDeleteNotification = (e, id) => {

    e.stopPropagation();

    const deleted = getDeletedIds();
    if (!deleted.includes(id)) {
      localStorage.setItem('deleted_notifications', JSON.stringify([...deleted, id]));
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

          <div className="notification-item" style={{ justifyContent: 'center', padding: '2rem' }}>

            <p style={{ color: 'var(--text-medium)' }}>Loading notifications...</p>

          </div>

        ) : notifications.length === 0 ? (

          <div className="notification-item" style={{ justifyContent: 'center', padding: '2rem' }}>

            <p style={{ color: 'var(--text-medium)' }}>No notifications yet</p>

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

              <button

                className="notif-delete-btn"

                onClick={(e) => handleDeleteNotification(e, notification._id)}

                title="Delete notification"

              >

                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                  <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />

                </svg>

              </button>

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

                  { key: 'ethicsReviewFee', label: 'Ethics Review Fee (Receipt)' },

                  { key: 'form7', label: 'Form 7' }

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







const MessagesInboxContent = ({ onMessageRead }) => {



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

        const sorted = messageList.sort((a, b) =>
          new Date(b.createdAt || b.sentAt) - new Date(a.createdAt || a.sentAt)
        );

        // Apply localStorage read overrides so read state persists through refreshes
        const readIds = (() => { try { return JSON.parse(localStorage.getItem('read_messages') || '[]'); } catch { return []; } })();
        setMessages(sorted.map(m => readIds.includes(String(m._id)) ? { ...m, read: true } : m));



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



  const formatInboxDate = (dateStr) => {

    const date = new Date(dateStr);

    const now = new Date();

    const yesterday = new Date(now);

    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString())

      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });

  };



  const openMessageModal = (message) => {
    setSelectedMessage(message);
    setIsMessageModalOpen(true);

    // Auto-mark as read when opening
    if (!message.read) {
      saveReadId(message._id);
      setMessages(prev => prev.map(m => m._id === message._id ? { ...m, read: true } : m));
      // Fire-and-forget API + badge refresh
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
      // Persist locally immediately
      saveReadId(selectedMessage._id);
      setMessages(prev => prev.map(m => m._id === selectedMessage._id ? { ...m, read: true } : m));
      setSelectedMessage(prev => ({ ...prev, read: true }));

      try {
        const { markMessageAsRead } = await import('../services/api.js');
        await markMessageAsRead(selectedMessage._id);

        // Call the callback to refresh message count in sidebar
        if (onMessageRead) {
          onMessageRead();
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };



  const markAllAsRead = async () => {

    // Persist all current message IDs to localStorage immediately
    try {
      const existing = JSON.parse(localStorage.getItem('read_messages') || '[]');
      const allIds = [...new Set([...existing, ...messages.map(m => String(m._id))])];
      localStorage.setItem('read_messages', JSON.stringify(allIds));
    } catch { }
    setMessages(prev => prev.map(m => ({ ...m, read: true })));

    try {

      const { markAllMessagesAsRead } = await import('../services/api.js');

      await markAllMessagesAsRead(userInfo.email);

      // Call the callback to refresh message count in sidebar
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

    // Update UI and persist locally immediately
    saveReadId(msg._id);
    setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, read: true } : m));

    try {

      const { markMessageAsRead } = await import('../services/api.js');

      await markMessageAsRead(msg._id);

      // Call the callback to refresh message count in sidebar
      if (onMessageRead) {
        onMessageRead();
      }

    } catch (error) {

      console.error('Error marking message as read:', error);

    }

  };



  const unreadCount = messages.filter(m => !m.read).length;



  return (

    <>

      <div className="inbox-wrapper">



        {/* Header */}

        <div className="inbox-header">

          <div className="inbox-title-group">

            <h2>Messages Inbox</h2>

            {unreadCount > 0 && (

              <span className="inbox-unread-count">{unreadCount} unread</span>

            )}

          </div>

          <div className="inbox-header-actions">

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



        {/* Message List */}

        <div className="inbox-list">

          {loading ? (

            <div className="inbox-empty">

              <div className="inbox-empty-icon">

                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>

              </div>

              <p>Loading messages...</p>

            </div>

          ) : messages.length === 0 ? (

            <div className="inbox-empty">

              <div className="inbox-empty-icon">

                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>

              </div>

              <p>Your inbox is empty</p>

              <span>Student messages and file submissions will appear here.</span>

            </div>

          ) : (

            messages.map((message, index) => (

              <div

                key={index}

                className={`inbox-row ${!message.read ? 'unread' : ''}`}

                onClick={() => openMessageModal(message)}

              >

                {/* Unread indicator column */}

                <div className="inbox-unread-indicator">

                  {!message.read && <span className="inbox-unread-dot" />}

                </div>



                {/* Avatar */}

                <div className="inbox-avatar">

                  {(message.senderName || message.senderEmail).charAt(0).toUpperCase()}

                </div>



                {/* Content */}

                <div className="inbox-row-content">

                  <div className="inbox-row-top">

                    <span className="inbox-sender-name">

                      {message.senderName || message.senderEmail}

                    </span>

                    <div className="inbox-row-actions">

                      {!message.read && (
                        <button
                          className="inbox-mark-read-btn"
                          onClick={(e) => markSingleAsRead(e, message)}
                          title="Mark as read"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Mark as read
                        </button>
                      )}

                      <span className="inbox-row-date">

                        {formatInboxDate(message.createdAt || message.sentAt)}

                      </span>

                      <button
                        className="inbox-trash-btn"
                        onClick={(e) => openInboxDeleteModal(e, message._id)}
                        title="Delete message"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>

                    </div>

                  </div>

                  <div className="inbox-row-bottom">

                    <span className="inbox-subject">{message.subject}</span>

                    {message.submissionType === 'resubmission' && (

                      <span className="inbox-badge resubmission">Resubmission</span>

                    )}

                    <span className="inbox-preview"> — {message.message}</span>

                  </div>

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

        onMessageRead={onMessageRead}

        setSuccessMessage={setSuccessMessage}

        setIsSuccessModalOpen={setIsSuccessModalOpen}

        setMessages={setMessages}

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







const MessageViewModal = ({ isOpen, onClose, message, userInfo, onMarkAsRead, onMessageRead, setSuccessMessage, setIsSuccessModalOpen, setMessages }) => {

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

                      <button className="msg-file-download" onClick={() => handleDownloadFile(fileKey, fileData)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                        </svg>
                        Download
                      </button>

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

              <p className="msg-modal-files-label">Attached Files from Student</p>

              <div className="msg-modal-files-list">

                {message.files.map((file, i) => {
                  const storedName = file.path ? file.path.split(/[\\/]/).pop() : file.filename;
                  const displayName = file.filename;
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

                      <button className="msg-file-download" onClick={() => handleDownloadFile(storedName, { filename: storedName, originalname: displayName })}>

                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">

                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />

                        </svg>

                        Download

                      </button>

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

                    <button className="msg-file-download" onClick={() => handleDownloadFile(fileKey, fileData)}>

                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">

                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />

                      </svg>

                      Download

                    </button>

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

      // Fetch reviews and proposals in parallel
      const [reviewsRes, proposalsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/reviews`),
        fetch(`${import.meta.env.VITE_API_URL}/api/proposals`),
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

      // Enrich each review with reviewerType
      const enrichedReviews = allReviews.map(review => {
        const emailKey = (review.reviewerEmail || '').trim().toLowerCase();
        const nameKey = (review.reviewerName || '').trim().toLowerCase();
        const reviewerType = reviewerTypeMap[emailKey] || reviewerTypeMap[nameKey] || 'preliminary';
        return { ...review, reviewerType };
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
      const recommendations = (review.recommendations || '—').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `
        <tr>
          <td>${(review.reviewerName || review.reviewer || 'N/A').replace(/</g, '&lt;')}</td>
          <td><span class="badge badge-${decision.toLowerCase().replace(/\s+/g, '-')}">${decision}</span></td>
          <td>${review.overallRating || '—'}</td>
          <td>${date}</td>
          <td>${comment}</td>
          <td>${recommendations}</td>
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
              <th>Date Completed</th><th>Comments</th><th>Recommendations</th>
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
                            <col style={{ width: '200px' }} />
                          </colgroup>
                          <thead>
                            <tr>
                              <th />
                              <th>Reviewer Name</th>
                              <th>Decision</th>
                              <th>Date Completed</th>
                              <th>Comments</th>
                              <th>Recommendations</th>
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
                                  <td className="grm-td-text">{review.recommendations || <span className="grm-muted">—</span>}</td>
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







const StudentSubmissionsModal = ({ isOpen, onClose }) => {
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
                        <td>
                          <span className="ssm-status-badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                            {proposal.status || 'Pending'}
                          </span>
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



