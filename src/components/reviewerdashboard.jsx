import { useState, useEffect } from 'react';

import './reviewerdashboard.css';

import { getProposalsByReviewer, getReviewsByReviewer, getMessagesByUser } from '../services/api';



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



const ReviewerDashboard = ({ onLogout }) => {

  const [activeTab, setActiveTab] = useState('dashboard');

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [userInfo, setUserInfo] = useState({ name: 'Reviewer', email: 'reviewer@ureb.edu' });

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

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



  const menuItems = [

    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },

    { id: 'assigned-proposals', label: 'Assigned Proposals', icon: <FileCheckIcon /> },

    { id: 'pending-reviews', label: 'Pending Reviews', icon: <ClockIcon /> },

    { id: 'submit-complete-review', label: 'Submit Complete Review', icon: <SubmitReviewIcon /> },

    { id: 'messages', label: 'Messages', icon: <MessageIcon /> },

  ];



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



  const renderContent = () => {

    switch (activeTab) {

      case 'dashboard':

        return <DashboardContent />;

      case 'assigned-proposals':

        return <AssignedProposalsContent />;

      case 'pending-reviews':

        return <PendingReviewsContent />;

      case 'submit-complete-review':

        return <SubmitCompleteReviewContent />;

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

          <h2>Reviewer Portal</h2>

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

const DashboardContent = () => {

  const [searchQuery, setSearchQuery] = useState('');

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

      const [proposals, reviews, messages] = await Promise.all([

        getProposalsByReviewer(userEmail),

        getReviewsByReviewer(userEmail),

        getMessagesByUser(userEmail)

      ]);



      const pendingReviews = reviews.filter(r => r.status === 'pending').length;

      const completedReviews = reviews.filter(r => r.status === 'completed').length;

      const unreadMessages = messages.filter(m => !m.read).length;



      const activities = generateRecentActivity(proposals, reviews, messages);



      setStats({

        assignedProposals: proposals.length,

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

      

      <div className="dashboard-search">

        <div className="search-bar">

          <SearchIcon />

          <input

            type="text"

            placeholder="Search proposals, reviews, or messages..."

            value={searchQuery}

            onChange={(e) => setSearchQuery(e.target.value)}

          />

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

        

        <div className="quick-actions">

          <h2>Quick Actions</h2>

          <div className="action-buttons">

            <button className="action-btn primary">View Assigned Proposals</button>

            <button className="action-btn secondary">Submit Review</button>

            <button className="action-btn secondary">View Messages</button>

            <button className="action-btn secondary">Download Guidelines</button>

          </div>

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

              <h3>Attached Files</h3>

              <div className="files-list">

                {Object.entries(proposal.files).map(([key, file]) => (

                  file && (

                    <div className="file-item" key={key}>

                      <span className="file-name">{key}: {typeof file === 'string' ? file : (file.originalname || 'File attached')}</span>

                    </div>

                  )

                ))}

              </div>

            </div>

          )}

        </div>

        <div className="modal-footer">

          <button className="btn-secondary" onClick={onClose}>Close</button>

          <button className="btn-primary">Start Review</button>

        </div>

      </div>

    </div>

  );

};



const AssignedProposalsContent = () => {

  const [proposals, setProposals] = useState([]);

  const [loading, setLoading] = useState(true);

  const [selectedProposal, setSelectedProposal] = useState(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);



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

      setProposals(data);

    } catch (error) {

      console.error('Error fetching proposals:', error);

    } finally {

      setLoading(false);

    }

  };



  const handleViewDetails = (proposal) => {

    setSelectedProposal(proposal);

    setIsViewModalOpen(true);

  };



  const handleCloseModal = () => {

    setIsViewModalOpen(false);

    setSelectedProposal(null);

  };



  if (loading) {

    return (

      <div className="content-section">

        <h2>Assigned Proposals</h2>

        <div className="loading-state">Loading proposals...</div>

      </div>

    );

  }



  if (proposals.length === 0) {

    return (

      <div className="content-section">

        <h2>Assigned Proposals</h2>

        <div className="empty-state">No proposals assigned to you yet.</div>

      </div>

    );

  }



  return (

    <div className="content-section">

      <h2>Assigned Proposals</h2>

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

              <div className="proposal-meta">

                <span>Submitted: {proposal.submissionDate ? new Date(proposal.submissionDate).toLocaleDateString() : 'N/A'}</span>

                <span>Date of Application: {proposal.dateOfApplication ? new Date(proposal.dateOfApplication).toLocaleDateString() : 'N/A'}</span>

              </div>

            </div>

            <div className="proposal-actions">

              <button className="btn-primary">

                {proposal.status === 'In Progress' ? 'Continue Review' : 'Start Review'}

              </button>

              <button className="btn-secondary" onClick={() => handleViewDetails(proposal)}>View Details</button>

            </div>

          </div>

        ))}

      </div>

      <ProposalDetailsModal

        isOpen={isViewModalOpen}

        onClose={handleCloseModal}

        proposal={selectedProposal}

      />

    </div>

  );

};



const PendingReviewsContent = () => {

  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    const savedUser = localStorage.getItem('ureb_user');

    if (savedUser) {

      const user = JSON.parse(savedUser);

      fetchReviews(user.email);

    }

  }, []);



  const fetchReviews = async (userEmail) => {

    if (!userEmail) return;

    setLoading(true);

    try {

      const data = await getReviewsByReviewer(userEmail);

      const pendingReviews = data.filter(r => r.status === 'pending' || r.status === 'in-progress');

      setReviews(pendingReviews);

    } catch (error) {

      console.error('Error fetching reviews:', error);

    } finally {

      setLoading(false);

    }

  };



  if (loading) {

    return (

      <div className="content-section">

        <h2>Pending Reviews</h2>

        <div className="loading-state">Loading reviews...</div>

      </div>

    );

  }



  if (reviews.length === 0) {

    return (

      <div className="content-section">

        <h2>Pending Reviews</h2>

        <div className="empty-state">No pending reviews. Great job!</div>

      </div>

    );

  }



  return (

    <div className="content-section">

      <h2>Pending Reviews</h2>

      <div className="reviews-list">

        {reviews.map((review) => (

          <div className="review-item" key={review._id || review.id}>

            <div className="review-header">

              <h3>{review.proposalId || review._id}</h3>

              <span className={`priority-badge ${review.priority?.toLowerCase() || 'medium'}`}>

                {review.priority || 'Medium'} Priority

              </span>

            </div>

            <div className="review-content">

              <h4>{review.proposalTitle || 'Untitled Proposal'}</h4>

              <p>{review.description || review.abstract || 'No description available'}</p>

              <div className="review-progress">

                <div className="progress-bar">

                  <div className="progress-fill" style={{width: `${review.progress || 0}%`}}></div>

                </div>

                <span>{review.progress || 0}% Complete</span>

              </div>

            </div>

            <div className="review-actions">

              <button className="btn-primary">Complete Review</button>

              <button className="btn-secondary">Save Draft</button>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

};



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

              {!message.read && <span className="unread-badge">New</span>}

            </div>

            <div className="message-content">

              <h4>{message.subject || 'No Subject'}</h4>

              <p>{message.message || 'No content'}</p>

            </div>

            <div className="message-actions">

              {!message.read && (

                <button className="btn-secondary">Mark as Read</button>

              )}

              <button className="btn-primary">Reply</button>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

};



const SubmitCompleteReviewContent = () => {

  const [proposals, setProposals] = useState([]);

  const [loading, setLoading] = useState(true);

  const [selectedProposal, setSelectedProposal] = useState(null);

  const [reviewData, setReviewData] = useState({

    overallRating: '',

    comments: '',

    recommendations: '',

    status: 'completed'

  });

  const [submitting, setSubmitting] = useState(false);



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

      const inProgressProposals = data.filter(p => p.status === 'In Progress');

      setProposals(inProgressProposals);

    } catch (error) {

      console.error('Error fetching proposals:', error);

    } finally {

      setLoading(false);

    }

  };



  const handleInputChange = (e) => {

    const { name, value } = e.target;

    setReviewData(prev => ({

      ...prev,

      [name]: value

    }));

  };



  const handleSubmitReview = async (e) => {

    e.preventDefault();

    if (!selectedProposal) return;



    setSubmitting(true);

    try {

      // Here you would submit the review to your API

      console.log('Submitting review:', {

        proposalId: selectedProposal._id,

        reviewData,

        reviewerEmail: JSON.parse(localStorage.getItem('ureb_user')).email

      });



      // Show success message

      alert('Review submitted successfully!');

      

      // Reset form

      setSelectedProposal(null);

      setReviewData({

        overallRating: '',

        comments: '',

        recommendations: '',

        status: 'completed'

      });

      

      // Refresh proposals

      const user = JSON.parse(localStorage.getItem('ureb_user'));

      fetchProposals(user.email);

    } catch (error) {

      console.error('Error submitting review:', error);

      alert('Failed to submit review. Please try again.');

    } finally {

      setSubmitting(false);

    }

  };



  if (loading) {

    return (

      <div className="content-section">

        <h2>Submit Complete Review</h2>

        <div className="loading-state">Loading proposals...</div>

      </div>

    );

  }



  if (proposals.length === 0) {

    return (

      <div className="content-section">

        <h2>Submit Complete Review</h2>

        <div className="empty-state">

          <p>No proposals in progress to review.</p>

          <p>Go to "Assigned Proposals" to start reviewing a proposal.</p>

        </div>

      </div>

    );

  }



  return (

    <div className="content-section">

      <h2>Submit Complete Review</h2>

      

      <div className="review-submission-form">

        <div className="form-section">

          <h3>Select Proposal to Review</h3>

          <div className="proposal-selection">

            {proposals.map((proposal) => (

              <div 

                key={proposal._id}

                className={`proposal-card ${selectedProposal?._id === proposal._id ? 'selected' : ''}`}

                onClick={() => setSelectedProposal(proposal)}

              >

                <div className="proposal-header">

                  <h4>{proposal.protocolCode || proposal._id}</h4>

                  <span className="status-badge in-progress">In Progress</span>

                </div>

                <div className="proposal-content">

                  <h5>{proposal.researchTitle || 'Untitled Proposal'}</h5>

                  <p><strong>Proponent:</strong> {proposal.proponent || 'N/A'}</p>

                </div>

              </div>

            ))}

          </div>

        </div>



        {selectedProposal && (

          <form onSubmit={handleSubmitReview} className="review-form">

            <div className="form-section">

              <h3>Review Details for {selectedProposal.protocolCode || selectedProposal._id}</h3>

              

              <div className="form-group">

                <label>Overall Rating</label>

                <select 

                  name="overallRating"

                  value={reviewData.overallRating}

                  onChange={handleInputChange}

                  required

                >

                  <option value="">Select rating</option>

                  <option value="Excellent">Excellent</option>

                  <option value="Good">Good</option>

                  <option value="Acceptable">Acceptable</option>

                  <option value="Needs Revision">Needs Revision</option>

                  <option value="Reject">Reject</option>

                </select>

              </div>



              <div className="form-group">

                <label>Review Comments</label>

                <textarea 

                  name="comments"

                  value={reviewData.comments}

                  onChange={handleInputChange}

                  placeholder="Provide detailed comments about the proposal..."

                  rows="6"

                  required

                />

              </div>



              <div className="form-group">

                <label>Recommendations</label>

                <textarea 

                  name="recommendations"

                  value={reviewData.recommendations}

                  onChange={handleInputChange}

                  placeholder="Provide recommendations for improvement or approval..."

                  rows="4"

                  required

                />

              </div>



              <div className="form-actions">

                <button 

                  type="button" 

                  className="btn-secondary"

                  onClick={() => {

                    setSelectedProposal(null);

                    setReviewData({

                      overallRating: '',

                      comments: '',

                      recommendations: '',

                      status: 'completed'

                    });

                  }}

                >

                  Cancel

                </button>

                <button 

                  type="submit" 

                  className="btn-primary"

                  disabled={submitting}

                >

                  {submitting ? 'Submitting...' : 'Submit Complete Review'}

                </button>

              </div>

            </div>

          </form>

        )}

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


export default ReviewerDashboard;