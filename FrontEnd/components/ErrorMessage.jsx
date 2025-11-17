'use client';

import { useEffect, useState } from 'react';

/**
 * ErrorMessage Component
 * Displays user-friendly error messages with dismiss functionality
 * 
 * @param {Object} props - Component props
 * @param {string} props.message - Error message to display
 * @param {Function} props.onDismiss - Callback when error is dismissed (optional)
 * @param {number} props.autoHideDuration - Auto-hide after milliseconds (default: 5000, 0 to disable)
 */
export default function ErrorMessage({ message, onDismiss, autoHideDuration = 5000 }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Reset visibility when message changes
    setIsVisible(true);

    // Auto-hide after duration
    if (autoHideDuration > 0 && message) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [message, autoHideDuration]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  // Don't render if no message or not visible
  if (!message || !isVisible) {
    return null;
  }

  return (
    <div className="error-message-container">
      <div className="error-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          width="20"
          height="20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div className="error-text">{message}</div>
      {onDismiss && (
        <button
          className="dismiss-button"
          onClick={handleDismiss}
          aria-label="Dismiss error"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            width="16"
            height="16"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}

      <style jsx>{`
        .error-message-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 0.375rem;
          color: #991b1b;
          margin: 0.5rem 0;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .error-icon {
          flex-shrink: 0;
          color: #dc2626;
        }

        .error-text {
          flex: 1;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .dismiss-button {
          flex-shrink: 0;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          color: #991b1b;
          border-radius: 0.25rem;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dismiss-button:hover {
          background-color: #fee2e2;
        }

        .dismiss-button:focus {
          outline: 2px solid #dc2626;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
