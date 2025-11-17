'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

export default function LoginPage() {
  const router = useRouter();
  const { login, verifyMFA, resendMFA } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });

  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaData, setMfaData] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }

    // Clear general error
    if (error) {
      setError(null);
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};

    // Validate identifier (username or email)
    if (!formData.identifier.trim()) {
      errors.identifier = 'Username or email is required';
    }

    // Validate password
    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call login through AuthContext
      const response = await login({
        identifier: formData.identifier,
        password: formData.password
      });

      // Check if MFA is required
      if (response.mfaRequired) {
        setMfaRequired(true);
        setMfaData(response);
        setError(null);
      } else {
        // Login successful - redirect to dashboard
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle MFA code submission
  const handleMFASubmit = async (e) => {
    e.preventDefault();

    if (!mfaCode || mfaCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await verifyMFA(mfaData.userId, mfaCode);
      
      // MFA verified - redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      const errorData = err.data || {};
      setError(err.message || 'Invalid verification code');
      
      if (errorData.attemptsRemaining !== undefined) {
        setAttemptsRemaining(errorData.attemptsRemaining);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle resend MFA code
  const handleResendCode = async () => {
    setLoading(true);
    setError(null);

    try {
      await resendMFA(mfaData.userId);
      setError(null);
      alert('Verification code resent! Check your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  // Handle MFA code input
  const handleMFACodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setMfaCode(value);
    if (error) setError(null);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>{mfaRequired ? 'Verify Your Identity' : 'Welcome Back'}</h1>
          <p>{mfaRequired ? 'Enter the code sent to your email' : 'Sign in to access your classes'}</p>
        </div>

        {error && (
          <ErrorMessage
            message={error}
            onDismiss={() => setError(null)}
          />
        )}

        {mfaRequired ? (
          // MFA Verification Form
          <form onSubmit={handleMFASubmit} className="login-form">
            <div className="mfa-info">
              <p>A 6-digit verification code has been sent to:</p>
              <p className="email-masked">{mfaData?.email}</p>
              {mfaData?.devCode && (
                <p className="dev-code">Dev Code: {mfaData.devCode}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="mfaCode">
                Verification Code <span className="required">*</span>
              </label>
              <input
                type="text"
                id="mfaCode"
                name="mfaCode"
                value={mfaCode}
                onChange={handleMFACodeChange}
                disabled={loading}
                placeholder="000000"
                maxLength="6"
                className="mfa-input"
                autoComplete="one-time-code"
                autoFocus
              />
              {attemptsRemaining < 3 && (
                <span className="attempts-warning">
                  {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
                </span>
              )}
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading || mfaCode.length !== 6}
            >
              {loading ? <LoadingSpinner size="small" /> : 'Verify Code'}
            </button>

            <button
              type="button"
              className="resend-button"
              onClick={handleResendCode}
              disabled={loading}
            >
              Resend Code
            </button>

            <button
              type="button"
              className="back-button"
              onClick={() => {
                setMfaRequired(false);
                setMfaCode('');
                setError(null);
              }}
              disabled={loading}
            >
              ← Back to Login
            </button>
          </form>
        ) : (
          // Login Form
          <form onSubmit={handleSubmit} className="login-form">
          {/* Username/Email Field */}
          <div className="form-group">
            <label htmlFor="identifier">
              Username or Email <span className="required">*</span>
            </label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              disabled={loading}
              className={validationErrors.identifier ? 'error' : ''}
              placeholder="Enter your username or email"
              autoComplete="username"
            />
            {validationErrors.identifier && (
              <span className="field-error">{validationErrors.identifier}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              className={validationErrors.password ? 'error' : ''}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            {validationErrors.password && (
              <span className="field-error">{validationErrors.password}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner size="small" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        )}

        {/* Registration Link */}
        {!mfaRequired && (
          <div className="register-link">
            Don't have an account?{' '}
            <a href="/register">Create one here</a>
          </div>
        )}
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem 1rem;
        }

        .login-container {
          width: 100%;
          max-width: 420px;
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          padding: 2rem;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-header h1 {
          font-size: 1.875rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        .login-header p {
          color: #6b7280;
          margin: 0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .required {
          color: #dc2626;
        }

        .form-group input {
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group input.error {
          border-color: #dc2626;
        }

        .form-group input.error:focus {
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }

        .form-group input:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }

        .field-error {
          font-size: 0.75rem;
          color: #dc2626;
          margin-top: -0.25rem;
        }

        .submit-button {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        .submit-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .register-link {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .register-link a {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 600;
        }

        .register-link a:hover {
          text-decoration: underline;
        }

        /* MFA Styles */
        .mfa-info {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 0.375rem;
          padding: 1rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .mfa-info p {
          margin: 0.25rem 0;
          font-size: 0.875rem;
          color: #1e40af;
        }

        .email-masked {
          font-weight: 600;
          font-size: 1rem !important;
          color: #1f2937 !important;
        }

        .dev-code {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          padding: 0.5rem;
          margin-top: 0.5rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 1.125rem !important;
          font-weight: 700;
          color: #92400e !important;
        }

        .mfa-input {
          text-align: center;
          font-size: 1.5rem !important;
          letter-spacing: 0.5rem;
          font-weight: 600;
          font-family: monospace;
        }

        .attempts-warning {
          font-size: 0.75rem;
          color: #dc2626;
          font-weight: 600;
          margin-top: 0.25rem;
          display: block;
        }

        .resend-button {
          padding: 0.75rem 1.5rem;
          background: white;
          color: #3b82f6;
          border: 2px solid #3b82f6;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 0.5rem;
        }

        .resend-button:hover:not(:disabled) {
          background: #eff6ff;
        }

        .resend-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .back-button {
          padding: 0.5rem 1rem;
          background: transparent;
          color: #6b7280;
          border: none;
          font-size: 0.875rem;
          cursor: pointer;
          margin-top: 1rem;
          transition: color 0.2s;
        }

        .back-button:hover:not(:disabled) {
          color: #1f2937;
        }

        .back-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
