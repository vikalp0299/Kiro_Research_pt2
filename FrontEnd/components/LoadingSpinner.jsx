'use client';

/**
 * LoadingSpinner Component
 * Displays a loading animation with optional message
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Size of spinner: 'small', 'medium', 'large' (default: 'medium')
 * @param {string} props.message - Optional loading message to display
 */
export default function LoadingSpinner({ size = 'medium', message }) {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'spinner-small';
      case 'large':
        return 'spinner-large';
      case 'medium':
      default:
        return 'spinner-medium';
    }
  };

  return (
    <div className="loading-spinner-container">
      <div className={`spinner ${getSizeClasses()}`}>
        <div className="spinner-circle"></div>
      </div>
      {message && <div className="loading-message">{message}</div>}

      <style jsx>{`
        .loading-spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .spinner {
          display: inline-block;
          position: relative;
        }

        .spinner-small {
          width: 20px;
          height: 20px;
        }

        .spinner-medium {
          width: 40px;
          height: 40px;
        }

        .spinner-large {
          width: 60px;
          height: 60px;
        }

        .spinner-circle {
          width: 100%;
          height: 100%;
          border: 3px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .spinner-small .spinner-circle {
          border-width: 2px;
        }

        .spinner-large .spinner-circle {
          border-width: 4px;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .loading-message {
          font-size: 0.875rem;
          color: #6b7280;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
