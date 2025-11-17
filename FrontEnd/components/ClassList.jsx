import ClassCard from './ClassCard';

/**
 * ClassList Component
 * Renders a list of ClassCard components
 * 
 * @param {Object} props
 * @param {Array} props.classes - Array of class objects
 * @param {string} props.type - List type: 'available', 'enrolled', or 'dropped'
 * @param {Function} props.onEnroll - Callback for enrollment action
 * @param {Function} props.onUnenroll - Callback for unenrollment action
 * @param {string} props.loadingClassId - ID of class currently being processed
 * @param {string} props.emptyMessage - Message to display when no classes
 */
export default function ClassList({
  classes,
  type,
  onEnroll,
  onUnenroll,
  loadingClassId = null,
  emptyMessage = 'No classes available'
}) {
  // Handle action based on type
  const handleAction = (classId, action) => {
    if (action === 'enroll' && onEnroll) {
      onEnroll(classId);
    } else if (action === 'unenroll' && onUnenroll) {
      onUnenroll(classId);
    }
  };

  // Show empty state if no classes
  if (!classes || classes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📚</div>
        <p className="empty-message">{emptyMessage}</p>

        <style jsx>{`
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4rem 2rem;
            text-align: center;
          }

          .empty-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            opacity: 0.5;
          }

          .empty-message {
            font-size: 1.125rem;
            color: #6b7280;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="class-list">
      {classes.map((classData) => (
        <ClassCard
          key={classData.classId}
          classData={classData}
          type={type}
          onAction={handleAction}
          loading={loadingClassId === classData.classId}
        />
      ))}

      <style jsx>{`
        .class-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
          padding: 1rem 0;
        }

        @media (max-width: 768px) {
          .class-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
