import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FirebaseError } from 'firebase/app';
import authSystem from '../auth/AuthSystem';
import { useAuth } from '../auth/AuthContext';
import './Auth.css';

interface TestUser {
  id: string;
  email: string;
  displayName: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setError, testLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Test login state
  const [showTestLogin, setShowTestLogin] = useState(false);
  const [testUsers, setTestUsers] = useState<TestUser[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [loadingTestUsers, setLoadingTestUsers] = useState(false);

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'auth/invalid-email':
          return 'Invalid email address format.';
        case 'auth/user-disabled':
          return 'This account has been disabled.';
        case 'auth/user-not-found':
          return 'No account found with this email.';
        case 'auth/wrong-password':
          return 'Incorrect password.';
        case 'auth/invalid-credential':
          return 'Invalid email or password.';
        case 'auth/too-many-requests':
          return 'Too many failed login attempts. Please try again later.';
        default:
          return `Authentication error: ${error.message}`;
      }
    }
    return 'An unexpected error occurred. Please try again.';
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setLocalError(null);
    setError(null);

    try {
      await authSystem.signIn(email, password);
      navigate('/');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setLocalError(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setLocalError(null);
    setError(null);

    try {
      await authSystem.signInWithGoogle();
      navigate('/');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setLocalError(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load test users when test login section is opened
  useEffect(() => {
    if (showTestLogin && testUsers.length === 0) {
      setLoadingTestUsers(true);
      authSystem.getTestUsers()
        .then(users => setTestUsers(users))
        .catch(err => console.error('Failed to load test users:', err))
        .finally(() => setLoadingTestUsers(false));
    }
  }, [showTestLogin, testUsers.length]);

  const handleTestLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!testEmail) {
      setLocalError('Please select or enter an email.');
      return;
    }

    setLoading(true);
    setLocalError(null);
    setError(null);

    try {
      await testLogin(testEmail, 'password');
      navigate('/');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Test login failed';
      setLocalError(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main-content" className="login-page">
      <div className="login-container">
        <h1>Sign In</h1>

        {localError && (
          <div className="error-message" role="alert">
            {localError}
          </div>
        )}

        <form onSubmit={handleEmailSignIn} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="btn btn-google"
          disabled={loading}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        <div className="signup-link">
          <p>
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>

        {/* Test Login Section */}
        <div className="test-login-section">
          <button
            type="button"
            className="test-login-toggle"
            onClick={() => setShowTestLogin(!showTestLogin)}
          >
            🔧 {showTestLogin ? 'Hide' : 'Show'} Test Login
          </button>

          {showTestLogin && (
            <div className="test-login-content">
              <p className="test-login-hint">
                Admin test mode: Log in as any user with password "password"
              </p>

              <form onSubmit={handleTestLogin} className="test-login-form">
                <div className="form-group">
                  <label htmlFor="test-email">Select User</label>
                  {loadingTestUsers ? (
                    <p className="loading-text">Loading users...</p>
                  ) : (
                    <select
                      id="test-email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      disabled={loading}
                    >
                      <option value="">-- Select a user --</option>
                      {testUsers.map((user) => (
                        <option key={user.id} value={user.email}>
                          {user.displayName} ({user.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="test-email-manual">Or enter email manually</label>
                  <input
                    id="test-email-manual"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="user@example.com"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-warning"
                  disabled={loading || !testEmail}
                >
                  {loading ? 'Logging in...' : 'Test Login'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
