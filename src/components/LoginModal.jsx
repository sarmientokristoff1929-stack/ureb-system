import { useState } from 'react';
import './LoginModal.css';

const ShieldIcon = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
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

const LoginModal = ({ isOpen, onClose, onLogin, onRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Registration form states
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentId, setStudentId] = useState('');
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
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [gmailExists, setGmailExists] = useState(false);
  const [checkingGmail, setCheckingGmail] = useState(false);

  // Debounce function to avoid too many API calls
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

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
      const response = await fetch('http://localhost:5001/api/check-gmail-exists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

  // Debounced version of checkGmailExists
  const debouncedCheckGmail = debounce(checkGmailExists, 500);

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
    setDepartment('');
    setProgram('');
    setRegGmail('');
    setRegPassword('');
    setConfirmPassword('');
    setError('');
    setPasswordError('');
    setPasswordTouched(false);
    setShowSuccessModal(false);
    setOtpSent(false);
    setOtpVerified(false);
    setOtpValue('');
    setOtpError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const result = await onLogin(email, password);
    
    if (result.success) {
      resetForm();
      onClose();
    } else {
      setError(result.error || 'Invalid username or password');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate Gmail
    if (!validateGmail(regGmail)) {
      setError('Please enter a valid Gmail address');
      return;
    }

    // Check if OTP has been sent
    if (!otpSent) {
      setError('Please click "Send OTP" to verify your Gmail address');
      return;
    }

    // Verify OTP if sent but not verified
    if (otpSent && !otpVerified) {
      if (otpValue.length !== 6) {
        setOtpError('Please enter a valid 6-digit OTP');
        return;
      }
      
      try {
        const response = await fetch('http://localhost:5001/api/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ gmail: regGmail, otp: otpValue }),
        });
        
        const result = await response.json();
        
        if (result.success) {
          setOtpVerified(true);
          setOtpError('');
        } else {
          setOtpError(result.error || 'Invalid OTP. Please try again.');
          return;
        }
      } catch (error) {
        console.error('Error verifying OTP:', error);
        setOtpError('Failed to verify OTP. Please try again.');
        return;
      }
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
      department,
      program,
      email: regGmail,  // Changed from gmail to email
      password: regPassword,
      role: 'student'
    };
    
    const result = await onRegister(userData);
    
    if (result.success) {
      // Show success modal
      setShowSuccessModal(true);
      // Clear form but don't close modal
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setStudentId('');
      setDepartment('');
      setProgram('');
      setRegGmail('');
      setOtpSent(false);
      setOtpVerified(false);
      setOtpValue('');
      setOtpError('');
      setRegPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setPasswordTouched(false);
      
      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        setIsRegistering(false);
        setError('');
      }, 3000);
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    resetForm();
  };

  return (
    <div className="login-modal-overlay">
      <div className="login-modal-container">
        <button className="login-modal-close" onClick={onClose} aria-label="Close modal">
          <XIcon />
        </button>
        <div className="login-modal-content">
          <div className="login-modal-left">
            <ShieldIcon />
            <h2>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
            <p>{isRegistering ? 'Register to access your research dashboard' : 'Sign in to access your research dashboard'}</p>
          </div>
          <div className="login-modal-right">
            {isRegistering ? (
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
                    inputMode="numeric"
                    pattern="[0-9-]+"
                  />
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
                      // Reset OTP states when email changes
                      setOtpSent(false);
                      setOtpVerified(false);
                      setOtpValue('');
                      setOtpError('');
                      setGmailExists(false); // Reset existence check
                      // Check if Gmail exists in real-time (debounced)
                      if (value) {
                        debouncedCheckGmail(value);
                      }
                    }}
                    placeholder="Enter your Gmail address"
                    required
                    pattern="[a-zA-Z0-9._%+-]+@gmail\.com"
                    title="Please enter a valid Gmail address"
                  />
                  {regGmail && !validateGmail(regGmail) && (
                    <div className="gmail-error-message">Please enter a valid Gmail address</div>
                  )}
                  {checkingGmail && (
                    <div className="gmail-checking-message">Checking...</div>
                  )}
                  {gmailExists && validateGmail(regGmail) && (
                    <div className="gmail-exists-message">This Gmail address is already registered in the system</div>
                  )}
                  {regGmail && validateGmail(regGmail) && !otpSent && !gmailExists && (
                    <button
                      type="button"
                      className="send-otp-btn"
                      onClick={async () => {
                        try {
                          const response = await fetch('http://localhost:5001/api/send-otp', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ gmail: regGmail }),
                          });
                          
                          const result = await response.json();
                          
                          if (result.success) {
                            setOtpSent(true);
                            setError('OTP has been sent to your Gmail address. Please enter it to continue.');
                          } else {
                            setError(result.error || 'Failed to send OTP');
                          }
                        } catch (error) {
                          console.error('Error sending OTP:', error);
                          setError('Failed to send OTP. Please try again.');
                        }
                      }}
                    >
                      Send OTP
                    </button>
                  )}
                </div>

                {otpSent && !otpVerified && (
                  <div className="login-form-group">
                    <label htmlFor="otp">Enter OTP </label>
                    <input
                      type="text"
                      id="otp"
                      value={otpValue}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setOtpValue(value);
                        setOtpError('');
                      }}
                      placeholder="Enter 6-digit OTP"
                      maxLength="6"
                      required
                    />
                    {otpError && (
                      <div className="otp-error-message">{otpError}</div>
                    )}
                    <button
                      type="button"
                      className="resend-otp-btn"
                      onClick={async () => {
                        try {
                          const response = await fetch('http://localhost:5001/api/send-otp', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ gmail: regGmail }),
                          });
                          
                          const result = await response.json();
                          
                          if (result.success) {
                            setOtpError('');
                            setError('New OTP has been sent to your Gmail address.');
                          } else {
                            setOtpError(result.error || 'Failed to resend OTP');
                          }
                        } catch (error) {
                          console.error('Error resending OTP:', error);
                          setOtpError('Failed to resend OTP. Please try again.');
                        }
                      }}
                    >
                      Resend OTP
                    </button>
                  </div>
                )}

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

                <button type="submit" className="login-btn-primary login-modal-submit">
                  Create Account
                </button>
              </form>
            ) : (
              <form className="login-modal-form" onSubmit={handleLoginSubmit}>
                {error && <div className="login-error-message">{error}</div>}
                <div className="login-form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your username"
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
      
      {/* Registration Success Modal */}
      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal-container">
            <div className="success-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#388E3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
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
