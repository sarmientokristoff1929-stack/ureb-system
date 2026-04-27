import { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import AdminDashboard from './components/admindashboard'
import ReviewerDashboard from './components/reviewerdashboard'
import StudentDashboard from './components/studentdashboard'
import { authenticateUser, API_BASE_URL } from './services/api'

// Reset Password Modal — shown when URL contains ?resetToken=
const ResetPasswordModal = ({ token, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validatePassword = (pw) => {
    const errors = []
    if (pw.length < 8) errors.push('at least 8 characters')
    if (!/[A-Z]/.test(pw)) errors.push('one uppercase letter')
    if (!/[a-z]/.test(pw)) errors.push('one lowercase letter')
    if (!/\d/.test(pw)) errors.push('one number')
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw)) errors.push('one special character')
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const errors = validatePassword(newPassword)
    if (errors.length > 0) {
      setError(`Password must contain ${errors.join(', ')}.`)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.error || 'Failed to reset password')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F5F8F5', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '2.5rem', textAlign: 'center', maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#388E3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 style={{ color: '#388E3C', margin: '0 0 1rem' }}>Password Reset Successfully!</h2>
          <p style={{ color: '#5C6B73', margin: '0 0 1.5rem' }}>You can now log in with your new password.</p>
          <button onClick={onSuccess} style={{ background: '#7A9E7E', color: 'white', padding: '0.875rem 2rem', borderRadius: 12, fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '1rem', width: '100%' }}>Go to Login</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F5F8F5', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '2.5rem', textAlign: 'center', maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#7A9E7E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 style={{ color: '#2D3436', margin: '0 0 0.5rem' }}>Set New Password</h2>
        <p style={{ color: '#5C6B73', margin: '0 0 1.5rem', fontSize: '0.9rem' }}>Enter your new password below.</p>
        {error && <div style={{ background: '#F8D7DA', color: '#721C24', padding: '0.75rem 1rem', borderRadius: 8, fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#2D3436', display: 'block', marginBottom: '0.5rem' }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                style={{ width: '100%', padding: '0.875rem 3rem 0.875rem 1rem', border: '2px solid #D4E4D4', borderRadius: 12, fontSize: '1rem', boxSizing: 'border-box' }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8B9A9E', padding: '0.25rem' }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#2D3436', display: 'block', marginBottom: '0.5rem' }}>Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              style={{ width: '100%', padding: '0.875rem 1rem', border: '2px solid #D4E4D4', borderRadius: 12, fontSize: '1rem', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" disabled={loading} style={{ background: '#7A9E7E', color: 'white', padding: '1rem 2rem', borderRadius: 12, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem', opacity: loading ? 0.65 : 1, marginTop: '0.5rem' }}>
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}


// Keep the Render free-tier server warm so OTP sending is always fast.
// Fires immediately on page load, then every 10 minutes while the tab is open.
function pingServer() {
  fetch(`${API_BASE_URL}/check-gmail-exists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gmail: '' }),
    signal: AbortSignal.timeout(90000),
  }).catch(() => {
    // If ping fails (server was sleeping / 502), retry after 10 s
    setTimeout(pingServer, 10000);
  });
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [resetToken, setResetToken] = useState(null)

  // Warm up server on page load and keep it alive every 10 minutes
  useEffect(() => {
    pingServer();
    const keepAlive = setInterval(pingServer, 10 * 60 * 1000);
    return () => clearInterval(keepAlive);
  }, []);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = () => {
      // Check for reset token in URL first
      const params = new URLSearchParams(window.location.search)
      const token = params.get('resetToken')
      if (token) {
        setResetToken(token)
        // Clean URL so token doesn't linger in browser history
        window.history.replaceState({}, document.title, window.location.pathname)
        setIsLoading(false)
        return
      }

      const savedAuth = localStorage.getItem('ureb_auth');
      const savedRole = localStorage.getItem('ureb_role');
      
      if (savedAuth === 'true' && savedRole) {
        setIsAuthenticated(true);
        setUserRole(savedRole);
      }
      setIsLoading(false);
    };
    
    // Small delay to ensure localStorage is ready
    setTimeout(checkAuth, 100);
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const result = await authenticateUser(email, password);
      if (result.success) {
        // For students, check if account is disabled before allowing login
        if (result.user.role === 'student') {
          try {
            const studentsRes = await fetch(`${API_BASE_URL}/students`);
            if (studentsRes.ok) {
              const students = await studentsRes.json();
              const studentRecord = Array.isArray(students)
                ? students.find(s => s.email === email)
                : null;
              if (studentRecord?.disabled === true) {
                return { success: false, error: 'disabled' };
              }
            }
          } catch {
            // If check fails, proceed with login
          }
        }

        setIsAuthenticated(true);
        setUserRole(result.user.role);

        // Save to localStorage for persistence
        localStorage.setItem('ureb_auth', 'true');
        localStorage.setItem('ureb_role', result.user.role);
        localStorage.setItem('ureb_user', JSON.stringify(result.user));

        // Dispatch custom event to notify components of user change
        window.dispatchEvent(new CustomEvent('userChanged', {
          detail: { action: 'login', user: result.user }
        }));

        return { success: true };
      } else {
        // Return error message to be displayed in modal
        return { success: false, error: result.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      // Return error message to be displayed in modal
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  const handleRegister = async (registrationData) => {
    try {
      console.log('[DEBUG] App.handleRegister - API_BASE_URL:', API_BASE_URL);
      console.log('[DEBUG] App.handleRegister - VITE_API_URL:', import.meta.env.VITE_API_URL);
      console.log('[DEBUG] App.handleRegister - registrationData:', { ...registrationData, password: '[HIDDEN]' });
      console.log('[DEBUG] App.handleRegister - gender:', registrationData.gender);
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const result = await response.json();

      if (result.success) {
        // Optionally auto-login the user after registration
        // Or just return success and let them log in manually
        return { success: true, message: 'Registration successful! Please log in.' };
      } else {
        return { success: false, error: result.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);

    // Clear localStorage
    localStorage.removeItem('ureb_auth');
    localStorage.removeItem('ureb_role');
    localStorage.removeItem('ureb_user');

    // Dispatch custom event to notify components of user change
    window.dispatchEvent(new CustomEvent('userChanged', { 
      detail: { action: 'logout' } 
    }));
  }

  return (
    <>
      {isLoading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#F5F8F5',
          fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #E8F0E8',
              borderTop: '4px solid #7A9E7E',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p style={{ color: '#5C6B73', margin: 0 }}>Loading...</p>
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : resetToken ? (
        <ResetPasswordModal token={resetToken} onSuccess={() => setResetToken(null)} />
      ) : isAuthenticated ? (
        (userRole === 'admin' || userRole === 'superadmin' || userRole === 'super-admin' || userRole === 'root' || userRole === 'administrator') ? (
          <AdminDashboard onLogout={handleLogout} />
        ) : userRole === 'student' ? (
          <StudentDashboard onLogout={handleLogout} />
        ) : (
          <ReviewerDashboard onLogout={handleLogout} />
        )
      ) : (
        <LandingPage onLogin={handleLogin} onRegister={handleRegister} />
      )}
    </>
  )
}

export default App
