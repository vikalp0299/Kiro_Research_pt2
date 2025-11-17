import LoadingSpinner from './LoadingSpinner';

/**
 * ClassCard Component
 * Displays individual class information with action buttons
 * 
 * @param {Object} props
 * @param {Object} props.classData - Class information
 * @param {string} props.classData.classId - Class ID (e.g., "IFT 593")
 * @param {string} props.classData.className - Class name
 * @param {number} props.classData.credits - Number of credits
 * @param {string} props.classData.description - Class description
 * @param {string} props.type - Card type: 'available', 'enrolled', or 'dropped'
 * @param {Function} props.onAction - Callback when action button is clicked
 * @param {boolean} props.loading - Whether action is in progress
 */
export default function ClassCard({ classData, type, onAction, loading = false }) {
  const { classId, className, credits, description } = classData;

  // Determine button text and style based on type
  const getButtonConfig = () => {
    switch (type) {
      case 'available':
        return {
          text: 'Enroll',
          className: 'action-button enroll',
          action: 'enroll'
        };
      case 'enrolled':
        return {
          text: 'Unenroll',
          className: 'action-button unenroll',
          action: 'unenroll'
        };
      case 'dropped':
        return {
          text: 'Re-enroll',
          className: 'action-button re-enroll',
          action: 'enroll'
        };
      default:
        return null;
    }
  };

  const buttonConfig = getButtonConfig();

  const handleClick = () => {
    if (!loading && onAction && buttonConfig) {
      onAction(classId, buttonConfig.action);
    }
  };

  return (
    <div className="class-card">
      <div className="class-header">
        <div className="class-id-badge">{classId}</div>
        <div className="class-credits">{credits} Credits</div>
      </div>

      <h3 className="class-name">{className}</h3>

      <p className="class-description">{description}</p>

      {buttonConfig && (
        <button
          className={buttonConfig.className}
          onClick={handleClick}
          disabled={loading}
        >
          {loading ? (
            <LoadingSpinner size="small" />
          ) : (
            buttonConfig.text
          )}
        </button>
      )}

      <style jsx>{`
        .class-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .class-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
        }

        .class-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .class-id-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .class-credits {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .class-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .class-description {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.5;
          margin: 0;
          flex-grow: 1;
        }

        .action-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
        }

        .action-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .action-button.enroll {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .action-button.enroll:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(102, 126, 234, 0.4), 0 2px 4px -1px rgba(102, 126, 234, 0.3);
        }

        .action-button.unenroll {
          background: #ef4444;
          color: white;
        }

        .action-button.unenroll:hover:not(:disabled) {
          background: #dc2626;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.4), 0 2px 4px -1px rgba(239, 68, 68, 0.3);
        }

        .action-button.re-enroll {
          background: #10b981;
          color: white;
        }

        .action-button.re-enroll:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4), 0 2px 4px -1px rgba(16, 185, 129, 0.3);
        }

        .action-button:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
