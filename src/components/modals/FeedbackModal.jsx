import { useState } from 'react';
import '../../styles/FeedbackModal.css';

const FEELING_EMOJIS = [
  { emoji: '😡', label: 'Frustrated', value: 1 },
  { emoji: '😕', label: 'Disappointed', value: 2 },
  { emoji: '😐', label: 'Neutral', value: 3 },
  { emoji: '😊', label: 'Satisfied', value: 4 },
  { emoji: '🤩', label: 'Love it', value: 5 },
];

const CATEGORIES = [
  { value: 'bug', label: '🐛 Bug Report', desc: 'Something is broken or not working as expected' },
  { value: 'feature', label: '✨ Feature Request', desc: 'Suggest a new feature or improvement' },
  { value: 'improvement', label: '⚡ Improvement', desc: 'An idea to make the system better' },
  { value: 'general', label: '💬 General Feedback', desc: 'General thoughts or comments' },
];

const FeedbackModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'researcher',
    category: '',
    feeling: 3,
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Feedback submitted:', formData);
    setSubmitted(true);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setFormData({
      name: '',
      email: '',
      role: 'researcher',
      category: '',
      feeling: 3,
      subject: '',
      message: '',
    });
    onClose();
  };

  return (
    <div className="feedback-modal-overlay" onClick={handleOverlayClick}>
      <div className="feedback-modal-container">
        <button className="feedback-modal-close" onClick={handleClose} aria-label="Close modal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        {submitted ? (
          <div className="feedback-success">
            <div className="feedback-success-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2>Thank You! </h2>
            <p>Your feedback has been received. We appreciate your input and will work to make the UREB system better.</p>
            <button className="btn-primary feedback-done-btn" onClick={handleClose}>
              Done
            </button>
          </div>
        ) : (
          <div className="feedback-modal-content">
            <div className="feedback-modal-header">
              <h2>Send Us Feedback</h2>
              <p>Help us improve the UREB system. We value your input!</p>
            </div>

            <form className="feedback-form" onSubmit={handleSubmit}>
              <div className="feedback-form-row">
                <div className="feedback-form-group">
                  <label htmlFor="feedback-name">Name</label>
                  <input
                    type="text"
                    id="feedback-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div className="feedback-form-group">
                  <label htmlFor="feedback-email">Email</label>
                  <input
                    type="email"
                    id="feedback-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className="feedback-form-group">
                <label htmlFor="feedback-role">I am a</label>
                <select
                  id="feedback-role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="researcher">Researcher</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="admin">Admin</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="feedback-form-group">
                <label>Category</label>
                <div className="feedback-category-grid">
                  {CATEGORIES.map((cat) => (
                    <div
                      key={cat.value}
                      className={`feedback-category-card ${formData.category === cat.value ? 'selected' : ''}`}
                      onClick={() => setFormData((prev) => ({ ...prev, category: cat.value }))}
                    >
                      <span className="feedback-category-label">{cat.label}</span>
                      <span className="feedback-category-desc">{cat.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="feedback-form-group">
                <label>How do you feel about the system?</label>
                <div className="feedback-emoji-rating">
                  {FEELING_EMOJIS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={`feedback-emoji-btn ${formData.feeling === item.value ? 'active' : ''}`}
                      onClick={() => setFormData((prev) => ({ ...prev, feeling: item.value }))}
                    >
                      <span className="feedback-emoji">{item.emoji}</span>
                      <span className="feedback-emoji-label">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="feedback-form-group">
                <label htmlFor="feedback-subject">Subject</label>
                <input
                  type="text"
                  id="feedback-subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Brief summary of your feedback"
                  required
                />
              </div>

              <div className="feedback-form-group">
                <label htmlFor="feedback-message">Message</label>
                <textarea
                  id="feedback-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us what you think..."
                  rows="5"
                  required
                />
              </div>

              <button type="submit" className="btn-primary feedback-submit-btn">
                Submit Feedback
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
