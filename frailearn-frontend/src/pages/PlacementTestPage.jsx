import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { submitPlacementTest } from '../api/tests';
import TestPage from '../components/TestPage';

const PlacementTestPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get the test data passed from LevelSelectPage
  const { testId, questions } = location.state || {};

  const handleSubmitSuccess = (result) => {
    const { pathAssigned } = result;
    
    // Redirect based on the assigned path
    if (pathAssigned === 'BEGINNER') {
      navigate('/dashboard');
    } else if (pathAssigned === 'BRIDGE_COURSE') {
      navigate('/bridge-course');
    }
  };

  return (
    <TestPage
      testId={testId}
      questions={questions}
      submitFunction={submitPlacementTest}
      onSubmitSuccess={handleSubmitSuccess}
      testTitle="Placement Test"
      loadingMessage="Evaluating your answers..."
      errorMessage="Test data not found"
      backToPath="/level-select"
    />
  );
};

export default PlacementTestPage;