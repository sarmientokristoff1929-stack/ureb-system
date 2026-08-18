import { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import AdminDashboard from './components/admindashboard'
import ReviewerDashboard from './components/reviewerdashboard'
import StudentDashboard from './components/studentdashboard'
import DataPrivacyModal from './components/DataPrivacyModal'
import SessionExpiryModal from './components/SessionExpiryModal'
import MaintenancePage from './components/MaintenancePage'
import { IS_UNDER_MAINTENANCE } from './config/maintenance'
import { authenticateUser, sendHeartbeat, sendSignOff, API_BASE_URL } from './services/api'

// Helper function to check if running in local development environment
const isLocalEnv = () => {
  if (typeof window === 'undefined') return true;
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.local')
  );
};

// Inactivity session limit for Researcher (student role) accounts only.
const RESEARCHER_IDLE_LIMIT_MS = 10 * 60 * 1000; // 10 minutes
const RESEARCHER_IDLE_CHECK_INTERVAL_MS = 15 * 1000; // poll every 15s
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

// How often a logged-in Researcher/Reviewer tab tells the server it's still
// open, feeding the Admin Dashboard's "Active Researchers/Reviewers" cards.
const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 60 seconds

// Researcher (student) sessions live in sessionStorage, which is private to
// the tab that created it — copying the URL into a new tab or another
// browser never inherits an active login. Admin/Reviewer sessions keep the
// previous localStorage behavior (persist across tabs/restarts).
const getAuthStorage = (role) => (role === 'student' ? sessionStorage : localStorage);

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
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)

  // Show maintenance page ONLY on deployed production, bypass for localhost
  const shouldShowMaintenance = IS_UNDER_MAINTENANCE && !isLocalEnv();

  // Warm up server on page load and keep it alive every 10 minutes
  useEffect(() => {
    pingServer();
    const keepAlive = setInterval(pingServer, 10 * 60 * 1000);
    return () => clearInterval(keepAlive);
  }, []);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = () => {
      // A student session only ever lives in sessionStorage (this tab). If
      // this tab doesn't have one, fall back to localStorage for an
      // admin/reviewer session, which is meant to persist across tabs.
      const source = sessionStorage.getItem('ureb_auth') ? sessionStorage : localStorage;
      const savedAuth = source.getItem('ureb_auth');
      const savedRole = source.getItem('ureb_role');
      const savedPrivacyAccepted = sessionStorage.getItem('ureb_privacy_accepted');

      if (savedAuth === 'true' && savedRole) {
        // Researcher (student) accounts expire after 10 minutes of inactivity,
        // even across a page refresh. Other roles are unaffected.
        if (savedRole === 'student') {
          const lastActivity = parseInt(source.getItem('ureb_last_activity') || '0', 10);
          const idleFor = Date.now() - lastActivity;
          if (!lastActivity || idleFor >= RESEARCHER_IDLE_LIMIT_MS) {
            source.removeItem('ureb_auth');
            source.removeItem('ureb_role');
            source.removeItem('ureb_user');
            source.removeItem('ureb_last_activity');
            sessionStorage.removeItem('ureb_privacy_accepted');
            setShowSessionExpiredModal(true);
            setIsLoading(false);
            return;
          }
        }

        setIsAuthenticated(true);
        setUserRole(savedRole);
        if (savedPrivacyAccepted === 'true') {
          setPrivacyAccepted(true);
        } else {
          setPrivacyAccepted(false);
        }
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
        setPrivacyAccepted(false); // Must Accept & Proceed before entering dashboard

        // Persist the session. Researcher (student) logins go to
        // sessionStorage only, so they never leak into a new tab or a
        // pasted URL; admin/reviewer keep the persistent localStorage session.
        const storage = getAuthStorage(result.user.role);
        storage.setItem('ureb_auth', 'true');
        storage.setItem('ureb_role', result.user.role);
        storage.setItem('ureb_user', JSON.stringify(result.user));
        if (result.user.role === 'student') {
          storage.setItem('ureb_last_activity', Date.now().toString());
        }

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
    // Drop out of the Admin Dashboard's "Active Researchers/Reviewers" count
    // immediately, instead of waiting for the last heartbeat to age out.
    if (userRole === 'student' || userRole === 'reviewer') {
      try {
        const savedUser = JSON.parse(getAuthStorage(userRole).getItem('ureb_user') || 'null');
        if (savedUser?.email) {
          sendSignOff(savedUser.email, userRole);
        }
      } catch {
        // ignore — best-effort signoff
      }
    }

    setIsAuthenticated(false);
    setUserRole(null);
    setPrivacyAccepted(false);

    // Clear both stores — whichever one actually held this session.
    [localStorage, sessionStorage].forEach((store) => {
      store.removeItem('ureb_auth');
      store.removeItem('ureb_role');
      store.removeItem('ureb_user');
      store.removeItem('ureb_last_activity');
    });
    sessionStorage.removeItem('ureb_privacy_accepted');

    // Dispatch custom event to notify components of user change
    window.dispatchEvent(new CustomEvent('userChanged', {
      detail: { action: 'logout' }
    }));
  }

  // Flag Researcher (student role) sessions as expired after 10 minutes of
  // inactivity. The dashboard stays on screen behind the modal; the actual
  // logout/redirect to the Landing Page happens only once "OK" is clicked.
  useEffect(() => {
    if (!isAuthenticated || userRole !== 'student') return;

    let hasExpired = false;

    const markActivity = () => {
      if (hasExpired) return;
      sessionStorage.setItem('ureb_last_activity', Date.now().toString());
    };

    markActivity();
    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, markActivity, { passive: true }));

    const intervalId = setInterval(() => {
      if (hasExpired) return;
      const lastActivity = parseInt(sessionStorage.getItem('ureb_last_activity') || '0', 10);
      if (Date.now() - lastActivity >= RESEARCHER_IDLE_LIMIT_MS) {
        hasExpired = true;
        setShowSessionExpiredModal(true);
      }
    }, RESEARCHER_IDLE_CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, markActivity));
      clearInterval(intervalId);
    };
  }, [isAuthenticated, userRole]);

  // Tell the server this Researcher/Reviewer session is alive, so the Admin
  // Dashboard's realtime "Active Researchers" / "Active Reviewers" cards can
  // count it. Fires immediately on login/reload, then on a fixed interval.
  useEffect(() => {
    if (!isAuthenticated || (userRole !== 'student' && userRole !== 'reviewer')) return;

    let savedUser;
    try {
      savedUser = JSON.parse(getAuthStorage(userRole).getItem('ureb_user') || 'null');
    } catch {
      savedUser = null;
    }
    const email = savedUser?.email;
    if (!email) return;

    sendHeartbeat(email, userRole);
    const intervalId = setInterval(() => sendHeartbeat(email, userRole), HEARTBEAT_INTERVAL_MS);

    // Tab/window closing or navigating away without clicking Logout — 'pagehide'
    // fires reliably in this case (unlike 'beforeunload' with bfcache), and
    // sendSignOff uses sendBeacon so the request survives the page unloading.
    const handlePageHide = () => sendSignOff(email, userRole);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [isAuthenticated, userRole]);

  const handleCloseSessionExpiredModal = () => {
    setShowSessionExpiredModal(false);
    // Only run the logout/redirect for a live expiry (dashboard still open).
    // If the session was already flagged as expired on page load, the user
    // is on the Landing Page already and there's nothing left to clear.
    if (isAuthenticated) {
      handleLogout();
    }
  }

  const handleAcceptPrivacy = () => {
    sessionStorage.setItem('ureb_privacy_accepted', 'true');
    setPrivacyAccepted(true);
  }

  // If maintenance mode is active on deployed server, show MaintenancePage
  if (shouldShowMaintenance) {
    return <MaintenancePage />;
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
      <SessionExpiryModal isOpen={showSessionExpiredModal} onClose={handleCloseSessionExpiredModal} />
    </>
  )
}

export default App
