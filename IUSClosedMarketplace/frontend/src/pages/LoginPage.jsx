import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMicrosoftLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login();
      // login() triggers a full-page redirect to login.microsoftonline.com,
      // so anything below this line typically does not execute.
    } catch (err) {
      console.error(err);
      setError(err.message || 'Sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>IUS Market</h1>
        <p className="sub">Sign in with your IUS account to continue</p>
        {error && <div className="error">{error}</div>}

        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          onClick={handleMicrosoftLogin}
          disabled={loading}
        >
          {loading ? 'Redirecting...' : 'Sign in with Microsoft'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text3)' }}>
          Only @ius.edu.ba accounts are allowed.
        </p>
      </div>
    </div>
  );
}
