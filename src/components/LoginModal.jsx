import { useState, useRef, useEffect } from 'react';
import { API_BASE_URL, authenticateUser } from '../services/api';
import './LoginModal.css';

const ShieldIcon = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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

const LoginModal = ({ isOpen, onClose, onLogin, onRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showDisabledModal, setShowDisabledModal] = useState(false);
  const [showPrivacyStep, setShowPrivacyStep] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [pendingAuthResult, setPendingAuthResult] = useState(null);

  // Registration form states
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [gender, setGender] = useState('');
  const [researcherType, setResearcherType] = useState('');
  const [department, setDepartment] = useState('');
  const [affiliationType, setAffiliationType] = useState('');
  const [customAffiliation, setCustomAffiliation] = useState('');
  const [program, setProgram] = useState('');
  const [regGmail, setRegGmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [gmailExists, setGmailExists] = useState(false);
  const [checkingGmail, setCheckingGmail] = useState(false);
  const debounceTimer = useRef(null);
  const pendingRegistrationRef = useRef(null);

  // Institutional / Email validation function
  const validateGmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test((email || '').trim());
  };

  // Check if email exists in system
  const checkGmailExists = async (gmail) => {
    if (!validateGmail(gmail)) {
      setGmailExists(false);
      return;
    }
    setCheckingGmail(true);
    try {
      const response = await fetch(`${API_BASE_URL}/check-gmail-exists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: gmail, gmail }),
      });
      const result = await response.json();
      setGmailExists(result.exists);
    } catch (error) {
      console.error('Error checking email:', error);
      setGmailExists(false);
    } finally {
      setCheckingGmail(false);
    }
  };

  // Properly memoised debounce using useRef
  const debouncedCheckGmail = (gmail) => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => checkGmailExists(gmail), 500);
  };

  // Password validation function
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];

    if (password.length < minLength) {
      errors.push(`at least ${minLength} characters`);
    }
    if (!hasUpperCase) {
      errors.push('one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('one number');
    }
    if (!hasSpecialChar) {
      errors.push('one special character (!@#$%^&*(),.?":{}|<>)');
    }

    return errors;
  };

  // Handle password change with validation
  const handlePasswordChange = (value) => {
    setRegPassword(value);
    if (passwordTouched) {
      const errors = validatePassword(value);
      if (errors.length > 0) {
        setPasswordError(`Password must contain ${errors.join(', ')}.`);
      } else {
        setPasswordError('');
      }
    }
  };

  // Handle password blur
  const handlePasswordBlur = () => {
    setPasswordTouched(true);
    const errors = validatePassword(regPassword);
    if (errors.length > 0) {
      setPasswordError(`Password must contain ${errors.join(', ')}.`);
    } else {
      setPasswordError('');
    }
  };

  // Department to Programs mapping
  const departmentPrograms = {
    'FAIS': [
      'Doctor of Education major in Education',
      'Doctor of Philosophy in Biology major in Biodiversity',
      'Doctor of Philosophy in Environmental Science',
      'Master of Arts in Educational Management',
      'Master of Arts in Education major in Teaching English',
      'Master of Science Teaching major in General Science',
      'Master in Science Teaching Major in Mathematics',
      'Master of Science in Environmental Science',
      'Master of Business Administration'
    ],
    'FNAS': [
      'Bachelor of Science in Nursing'
    ],
    'FTED': [
      'Bachelor of Secondary Education',
      'Bachelor of Secondary Education major in Filipino',
      'Bachelor of Secondary Education major in English',
      'Bachelor of Secondary Education major in Science',
      'Bachelor of Secondary Education major in Mathematics',
      'Bachelor of Technology and Livelihood Education major in Industrial Arts',
      'Bachelor of Technology and Livelihood Education major in Home Economics',
      'Bachelor of Early Education',
      'Bachelor of Physical Education',
      'Bachelor of Special Needs Education',
      'Bachelor of Elementary Education'
    ],
    'FBM': [
      'Bachelor of Science in Business Administration'
    ],
    'FALS': [
      'Bachelor of Science in Environmental Science',
      'Bachelor of Science in Biology',
      'Bachelor of Science in Business Management',
      'Bachelor of Science in Agriculture',
    ],
    'FCJE': [
      'Bachelor of Science in Criminilogy'
    ],
    'FACET': [
      'Bachelor of Science in Information Technology',
      'Bachelor of Science in Engineering',
      'Bachelor of Science in Industrial Technology Management',
      'Bachelor of Science in Mathimatics with Research Statistics'
    ],
    'FHUSOCOM': [
      'Bachelor of Science in Developmental Education',
      'Bachelor of Science in Psychology',
      'Bachelor of Science in Political Science'
    ],
    'SEIC': [
      'Bachelor of Science in Agriculture',
      'Bachelor of Science in Business Administration',
      'Bachelor of Science in Criminology',
      'Bachelor of Elementary Education'
    ],
    'BEC': [
      'Bachelor of Science in Agriculture',
      'Bachelor of Science in Information Technology',
      'Bachelor of Science in Business Administration',
      'Bachelor of Technology and Livelihood Education'
    ],
    'CEC': [
      'Bachelor of Science in Agriculture',
      'Bachelor of Science in Agribusiness Management',
      'Bachelor of Science in Business Administration',
      'Bachelor of Science in Criminology',
      'Bachelor of Elementary Education'
    ],
    'BGEC': [
      'Bachelor of Science in Agriculture',
      'Bachelor of Science in Agribusiness Management',
      'Bachelor of Science in Environmental Science',
      'Bachelor of Science in Information Technology'
    ],
    'TEC': [
      'Bachelor of Science Agriculture',
      'Bachelor of Science in Agribusiness Management '
    ],
    'NSTP': ['National Service Training Program'],
    'ICS': ['Indigenous Community Studies'],
    'Community Representatives': ['Community Representative'],
    'UREB Board': ['University Research Ethics Board Member']
  };

  const handleAffiliationTypeChange = (e) => {
    const selectedType = e.target.value;
    setAffiliationType(selectedType);
    setDepartment('');
    setCustomAffiliation('');
    setProgram('');
  };

  // Handle department change to reset program
  const handleDepartmentChange = (e) => {
    const selectedDepartment = e.target.value;
    setDepartment(selectedDepartment);
    setProgram(''); // Reset program when department changes
  };

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setSuffix('');
    setGender('');
    setResearcherType('');
    setDepartment('');
    setAffiliationType('');
    setCustomAffiliation('');
    setProgram('');
    setRegGmail('');
    setRegPassword('');
    setConfirmPassword('');
    setError('');
    setPasswordError('');
    setPasswordTouched(false);
    setShowSuccessModal(false);
    setRegisterLoading(false);
    setLoginLoading(false);
    setShowRegistrationForm(false);
    setGmailExists(false);
    setShowPrivacyStep(false);
    setPrivacyChecked(false);
    setPendingAuthResult(null);
    pendingRegistrationRef.current = null;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoginLoading(true);

    try {
      const result = await authenticateUser(email, password);

      if (result.success) {
        // For students, check if account is disabled
        if (result.user.role === 'student') {
          try {
            const studentsRes = await fetch(`${API_BASE_URL}/students`);
            if (studentsRes.ok) {
              const students = await studentsRes.json();
              const studentRecord = Array.isArray(students)
                ? students.find(s => s.email === email)
                : null;
              if (studentRecord?.disabled === true) {
                setShowDisabledModal(true);
                return;
              }
            }
          } catch {
            // ignore failure
          }
        }

        const isAdmin = ['admin', 'superadmin', 'super-admin', 'root', 'administrator'].includes(result.user?.role?.toLowerCase());
        const isReviewer = result.user?.role?.toLowerCase() === 'reviewer';
        if (isAdmin || isReviewer) {
          // Exclude admin and reviewer from data and privacy act modal - proceed directly to login
          const loginResult = await onLogin(email, password);
          if (loginResult.success) {
            resetForm();
            onClose();
          } else {
            setError(loginResult.error || 'Login failed');
          }
        } else {
          setPendingAuthResult(result);
          setShowPrivacyStep(true);
        }
      } else if (result.error === 'disabled') {
        setShowDisabledModal(true);
      } else {
        setError(result.error || 'Invalid username or password');
      }
    } catch (err) {
      console.error('Login submit error:', err);
      setError('An error occurred during sign in');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAcceptAndProceedLogin = async () => {
    if (!privacyChecked) return;
    setLoginLoading(true);
    try {
      const result = await onLogin(email, password);
      if (result.success) {
        resetForm();
        onClose();
      } else {
        setError(result.error || 'Login failed');
        setShowPrivacyStep(false);
      }
    } catch (err) {
      console.error('Final login error:', err);
      setError('An error occurred during sign in');
      setShowPrivacyStep(false);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate Gmail format
    if (!validateGmail(regGmail)) {
      setError('Please enter a valid Gmail address');
      return;
    }

    // Block if Gmail is already registered
    if (gmailExists) {
      setError('This Gmail address is already registered in the system');
      return;
    }

    // Validate password
    const passwordErrors = validatePassword(regPassword);
    if (passwordErrors.length > 0) {
      setPasswordError(`Password must contain ${passwordErrors.join(', ')}.`);
      setPasswordTouched(true);
      return;
    }

    if (regPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const userData = {
      firstName,
      middleName,
      lastName,
      suffix,
      sex: gender,
      gender,
      researcherType,
      affiliationType,
      department: (affiliationType === 'Institution/Agency' || affiliationType === 'Institution' || affiliationType === 'Agency') ? 'Institution/Agency' : department,
      program: (affiliationType === 'Institution/Agency' || affiliationType === 'Institution' || affiliationType === 'Agency') ? 'N/A' : program,
      email: regGmail,  // Changed from gmail to email
      password: regPassword,
      role: 'student'
    };

    console.log('[DEBUG] Registration - userData:', { ...userData, password: '[HIDDEN]' });
    console.log('[DEBUG] Registration - gender value:', gender, '| type:', typeof gender);

    // Direct registration without pre-register reminder (now shown before form)
    handleDirectRegister(userData);
  };

  const handleDirectRegister = async (userData) => {
    setRegisterLoading(true);
    setError('');

    try {
      const result = await onRegister(userData);

      if (result.success) {
        setShowSuccessModal(true);
        setFirstName('');
        setMiddleName('');
        setLastName('');
        setSuffix('');
        setGender('');
        setResearcherType('');
        setDepartment('');
        setAffiliationType('');
        setCustomAffiliation('');
        setProgram('');
        setRegGmail('');
        setGmailExists(false);
        setRegPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setPasswordTouched(false);

        setTimeout(() => {
          setShowSuccessModal(false);
          setIsRegistering(false);
          setShowRegistrationForm(false);
          setError('');
        }, 3000);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleCancelPreRegisterReminder = () => {
    setIsRegistering(false);
    setShowRegistrationForm(false);
  };

  const handleConfirmPreRegisterReminder = () => {
    setShowRegistrationForm(true);
  };

  const toggleMode = () => {
    if (!isRegistering) {
      // Switching to register mode - show reminder first
      setIsRegistering(true);
      resetForm();
    } else {
      // Switching back to login
      setIsRegistering(false);
      setShowRegistrationForm(false);
      resetForm();
    }
  };

  return (
    <div className="login-modal-overlay">
      <div className="login-modal-container">
        <button className="login-modal-close" onClick={onClose} aria-label="Close modal">
          <XIcon />
        </button>
        <div className="login-modal-content">
          <div className="login-modal-left">
            <h2>{isRegistering ? 'Create Account' : 'Welcome to'}</h2>
            <img src="/ureb.png" alt="UREB Logo" style={{ width: '100%', maxWidth: '320px', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }} />
          </div>
          <div className="login-modal-right">
            {isRegistering ? (
              showRegistrationForm ? (
                <form className="login-modal-form" onSubmit={handleRegisterSubmit}>
                  {error && <div className="login-error-message">{error}</div>}

                  <div className="login-form-group">
                    <label htmlFor="researcherType">Researcher Type </label>
                    <select
                      id="researcherType"
                      value={researcherType}
                      onChange={(e) => setResearcherType(e.target.value)}
                      required
                    >
                      <option value="">Select researcher type</option>
                      <option value="Faculty Researcher">Faculty Researcher</option>
                      <option value="Staff Researcher">Staff Researcher</option>
                      <option value="External Researcher">External Researcher</option>
                      <option value="Student Researcher">Student Researcher</option>
                    </select>
                  </div>

                  <div className="login-form-group">
                    <label htmlFor="firstName">First Name </label>
                    <input
                      type="text"
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                      required
                    />
                  </div>

                  <div className="login-form-group">
                    <label htmlFor="middleName">Middle Name (Optional)</label>
                    <input
                      type="text"
                      id="middleName"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      placeholder="Enter your middle name"
                    />
                  </div>

                  <div className="login-form-group">
                    <label htmlFor="lastName">Last Name </label>
                    <input
                      type="text"
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                      required
                    />
                  </div>

                  <div className="login-form-group">
                    <label htmlFor="suffix">Suffix (Optional)</label>
                    <select
                      id="suffix"
                      value={suffix}
                      onChange={(e) => setSuffix(e.target.value)}
                    >
                      <option value="">None</option>
                      <option value="Jr.">Jr.</option>
                      <option value="Sr.">Sr.</option>
                      <option value="II">II</option>
                      <option value="III">III</option>
                      <option value="IV">IV</option>
                      <option value="V">V</option>
                      <option value="VI">VI</option>
                      <option value="Ph.D.">Ph.D.</option>
                      <option value="Ed.D.">Ed.D.</option>
                      <option value="M.D.">M.D.</option>
                      <option value="M.S.">M.S.</option>
                      <option value="M.A.">M.A.</option>
                      <option value="CPA">CPA</option>
                      <option value="Engr.">Engr.</option>
                      <option value="RN">RN</option>
                      <option value="LPT">LPT</option>
                    </select>
                  </div>

                  <div className="login-form-group">
                    <label htmlFor="gender">Sex </label>
                    <select
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      required
                    >
                      <option value="">Select your sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="login-form-group">
                    <label htmlFor="affiliationType">Affiliation Category </label>
                    <select
                      id="affiliationType"
                      value={affiliationType}
                      onChange={handleAffiliationTypeChange}
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="Faculty">Faculty</option>
                      <option value="Institution/Agency">Institution/Agency</option>
                    </select>
                  </div>

                  {affiliationType === 'Faculty' && (
                    <>
                      <div className="login-form-group">
                        <label htmlFor="department">Faculty </label>
                        <select
                          id="department"
                          value={department}
                          onChange={handleDepartmentChange}
                          required
                        >
                          <option value="">Select your faculty</option>
                          <option value="FAIS">FAIS - Faculty of Advanced and International Studies</option>
                          <option value="FNAHS">FNAHS - Faculty of Nursing and Allied Health Sciences</option>
                          <option value="FTED">FTED - Faculty of Teacher Education</option>
                          <option value="FBM">FBM - Faculty of Business and Management</option>
                          <option value="FALS">FALS - Faculty of Agriculture and Life Sciences</option>
                          <option value="FNAS">FNAS - Faculty of Nursing and Allied Health Science</option>
                          <option value="FCJE">FCJE - Faculty of Criminology Justice Education</option>
                          <option value="FACET">FACET - Faculty of Computing, Engineering, Technology</option>
                          <option value="FHUSOCOM">FHUSOCOM - Faculty of Humanities, Social Science & Communication</option>
                          <option value="SEIC">SEIC - San Isidro Extension Campus</option>
                          <option value="BEC">BEC - BanayBanay Extension Campus</option>
                          <option value="CEC">CEC - Cateel Extension Campus</option>
                          <option value="BGEC">BGEC - Baganga Extension Campus</option>
                          <option value="TEC">TEC - Tarragona Extension Campus</option>
                          <option value="NSTP">NSTP - National Service Training Program</option>
                          <option value="ICS">ICS - Indigenous Community Studies</option>
                          <option value="Community Representatives">Community Representatives</option>
                          <option value="UREB Board">UREB Board - University Research Ethics Board</option>
                        </select>
                      </div>

                      <div className="login-form-group">
                        <label htmlFor="program">Program </label>
                        <select
                          id="program"
                          value={program}
                          onChange={(e) => setProgram(e.target.value)}
                          required
                          disabled={!department}
                        >
                          <option value="">
                            {department ? 'Select your program' : 'Select faculty first'}
                          </option>
                          {department && departmentPrograms[department]?.map((prog, index) => (
                            <option key={index} value={prog}>
                              {prog}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div className="login-form-group">
                    <label htmlFor="regGmail">Institutional / Email Address </label>
                    <input
                      type="email"
                      id="regGmail"
                      value={regGmail}
                      onChange={(e) => {
                        const value = e.target.value;
                        setRegGmail(value);
                        setGmailExists(false);
                        if (value) {
                          debouncedCheckGmail(value);
                        }
                      }}
                      placeholder="e.g., name@dorsu.edu.ph or name@gmail.com"
                      required
                    />
                    {regGmail && !validateGmail(regGmail) && (
                      <div className="gmail-error-message">Please enter a valid institutional or email address (e.g., @dorsu.edu.ph)</div>
                    )}
                    {checkingGmail && (
                      <div className="gmail-checking-message">Checking email availability...</div>
                    )}
                    {gmailExists && validateGmail(regGmail) && (
                      <div className="gmail-exists-message">This email address is already registered in the system</div>
                    )}
                    {regGmail && validateGmail(regGmail) && !checkingGmail && !gmailExists && (
                      <div className="gmail-checking-message" style={{ color: '#388E3C' }}>✓ Email address is available</div>
                    )}
                  </div>

                  <div className="login-form-group">
                    <label htmlFor="regPassword">Password </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        id="regPassword"
                        value={regPassword}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        onBlur={handlePasswordBlur}
                        placeholder="Create a password"
                        required
                        className={passwordError && passwordTouched ? 'error' : ''}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    {passwordError && passwordTouched && (
                      <div className="password-error-message">{passwordError}</div>
                    )}
                  </div>

                  <div className="login-form-group">
                    <label htmlFor="confirmPassword">Confirm Password </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="login-btn-primary login-modal-submit" disabled={registerLoading}>
                    {registerLoading ? 'Creating account…' : 'Create Account'}
                  </button>
                </form>
              ) : (
                // Pre-register reminder shown before form
                <div className="pre-register-reminder-inline">
                  <div className="success-icon" style={{ marginBottom: '1rem' }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#388E3C" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2 2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <h2 style={{ color: '#2e7d32', marginBottom: '0.5rem' }}>Welcome, Researcher!</h2>
                  <div className="registration-data-reminder registration-data-reminder--modal" style={{ marginBottom: '1.5rem', borderColor: '#388E3C', backgroundColor: '#f1f8e9' }}>
                    <p>
                      Welcome to UREB! Before you register, please ensure all your information is accurate.
                      We'll use your Gmail and student details for important updates about your research protocols.
                    </p>
                  </div>
                  <div className="pre-register-modal-actions" style={{ justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="login-btn-secondary pre-register-btn"
                      onClick={handleCancelPreRegisterReminder}
                    >
                      Go back
                    </button>
                    <button
                      type="button"
                      className="login-btn-primary login-modal-submit pre-register-btn"
                      onClick={handleConfirmPreRegisterReminder}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )
            ) : (
              <form className="login-modal-form" onSubmit={handleLoginSubmit}>
                {error && <div className="login-error-message">{error}</div>}
                <div className="login-form-group">
                  <label htmlFor="username">Email</label>
                  <input
                    type="text"
                    id="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your Email"
                    required
                  />
                </div>
                <div className="login-form-group">
                  <label htmlFor="password">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
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
                <div className="login-form-options">
                  <label className="login-checkbox-label">
                    <input type="checkbox" />
                    <span>Remember me</span>
                  </label>
                </div>
                <button type="submit" className="login-btn-primary login-modal-submit" disabled={loginLoading}>
                  {loginLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )}
            <div className="login-modal-footer">
              <p>
                {isRegistering ? 'Already have an account?' : 'Don\'t have an account?'}{' '}
                <button type="button" className="login-toggle-link" onClick={toggleMode}>
                  {isRegistering ? 'Sign In' : 'Create Account'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>      {/* Data Privacy & Protection Commitment White Modal Popup */}
      {showPrivacyStep && (
        <div className="success-modal-overlay" style={{ zIndex: 3000 }}>
          <div className="success-modal-container" style={{ maxWidth: '500px', width: '92%', padding: '2.25rem 2rem', textAlign: 'center', borderRadius: '20px', backgroundColor: '#ffffff' }}>
             <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#1E293B', margin: '0 0 0.75rem 0' }}>
               Data Privacy Disclaimer
             </h2>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.25rem', textAlign: 'left' }}>
              <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.6', margin: '0 0 0.75rem 0' }}>
                All information and protocol documents submitted through this online application system will be processed strictly for research ethics review, monitoring, and administrative record-keeping. In compliance with the Data Privacy Act of 2012 (Republic Act No. 10173) and the Philippine Health Research Ethics Board (PHREB) standards, all submitted data will be handled with strict confidentiality and stored securely. The Davao Oriental State University – Research Ethics Board (DOrSU-REB) functions as an independent ethics body responsible for evaluating research protocols to ensure the safety, welfare, and protection of research participants.
              </p>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer', background: '#F1F5F9', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '1.25rem', textAlign: 'left' }}>
              <input
                type="checkbox"
                id="whiteModalPrivacyCheck"
                checked={privacyChecked}
                onChange={(e) => setPrivacyChecked(e.target.checked)}
                style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#2E7D32', cursor: 'pointer', flexShrink: 0 }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', lineHeight: '1.4' }}>
                I have read, understood, and accept the Data & Privacy Policy.
              </span>
            </label>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '0.35rem 0.8rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  border: '2px solid #E2E8F0',
                  background: '#ffffff',
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                }}
                onClick={() => {
                  setShowPrivacyStep(false);
                  setPendingAuthResult(null);
                }}
              >
                 Back
              </button>
              <button
                type="button"
                style={{
                  flex: 2,
                  padding: '0.35rem 0.8rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  border: privacyChecked ? '2px solid transparent' : '2px solid #CBD5E1',
                  background: loginLoading ? '#2E7D32' : (privacyChecked ? '#388E3C' : '#F1F5F9'),
                  color: privacyChecked ? '#ffffff' : '#94A3B8',
                  cursor: privacyChecked ? 'pointer' : 'not-allowed',
                  opacity: loginLoading ? 0.85 : 1,
                  transform: loginLoading ? 'scale(0.98)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  boxShadow: loginLoading ? '0 2px 8px rgba(46, 125, 50, 0.35)' : (privacyChecked ? '0 1px 4px rgba(56, 142, 60, 0.18)' : 'none'),
                }}
                disabled={!privacyChecked || loginLoading}
                onClick={handleAcceptAndProceedLogin}
              >
                ✓ I Accept & Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Disabled Modal */}
      {showDisabledModal && (
        <div className="success-modal-overlay">
          <div className="success-modal-container" style={{ borderTop: '4px solid #d97706' }}>
            <div className="success-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 style={{ color: '#92400e' }}>Account Disabled</h2>
            <p>Your account has been disabled. Please contact the administrator for assistance.</p>
            <button
              className="login-btn-primary login-modal-submit"
              style={{ marginTop: '1.25rem', background: '#d97706' }}
              onClick={() => setShowDisabledModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Registration Success Modal */}
      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal-container">
            <div className="success-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#388E3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2>Registered Successfully!</h2>
            <p>Your account has been created successfully. You can now log in with your credentials.</p>
            <div className="success-timer">
              <div className="timer-bar"></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LoginModal;
