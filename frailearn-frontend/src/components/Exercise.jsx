import React, { useState } from 'react';
import { submitExerciseAnswer } from '../api/lessons';
import styles from './Exercise.module.css';

const Exercise = ({ exercise, onCorrectAnswer }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [result, setResult] = useState(null); // 'correct', 'incorrect', or null
  const [isLoading, setIsLoading] = useState(false);

  // Function to normalize text by removing accents and converting to lowercase
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
      .replace(/[^a-z\s\-']/g, '') // Keep only letters, spaces, hyphens, and apostrophes
      .trim();
  };

  // Function to filter input to allow both French and English characters
  const filterInput = (text) => {
    // Allow French letters (including accented), English letters, spaces, hyphens, and apostrophes
    return text.replace(/[^a-zA-ZàâäéèêëïîôöùûüÿçÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ\s\-']/g, '');
  };

  const handleInputChange = (e) => {
    const filteredValue = filterInput(e.target.value);
    setUserAnswer(filteredValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userAnswer.trim() || result) return; // Don't submit if empty or already answered

    setIsLoading(true);
    try {
      // Normalize user answer for comparison
      const normalizedUserAnswer = normalizeText(userAnswer);
      
      // For translation exercises, we need to check against both French and English answers
      let isCorrect = false;
      
      if (exercise.type === 'TRANSLATION_EN_TO_FR') {
        // User should answer in French, check against French correct answer
        const normalizedCorrectAnswer = normalizeText(exercise.correctAnswer);
        isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
      } else if (exercise.type === 'TRANSLATION_FR_TO_EN') {
        // User should answer in English, check against English correct answer
        const normalizedCorrectAnswer = normalizeText(exercise.correctAnswer);
        isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
      } else {
        // For other exercise types (FILL_IN_BLANK, MULTIPLE_CHOICE), check against correct answer
        const normalizedCorrectAnswer = normalizeText(exercise.correctAnswer);
        isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
      }
      
      const response = await submitExerciseAnswer(exercise.id, userAnswer);
      
      // Use our client-side validation as primary check, fallback to server response
      if (isCorrect || response.data.isCorrect) {
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
          onChange={handleInputChange}
          placeholder={exercise.type === 'TRANSLATION_EN_TO_FR' ? 'Enter French answer...' : 
                      exercise.type === 'TRANSLATION_FR_TO_EN' ? 'Enter English answer...' : 
                      'Your answer...'}
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