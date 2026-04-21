import { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';
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

  // Registration form states
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [gender, setGender] = useState('');
  const [department, setDepartment] = useState('');
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
  const [gmailExists, setGmailExists] = useState(false);
  const [checkingGmail, setCheckingGmail] = useState(false);
  const debounceTimer = useRef(null);
  const pendingRegistrationRef = useRef(null);

  // Gmail validation function
  const validateGmail = (gmail) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return gmailRegex.test(gmail);
  };

  // Check if Gmail exists in system
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
        body: JSON.stringify({ gmail }),
      });
      const result = await response.json();
      setGmailExists(result.exists);
    } catch (error) {
      console.error('Error checking Gmail:', error);
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
    'FNAHS': [
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
    'SIEC': [
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
    ]
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
    setStudentId('');
    setGender('');
    setDepartment('');
    setProgram('');
    setRegGmail('');
    setRegPassword('');
    setConfirmPassword('');
    setError('');
    setPasswordError('');
    setPasswordTouched(false);
    setShowSuccessModal(false);
    setRegisterLoading(false);
    setShowRegistrationForm(false);
    setGmailExists(false);
    pendingRegistrationRef.current = null;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await onLogin(email, password);

    if (result.success) {
      resetForm();
      onClose();
    } else if (result.error === 'disabled') {
      setShowDisabledModal(true);
    } else {
      setError(result.error || 'Invalid username or password');
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
      studentId,
      gender,
      department,
      program,
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
        setStudentId('');
        setGender('');
        setDepartment('');
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
                  <label htmlFor="studentId">Student ID Number </label>
                  <input
                    type="text"
                    id="studentId"
                    value={studentId}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Remove all characters except numbers and hyphens
                      const validValue = value.replace(/[^0-9-]/g, '');
                      setStudentId(validValue);
                    }}
                    onKeyPress={(e) => {
                      // Allow only numbers, hyphens, and control keys
                      if (!/[0-9-]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Enter your student ID (e.g., 2022-2025 or 20231234)"
                    required
                    inputMode="text"
                    pattern="[0-9\-]+"
                  />
                </div>

                <div className="login-form-group">
                  <label htmlFor="gender">Gender </label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                  >
                    <option value="">Select your gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div className="login-form-group">
                  <label htmlFor="department">Department </label>
                  <select
                    id="department"
                    value={department}
                    onChange={handleDepartmentChange}
                    required
                  >
                    <option value="">Select your department</option>
                    <option value="FAIS">FAIS - Faculty of Advanced and International Studies</option>
                    <option value="FNAHS">FNAHS - Faculty of Nursing and Allied Health Sciences</option>
                    <option value="FTED">FTED - Faculty of Teacher Education</option>
                    <option value="FBM">FBM - Faculty of Business and Management</option>
                    <option value="FALS">FALS - Faculty of Agriculture and Life Sciences</option>
                    <option value="FCJE">FCJE - Faculty of Criminal Justice Education</option>
                    <option value="FACET">FACET - Faculty of Computing Engineering and Technology</option>
                    <option value="FHUSOCOM">FHUSOCOM - Faculty of Humanities and Social Communication</option>
                    <option value="SIEC">SIEC - San Isidro Extension Campus</option>
                    <option value="BEC">BEC - Banay-Banay Extension Campus</option>
                    <option value="CEC">CEC - Cateel Extension Campus</option>
                    <option value="BGEC">BGEC - Bagangga Extension Campus</option>
                    <option value="TEC">TEC - Tarragona Extension Campus</option>
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
                      {department ? 'Select your program' : 'Select department first'}
                    </option>
                    {department && departmentPrograms[department]?.map((prog, index) => (
                      <option key={index} value={prog}>
                        {prog}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="login-form-group">
                  <label htmlFor="regGmail">Gmail </label>
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
                    placeholder="Enter your Gmail address"
                    required
                  />
                  {regGmail && !validateGmail(regGmail) && (
                    <div className="gmail-error-message">Please enter a valid Gmail address (@gmail.com)</div>
                  )}
                  {checkingGmail && (
                    <div className="gmail-checking-message">Checking...</div>
                  )}
                  {gmailExists && validateGmail(regGmail) && (
                    <div className="gmail-exists-message">This Gmail address is already registered in the system</div>
                  )}
                  {regGmail && validateGmail(regGmail) && !checkingGmail && !gmailExists && (
                    <div className="gmail-checking-message" style={{ color: '#388E3C' }}>✓ Gmail address is available</div>
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
                  <h2 style={{ color: '#2e7d32', marginBottom: '0.5rem' }}>Welcome, Students!</h2>
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
                  <a href="#" className="login-forgot-password">Forgot password?</a>
                </div>
                <button type="submit" className="login-btn-primary login-modal-submit">
                  Sign In
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
      </div>

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
