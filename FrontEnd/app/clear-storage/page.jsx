'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { token } from '../../lib/api';

export default function ClearStorage() {
  const [cleared, setCleared] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      token.remove();
      setCleared(true);
    }
  }, []);

  const goHome = () => {
    router.push('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      padding: '2rem'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        padding: '3rem',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        {cleared ? (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h1 style={{ color: '#e2e8f0', marginBottom: '1rem' }}>Storage Cleared!</h1>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
              All tokens and cached data have been removed. You can now register or login with a fresh session.
            </p>
            <button
              onClick={goHome}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 30px rgba(59, 130, 246, 0.6)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.4)';
              }}
            >
              Go to Home
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔄</div>
            <h1 style={{ color: '#e2e8f0' }}>Clearing Storage...</h1>
          </>
        )}
      </div>
    </div>
  );
}
