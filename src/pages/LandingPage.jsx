import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import LoginModal from '../components/modals/LoginModal';
import TermsModal from '../components/modals/TermsModal';
import PrivacyModal from '../components/modals/PrivacyModal';
import FeedbackModal from '../components/modals/FeedbackModal';
import HelpModal from '../components/modals/HelpModal';
import { sendMessage } from '../services/api.js';
import '../styles/LandingPage.css';

const useScrollReveal = () => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);
};

// Icons as simple SVG components
const ShieldIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const FileCheckIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="m9 15 2 2 4-4" />
  </svg>
);

const UsersIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ClockIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
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

const ZapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const HelpCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const FileTextIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const LayersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const MessageSquareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const WorkflowIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <path d="M10 6.5h4" />
    <path d="M17.5 10v4" />
  </svg>
);

const MobileBottomNav = ({ onLoginClick }) => {
  const mobileLinks = [
    {
      name: 'Home', href: '#home',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      name: 'Services', href: '#services',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="m9 15 2 2 4-4" />
        </svg>
      ),
    },
    {
      name: 'About', href: '#about',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      name: 'Process', href: '#process',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
    },
    {
      name: 'Login', href: null,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {mobileLinks.map((item) =>
        item.href ? (
          <a key={item.name} href={item.href} className="mobile-bottom-nav-item">
            {item.icon}
            <span>{item.name}</span>
          </a>
        ) : (
          <button key={item.name} className="mobile-bottom-nav-item mobile-bottom-nav-login" onClick={onLoginClick}>
            {item.icon}
            <span>{item.name}</span>
          </button>
        )
      )}
    </nav>
  );
};

const Navbar = ({ onLoginClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);

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
    <>
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <a href="#home" className="logo">
            <img src="/UREBLOGO.png" alt="UREB Logo" className="navbar-logo-img" />
            <span>University Research Ethics Board</span>
          </a>
          <div className="nav-links">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href}>{link.name}</a>
            ))}
            <button className="nav-cta" onClick={onLoginClick}>Login</button>
          </div>
        </div>
      </nav>
      <MobileBottomNav onLoginClick={onLoginClick} />
    </>
  );
};

const Hero = () => {
  const imageRef = useRef(null);

  const handleMouseMove = (e) => {
    const el = imageRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `rotateY(${x * 16}deg) rotateX(${y * -12}deg) scale(1.03)`;
  };

  const handleMouseLeave = () => {
    if (imageRef.current) imageRef.current.style.transform = '';
  };

  return (
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
        </div>
        <div className="hero-visual" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
          <div className="hero-mockup-float">
            <img
              ref={imageRef}
              src="/ureb-mockup2.png"
              alt="UREB System preview"
              className="hero-mockup-image"
            />
          </div>
        </div>
      </div>
      <div className="hero-scroll">
        <div className="scroll-indicator"></div>
      </div>

      
    </section>
  );
};

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
    <section id="services" className="services reveal-on-scroll">
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

const PARTICLE_COLOR = '122, 158, 126';
const PARTICLE_LINK_DISTANCE = 130;

const ParticleNetwork = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let particles = [];
    let animationId = null;

    const createParticles = () => {
      const count = Math.max(24, Math.min(70, Math.floor((width * height) / 9000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 1.2,
      }));
    };

    const resize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createParticles();
    };

    const step = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x <= 0 || p.x >= width) p.vx *= -1;
        if (p.y <= 0 || p.y >= height) p.vy *= -1;
        p.x = Math.max(0, Math.min(width, p.x));
        p.y = Math.max(0, Math.min(height, p.y));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${PARTICLE_COLOR}, 0.8)`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < PARTICLE_LINK_DISTANCE) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${PARTICLE_COLOR}, ${(1 - dist / PARTICLE_LINK_DISTANCE) * 0.55})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      if (!prefersReducedMotion) {
        animationId = requestAnimationFrame(step);
      }
    };

    resize();
    step();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="about-particles" aria-hidden="true" />;
};

const About = () => {
  const [isOrgChartOpen, setIsOrgChartOpen] = useState(false);

  useEffect(() => {
    if (isOrgChartOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOrgChartOpen]);

  return (
    <section id="about" className="about reveal-on-scroll">
      <ParticleNetwork />
      <div className="section-container">
        <div className="section-header">
          <span className="section-badge">Our Team</span>
          <h2 className="section-title">Meet Our Experts</h2>
          <p className="section-description">
            Dedicated professionals committed to ethical research excellence
          </p>
        </div>
        <div className="orgchart-trigger-wrap">
          <button
            type="button"
            className="orgchart-trigger"
            onClick={() => setIsOrgChartOpen(true)}
          >
            <UsersIcon />
            <span>View Organizational Chart</span>
          </button>
        </div>
      </div>

      {isOrgChartOpen && createPortal(
        <div
          className="orgchart-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setIsOrgChartOpen(false)}
        >
          <button
            className="orgchart-modal-close"
            onClick={() => setIsOrgChartOpen(false)}
            aria-label="Close organizational chart"
          >
            <XIcon />
          </button>
          <div className="orgchart-modal-container">
            <img
              src="/ORGCHART.png"
              alt="UREB Organizational Chart"
              className="orgchart-modal-image"
            />
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};

const Process = () => {
  const steps = [
    {
      number: 'A',
      title: 'No Human Participants',
      description: 'If there are no human participants (primary or secondary data), the preliminary reviewer evaluates the proposal and issues a Certificate of No Human Participants. (1 week)',
    },
    {
      number: 'B',
      title: 'Certificate Received',
      description: 'Upon receipt of the Certificate of No Human Participants, the study can be conducted.',
    },
    {
      number: '01',
      title: 'Register & Upload',
      description: 'Study with human participants: register and upload required documents to the UREB database. (1 week)',
    },
    {
      number: '02',
      title: 'Preliminary Review',
      description: 'UREB preliminary reviewer evaluates completeness of submission, conducts preliminary review, and forwards to UREB. (1 week)',
    },
    {
      number: '03',
      title: "Director's Evaluation",
      description: 'UREB Director evaluates the result of preliminary review. If no ethical issues, UREB releases a Certificate of Exemption from Review and the study can be conducted. (1 week)',
    },
    {
      number: '04',
      title: 'Panel Assignment',
      description: 'For Expedite Review, the UREB Director assigns a review panel per study, and UREB staff forwards documents to the review panel. (3 days)',
    },
    {
      number: '05',
      title: 'Panel Review',
      description: 'Review Panel reviews the documents, meets, and makes a report. (2 weeks)',
    },
    {
      number: '06',
      title: 'Deliberation',
      description: 'Deliberation of the study is conducted during UREB regular meetings (2nd Friday of the month). Studies for Full Review are deliberated by all UREB Members. (1 day)',
    },
    {
      number: '07',
      title: 'Notification Letter',
      description: 'UREB Staff sends a Notification letter to the researcher. (1 day)',
    },
    {
      number: '08',
      title: 'Revisions',
      description: 'Upon receipt of the Notification letter, the researcher accomplishes required revisions. (Depends on the researcher)',
    },
    {
      number: '09',
      title: 'Resubmission',
      description: 'Researcher submits the revised proposal and other documents.',
    },
    {
      number: '10',
      title: 'Recheck',
      description: 'UREB Staff receives the revised proposal and forwards it to the review panel for checking. (1 day)',
    },
    {
      number: '11',
      title: 'Ethical Clearance',
      description: 'UREB sends the Ethical Clearance to the researcher. (1 day)',
    },
    {
      number: '12',
      title: 'Study Conducted',
      description: 'Upon receipt of the Ethical Clearance, the study can be conducted.',
    },
    {
      number: '13',
      title: 'Protocol Amendment',
      description: 'During the conduct of the study, if revision of methodology or other parts is necessary, an application for protocol amendment must be lodged at UREB.',
    },
    {
      number: '14',
      title: 'Emergency Reporting',
      description: 'During the conduct of the study, if emergencies arise, UREB must be immediately informed. (1 day)',
    },
    {
      number: '15',
      title: 'Final Manuscript',
      description: 'Researcher submits the final manuscript (Chapters 1 to 5), Informed Consent, and other documents.',
    },
    {
      number: '16',
      title: 'Manuscript Forwarded',
      description: 'UREB Staff receives the final manuscript and other documents, and forwards them to the Review Panel.',
    },
    {
      number: '17',
      title: 'Manuscript Evaluation',
      description: 'Review Panel evaluates the final manuscript and other documents.',
    },
    {
      number: '18',
      title: 'Certificate Issuance',
      description: 'UREB Staff sends the Certificate of Completed Ethical Review.',
    },
    {
      number: '19',
      title: 'Completion',
      description: 'Researcher receives the Certificate of Completed Ethical Review, a requirement for final defense and publication.',
    },
  ];

  return (
    <section id="process" className="process reveal-on-scroll">
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
  <section id="contact" className="contact reveal-on-scroll">
    <div className="section-container">
      <div className="contact-grid">

        <div className="contact-info">
          <span className="section-badge">Get in Touch</span>
          <h2 className="section-title">We're Here to Help</h2>
          <p className="contact-text">
            Have questions about your research protocol or the ethics review process?
            Our team is ready to assist you every step of the way.
          </p>
          <div className="contact-details">
            <div className="contact-item">
              <span className="contact-item-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <div>
                <strong>Email</strong>
                <a href="mailto:reo@dorsu.edu.ph">reo@dorsu.edu.ph</a>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-item-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </span>
              <div>
                <strong>Office Hours</strong>
                <span>Monday – Friday, 8:00 AM – 5:00 PM</span>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-item-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <div>
                <strong>Location</strong>
                <span>Guang-Guang, Dahican, Mati City, Davao Oriental</span>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-cta-card" id="apply">
          <div className="contact-cta-badge">Ready to get started?</div>
          <h3>Send Us a Message</h3>
          <p>Reach out to our team for guidance on your research ethics review. We typically respond within one business day.</p>
          <button className="btn-primary contact-cta-btn" onClick={onMessageClick}>
            Message Us
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </button>
          <p className="contact-cta-note">No login required · Free consultation</p>
        </div>

      </div>
    </div>
  </section>
);

const Footer = ({ onTermsClick, onPrivacyClick, onFeedbackClick, onHelpClick }) => (
  <footer className="footer">
    <div className="footer-container">
      <div className="footer-main">

        <div className="footer-brand">
          <div className="footer-logo">
            <img src="/UREBLOGO.png" alt="UREB Logo" className="footer-logo-img" />
            <span>University Research Ethics Board</span>
          </div>
          <p className="footer-tagline">
            Protecting research participants and promoting ethical research excellence at Davao Oriental State University.
          </p>
        </div>

        <div className="footer-column">
          <h4>Navigate</h4>
          <a href="#home">Home</a>
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#process">Process</a>
        </div>

        <div className="footer-column">
          <h4>Help & Legal</h4>
          <a href="#" onClick={(e) => { e.preventDefault(); onHelpClick(); }}>Help</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onFeedbackClick(); }}>Send Feedback</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onTermsClick(); }}>Terms</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onPrivacyClick(); }}>Privacy</a>
        </div>

        <div className="footer-column">
          <h4>Contact</h4>
          <div className="footer-contact-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
            <a href="mailto:reo@dorsu.edu.ph">reo@dorsu.edu.ph</a>
          </div>
          <div className="footer-contact-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            <span>Mon – Fri, 8:00 AM – 5:00 PM</span>
          </div>
          <div className="footer-contact-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            <span>Guang-Guang, Dahican, Mati, Davao Oriental</span>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} University Research Ethics Board — DOrSU. All rights reserved.</p>
        <a href="#home" className="footer-back-top">Back to top ↑</a>
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
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
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

const WorkflowModal = ({ isOpen, onClose }) => {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setHasScrolled(false);
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleScroll = (e) => {
    if (e.currentTarget.scrollTop > 24 && !hasScrolled) {
      setHasScrolled(true);
    }
  };

  return createPortal(
    <div
      className="workflow-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="workflow-modal-top-fade" aria-hidden="true"></div>
      <button
        className="workflow-modal-close"
        onClick={onClose}
        aria-label="Close workflow"
      >
        <XIcon />
      </button>
      <div className="workflow-modal-scroll" onScroll={handleScroll}>
        <img
          src="/workflow.png"
          alt="UREB Workflow"
          className="workflow-modal-image"
        />
      </div>
      <div className={`workflow-scroll-indicator${hasScrolled ? ' is-hidden' : ''}`} aria-hidden="true">
        <div className="workflow-scroll-indicator-mouse">
          <div className="workflow-scroll-indicator-dot"></div>
        </div>
        <span>Scroll down</span>
      </div>
    </div>,
    document.body
  );
};

const QuickAccessDock = ({ onHelpClick, onTermsClick, onFeedbackClick, onWorkflowClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dockRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickAway = (e) => {
      if (dockRef.current && !dockRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [isOpen]);

  const items = [
    { key: 'workflow', label: 'Workflow', icon: <WorkflowIcon />, onClick: onWorkflowClick },
    { key: 'services', label: 'Services', icon: <LayersIcon />, href: '#services' },
    { key: 'feedback', label: 'Feedback', icon: <MessageSquareIcon />, onClick: onFeedbackClick },
    { key: 'terms', label: 'Terms', icon: <FileTextIcon />, onClick: onTermsClick },
    { key: 'help', label: 'Help', icon: <HelpCircleIcon />, onClick: onHelpClick },
  ];

  return (
    <div className={`quick-access${isOpen ? ' is-open' : ''}`} ref={dockRef}>
      <div className="quick-access-items">
        {items.map((item, index) => (
          item.href ? (
            <a
              key={item.key}
              href={item.href}
              className="quick-access-item"
              style={{ transitionDelay: isOpen ? `${index * 40}ms` : '0ms' }}
              onClick={() => setIsOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          ) : (
            <button
              key={item.key}
              type="button"
              className="quick-access-item"
              style={{ transitionDelay: isOpen ? `${index * 40}ms` : '0ms' }}
              onClick={() => { setIsOpen(false); item.onClick(); }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          )
        ))}
      </div>
      <button
        type="button"
        className="quick-access-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close quick access menu' : 'Open quick access menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <XIcon /> : <ZapIcon />}
      </button>
    </div>
  );
};

const LandingPage = ({ onLogin, onRegister, onCommitLogin }) => {
  useScrollReveal();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const openMessageModal = () => setIsMessageModalOpen(true);
  const closeMessageModal = () => setIsMessageModalOpen(false);
  const closeThankYouModal = () => setIsSuccessModalOpen(false);

  const openTermsModal = () => setIsTermsModalOpen(true);
  const closeTermsModal = () => setIsTermsModalOpen(false);

  const openPrivacyModal = () => setIsPrivacyModalOpen(true);
  const closePrivacyModal = () => setIsPrivacyModalOpen(false);

  const openFeedbackModal = () => setIsFeedbackModalOpen(true);
  const closeFeedbackModal = () => setIsFeedbackModalOpen(false);

  const openHelpModal = () => setIsHelpModalOpen(true);
  const closeHelpModal = () => setIsHelpModalOpen(false);

  const openWorkflowModal = () => setIsWorkflowModalOpen(true);
  const closeWorkflowModal = () => setIsWorkflowModalOpen(false);

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
      <Footer onTermsClick={openTermsModal} onPrivacyClick={openPrivacyModal} onFeedbackClick={openFeedbackModal} onHelpClick={openHelpModal} />
      <QuickAccessDock onHelpClick={openHelpModal} onTermsClick={openTermsModal} onFeedbackClick={openFeedbackModal} onWorkflowClick={openWorkflowModal} />
      <WorkflowModal isOpen={isWorkflowModalOpen} onClose={closeWorkflowModal} />
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} onLogin={onLogin} onRegister={onRegister} onCommitLogin={onCommitLogin} />
      <MessageModal isOpen={isMessageModalOpen} onClose={closeMessageModal} setIsSuccessModalOpen={setIsSuccessModalOpen} />
      <ThankYouModal isOpen={isSuccessModalOpen} onClose={closeThankYouModal} />
      <TermsModal isOpen={isTermsModalOpen} onClose={closeTermsModal} />
      <PrivacyModal isOpen={isPrivacyModalOpen} onClose={closePrivacyModal} />
      <FeedbackModal isOpen={isFeedbackModalOpen} onClose={closeFeedbackModal} />
      <HelpModal isOpen={isHelpModalOpen} onClose={closeHelpModal} />
    </div>
  );
};

export default LandingPage;
