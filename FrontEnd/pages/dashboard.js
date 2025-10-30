import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  displayAllAvailableClasses, 
  displayEnrolledClasses, 
  displayDroppedClasses,
  enrollClass,
  unenrollClass
} from '../utils/api';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('available');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [droppedClasses, setDroppedClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [available, enrolled, dropped] = await Promise.all([
        displayAllAvailableClasses(),
        displayEnrolledClasses(),
        displayDroppedClasses()
      ]);
      
      setAvailableClasses(available.data || []);
      setEnrolledClasses(enrolled.data || []);
      setDroppedClasses(dropped.data || []);
    } catch (error) {
      setMessage('Error loading class data');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (classId) => {
    try {
      const response = await enrollClass(classId);
      if (response.success) {
        setMessage('Successfully enrolled in class');
        loadData(); // Refresh data
      } else {
        setMessage(response.message || 'Enrollment failed');
      }
    } catch (error) {
      setMessage('Error enrolling in class');
    }
  };

  const handleUnenroll = async (classId) => {
    try {
      const response = await unenrollClass(classId);
      if (response.success) {
        setMessage('Successfully dropped class');
        loadData(); // Refresh data
      } else {
        setMessage(response.message || 'Drop failed');
      }
    } catch (error) {
      setMessage('Error dropping class');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const renderClassList = (classes, actionType) => {
    if (classes.length === 0) {
      return <p>No classes found.</p>;
    }

    return (
      <div className="class-list">
        {classes.map((classItem) => (
          <div key={classItem.classId} className="class-item">
            <div className="class-info">
              <h3>{classItem.classId}</h3>
              <p className="class-name">{classItem.className}</p>
              {classItem.credits && <p className="credits">Credits: {classItem.credits}</p>}
              {classItem.description && <p className="description">{classItem.description}</p>}
            </div>
            <div className="class-actions">
              {actionType === 'enroll' && (
                <button 
                  onClick={() => handleEnroll(classItem.classId)}
                  className="btn-primary"
                >
                  Enroll
                </button>
              )}
              {actionType === 'unenroll' && (
                <button 
                  onClick={() => handleUnenroll(classItem.classId)}
                  className="btn-secondary"
                >
                  Drop
                </button>
              )}
              {actionType === 're-enroll' && (
                <button 
                  onClick={() => handleEnroll(classItem.classId)}
                  className="btn-primary"
                >
                  Re-enroll
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Class Registration Dashboard</h1>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </header>

      <nav className="dashboard-nav">
        <button 
          className={activeTab === 'available' ? 'active' : ''}
          onClick={() => setActiveTab('available')}
        >
          Available Classes
        </button>
        <button 
          className={activeTab === 'enrolled' ? 'active' : ''}
          onClick={() => setActiveTab('enrolled')}
        >
          My Classes
        </button>
        <button 
          className={activeTab === 'dropped' ? 'active' : ''}
          onClick={() => setActiveTab('dropped')}
        >
          Dropped Classes
        </button>
      </nav>

      {message && (
        <div className={`message ${message.includes('Error') || message.includes('failed') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <main className="dashboard-content">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {activeTab === 'available' && (
              <div>
                <h2>Available Classes</h2>
                {renderClassList(availableClasses, 'enroll')}
              </div>
            )}
            {activeTab === 'enrolled' && (
              <div>
                <h2>My Enrolled Classes</h2>
                {renderClassList(enrolledClasses, 'unenroll')}
              </div>
            )}
            {activeTab === 'dropped' && (
              <div>
                <h2>Dropped Classes</h2>
                {renderClassList(droppedClasses, 're-enroll')}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}