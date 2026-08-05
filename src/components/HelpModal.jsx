import { useState } from 'react';
import './HelpModal.css';

const FAQ_ITEMS = [
  {
    category: 'Account & Login',
    icon: null,
    questions: [
      {
        q: "Why can't I log in?",
        a: "Make sure you are using the correct email and password associated with your UREB account. If you forgot your password, click the \"Forgot Password\" link on the login page to reset it. If you still cannot access your account, contact your institution's UREB administrator for assistance.",
      },
      {
        q: 'I forgot my password. How do I reset it?',
        a: 'On the login page, click the "Forgot Password" link. Enter your registered email address, and you will receive a password reset link. Follow the instructions in the email to create a new password.',
      },
      {
        q: 'My account is locked after too many failed attempts',
        a: 'After multiple failed login attempts, your account may be temporarily locked for security reasons. Wait 15 minutes and try again, or contact your UREB administrator to unlock your account.',
      },
      {
        q: 'How do I create a new account?',
        a: 'Click the "Register" button on the login page. Fill in your name, email, institutional affiliation, and create a password. You will receive a confirmation email — verify your email to complete registration.',
      },
    ],
  },
  {
    category: 'Research Protocols',
    icon: null,
    questions: [
      {
        q: 'How do I submit a research protocol?',
        a: 'Log in to your dashboard, click "New Submission," fill in the required details about your research, upload the necessary documents, and click "Submit." Your protocol will then go through the initial review and board review process.',
      },
      {
        q: 'What happens after I submit my protocol?',
        a: 'Your submission goes through three stages: Initial Review (to check completeness), Board Review (ethical evaluation by the UREB board), and Decision & Feedback (you receive approval, conditional approval, or revision requests).',
      },
      {
        q: 'How do I know the status of my submission?',
        a: 'You can track your submission status from your dashboard. Each submission will show its current stage — Pending Review, Under Review, Approved, or Requires Revisions.',
      },
      {
        q: 'Can I update my protocol after submission?',
        a: 'If your protocol is still under review, you may need to wait for a decision first. If revisions are requested, you can submit an amended version. For minor amendments, use the "Amend Protocol" feature if available.',
      },
    ],
  },
  {
    category: 'System & Technical',
    icon: null,
    questions: [
      {
        q: 'The page is loading slowly or not responding',
        a: 'Try refreshing the page (F5 or Ctrl+R). Clear your browser cache if the issue persists. If the problem continues, it may be a server-side issue — please try again in a few minutes or contact support.',
      },
      {
        q: "I'm getting an error message",
        a: 'Note the exact error message and try the action again. If the error persists, take a screenshot and send it to the support team at reo@dorsu.edu.ph with a description of what you were doing when the error occurred.',
      },
      {
        q: 'Which browsers are supported?',
        a: 'The UREB system works best on modern browsers including Google Chrome, Mozilla Firefox, Microsoft Edge, and Safari. Please ensure your browser is up to date for the best experience.',
      },
      {
        q: 'Can I use the system on my mobile device?',
        a: 'Yes, the UREB system is responsive and works on mobile devices. For the best experience on smaller screens, we recommend using the mobile bottom navigation menu.',
      },
    ],
  },
  {
    category: 'Documents & Files',
    icon: null,
    questions: [
      {
        q: 'What file formats are accepted for uploads?',
        a: 'Accepted formats include PDF, DOC, DOCX, XLS, XLSX, and PNG. The maximum file size is 10MB per file. If your file exceeds this limit, try compressing it or splitting it into smaller parts.',
      },
      {
        q: 'I uploaded the wrong file. Can I replace it?',
        a: 'If your submission is still in the initial review stage, you may be able to replace the file. Once the board review has started, you will need to submit an amendment with the corrected file.',
      },
      {
        q: 'How do I upload multiple files?',
        a: 'Use the file upload button in the submission form. You can select multiple files at once by holding Ctrl (or Cmd on Mac) while clicking the files. Each file must be under 10MB.',
      },
    ],
  },
  {
    category: 'Privacy & Security',
    icon: null,
    questions: [
      {
        q: 'Is my data safe and confidential?',
        a: 'Yes. All personal and research data submitted through the UREB system is treated as confidential. We implement appropriate security measures to protect your data and do not share it with third parties without your explicit consent.',
      },
      {
        q: 'Who can see my research protocol?',
        a: 'Only authorized UREB board members and reviewers involved in the ethics review process can access your submission. Your data is not shared with anyone outside the review team without your permission.',
      },
      {
        q: 'How do I delete my account or data?',
        a: 'To request account deletion or data removal, contact the UREB office at reo@dorsu.edu.ph with your request. Please note that some data may be retained for institutional record-keeping purposes as required by policy.',
      },
    ],
  },
];

const HelpModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleQuestion = (index) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  const filteredItems = FAQ_ITEMS.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (q) =>
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.category.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.questions.length > 0);

  const allQuestionsCount = FAQ_ITEMS.reduce(
    (sum, cat) => sum + cat.questions.length,
    0
  );

  const handleContactSupport = () => {
    window.location.href = "mailto:reo@dorsu.edu.ph?subject=UREB System Help Request";
  };

  return (
    <div className="help-modal-overlay" onClick={handleOverlayClick}>
      <div className="help-modal-container">
        <button className="help-modal-close" onClick={onClose} aria-label="Close modal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <div className="help-modal-content">
          <div className="help-modal-header">
            <div className="help-header-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2>How Can I Help You?</h2>
            <p>Search for answers or browse common questions below</p>
          </div>

          <div className="help-search-wrapper">
            <div className="help-search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-medium)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Describe your problem, e.g. 'why can't I log in?'"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setExpandedQuestion(null);
                }}
                className="help-search-input"
              />
              {searchQuery && (
                <button
                  className="help-search-clear"
                  onClick={() => {
                    setSearchQuery("");
                    setExpandedQuestion(null);
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="help-stats">
            <span>{allQuestionsCount} help topics available</span>
            {searchQuery && (
              <span className="help-search-result-count">
                {filteredItems.reduce((sum, cat) => sum + cat.questions.length, 0)} results for "{searchQuery}"
              </span>
            )}
          </div>

          <div className="help-body-wrapper">
            <div className="help-body">
            {filteredItems.length === 0 ? (
              <div className="help-no-results">
                <div className="help-no-results-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-medium)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3>No results found</h3>
                <p>We couldn't find any help topics matching "{searchQuery}".</p>
                <p>Try a different search term or <a href="#" onClick={(e) => { e.preventDefault(); handleContactSupport(); }}>contact support</a> for personalized help.</p>
              </div>
            ) : (
              filteredItems.map((category, catIndex) => (
                <div key={catIndex} className="help-category">
                  <div className="help-category-header">
                    <span className="help-category-label">{category.category}</span>
                    <h3>{category.category}</h3>
                    <span className="help-category-count">{category.questions.length}</span>
                  </div>
                  <div className="help-category-questions">
                    {category.questions.map((item, qIndex) => {
                      const globalIndex = catIndex * 100 + qIndex;
                      const isExpanded = expandedQuestion === globalIndex;
                      return (
                        <div key={qIndex} className="help-question-item">
                          <button
                            className={`help-question-btn ${isExpanded ? "expanded" : ""}`}
                            onClick={() => toggleQuestion(globalIndex)}
                          >
                            <span className="help-question-text">{item.q}</span>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`help-chevron ${isExpanded ? "rotated" : ""}`}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                          {isExpanded && (
                            <div className="help-answer">
                              <p>{item.a}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="help-footer">
            <p>Still need help? Our team is here for you.</p>
            <button className="btn-primary help-contact-btn" onClick={handleContactSupport}>
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
