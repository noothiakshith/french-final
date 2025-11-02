import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { submitBridgeFinalTest } from '../api/tests';
import TestPage from '../components/TestPage';

const BridgeFinalTestPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get test data from navigation state (passed from BridgeCoursePage)
    if (location.state?.testData) {
      setTestData(location.state.testData);
      setLoading(false);
    } else {
      setError('No test data found. Please start the test from the Bridge Course page.');
      setLoading(false);
    }
  }, [location.state]);

  const handleSubmitSuccess = (result) => {
    // Handle successful test submission
    const { score, passed } = result;
    
    if (passed) {
      // If they passed, redirect to main curriculum dashboard
      navigate('/dashboard', { 
        state: { 
          testResult: { 
            type: 'bridge-final',
            score, 
            passed,
            message: 'Congratulations! You have successfully completed the Bridge Course and unlocked your main curriculum.'
          } 
        } 
      });
    } else {
      // If they failed, redirect back to bridge course
      navigate('/bridge-course', { 
        state: { 
          testResult: { 
            type: 'bridge-final',
            score, 
            passed,
            message: 'You need to review the bridge course materials before retaking the final test.'
          } 
        } 
      });
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Loading your final test...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: '#ef4444' }}>{error}</p>
        <button onClick={() => navigate('/bridge-course')}>
          Back to Bridge Course
        </button>
      </div>
    );
  }

  return (
    <TestPage
      testId={testData?.testId}
      questions={testData?.questions}
      submitFunction={submitBridgeFinalTest}
      onSubmitSuccess={handleSubmitSuccess}
      testTitle="Bridge Course Final Test"
      loadingMessage="Evaluating your final test..."
      errorMessage="Bridge final test data not found"
      backToPath="/bridge-course"
    />
  );
};

export default BridgeFinalTestPage;