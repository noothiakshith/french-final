import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './TestPage.module.css';

const TestPage = ({ 
  testId, 
  questions, 
  submitFunction, 
  onSubmitSuccess, 
  testTitle = "Test",
  loadingMessage = "Evaluating your answers...",
  errorMessage = "Test data not found",
  backToPath = "/dashboard"
}) => {
  const navigate = useNavigate();
  
  // State management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fillInAnswer, setFillInAnswer] = useState('');

  // Debug logging
  useEffect(() => {
    console.log('TestPage - testId:', testId);
    console.log('TestPage - questions:', questions);
  }, [testId, questions]);

  // If no test data was passed, show error
  if (!testId || !questions || !Array.isArray(questions) || questions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>{errorMessage}</h2>
          <p>Please start the test from the appropriate page.</p>
          <button 
            className={styles.submitButton}
            onClick={() => navigate(backToPath)}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswer = async (answer) => {
    // Add the user's answer to the array
    const newAnswer = {
      questionId: currentQuestion.id,
      userAnswer: answer
    };
    const updatedAnswers = [...userAnswers, newAnswer];
    setUserAnswers(updatedAnswers);

    if (isLastQuestion) {
      // This is the last question - submit the test
      await handleSubmit(updatedAnswers);
    } else {
      // Move to the next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setFillInAnswer(''); // Reset fill-in answer for next question
    }
  };

  const handleSubmit = async (finalAnswers) => {
    setIsLoading(true);
    setError('');
    
    console.log('🚀 TestPage - Submitting test:', {
      testId,
      answersCount: finalAnswers.length,
      answers: finalAnswers
    });
    
    try {
      const response = await submitFunction(testId, finalAnswers);
      console.log('✅ TestPage - Test submitted successfully:', response.data);
      onSubmitSuccess(response.data);
    } catch (err) {
      console.error('❌ TestPage - Submit error:', err);
      console.error('❌ Error response:', err.response?.data);
      setError('Failed to submit test. Please try again.');
      setIsLoading(false);
    }
  };

  const handleFillInSubmit = (e) => {
    e.preventDefault();
    if (fillInAnswer.trim()) {
      handleAnswer(fillInAnswer.trim());
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          {loadingMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{testTitle}</h1>
        <p className={styles.progress}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </p>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className={styles.questionCard}>
        <h2 className={styles.question}>{currentQuestion?.question || 'Loading question...'}</h2>
        
        {currentQuestion?.type === 'MULTIPLE_CHOICE' && (
          <div className={styles.optionsContainer}>
            {currentQuestion?.options && Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0 ? (
              currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={styles.optionButton}
                  onClick={() => handleAnswer(option)}
                >
                  {option}
                </button>
              ))
            ) : (
              <div className={styles.error}>
                <p>No options available for this multiple choice question.</p>
                <button 
                  className={styles.submitButton}
                  onClick={() => handleAnswer('NO_OPTIONS_AVAILABLE')}
                >
                  Skip Question
                </button>
              </div>
            )}
          </div>
        )}

        {currentQuestion?.type === 'FILL_IN_BLANK' && (
          <form onSubmit={handleFillInSubmit}>
            <input
              type="text"
              className={styles.textInput}
              value={fillInAnswer}
              onChange={(e) => setFillInAnswer(e.target.value)}
              placeholder="Type your answer here..."
              autoFocus
            />
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!fillInAnswer.trim()}
            >
              {isLastQuestion ? 'Finish Test' : 'Next Question'}
            </button>
          </form>
        )}

        {/* Fallback for unknown question types */}
        {currentQuestion && !['MULTIPLE_CHOICE', 'FILL_IN_BLANK'].includes(currentQuestion.type) && (
          <div className={styles.error}>
            <p>Unknown question type: {currentQuestion.type}</p>
            <button 
              className={styles.submitButton}
              onClick={() => handleAnswer('SKIPPED')}
            >
              Skip Question
            </button>
          </div>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default TestPage;