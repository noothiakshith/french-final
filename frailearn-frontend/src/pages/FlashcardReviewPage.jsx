import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFlashcardReview, submitFlashcardReview } from '../api/flashcards';
import styles from './FlashcardReviewPage.module.css';

const FlashcardReviewPage = () => {
  const navigate = useNavigate();
  
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewComplete, setReviewComplete] = useState(false);

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        const response = await getFlashcardReview();
        // Backend returns array of flashcardProgress objects with nested flashcard
        const flashcardData = response.data || [];
        setFlashcards(flashcardData);
        if (flashcardData.length === 0) {
          setReviewComplete(true);
        }
      } catch (err) {
        setError('Failed to load flashcards for review.');
      } finally {
        setLoading(false);
      }
    };
    fetchFlashcards();
  }, []);

  const currentCard = flashcards[currentIndex];
  const progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleResponse = async (wasCorrect) => {
    if (!currentCard || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitFlashcardReview(currentCard.id, wasCorrect);
      
      // Move to next card or complete review
      if (currentIndex + 1 >= flashcards.length) {
        setReviewComplete(true);
      } else {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      }
    } catch (err) {
      console.error('Failed to submit flashcard response:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <p className={styles.loading}>Loading your flashcards...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  if (reviewComplete || flashcards.length === 0) {
    return (
      <main className={styles.container}>
        <div className={styles.completionCard}>
          <h1 className={styles.completionTitle}>🎉 Review Complete!</h1>
          <p className={styles.completionMessage}>
            {flashcards.length === 0 
              ? "No flashcards are due for review right now. Great job staying on top of your studies!"
              : "Excellent work! You've completed all your flashcard reviews for today."
            }
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            className={styles.backButton}
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <p className={styles.breadcrumb}>
          <Link to="/dashboard">Dashboard</Link> / Flashcard Review
        </p>
        <h1 className={styles.title}>Flashcard Review</h1>
        <div className={styles.progressInfo}>
          <span className={styles.progressText}>
            Card {currentIndex + 1} of {flashcards.length}
          </span>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <div className={styles.flashcardContainer}>
        <div className={`${styles.flashcard} ${isFlipped ? styles.flipped : ''}`}>
          <div className={styles.flashcardFront}>
            <div className={styles.cardContent}>
              <p className={styles.cardText}>{currentCard?.flashcard?.frontText}</p>
            </div>
            <button 
              onClick={handleFlip}
              className={styles.flipButton}
              disabled={isSubmitting}
            >
              Flip Card
            </button>
          </div>
          
          <div className={styles.flashcardBack}>
            <div className={styles.cardContent}>
              <p className={styles.cardText}>{currentCard?.flashcard?.backText}</p>
            </div>
            <div className={styles.responseButtons}>
              <button 
                onClick={() => handleResponse(false)}
                disabled={isSubmitting}
                className={`${styles.responseButton} ${styles.incorrectButton}`}
              >
                {isSubmitting ? 'Submitting...' : "I didn't know"}
              </button>
              <button 
                onClick={() => handleResponse(true)}
                disabled={isSubmitting}
                className={`${styles.responseButton} ${styles.correctButton}`}
              >
                {isSubmitting ? 'Submitting...' : 'I knew it'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default FlashcardReviewPage;