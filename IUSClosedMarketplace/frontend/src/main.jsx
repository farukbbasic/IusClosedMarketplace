import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MsalProvider } from '@azure/msal-react'
import { msalInstance, initializeMsal } from './auth/authConfig'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import App from './App'
import './globals.css'
import './styles.css'

// MSAL must be initialized BEFORE any component tries to read its state.
// We await initialization (which also processes any redirect response) and
// only then render React.
initializeMsal().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <MsalProvider instance={msalInstance}>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </MsalProvider>
    </BrowserRouter>
  )
}).catch((err) => {
  console.error('MSAL initialization failed:', err);
  document.getElementById('root').innerText =
    'Authentication system failed to initialize. Please refresh the page.';
});
