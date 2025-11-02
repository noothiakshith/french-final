import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { startProgressTest, submitProgressTest } from '../api/tests';
import api from '../api';
import TestPage from '../components/TestPage';

const ProgressTestPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { range } = useParams(); // e.g., "1-5" for chapters 1-5
  
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLevel, setUserLevel] = useState('BEGINNER');

  useEffect(() => {
    const initializeTest = async () => {
      try {
        // First, get user's current level
        const userResponse = await api.get('/auth/me');
        const currentLevel = userResponse.data.currentLevel || 'BEGINNER';
        setUserLevel(currentLevel);

        // Check if test data was passed via navigation state
        if (location.state?.testId && location.state?.questions) {
          setTestData({
            testId: location.state.testId,
            questions: location.state.questions
          });
          setLoading(false);
          return;
        }

        // If no test data in state, start a new progress test
        if (range) {
          const response = await startProgressTest(range, currentLevel);
          setTestData({
            testId: response.data.testId,
            questions: response.data.questions
          });
        } else {
          setError('No test range specified');
        }
      } catch (err) {
        setError('Failed to start progress test');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initializeTest();
  }, [location.state, range]);

  const handleSubmitSuccess = (result) => {
    // Handle successful test submission
    const { score, passed, unlockedChapters } = result;
    
    // Navigate to results page or dashboard with results
    navigate('/dashboard', { 
      state: { 
        testResult: { 
          type: 'progress',
          score, 
          passed, 
          unlockedChapters,
          range 
        } 
      } 
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Starting your progress test...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: '#ef4444' }}>{error}</p>
        <button onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <TestPage
      testId={testData?.testId}
      questions={testData?.questions}
      submitFunction={submitProgressTest}
      onSubmitSuccess={handleSubmitSuccess}
      testTitle={`Progress Test - Chapters ${range}`}
      loadingMessage="Evaluating your progress..."
      errorMessage="Progress test data not found"
      backToPath="/dashboard"
    />
  );
};

export default ProgressTestPage;