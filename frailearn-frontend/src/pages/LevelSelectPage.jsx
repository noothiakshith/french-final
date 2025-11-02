import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // Use our centralized api instance
import styles from './LevelSelectPage.module.css';

const LevelSelectPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  // Check if user has already completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const response = await api.get('/auth/me');
        const user = response.data;
        
        // If user has chapters in their database, they've completed onboarding
        const hasCompletedOnboarding = user.hasChapters || user.hasSkippedTest || user.placementTestScore !== null;
        
        if (hasCompletedOnboarding) {
          // User has already completed onboarding, redirect to dashboard
          navigate('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // If there's an error, let them stay on level-select page
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [navigate]);

  const handleSelect = async (level) => {
    setIsLoading(true);
    setError('');
    try {
      if (level === 'BEGINNER') {
        // --- BACKEND CALL 1 ---
        await api.post('/onboarding/skip-test', { level });
        // On success, navigate to a future dashboard page
        navigate('/dashboard');
       } else {
        // --- BACKEND CALL 2 ---
        // For Intermediate or Advanced, we start the placement test
        const response = await api.post('/tests/placement/start');
        const { testId, questions } = response.data;
        // Navigate to the placement test page, passing test data in state
        navigate('/placement-test', { state: { testId, questions } });
      }
    } catch (err) {
      console.error('Full error object:', err);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred. Please try again.';
      setError(`Error: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  // Show loading while checking onboarding status
  if (isCheckingOnboarding) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <p>Checking your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Choose Your Path</h1>
      <p className={styles.subtitle}>Select your current level to get started.</p>
      
      {isLoading ? (
        <p>Loading your experience...</p>
      ) : (
        <div className={styles.optionsGrid}>
          <div className={styles.optionCard} onClick={() => handleSelect('BEGINNER')}>
            <h3>Beginner</h3>
            <p>Start from scratch. Learn greetings, basic verbs, and essential vocabulary.</p>
          </div>
          <div className={styles.optionCard} onClick={() => handleSelect('INTERMEDIATE')}>
            <h3>Intermediate</h3>
            <p>Take a placement test to find your gaps and start with a personalized plan.</p>
          </div>
          <div className={styles.optionCard} onClick={() => handleSelect('ADVANCED')}>
            <h3>Advanced</h3>
            <p>Challenge yourself with a test to unlock advanced topics and complex grammar.</p>
          </div>
        </div>
      )}

      {error && <p style={{ color: 'var(--error-color)', marginTop: '1rem' }}>{error}</p>}
    </div>
  );
};

export default LevelSelectPage;