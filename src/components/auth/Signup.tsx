import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Auth.css';

export function Signup() {
  const navigate = useNavigate();
  const { signup, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();
    setValidationError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 4) {
      setValidationError('Password must be at least 4 characters long');
      return;
    }

    try {
      await signup({ email, password });
      navigate('/app');
    } catch (error) {
      // Error is handled by AuthContext
    }
  }

  const displayError = validationError || error;

  return (
    <div className="auth-page">
      <Link to="/" className="auth-back-link">
        ← Back to Home
      </Link>

      <div className="auth-container">
        <div className="auth-logo">
          <div className="auth-logo-icon">✨</div>
        </div>

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Start your journey to better sleep</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {displayError && <div className="auth-error">{displayError}</div>}

          <div className="auth-input-group">
            <label htmlFor="email" className="auth-label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <div className="auth-input-group">
            <label htmlFor="password" className="auth-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
              disabled={loading}
            />
            <p className="auth-hint">
              At least 4 characters
            </p>
          </div>

          <div className="auth-input-group">
            <label htmlFor="confirmPassword" className="auth-label">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? (
              <>
                <div className="auth-spinner" />
                <span>Creating account...</span>
              </>
            ) : (
              'Create Account'
            )}
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="auth-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
