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

const StudentDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userInfo, setUserInfo] = useState({ name: 'Student', email: 'student@ureb.edu' });
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

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
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon /> },
    { id: 'add-files', label: 'Add Files', icon: <FilePlusIcon /> },
    { id: 'history', label: 'History', icon: <HistoryIcon /> },
  ];

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
        return <DashboardContent userInfo={userInfo} />;
      case 'notifications':
        return <NotificationsContent />;
      case 'add-files':
        return <AddFilesContent />;
      case 'history':
        return <HistoryContent />;
      default:
        return <DashboardContent userInfo={userInfo} />;
    }
  };

  const getFirstName = () => {
    return userInfo.name.split(' ')[0];
  };

  return (
    <div className="student-dashboard">
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
const DashboardContent = ({ userInfo }) => {
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
    // Simulate loading dashboard data
    setTimeout(() => {
      setStats({
        totalProposals: 0,
        pendingReviews: 0,
        approvedProposals: 0,
        notifications: 0
      });
      
      setRecentActivity([]);
      setProposals([]);
      setLoading(false);
    }, 1000);
  }, []);

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
        <div className="proposals-section">
          <h2>Uploaded Proposals</h2>
          <div className="proposals-table-container">
            {proposals.length === 0 ? (
              <div className="loading-state">No proposals uploaded yet</div>
            ) : (
              <table className="proposals-table">
                <thead>
                  <tr>
                    <th>Proposal Title</th>
                    <th>Department</th>
                    <th>Preliminary Reviewer</th>
                    <th>Upload Date</th>
                    <th>Status</th>
                    <th>Files</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((proposal, index) => (
                    <tr key={index}>
                      <td>{proposal.title || 'Untitled Proposal'}</td>
                      <td>{proposal.department || 'N/A'}</td>
                      <td>{proposal.preliminaryReviewer || 'N/A'}</td>
                      <td>{new Date(proposal.uploadDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${proposal.status?.toLowerCase() || 'pending'}`}>
                          {proposal.status || 'Pending'}
                        </span>
                      </td>
                      <td>
                        <div className="file-list">
                          {proposal.files && proposal.files.length > 0 ? (
                            proposal.files.map((file, fileIndex) => (
                              <span key={fileIndex} className="file-tag">
                                {file.name}
                              </span>
                            ))
                          ) : (
                            <span className="no-files">No files</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn primary">Submit New Proposal</button>
            <button className="action-btn secondary">View Guidelines</button>
            <button className="action-btn secondary">Contact Reviewer</button>
          </div>
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

const AddFilesContent = () => {
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
    department: ''
  });
  const [uploading, setUploading] = useState(false);

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
    // Simulate file upload
    setTimeout(() => {
      setUploading(false);
      alert('Files uploaded successfully!');
      // Reset form
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
        department: ''
      });
    }, 2000);
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
            onChange={(e) => handleInputChange('department', e.target.value)}
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
            <option value="Community Representatives">Community Representatives</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="preliminaryReviewer">Preliminary Reviewer </label>
          <select
            id="preliminaryReviewer"
            value={formData.preliminaryReviewer}
            onChange={(e) => handleInputChange('preliminaryReviewer', e.target.value)}
            required
          >
            <option value="">Select a reviewer</option>
            <option value="dr-smith">Dr. Smith</option>
            <option value="dr-johnson">Dr. Johnson</option>
            <option value="dr-brown">Dr. Brown</option>
            <option value="dr-davis">Dr. Davis</option>
            <option value="dr-wilson">Dr. Wilson</option>
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
                department: ''
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

const HistoryContent = () => {
  const [history, setHistory] = useState([]);

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'approved';
      case 'under review': return 'pending';
      case 'rejected': return 'rejected';
      default: return 'pending';
    }
  };

  return (
    <div className="content-section">
      <h2>History</h2>
      <div className="history-list">
        {history.length === 0 ? (
          <div className="loading-state">No history available</div>
        ) : (
          history.map((item) => (
            <div className="history-item" key={item.id}>
              <div className="history-header">
                <h3>{item.title}</h3>
                <span className={`status-badge ${getStatusClass(item.status)}`}>
                  {item.status}
                </span>
              </div>
              <div className="history-content">
                <p><strong>Date:</strong> {new Date(item.date).toLocaleDateString()}</p>
                <p><strong>Reviewer:</strong> {item.reviewer}</p>
                <p><strong>Files:</strong> {item.files.join(', ')}</p>
                <div className="action-timeline">
                  <strong>Actions:</strong>
                  <div className="timeline">
                    {item.actions.map((action, index) => (
                      <div className="timeline-item" key={index}>
                        <div className="timeline-dot"></div>
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
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

export default StudentDashboard;