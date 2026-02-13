import { useState, useEffect } from 'react';
import LoginModal from './LoginModal';
import { sendMessage } from '../services/api.js';
import './LandingPage.css';

// Icons as simple SVG components
const ShieldIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const FileCheckIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <path d="m9 15 2 2 4-4"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
    <path d="m12 5 7 7-7 7"/>
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

const Navbar = ({ onLoginClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Services', href: '#services' },
    { name: 'About', href: '#about' },
    { name: 'Process', href: '#process' },
  ];

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <a href="#home" className="logo">
          <ShieldIcon />
          <span>University Research Ethics Board</span>
        </a>
        
        <div className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <button className="nav-cta" onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }}>Login</button>
        </div>

        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </div>
    </nav>
  );
};

const Hero = () => (
  <section id="home" className="hero">
    <div className="hero-container">
      <div className="hero-content">
        <h1 className="hero-title">
          Track and Manage.<br />
          <span className="highlight">Research Protocols</span> with ease.
        </h1>
        <p className="hero-description">
          Supporting researchers in conducting ethical, responsible, and impactful research. 
          We review and approve research protocols to ensure the protection of human participants 
          and the integrity of research endeavors.
        </p>
        <div className="hero-cta">
          <a href="#apply" className="btn-primary">
            Submit Application <ArrowRightIcon />
          </a>
          <a href="#services" className="btn-secondary">
            Learn More
          </a>
        </div>
      </div>
      <div className="hero-visual">
        <div className="hero-card">
          <ShieldIcon />
          <h3>Trusted by Researchers</h3>
          <p>500+ applications reviewed annually</p>
        </div>
        <div className="hero-card card-2">
          <ClockIcon />
          <h3>Efficient Process</h3>
          <p>Average 14-day review time</p>
        </div>
      </div>
    </div>
    <div className="hero-scroll">
      <div className="scroll-indicator"></div>
    </div>
  </section>
);

const Services = () => {
  const services = [
    {
      icon: <FileCheckIcon />,
      title: 'Protocol Review',
      description: 'Comprehensive ethical review of research protocols involving human participants, ensuring compliance with ethical standards.',
    },
    {
      icon: <UsersIcon />,
      title: 'Consultation',
      description: 'Expert guidance on research ethics, study design, and participant protection strategies for your research project.',
    },
    {
      icon: <ClockIcon />,
      title: 'Expedited Review',
      description: 'Fast-track review process for minimal risk research and minor protocol amendments to save your time.',
    },
    {
      icon: <ShieldIcon />,
      title: 'Continuing Review',
      description: 'Ongoing oversight and annual review of approved research to ensure continued ethical compliance.',
    },
  ];

  return (
    <section id="services" className="services">
      <div className="section-container">
        <div className="section-header">
          <span className="section-badge">Our Services</span>
          <h2 className="section-title">Comprehensive Ethics Support</h2>
          <p className="section-description">
            We provide a full range of ethical review services to support your research journey
          </p>
        </div>
        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card">
              <div className="service-icon">{service.icon}</div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const About = () => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const team = [
    {
      name: 'Dr. Melay Antonio',
      role: 'UREB Director',
      description: 'Leading the UREB with over 15 years of experience in research ethics and participant protection.',
      image: '/Dr.Emily.png'
    },
    {
      name: 'Mary Grace Obenza',
      role: 'UREB Technical Assistant',
      description: 'Managing protocol reviews and providing guidance on ethical research practices.',
      image: '/Ms.Obenza.png'
    },
    {
      name: 'Mary Cris Decena',
      role: 'UREB Technical Assistant',
      description: 'Specializing in biomedical research ethics and regulatory compliance.',
      image: '/Ms.Cris.png'
    },
    {
      name: 'Ermelyn Padalapat', 
      role: 'Web Designer',
      description: 'Specializing in biomedical research ethics and regulatory compliance.',
      image: '/Ermelyn.png'
    },
    {
      name: 'Kristofer John Sarmiento',
      role: 'System Developer',
      description: 'Developing and maintaining the UREB online portal and submission system.',
      image: '/Kristoff.png'
    }
  ];

  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedMember(null);
    setIsModalOpen(false);
  };

  return (
    <section id="about" className="about">
      <div className="section-container">
        <div className="section-header">
          <span className="section-badge">Our Team</span>
          <h2 className="section-title">Meet Our Experts</h2>
          <p className="section-description">
            Dedicated professionals committed to ethical research excellence
          </p>
        </div>
        <div className="team-grid">
          {team.map((member, index) => (
            <div key={index} className="team-card">
              <div className="team-avatar" onClick={() => handleMemberClick(member)} style={{ cursor: 'pointer' }}>
                {member.image ? (
                  <img src={member.image} alt={member.name} className="team-image" />
                ) : (
                  <div className="avatar-placeholder">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
              </div>
              <div className="team-info">
                <h3 className="team-name">{member.name}</h3>
                <span className="team-role">{member.role}</span>
                <p className="team-description">{member.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Process = () => {
  const steps = [
    {
      number: '01',
      title: 'Submit Application',
      description: 'Complete our online application form with your research protocol and supporting documents.',
    },
    {
      number: '02',
      title: 'Initial Review',
      description: 'Our team conducts a preliminary review to ensure all required materials are included.',
    },
    {
      number: '03',
      title: 'Board Review',
      description: 'The full board or designated reviewer evaluates your protocol for ethical compliance.',
    },
    {
      number: '04',
      title: 'Decision & Feedback',
      description: 'Receive approval, conditional approval, or revision requests with detailed guidance.',
    },
  ];

  return (
    <section id="process" className="process">
      <div className="section-container">
        <div className="section-header">
          <span className="section-badge">Application Process</span>
          <h2 className="section-title">Simple, Transparent Steps</h2>
          <p className="section-description">
            Our streamlined process ensures efficient review while maintaining thorough ethical evaluation
          </p>
        </div>
        <div className="process-grid">
          {steps.map((step, index) => (
            <div key={index} className="process-card">
              <span className="process-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Contact = ({ onMessageClick }) => (
  <section id="contact" className="contact">
    <div className="section-container">
      <div className="contact-grid">
        <div className="contact-info">
          <span className="section-badge">Get in Touch</span>
          <h2 className="section-title">We're Here to Help</h2>
          <p className="contact-text">
            Have questions about your research protocol or the ethics review process? 
            Our team is ready to assist you.
          </p>
          <div className="contact-details">
            <div className="contact-item">
              <strong>Email</strong>
              <span>ureb@university.edu</span>
            </div>
            <div className="contact-item">
              <strong>Office Hours</strong>
              <span>Monday - Friday, 9:00 AM - 5:00 PM</span>
            </div>
            <div className="contact-item">
              <strong>Location</strong>
              <span>Research Administration Building, Room 301</span>
            </div>
          </div>
        </div>
        <div className="contact-cta-card" id="apply">
          <ShieldIcon />
          <h3>Message Us We are Here to Help</h3>
          <p>Start your ethics review process today. Our online portal makes submission quick and easy.</p>
          <button className="btn-primary" onClick={onMessageClick}>Message Us</button>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="footer">
    <div className="footer-container">
      <div className="footer-main">
        <div className="footer-brand">
          <div className="footer-logo">
            <ShieldIcon />
            <span>University Research Ethics Board</span>
          </div>
          <p className="footer-tagline">
            Protecting research participants, promoting ethical research excellence.
          </p>
        </div>
        <div className="footer-links">
          <div className="footer-column">
            <h4>Quick Links</h4>
            <a href="#home">Home</a>
            <a href="#services">Services</a>
            <a href="#about">About</a>
            <a href="#process">Process</a>
          </div>
          <div className="footer-column">
            <h4>Resources</h4>
            <a href="#">Guidelines</a>
            <a href="#">Forms</a>
            <a href="#">FAQ</a>
            <a href="#">Policies</a>
          </div>
          <div className="footer-column">
            <h4>Contact</h4>
            <a href="mailto:ureb@university.edu">ureb@university.edu</a>
            <span>Research Admin Building</span>
            <span>Room 301</span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} University Research Ethics Board. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

const MessageModal = ({ isOpen, onClose, setIsSuccessModalOpen }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Message submitted:', formData);
    
    try {
      const messageData = {
        senderEmail: formData.email,
        senderName: formData.name,
        recipientEmail: 'admin@ureb.edu', // Send to admin
        subject: 'Message from Researcher',
        message: formData.message
      };
      
      const result = await sendMessage(messageData);
      
      if (result.success) {
        // Show success modal instead of alert
        setIsSuccessModalOpen(true);
        setFormData({ name: '', email: '', message: '' });
        onClose();
      } else {
        alert(`Error: ${result.error || 'Failed to send message'}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="message-modal-overlay" onClick={handleOverlayClick}>
      <div className="message-modal-container">
        <button className="message-modal-close" onClick={onClose} aria-label="Close modal">
          <XIcon />
        </button>
        <div className="message-modal-content">
          <div className="message-modal-header">
            <ShieldIcon />
            <h2>Send us a Message</h2>
            <p>We'd love to hear from you. Send us your questions or feedback.</p>
          </div>
          <form className="message-modal-form" onSubmit={handleSubmit}>
            <div className="message-form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="message-form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                required
              />
            </div>
            <div className="message-form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Type your message here..."
                rows="5"
                required
              />
            </div>
            <button type="submit" className="btn-primary message-modal-submit">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const ThankYouModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container small">
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <XIcon />
        </button>
        <div className="modal-header">
          <h2>Thank You!</h2>
        </div>
        <div className="modal-body">
          <div className="success-content" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="success-icon" style={{ marginBottom: '16px' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <p className="success-message" style={{ textAlign: 'center', margin: '0' }}>Thank you for your message! We will get back to you soon.</p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
};

const LandingPage = ({ onLogin, onRegister }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const openMessageModal = () => setIsMessageModalOpen(true);
  const closeMessageModal = () => setIsMessageModalOpen(false);
  const closeThankYouModal = () => setIsSuccessModalOpen(false);

  return (
    <div className="landing-page">
      <Navbar onLoginClick={openLoginModal} />
      <main>
        <Hero />
        <Services />
        <About />
        <Process />
        <Contact onMessageClick={openMessageModal} />
      </main>
      <Footer />
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} onLogin={onLogin} onRegister={onRegister} />
      <MessageModal isOpen={isMessageModalOpen} onClose={closeMessageModal} setIsSuccessModalOpen={setIsSuccessModalOpen} />
      <ThankYouModal isOpen={isSuccessModalOpen} onClose={closeThankYouModal} />
    </div>
  );
};

export default LandingPage;
