'use client';

import { useEffect } from 'react';
import { validatePassword, getStrengthColor, getStrengthLabel } from '../js/utils/passwordValidation';

/**
 * PasswordStrengthIndicator Component
 * Displays visual password strength indicator with requirements checklist
 * 
 * @param {Object} props - Component props
 * @param {string} props.password - Password to validate
 * @param {Function} props.onStrengthChange - Callback when strength changes (optional)
 */
export default function PasswordStrengthIndicator({ password, onStrengthChange }) {
  // Validate password
  const validation = validatePassword(password || '');
  const { strength, feedback, errors } = validation;

  // Notify parent of strength change using useEffect
  useEffect(() => {
    if (onStrengthChange && password) {
      onStrengthChange(strength);
    }
  }, [strength, password, onStrengthChange]);

  // Don't show indicator if no password entered
  if (!password) {
    return null;
  }

  const strengthColor = getStrengthColor(strength);
  const strengthLabel = getStrengthLabel(strength);

  // Calculate strength bar width
  const getStrengthWidth = () => {
    switch (strength) {
      case 'strong':
        return '100%';
      case 'medium':
        return '66%';
      case 'weak':
      default:
        return '33%';
    }
  };

  return (
    <div className="password-strength-indicator">
      {/* Strength Bar */}
      <div className="strength-bar-container">
        <div
          className="strength-bar"
          style={{
            width: getStrengthWidth(),
            backgroundColor: strengthColor,
            transition: 'all 0.3s ease'
          }}
        />
      </div>

      {/* Strength Label */}
      <div className="strength-label" style={{ color: strengthColor }}>
        Password Strength: <strong>{strengthLabel}</strong>
      </div>

      {/* Requirements Checklist */}
      <div className="requirements-checklist">
        <div className="checklist-title">Password Requirements:</div>
        <ul className="checklist-items">
          <li className={feedback.minLength ? 'met' : 'unmet'}>
            <span className="checkbox">{feedback.minLength ? '✓' : '○'}</span>
            At least 12 characters
          </li>
          <li className={feedback.hasUpper ? 'met' : 'unmet'}>
            <span className="checkbox">{feedback.hasUpper ? '✓' : '○'}</span>
            One uppercase letter
          </li>
          <li className={feedback.hasLower ? 'met' : 'unmet'}>
            <span className="checkbox">{feedback.hasLower ? '✓' : '○'}</span>
            One lowercase letter
          </li>
          <li className={feedback.hasNumber ? 'met' : 'unmet'}>
            <span className="checkbox">{feedback.hasNumber ? '✓' : '○'}</span>
            One number
          </li>
          <li className={feedback.hasSpecial ? 'met' : 'unmet'}>
            <span className="checkbox">{feedback.hasSpecial ? '✓' : '○'}</span>
            One special character (!@#$%^&*)
          </li>
        </ul>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="error-messages">
          {errors.map((error, index) => (
            <div key={index} className="error-message">
              {error}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .password-strength-indicator {
          margin-top: 0.5rem;
          padding: 0.75rem;
          background-color: #f9fafb;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
        }

        .strength-bar-container {
          width: 100%;
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .strength-bar {
          height: 100%;
          border-radius: 4px;
        }

        .strength-label {
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
          font-weight: 500;
        }

        .requirements-checklist {
          margin-top: 0.75rem;
        }

        .checklist-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .checklist-items {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .checklist-items li {
          font-size: 0.875rem;
          padding: 0.25rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .checklist-items li.met {
          color: #059669;
        }

        .checklist-items li.unmet {
          color: #6b7280;
        }

        .checkbox {
          font-weight: bold;
          font-size: 1rem;
          width: 1.25rem;
          display: inline-block;
        }

        .error-messages {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid #e5e7eb;
        }

        .error-message {
          font-size: 0.75rem;
          color: #dc2626;
          padding: 0.125rem 0;
        }
      `}</style>
    </div>
  );
}
