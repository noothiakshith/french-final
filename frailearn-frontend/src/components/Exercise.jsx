import React, { useState } from 'react';
import { submitExerciseAnswer } from '../api/lessons';
import styles from './Exercise.module.css';

const Exercise = ({ exercise, onCorrectAnswer }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [result, setResult] = useState(null); // 'correct', 'incorrect', or null
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userAnswer.trim() || result) return; // Don't submit if empty or already answered

    setIsLoading(true);
    try {
      const response = await submitExerciseAnswer(exercise.id, userAnswer);
      if (response.data.isCorrect) {
        setResult('correct');
        onCorrectAnswer(exercise.id, response.data.lessonCompleted); // Notify parent
      } else {
        setResult('incorrect');
      }
    } catch (error) {
      console.error("Failed to submit exercise", error);
    } finally {
      setIsLoading(false);
    }
  };

  const containerClasses = `${styles.container} ${result === 'correct' ? styles.correct : ''} ${result === 'incorrect' ? styles.incorrect : ''}`;

  return (
    <div className={containerClasses}>
      <p className={styles.question}>{exercise.question}</p>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Your answer..."
          disabled={!!result} // Disable input after answering
          className={styles.input}
        />
        <button type="submit" disabled={!!result || isLoading} className={styles.button}>
          {isLoading ? 'Checking...' : 'Check'}
        </button>
      </form>

      {result === 'correct' && (
        <div className={`${styles.feedback} ${styles.feedbackCorrect}`}>
          <strong>Correct!</strong>
        </div>
      )}
      {result === 'incorrect' && (
        <div className={`${styles.feedback} ${styles.feedbackIncorrect}`}>
          <strong>Not quite.</strong> The correct answer is: "{exercise.correctAnswer}"
        </div>
      )}
    </div>
  );
};

export default Exercise;