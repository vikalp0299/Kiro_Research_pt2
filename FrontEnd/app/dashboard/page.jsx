'use client';

import { useState, useEffect } from 'react';
import { classes } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClassList from '../../components/ClassList';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

function DashboardContent() {
  const { logout } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState('available');

  // Data state
  const [classesData, setClassesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Action state
  const [loadingClassId, setLoadingClassId] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Fetch classes based on active tab
  useEffect(() => {
    fetchClasses();
  }, [activeTab]);

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;
      switch (activeTab) {
        case 'available':
          response = await classes.getAvailable();
          break;
        case 'enrolled':
          response = await classes.getEnrolled();
          break;
        case 'dropped':
          response = await classes.getDropped();
          break;
        default:
          response = { classes: [] };
      }
      // Extract classes array from response
      setClassesData(response.classes || response || []);
    } catch (err) {
      setError(err.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  // Handle enrollment
  const handleEnroll = async (classId) => {
    setLoadingClassId(classId);
    setActionError(null);

    try {
      await classes.enroll(classId);
      // Refresh the current view
      await fetchClasses();
    } catch (err) {
      setActionError(err.message || 'Failed to enroll in class');
    } finally {
      setLoadingClassId(null);
    }
  };

  // Handle unenrollment
  const handleUnenroll = async (classId) => {
    setLoadingClassId(classId);
    setActionError(null);

    try {
      await classes.unenroll(classId);
      // Refresh the current view
      await fetchClasses();
    } catch (err) {
      setActionError(err.message || 'Failed to unenroll from class');
    } finally {
      setLoadingClassId(null);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
  };

  // Get empty message based on tab
  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'available':
        return 'No classes available for enrollment';
      case 'enrolled':
        return 'You are not enrolled in any classes';
      case 'dropped':
        return 'You have not dropped any classes';
      default:
        return 'No classes found';
    }
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Class Dashboard</h1>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'available' ? 'active' : ''}`}
              onClick={() => setActiveTab('available')}
            >
              Available Classes
            </button>
            <button
              className={`tab-button ${activeTab === 'enrolled' ? 'active' : ''}`}
              onClick={() => setActiveTab('enrolled')}
            >
              My Classes
            </button>
            <button
              className={`tab-button ${activeTab === 'dropped' ? 'active' : ''}`}
              onClick={() => setActiveTab('dropped')}
            >
              Dropped Classes
            </button>
          </div>

          {/* Error Messages */}
          {error && (
            <ErrorMessage
              message={error}
              onDismiss={() => setError(null)}
            />
          )}

          {actionError && (
            <ErrorMessage
              message={actionError}
              onDismiss={() => setActionError(null)}
            />
          )}

          {/* Content Area */}
          <div className="content-area">
            {loading ? (
              <div className="loading-container">
                <LoadingSpinner size="large" message="Loading classes..." />
              </div>
            ) : (
              <ClassList
                classes={classesData}
                type={activeTab}
                onEnroll={handleEnroll}
                onUnenroll={handleUnenroll}
                loadingClassId={loadingClassId}
                emptyMessage={getEmptyMessage()}
              />
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .dashboard-page {
          min-height: 100vh;
          background: #f9fafb;
        }

        .dashboard-header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 1rem 0;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dashboard-header h1 {
          font-size: 1.875rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .logout-button {
          padding: 0.5rem 1.5rem;
          background: white;
          color: #ef4444;
          border: 1px solid #ef4444;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logout-button:hover {
          background: #ef4444;
          color: white;
        }

        .dashboard-main {
          padding: 2rem 0;
        }

        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .tab-navigation {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .tab-button {
          padding: 1rem 1.5rem;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          font-size: 1rem;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: -2px;
        }

        .tab-button:hover {
          color: #374151;
        }

        .tab-button.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }

        .content-area {
          min-height: 400px;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
        }

        @media (max-width: 768px) {
          .header-content {
            padding: 0 1rem;
          }

          .dashboard-header h1 {
            font-size: 1.5rem;
          }

          .dashboard-container {
            padding: 0 1rem;
          }

          .tab-navigation {
            flex-direction: column;
            gap: 0;
            border-bottom: none;
          }

          .tab-button {
            border-bottom: 1px solid #e5e7eb;
            border-left: 3px solid transparent;
            margin-bottom: 0;
            text-align: left;
          }

          .tab-button.active {
            border-bottom-color: #e5e7eb;
            border-left-color: #667eea;
          }
        }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
