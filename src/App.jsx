import { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import AdminDashboard from './components/admindashboard'
import ReviewerDashboard from './components/reviewerdashboard'
import StudentDashboard from './components/studentdashboard'
import { authenticateUser, API_BASE_URL } from './services/api'

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

  // Warm up server on page load and keep it alive every 10 minutes
  useEffect(() => {
    pingServer();
    const keepAlive = setInterval(pingServer, 10 * 60 * 1000);
    return () => clearInterval(keepAlive);
  }, []);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = () => {
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
