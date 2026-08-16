import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// The backend now requires a session cookie on every request (see server.js auth gate).
// The app's ~140 fetch() call sites were written before that existed and don't set
// `credentials`, so the cookie wouldn't be sent — especially in production, where the
// frontend (Vercel) and API (Render) are different origins. Patching fetch once here,
// instead of touching every call site, is what makes those calls carry the session
// cookie without having to hand-edit each one.
const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  const url = typeof input === 'string' ? input : (input && input.url) || '';
  const isOwnApi = url.startsWith('/') || (API_ORIGIN && url.startsWith(API_ORIGIN));
  return nativeFetch(input, isOwnApi ? { ...init, credentials: 'include' } : init);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
