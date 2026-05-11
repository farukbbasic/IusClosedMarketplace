import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

function MicrosoftLogo() {
  return (
    <svg viewBox="0 0 21 21" width="16" height="16" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <rect x="0" y="0" width="10" height="10" fill="#f25022" />
      <rect x="11" y="0" width="10" height="10" fill="#7fba00" />
      <rect x="0" y="11" width="10" height="10" fill="#00a4ef" />
      <rect x="11" y="11" width="10" height="10" fill="#ffb900" />
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMicrosoftLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-mark">
            <Icon name="shoppingBag" size={18} />
          </div>
          <div className="login-logo-text">
            <h1>IUS Market</h1>
            <span>Closed Marketplace</span>
          </div>
        </div>

        <p className="sub">Sign in with your IUS account to continue</p>

        {error && <div className="error">{error}</div>}

        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 4 }}
          onClick={handleMicrosoftLogin}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} />
              Redirecting...
            </>
          ) : (
            <>
              <MicrosoftLogo />
              Sign in with Microsoft
            </>
          )}
        </button>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: '0.6875rem', color: 'var(--text3)', lineHeight: 1.5 }}>
          Only @ius.edu.ba accounts are permitted
        </p>
      </div>
    </div>
  );
}
